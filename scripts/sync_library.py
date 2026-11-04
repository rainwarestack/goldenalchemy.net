"""Collect title/link metadata only, keeping a durable repository archive."""
import hashlib
import html
import json
import re
import unicodedata
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

def normalized(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))

def clean(text):
    return html.unescape(re.sub('<[^>]+>', '', text or '')).strip()[:400]

def safe_url(raw, host):
    parsed = urlsplit(raw or '')
    if parsed.scheme != 'https' or parsed.hostname not in {host, host.removeprefix('www.')} or parsed.username or parsed.password:
        return None
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ''))

class FeedImages(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = []

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            values = dict(attrs)
            self.urls.append(values.get('src') or values.get('data-src') or '')

def thumbnail(entry, source):
    candidates = []
    for child in entry.iter():
        if child.tag in ('{http://search.yahoo.com/mrss/}thumbnail', '{http://search.yahoo.com/mrss/}content', 'enclosure'):
            candidates.append(child.get('url', ''))
    parser = FeedImages()
    for field in ('description', '{http://purl.org/rss/1.0/modules/content/}encoded'):
        parser.feed(entry.findtext(field) or '')
    candidates.extend(parser.urls)
    allowed = {source['host'], source['host'].removeprefix('www.'), *source.get('imageHosts', [])}
    for candidate in candidates:
        parsed = urlsplit(html.unescape(candidate))
        if parsed.scheme == 'https' and parsed.hostname in allowed and not parsed.username and not parsed.password and not parsed.path.lower().endswith('.svg'):
            return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ''))
    return None

def parse_feed(data, source, techniques, now):
    if len(data) > 2_000_000:
        raise ValueError('Feed too large')
    root = ET.fromstring(data)
    items = []
    for entry in root.findall('./channel/item'):
        title = clean(entry.findtext('title'))
        url = safe_url(entry.findtext('link'), source['host'])
        if not title or not url:
            continue
        search = normalized(title + ' ' + ' '.join(clean(x.text) for x in entry.findall('category')))
        tags, elements = set(), {source['defaultElement']}
        for technique in techniques:
            term = normalized(technique['name'])
            if re.search(r'\b'+re.escape(term)+r'\b', search):
                tags.add(technique['name'].lower()); elements.add(technique['element'])
        # Broad publisher topics stay discoverable without assigning an unrelated specific method.
        for word, tag in [('grill', 'grilling'), ('smok', 'hot smoking'), ('sourdough', 'sourdough fermentation'), ('steam', 'steaming'), ('whip', 'whipping'), ('stone', 'baking stone')]:
            if word in search:
                tags.add(tag)
        if 'steaming' in tags: elements.add('water')
        if 'baking stone' in tags: elements.add('earth')
        published = None
        try:
            date = parsedate_to_datetime(entry.findtext('pubDate') or '')
            published = date.astimezone(timezone.utc).isoformat()
        except (ValueError, TypeError, OverflowError):
            pass
        items.append(dict(id=hashlib.sha256(url.encode()).hexdigest()[:20], title=title, url=url, publisher=source['name'], elements=sorted(elements), tags=sorted(tags), kind='Article', origin='RSS', publishedAt=published, addedAt=now, summary='', thumbnail=thumbnail(entry, source)))
    if not items:
        raise ValueError('No valid feed items')
    return items

def merge(previous, incoming):
    records = {item['url']: item for item in previous}
    for item in incoming:
        if item['url'] in records:
            item['addedAt'] = records[item['url']]['addedAt']
        records[item['url']] = item
    return sorted(records.values(), key=lambda item: item['url'])

def main():
    catalog = json.loads((ROOT/'content/library-catalog.json').read_text(encoding='utf-8'))
    path = ROOT/'content/library-archive.json'
    archive = json.loads(path.read_text(encoding='utf-8'))
    now = datetime.now(timezone.utc).isoformat()
    old_states = {s['id']: s for s in archive.get('sources', [])}
    states = []
    for source in catalog['feeds']:
        state = dict(id=source['id'], name=source['name'], url=source['url'], checkedAt=now)
        try:
            request = Request(source['url'], headers={'User-Agent':'GoldenAlchemyLibrary/1.0 (+https://www.goldenalchemy.net/)'})
            with urlopen(request, timeout=25) as response:
                data = response.read(2_000_001)
            archive['items'] = merge(archive['items'], parse_feed(data, source, catalog['techniques'], now))
            state.update(status='ok', refreshedAt=now)
        except Exception as error:
            state.update(status='delayed', refreshedAt=old_states.get(source['id'], {}).get('refreshedAt'))
            print(f"{source['name']}: keeping archived links ({type(error).__name__}).")
        states.append(state)
    archive['sources'] = states
    path.write_text(json.dumps(archive, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    resources = merge(catalog['resources'], archive['items'])
    for resource in resources:
        related = [t for t in catalog['techniques'] if normalized(t['name']) in {normalized(tag) for tag in resource['tags']}]
        resource['tools'] = sorted({tool for t in related for tool in t['tools']})
    output = dict(techniques=catalog['techniques'], resources=resources, sources=states, updatedAt=now)
    (ROOT/'docs/data/library.json').write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f"Library ready: {len(output['resources'])} resource links; {len(output['techniques'])} methods.")

if __name__ == '__main__':
    main()
