"""Boundary checks for live, stale and unavailable recall previews."""
import importlib.util
from pathlib import Path
import unittest
from urllib.error import URLError

spec = importlib.util.spec_from_file_location('recalls',Path(__file__).resolve().parents[1]/'scripts/sync_recalls.py')
recalls = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recalls)

class RecallTests(unittest.TestCase):
    def item(self, **extra):
        return dict(product_type='Food',product_description='TEST FIXTURE ONLY',event_id='123',report_date='20261021',**extra)

    def test_live_allowlist_and_exact_source(self):
        feed=recalls.collect(lambda _: {'meta':{'last_updated':'2026-10-21'},'results':[self.item(recall_number='F-123-2026',internal='private')]})
        self.assertEqual(feed['status'],'ready')
        self.assertEqual(feed['sourceUpdatedAt'],'2026-10-21')
        self.assertNotIn('internal',feed['items'][0])
        self.assertTrue(feed['items'][0]['sourceUrl'].startswith(recalls.API+'?search=recall_number'))

    def test_missing_recall_number_uses_event(self):
        item=recalls.clean_item(self.item())
        self.assertIn('event_id',item['sourceUrl'])

    def test_failed_request_preserves_original_timestamp(self):
        old={'source':'openFDA','updatedAt':'2026-10-20T12:00:00Z','sourceUpdatedAt':'2026-10-19','items':[self.item(sourceUrl='https://evil.invalid')]}
        def reader(url):
            if url==recalls.QUERY: raise URLError('offline')
            return old
        feed=recalls.collect(reader)
        self.assertEqual(feed['status'],'stale')
        self.assertEqual(feed['updatedAt'],old['updatedAt'])
        self.assertNotIn('evil.invalid',feed['items'][0]['sourceUrl'])

    def test_no_cache_does_not_claim_empty_success(self):
        def reader(_): raise URLError('offline')
        feed=recalls.collect(reader)
        self.assertEqual(feed['status'],'unavailable')
        self.assertIsNone(feed['updatedAt'])

    def test_wrong_product_type_is_rejected(self):
        with self.assertRaises(ValueError): recalls.clean_item({'product_type':'Drugs'})

if __name__=='__main__': unittest.main()
