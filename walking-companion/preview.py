from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parent)
class Preview(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
print('Local preview: http://127.0.0.1:8768/', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8768), Preview).serve_forever()
