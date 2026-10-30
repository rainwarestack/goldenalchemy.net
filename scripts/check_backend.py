"""Probe the public client connection without creating users or sending mail."""
import json
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

config=json.loads((Path(__file__).resolve().parents[1]/'docs/data/backend.json').read_text(encoding='utf-8'))
assert config['project']=='golden-alchemy' and config['projectRef']=='fnjsbsoavsjnftbmmbtr'
assert config['supabaseUrl']=='https://fnjsbsoavsjnftbmmbtr.supabase.co'
assert config['publishableKey'].startswith('sb_publishable_')

def status(path, body=None):
    request=Request(config['supabaseUrl']+path,data=body,headers={'apikey':config['publishableKey'],'Content-Type':'application/json'})
    try:
        with urlopen(request,timeout=20) as response: return response.status
    except HTTPError as error: return error.code

assert status('/auth/v1/settings')==200, 'Public client key/project connection did not validate'
with urlopen(Request(config['supabaseUrl']+'/auth/v1/settings',headers={'apikey':config['publishableKey']}),timeout=20) as response:
    settings=json.load(response)
assert settings.get('mailer_autoconfirm') is False, 'Email confirmation must remain enabled'
assert settings.get('external',{}).get('email') is True, 'Email authentication is not enabled'
print('PASS: email authentication enabled; confirmation required')
for label,path,body in [
    ('profiles','/rest/v1/ga_profiles?select=user_id&limit=1',None),
    ('memberships','/rest/v1/ga_memberships?select=user_id&limit=1',None),
    ('membership function','/rest/v1/rpc/ga_is_guild_member',b'{}'),
]:
    result=status(path,body)
    assert result in (401,403), f'Anonymous {label} access was not denied (HTTP {result})'
    print(f'PASS: anonymous {label} access denied (HTTP {result})')
print('PASS: Golden Alchemy public client connection verified. No accounts created or emails sent.')
