"""Loopback-only development server with a direct Guild QA route.

The deployed /forum/ route keeps its courtesy PIN gate. /__guild-preview/
exists only in this local server so layout QA does not need the owner's PIN.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from build_site import ROOT, forum_content


class Preview(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if self.path.split('?')[0] == '/__guild-preview/':
            page = (ROOT / 'forum/index.html').read_text(encoding='utf-8')
            # Replace only the main element; preserve generated shared chrome.
            start = page.index('<main id="main">') + len('<main id="main">')
            end = page.index('</main>', start)
            page = page[:start] + forum_content() + page[end:]
            body = page.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()


if __name__ == '__main__':
    print('Golden Alchemy local preview: http://127.0.0.1:4174/__guild-preview/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4174), Preview).serve_forever()
