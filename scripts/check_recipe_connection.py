"""Check a production key privately without recording URLs or response bodies."""
import getpass
import json
from urllib.parse import quote
from urllib.request import Request, urlopen

key=getpass.getpass('Production key (hidden): ').strip()
for version,endpoint in [('v1','search.php?f=a'),('v2','latest.php')]:
    try:
        request=Request('https://www.themealdb.com/api/json/'+version+'/'+quote(key,safe='')+'/'+endpoint,headers={'User-Agent':'Mozilla/5.0'})
        with urlopen(request,timeout=20) as response:
            payload=response.read()
            print(version,'HTTP',response.status,'bytes',len(payload),'type',response.headers.get('Content-Type'))
        try:
            data=json.loads(payload)
            print('Recipe count:',len(data.get('meals') or []))
        except (ValueError,AttributeError):
            print('Response is not recipe JSON; key may not yet be active.')
    except Exception as error:
        print(version,'request failed:',getattr(error,'code',type(error).__name__))
