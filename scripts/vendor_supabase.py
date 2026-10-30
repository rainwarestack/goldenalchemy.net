"""Vendor the pinned official SDK without running npm install scripts."""
import base64
import hashlib
import io
import json
import tarfile
from pathlib import Path
from urllib.request import urlopen

VERSION = '2.118.0'
ROOT = Path(__file__).resolve().parents[1] / 'docs/assets/vendor'

def main():
    with urlopen('https://registry.npmjs.org/@supabase/supabase-js/'+VERSION,timeout=30) as response:
        metadata=json.load(response)
    url=metadata['dist']['tarball']
    if not url.startswith('https://registry.npmjs.org/@supabase/supabase-js/-/'):
        raise SystemExit('Unexpected package URL')
    with urlopen(url,timeout=30) as response: archive=response.read(10_000_001)
    if len(archive)>10_000_000: raise SystemExit('Package unexpectedly large')
    actual='sha512-'+base64.b64encode(hashlib.sha512(archive).digest()).decode()
    if actual!=metadata['dist']['integrity']: raise SystemExit('Package integrity mismatch')
    with tarfile.open(fileobj=io.BytesIO(archive),mode='r:gz') as package:
        bundle=package.extractfile('package/dist/umd/supabase.js').read()
        license_text=package.extractfile('package/LICENSE').read()
    ROOT.mkdir(parents=True,exist_ok=True)
    (ROOT/'supabase.js').write_bytes(bundle)
    (ROOT/'supabase-LICENSE.txt').write_bytes(license_text)
    (ROOT/'supabase-version.json').write_text(json.dumps({'package':'@supabase/supabase-js','version':VERSION,'tarballIntegrity':actual,'bundleSha256':hashlib.sha256(bundle).hexdigest()},indent=2)+'\n',encoding='utf-8')
    print(f'Vendored official Supabase SDK {VERSION}; npm integrity verified; {len(bundle)} bytes.')

if __name__=='__main__': main()
