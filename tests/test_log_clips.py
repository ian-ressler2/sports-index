"""Clicking the play button in a player's game log opens that game's highlight reel under the row."""
import importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
sport, route = sys.argv[1], sys.argv[2]
spec = importlib.import_module(sport).SPEC
from espn_mock import make_handler
H = make_handler(spec)
def handle(r):
    u = r.request.url
    if u.startswith('file:'): return r.continue_()
    if 'espn.com' in u or 'espn.api' in u or 'espncdn' in u:
        try: st, ct, body = H(u)
        except Exception as e: st, ct, body = 500, 'text/plain', repr(e)
        return r.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    r.abort()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', handle)
    pg.goto('file://' + os.path.abspath(f'dist/{sport}/index.html')); pg.wait_for_timeout(1500)
    pg.evaluate(f"location.hash={json.dumps('#' + route)}"); pg.wait_for_timeout(2500)
    n = pg.locator('button[data-gid]').count(); print('play buttons:', n)
    pg.locator('button[data-gid]').first.click(); pg.wait_for_timeout(1500)
    row = pg.locator('tr.hlrow').count(); vid = pg.locator('tr.hlrow video').count(); items = pg.locator('tr.hlrow .hlitem').count()
    print('rows', row, 'video', vid, 'clips', items, errs[:2])
    pg.locator('button[data-gid]').first.click(); pg.wait_for_timeout(300)
    closed = pg.locator('tr.hlrow').count() == 0
    ok = n > 0 and row == 1 and vid == 1 and closed and not errs
    print('OK' if ok else 'FAIL'); sys.exit(0 if ok else 1)
