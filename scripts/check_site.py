"""Check generated static route and asset references before deployment."""
from pathlib import Path
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[1] / 'docs'
missing = set()

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get('href') if tag in ('a', 'link') else attrs.get('src')
        if value and value.startswith('/') and not value.startswith('//'):
            path = root / value.split('#')[0].lstrip('/')
            if not path.exists():
                missing.add(str(path.relative_to(root)))

pages = list(root.rglob('*.html'))
for page in pages:
    Links().feed(page.read_text(encoding='utf-8'))
if missing:
    raise SystemExit('Missing local targets: ' + ', '.join(sorted(missing)))
print(f'Checked {len(pages)} HTML files: all internal routes and assets exist.')
