"""A game in progress refreshes itself: python3 tests/test_live.py (uses the NBA mock; the second feed has one more play and a new score)"""
import importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
from espn_mock import make_handler
spec = importlib.import_module('nba').SPEC; H = make_handler(spec); calls = {'n': 0}
def feed(u):
    st, ct, body = H(u)
    if '/summary?event=9000' in u and ct and 'json' in ct:
        calls['n'] += 1; j = json.loads(body); comp = j['header']['competitions'][0]
        comp['status'] = {'type': {'state': 'in' if calls['n'] < 4 else 'post', 'detail': 'Q3 4:12', 'completed': calls['n'] >= 4}}
        evs = j.get('plays') or []
        if calls['n'] < 3: j['plays'] = evs[:-3] if len(evs) > 6 else evs
        body = json.dumps(j)
    return st, ct, body
def handle(route):
    u = route.request.url
    if u.startswith('file:'): return route.continue_()
    if 'espn.com' in u:
        st, ct, body = feed(u); return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', handle)
    pg.add_init_script("window.__speed=1")
    pg.goto('file://' + os.path.abspath('dist/nba/index.html')); pg.wait_for_timeout(1500)
    pg.evaluate("location.hash='#/game/9000'"); pg.wait_for_timeout(3000)
    first = pg.evaluate("document.querySelectorAll('.gp').length"); live = pg.evaluate("/LIVE/.test(document.querySelector('#view').innerText)")
    print('plays at open', first, 'live label', live)
    pg.wait_for_timeout(65000)
    last = pg.evaluate("document.querySelectorAll('.gp').length"); txt = pg.evaluate("document.querySelector('#view').innerText.slice(0,300).replace(/\\n/g,' | ')")
    print('plays after refresh', last, 'feed calls', calls['n'], '|', txt[:160])
    b.close(); print('errors', errs[:3]); sys.exit(0 if (live and last >= first and calls['n'] >= 3 and not errs) else 1)
