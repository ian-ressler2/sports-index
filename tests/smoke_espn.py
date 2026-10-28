"""Smoke test for an ESPN-backed site: python3 tests/smoke_espn.py <sport> [routes...]  (env W=width CS=light|dark)"""
import importlib, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
sport = sys.argv[1]; spec = importlib.import_module(sport).SPEC
from espn_mock import make_handler
H = make_handler(spec)
ROUTES = sys.argv[2:] or json.load(open(os.path.join(os.path.dirname(__file__), 'routes.json')))[sport]
os.makedirs('tests/shots', exist_ok=True)
def handle(route):
    u = route.request.url
    if u.startswith('file:'): return route.continue_()
    if 'espn.com' in u:
        try: st, ct, body = H(u)
        except Exception as e: st, ct, body = 500, 'text/plain', repr(e)
        return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': int(os.environ.get('W', 1300)), 'height': 900}, color_scheme=os.environ.get('CS', 'light'))
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.route('**/*', handle)
    pg.goto('file://' + os.path.abspath(f'dist/{sport}/index.html'))
    pg.wait_for_timeout(1800)
    bad = 0
    for i, rt in enumerate(ROUTES):
        errs.clear()
        pg.evaluate(f"location.hash={json.dumps('#' + rt)}")
        pg.wait_for_timeout(2200)
        txt = pg.evaluate("document.querySelector('#view').innerText.slice(0,150).replace(/\\n/g,' | ')")
        ov = pg.evaluate('document.documentElement.scrollWidth-innerWidth')
        pg.screenshot(path=f'tests/shots/{sport}_{i:02d}_{re.sub(chr(92)+"W+", "_", rt)[:30]}.png')
        flag = '' if (ov <= 0 and not errs and 'went wrong' not in txt.lower()) else '  <-- CHECK'
        if flag: bad += 1
        print(f'{rt} => {txt[:70]} | overflow {ov}{flag}')
        for e in errs[:4]: print('   ', e[:300])
    b.close()
    sys.exit(1 if bad else 0)
