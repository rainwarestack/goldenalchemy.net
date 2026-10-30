"""Cache city forecasts from the National Weather Service. No key or user location."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

CITIES = [('new-york', 'New York City', '40.7128,-74.0060'),
          ('albany', 'Albany, NY', '42.6526,-73.7562'),
          ('buffalo', 'Buffalo, NY', '42.8864,-78.8784')]
PREVIOUS = 'https://www.goldenalchemy.net/data/weather.json'
OUTPUT = Path(__file__).resolve().parents[1] / 'docs/data/weather.json'
PERIOD_FIELDS = ('name', 'startTime', 'endTime', 'temperature', 'temperatureUnit',
                 'shortForecast', 'detailedForecast', 'windSpeed', 'windDirection')
ERRORS = (URLError, HTTPError, TimeoutError, OSError, ValueError, TypeError, KeyError, AttributeError)

def read_json(url):
    req = Request(url, headers={'User-Agent':'GoldenAlchemy/1.0 (https://www.goldenalchemy.net/)',
                               'Accept':'application/geo+json, application/json'})
    with urlopen(req, timeout=15) as response:
        raw = response.read(2_000_001)
        if len(raw) > 2_000_000: raise ValueError('Response too large')
        return json.loads(raw)

def clean_period(raw):
    if not isinstance(raw, dict) or raw.get('temperatureUnit') != 'F':
        raise ValueError('Unexpected forecast units')
    if not isinstance(raw.get('temperature'), (int, float)) or isinstance(raw.get('temperature'), bool):
        raise ValueError('No numeric forecast temperature')
    for field in ('startTime','endTime'):
        date = datetime.fromisoformat(raw.get(field,'').replace('Z','+00:00'))
        if date.tzinfo is None: raise ValueError('No forecast timezone')
    return {key:raw[key] for key in PERIOD_FIELDS if key in raw}

def collect(reader=read_json):
    checked = datetime.now(timezone.utc).isoformat()
    previous = None
    cities = []
    for city_id, name, coords in CITIES:
        base = {'id':city_id,'name':name,'sourceUrl':'https://forecast.weather.gov/MapClick.php?lat='+coords.split(',')[0]+'&lon='+coords.split(',')[1]}
        try:
            point = reader('https://api.weather.gov/points/'+coords)
            url = point['properties']['forecast']
            parsed = urlparse(url)
            if parsed.scheme!='https' or parsed.hostname!='api.weather.gov' or not re.fullmatch(r'/gridpoints/[A-Z]{3}/\d+,\d+/forecast',parsed.path):
                raise ValueError('Unexpected forecast endpoint')
            properties = reader(url)['properties']
            if not isinstance(properties.get('periods'),list) or not properties['periods']:
                raise ValueError('No forecast periods')
            periods = [clean_period(p) for p in properties['periods'][:6]]
            cities.append({**base,'status':'ready','updatedAt':checked,
                           'sourceUpdatedAt':properties.get('updateTime') or properties.get('generatedAt'),
                           'periods':periods})
        except ERRORS:
            try:
                if previous is None: previous = reader(PREVIOUS)
                if previous.get('source')!='NWS': raise ValueError('No prior weather')
                old = next(c for c in previous['cities'] if c['id']==city_id)
                periods = [clean_period(p) for p in old['periods'][:6]]
                if not old.get('updatedAt') or not periods: raise ValueError('No usable prior forecast')
                cities.append({**base,'status':'stale','updatedAt':old['updatedAt'],
                               'sourceUpdatedAt':old.get('sourceUpdatedAt'),'periods':periods})
            except ERRORS + (StopIteration,):
                cities.append({**base,'status':'unavailable','updatedAt':None,'sourceUpdatedAt':None,'periods':[]})
    return {'source':'NWS','checkedAt':checked,'cities':cities}

def main():
    feed = collect()
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    temp = OUTPUT.with_suffix('.tmp')
    temp.write_text(json.dumps(feed,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temp.replace(OUTPUT)
    print('NWS forecast preview: '+', '.join(c['id']+'='+c['status'] for c in feed['cities']))

if __name__=='__main__': main()
