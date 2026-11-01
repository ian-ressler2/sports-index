"""No saved file: the browser keeps its own days and shows the trend. python3 tests/test_local_history.py"""
import functools, http.server, importlib, json, os, sys, threading
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
from espn_mock import make_handler
H = make_handler(importlib.import_module('nba').SPEC)
def handle(route):
    u = route.request.url
    if '127.0.0.1' in u: return route.continue_()
    if 'espn.com' in u:
        st, ct, body = H(u); return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='dist')); threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', handle)
    pg.goto(f'http://127.0.0.1:{srv.server_port}/nba/index.html'); pg.wait_for_timeout(1500)
    pg.evaluate("location.hash='#/odds'"); pg.wait_for_timeout(7000)
    first = pg.evaluate("document.querySelectorAll('table.odds td svg path').length")
    key = pg.evaluate("Object.keys(localStorage).find(k => k.startsWith('oddsHist:'))"); assert key, 'nothing saved'
    pg.evaluate("k => { const j = JSON.parse(localStorage[k]); const d = JSON.parse(JSON.stringify(j.days[0])); d.d = '2000-01-01'; j.days.unshift(d); localStorage[k] = JSON.stringify(j); }", key)
    pg.evaluate("location.hash='#/'"); pg.wait_for_timeout(500); pg.evaluate("location.hash='#/odds'"); pg.wait_for_timeout(7000)
    hdr = pg.evaluate("[...document.querySelectorAll('table.odds th')].some(x => x.innerText === 'Trend')"); n = pg.evaluate("document.querySelectorAll('table.odds td svg path').length")
    print('first visit sparklines', first, '| second: header', hdr, 'sparklines', n, 'errors', errs); b.close()
srv.shutdown(); sys.exit(0 if first == 0 and hdr and n > 0 and not errs else 1)
