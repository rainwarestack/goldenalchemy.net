"""Refresh a public recipe catalog daily using a private production key."""
import json
import os
import string
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

def text(value, limit=500):
    return value.strip()[:limit] if isinstance(value, str) else ''

def safe_url(value, image=False):
    try:
        parsed = urlsplit(value or '')
        if parsed.scheme != 'https' or parsed.username or parsed.password or '/api/' in parsed.path:
            return None
        if image and (parsed.hostname not in ('www.themealdb.com','themealdb.com') or not parsed.path.startswith('/images/')):
            return None
        return value
    except ValueError:
        return None

def recipe(item):
    identifier = text(item.get('idMeal'))
    if not identifier.isdigit() or not text(item.get('strMeal')) or not text(item.get('strInstructions')):
        return None
    ingredients = []
    for i in range(1,21):
        name = text(item.get(f'strIngredient{i}'))
        if name:
            ingredients.append({'name':name, 'measure':text(item.get(f'strMeasure{i}'))})
    return dict(id=identifier, name=text(item.get('strMeal')), category=text(item.get('strCategory')), area=text(item.get('strArea')), ingredients=ingredients, instructions=text(item.get('strInstructions'),20000), image=safe_url(item.get('strMealThumb'),True), source=safe_url(item.get('strSource')), video=safe_url(item.get('strYoutube')))

def main():
    archive_path=ROOT/'content/recipe-archive.json'
    archive=json.loads(archive_path.read_text(encoding='utf-8'))
    key=os.environ.get('THEMEALDB_API_KEY','').strip()
    now=datetime.now(timezone.utc)
    status='pending'
    try:
        fetched=datetime.fromisoformat(archive.get('updatedAt') or '')
        fresh=bool(archive['items']) and (now-fetched).total_seconds()<86400
    except (ValueError, TypeError):
        fresh=False
    if fresh:
        status='ok'
    elif key and key!='1':
        try:
            meals={}
            for letter in string.ascii_lowercase:
                # The key is confined to this request; never print the URL or exception body.
                url='https://www.themealdb.com/api/json/v2/'+quote(key,safe='')+'/search.php?f='+letter
                request=Request(url,headers={'User-Agent':'GoldenAlchemyRecipes/1.0 (+https://www.goldenalchemy.net/)'})
                with urlopen(request,timeout=20) as response:
                    data=json.load(response)
                if 'meals' not in data or not (data['meals'] is None or isinstance(data['meals'],list)):
                    raise ValueError('Invalid recipe response')
                for raw in data['meals'] or []:
                    record=recipe(raw)
                    if record:meals[record['id']]=record
            if not meals:raise ValueError('No recipes')
            archive={'updatedAt':now.isoformat(),'items':sorted(meals.values(),key=lambda r:r['name'])}
            serialized=json.dumps(archive,ensure_ascii=False,indent=2)+'\n'
            if '/'+key+'/' in serialized:raise ValueError('Unexpected credential in recipe output')
            archive_path.write_text(serialized,encoding='utf-8')
            status='ok'
        except Exception:
            status='delayed' if archive['items'] else 'unavailable'
            print('Recipe refresh unavailable; keeping any previous catalog. Check production key configuration.')
    elif archive['items']:
        status='delayed'
    output=dict(archive,status=status,source='TheMealDB',sourceUrl='https://www.themealdb.com/',checkedAt=now.isoformat())
    (ROOT/'docs/data/recipes.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Recipe catalog: {status}; {len(archive['items'])} public recipes. No credentials written.")

if __name__=='__main__':
    main()
