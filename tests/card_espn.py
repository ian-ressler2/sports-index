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
    pg.wait_for_timeout(2000)
    pid = pg.evaluate("[...App.D.players.keys()][0]")
    tid = pg.evaluate("[...App.D.teams.keys()][0]")
    print('player', pid, 'team', tid)
    pg.evaluate(f"location.hash='#/player/{pid}'"); pg.wait_for_timeout(2500)
    pg.click('.watchbtn'); pg.wait_for_timeout(300)
    print('watching:', pg.evaluate("document.querySelector('.watchbtn').getAttribute('aria-pressed')"))
    pg.evaluate(f"location.hash='#/team/{tid}'"); pg.wait_for_timeout(2500)
    pg.click('.watchbtn'); pg.wait_for_timeout(300)
    pg.evaluate("location.hash='#/watch'"); pg.wait_for_timeout(2500)
    print('watch page:', pg.evaluate("document.querySelector('#view').innerText.slice(0,200).replace(/\\n/g,' | ')"))
    pg.screenshot(path=f'tests/shots/{sport}_watch.png')
    pg.evaluate(f"location.hash='#/player/{pid}'"); pg.wait_for_timeout(2500)
    pg.click('button[title^="Make a shareable"]'); pg.wait_for_timeout(9000)
    print('card img:', pg.evaluate("!!document.querySelector('.cm-img')"), pg.evaluate("document.querySelector('.cardmodal')?.innerText.slice(0,200)"))
    pg.screenshot(path=f'tests/shots/{sport}_card.png')
    pg.evaluate("document.querySelector('.cm-img') && fetch(document.querySelector('.cm-img').src).then(r=>r.blob()).then(b=>window.__b=b)")
    print(errs[:5])
    b.close()
