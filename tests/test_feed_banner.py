"""A dead feed shows the banner; a working one clears it. python3 tests/test_feed_banner.py"""
import functools, http.server, importlib, os, sys, threading
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
from espn_mock import make_handler
H = make_handler(importlib.import_module('nba').SPEC); mode = {'down': True}
def handle(route):
    u = route.request.url
    if '127.0.0.1' in u: return route.continue_()
    if 'espn.com' in u:
        if mode['down']: return route.fulfill(status=403, body='no')
        st, ct, body = H(u); return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='dist')); threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', handle)
    pg.goto(f'http://127.0.0.1:{srv.server_port}/nba/index.html'); pg.wait_for_timeout(9000)
    shown = pg.evaluate("document.getElementById('feedbanner')?.innerText || ''"); print('down:', shown[:90])
    mode['down'] = False; pg.reload(); pg.wait_for_timeout(9000)
    gone = pg.evaluate("!document.getElementById('feedbanner')"); print('banner gone when up:', gone, errs); b.close()
srv.shutdown(); sys.exit(0 if 'ESPN' in shown and gone and not errs else 1)
