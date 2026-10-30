"""Cache a small public openFDA food-enforcement preview. No credentials needed."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = 'https://api.fda.gov/food/enforcement.json'
QUERY = API + '?' + urlencode({'sort': 'report_date:desc', 'limit': 6})
PREVIOUS = 'https://www.goldenalchemy.net/data/recalls.json'
OUTPUT = Path(__file__).resolve().parents[1] / 'docs/data/recalls.json'
FIELDS = ('recall_number', 'event_id', 'product_description', 'reason_for_recall',
          'classification', 'distribution_pattern', 'recalling_firm', 'code_info',
          'report_date', 'recall_initiation_date', 'status')

def read_json(url):
    request = Request(url, headers={'User-Agent': 'GoldenAlchemy/1.0 (+https://www.goldenalchemy.net/)'})
    with urlopen(request, timeout=20) as response:
        raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValueError('Response too large')
        return json.loads(raw)

def clean_item(raw):
    if not isinstance(raw, dict) or raw.get('product_type') != 'Food':
        raise ValueError('Unexpected food-enforcement record')
    item = {key: raw[key] for key in FIELDS if isinstance(raw.get(key), str)}
    if not item.get('product_description') or not re.fullmatch(r'\d+', item.get('event_id', '')):
        raise ValueError('Incomplete food-enforcement record')
    number = item.get('recall_number', '')
    search = 'recall_number:"' + number + '"' if re.fullmatch(r'[A-Z]-\d+-\d+', number) else 'event_id:"' + item['event_id'] + '"'
    item['sourceUrl'] = API + '?' + urlencode({'search': search, 'limit': 100})
    return item

def collect(reader=read_json):
    checked = datetime.now(timezone.utc).isoformat()
    try:
        data = reader(QUERY)
        if not isinstance(data, dict) or not isinstance(data.get('results'), list):
            raise ValueError('No result list')
        return {'source': 'openFDA', 'sourceUrl': QUERY, 'status': 'ready',
                'checkedAt': checked, 'updatedAt': checked,
                'sourceUpdatedAt': (data.get('meta') or {}).get('last_updated'),
                'items': [clean_item(item) for item in data['results'][:6]]}
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError, AttributeError):
        # Preserve the previous public preview when the provider is unavailable.
        # Its original successful refresh timestamp stays intact.
        try:
            previous = reader(PREVIOUS)
            if previous.get('source') != 'openFDA' or not isinstance(previous.get('items'), list):
                raise ValueError('No prior preview')
            items = [clean_item({**item, 'product_type': 'Food'}) for item in previous['items'][:6]]
            if not items or not previous.get('updatedAt'):
                raise ValueError('No successful previous data')
            return {'source': 'openFDA', 'sourceUrl': QUERY, 'status': 'stale',
                    'checkedAt': checked, 'updatedAt': previous['updatedAt'],
                    'sourceUpdatedAt': previous.get('sourceUpdatedAt'), 'items': items}
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError, AttributeError):
            return {'source': 'openFDA', 'sourceUrl': QUERY, 'status': 'unavailable',
                    'checkedAt': checked, 'updatedAt': None, 'sourceUpdatedAt': None, 'items': []}

def main():
    feed = collect()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(feed, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(OUTPUT)
    print(f"openFDA preview: {feed['status']}; {len(feed['items'])} records.")

if __name__ == '__main__':
    main()
