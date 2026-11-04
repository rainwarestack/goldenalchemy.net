import importlib.util
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('library',Path(__file__).resolve().parents[1]/'scripts/sync_library.py')
lib=importlib.util.module_from_spec(spec);spec.loader.exec_module(lib)
class LibraryTests(unittest.TestCase):
    def test_untrusted_feed_links_are_excluded(self):
        xml=b'<rss><channel><item><title>Bad</title><link>https://evil.example/a</link></item><item><title>Good</title><link>https://barbecuebible.com/a#fragment</link></item></channel></rss>'
        result=lib.parse_feed(xml,{'host':'barbecuebible.com','name':'BBQ','defaultElement':'fire'},[], 'today')
        self.assertEqual(len(result),1);self.assertEqual(result[0]['url'],'https://barbecuebible.com/a')
    def test_first_seen_and_disappeared_records_survive(self):
        old=[{'url':'https://example.com/a','addedAt':'first','title':'Old'},{'url':'https://example.com/b','addedAt':'old','title':'Archived'}]
        new=[{'url':'https://example.com/a','addedAt':'later','title':'Updated'}]
        result=lib.merge(old,new)
        self.assertEqual(len(result),2);self.assertEqual(result[0]['addedAt'],'first');self.assertEqual(result[0]['title'],'Updated')
    def test_invalid_xml_does_not_produce_empty_replacement(self):
        with self.assertRaises(Exception):lib.parse_feed(b'not xml',{},[],'now')
    def test_invalid_dates_stay_unknown_and_html_is_text(self):
        data=b'<rss><channel><item><title>&lt;b&gt;Grilling&lt;/b&gt;</title><link>https://barbecuebible.com/a</link><pubDate>oops</pubDate></item></channel></rss>'
        item=lib.parse_feed(data,{'host':'barbecuebible.com','name':'BBQ','defaultElement':'fire'},[],'now')[0]
        self.assertIsNone(item['publishedAt']);self.assertEqual(item['title'],'Grilling')
if __name__=='__main__':unittest.main()
