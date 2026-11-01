"""Odds history: the snapshot tool reads the odds page, the site shows a trend column from the saved file. python3 tests/test_odds_history.py"""
import functools, http.server, importlib, json, os, shutil, sys, tempfile, threading
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs')); sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
from playwright.sync_api import sync_playwright
from espn_mock import make_handler
import odds_snapshot as O
H = make_handler(importlib.import_module('nba').SPEC)
HIST = {}
def handle(route):
    u = route.request.url
    if u.startswith('file:') or '127.0.0.1' in u: return route.continue_()
    if 'espn.com' in u:
        st, ct, body = H(u); return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
snap = O.snapshot('nba', 'dist', lambda pg: pg.route('**/*', handle), 60)
assert snap and snap['teams'], 'no snapshot'; print('snapshot', len(snap['teams']), 'teams, cols', snap['cols'], 'season', snap['season'])
tmp = tempfile.mkdtemp(); f = os.path.join(tmp, 'nba.json')
O.merge(f, snap, '2026-10-30')
s2 = json.loads(json.dumps(snap)); k = next(iter(s2['teams'])); s2['teams'][k][0] = max(0, s2['teams'][k][0] - 300)
O.merge(f, s2, '2026-10-31'); O.merge(f, snap, '2026-10-31')
print('days', len(json.load(open(f))['days']))
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='dist')); threading.Thread(target=srv.serve_forever, daemon=True).start()
shutil.copy(f, 'dist/nba/odds_history.json')
ok = False
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', handle)
        pg.goto(f'http://127.0.0.1:{srv.server_port}/nba/index.html'); pg.wait_for_timeout(1500)
        pg.evaluate("location.hash='#/odds'"); pg.wait_for_timeout(7000)
        print('trend header', pg.evaluate("[...document.querySelectorAll('table.odds th')].some(x => x.innerText === 'Trend')"), 'sparklines', pg.evaluate("document.querySelectorAll('table.odds td svg path').length"), 'errors', errs[:2])
        ok = pg.evaluate("document.querySelectorAll('table.odds td svg path').length") > 0 and not errs; b.close()
finally: os.remove('dist/nba/odds_history.json'); srv.shutdown()
sys.exit(0 if ok else 1)
