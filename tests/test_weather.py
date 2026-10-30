import importlib.util
from pathlib import Path
import unittest
from urllib.error import URLError

spec=importlib.util.spec_from_file_location('weather',Path(__file__).resolve().parents[1]/'scripts/sync_weather.py')
weather=importlib.util.module_from_spec(spec)
spec.loader.exec_module(weather)

def period(**extra):
    return dict(name='TEST FIXTURE',startTime='2026-10-30T12:00:00-04:00',endTime='2026-10-30T18:00:00-04:00',temperature=50,temperatureUnit='F',**extra)

class WeatherTests(unittest.TestCase):
    def test_real_endpoint_and_allowlist(self):
        def reader(url):
            if '/points/' in url: return {'properties':{'forecast':'https://api.weather.gov/gridpoints/OKX/33,35/forecast'}}
            return {'properties':{'updateTime':'2026-10-30T12:00:00Z','periods':[period(internal='unused')]}}
        feed=weather.collect(reader)
        self.assertEqual(len(feed['cities']),3)
        self.assertTrue(all(c['status']=='ready' for c in feed['cities']))
        self.assertNotIn('internal',feed['cities'][0]['periods'][0])

    def test_does_not_follow_untrusted_provider_url(self):
        seen=[]
        def reader(url):
            seen.append(url)
            if '/points/' in url: return {'properties':{'forecast':'https://evil.invalid/forecast'}}
            raise URLError('offline')
        feed=weather.collect(reader)
        self.assertTrue(all(c['status']=='unavailable' for c in feed['cities']))
        self.assertFalse(any('evil.invalid' in u for u in seen))

    def test_fallback_preserves_original_date(self):
        def reader(url):
            if url==weather.PREVIOUS:
                return {'source':'NWS','cities':[{'id':c[0],'updatedAt':'2026-10-29T12:00:00Z','periods':[period()]} for c in weather.CITIES]}
            raise URLError('offline')
        feed=weather.collect(reader)
        self.assertTrue(all(c['status']=='stale' for c in feed['cities']))
        self.assertEqual(feed['cities'][0]['updatedAt'],'2026-10-29T12:00:00Z')

    def test_bad_units_and_temperatures_are_rejected(self):
        with self.assertRaises(ValueError): weather.clean_period({'temperatureUnit':'C','temperature':5})
        with self.assertRaises(ValueError): weather.clean_period({'temperatureUnit':'F','temperature':True})

if __name__=='__main__': unittest.main()
