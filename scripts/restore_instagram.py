"""Keep the last published public feed available during credential recovery."""
import json
from pathlib import Path
from urllib.request import Request, urlopen
from sync_instagram import USERNAME, media_item

output=Path(__file__).resolve().parents[1]/'docs/data/instagram.json'
feed={'source':'instagram','username':USERNAME,'profileUrl':'https://www.instagram.com/'+USERNAME+'/','updatedAt':None,'items':[],'status':'delayed'}
try:
    request=Request('https://www.goldenalchemy.net/data/instagram.json',headers={'User-Agent':'GoldenAlchemyFeedRecovery/1.0'})
    with urlopen(request,timeout=20) as response:
        data=json.loads(response.read(2_000_000))
    if data.get('username')!=USERNAME or not isinstance(data.get('items'),list):
        raise ValueError('Unexpected public account')
    feed['items']=[media_item(item) for item in data['items'][:500]]
    feed['updatedAt']=data.get('updatedAt')
except Exception:
    print('Previous Instagram display data unavailable; keeping profile link fallback.')
output.write_text(json.dumps(feed,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"Preserved {len(feed['items'])} public Instagram posts; no credentials used.")
