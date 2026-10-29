"""Fetch only Golden Alchemy's public display data; never write credentials."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

INSTAGRAM_ID = "17841468852775750"
USERNAME = "goldenalchemy.na"


def request_graph(path, fields, token):
    url = "https://graph.facebook.com/v26.0/" + path + "?" + urlencode(fields)
    request = Request(url, headers={"Authorization": "Bearer " + token})
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        # Never print response bodies or request headers; they can contain secrets.
        raise RuntimeError(f"Meta request failed (HTTP {error.code}); check token validity and permissions.") from None
    except (URLError, TimeoutError, json.JSONDecodeError):
        raise RuntimeError("Meta could not be reached or returned invalid data; existing deployment is preserved.") from None


def media_item(item):
    permalink = item.get("permalink", "")
    parsed = urlparse(permalink)
    if parsed.scheme != "https" or parsed.hostname not in ("www.instagram.com", "instagram.com"):
        raise ValueError("Unexpected Instagram post URL.")
    # Explicit allowlist prevents access tokens and internal API fields entering the public artifact.
    result = {key: item[key] for key in ("id", "caption", "media_type", "timestamp") if key in item}
    result["permalink"] = permalink
    for key in ("media_url", "thumbnail_url"):
        value = item.get(key)
        if value and urlparse(value).scheme == "https":
            result[key] = value
    return result


def main():
    token = os.environ.get("META_PAGE_ACCESS_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Add the META_PAGE_ACCESS_TOKEN repository secret before running this workflow.")
    profile = request_graph(INSTAGRAM_ID, {"fields": "id,username,media_count"}, token)
    if str(profile.get("id")) != INSTAGRAM_ID or profile.get("username") != USERNAME:
        raise RuntimeError("Account identity mismatch; refusing to publish another project's content.")
    response = request_graph(INSTAGRAM_ID + "/media", {
        "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp", "limit": "12"
    }, token)
    if not isinstance(response.get("data"), list):
        raise RuntimeError("Meta did not return a media list; existing deployment is preserved.")
    feed = {
        "source": "instagram", "username": USERNAME,
        "profileUrl": "https://www.instagram.com/" + USERNAME + "/",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "items": [media_item(item) for item in response["data"][:12]],
    }
    serialized = json.dumps(feed, ensure_ascii=False, indent=2) + "\n"
    if token in serialized:
        raise RuntimeError("Credential detected in output; refusing to write feed.")
    output = Path(__file__).resolve().parents[1] / "docs/data/instagram.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(".tmp")
    temporary.write_text(serialized, encoding="utf-8")
    temporary.replace(output)
    print(f"Verified @{USERNAME}; prepared {len(feed['items'])} public posts.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError) as error:
        raise SystemExit(str(error)) from None
