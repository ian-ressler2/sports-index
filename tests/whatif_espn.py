"""What-if smoke test: python3 tests/whatif_espn.py <nhl|nba|nfl>. Takes two players out and runs the 2,000-game comparison."""
import importlib, json, os, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
sport = sys.argv[1]; spec = importlib.import_module(sport).SPEC
from espn_mock import make_handler
H = make_handler(spec)
def handle(route):
    u = route.request.url
    if u.startswith('file:'): return route.continue_()
    if 'espn.com' in u:
        st, ct, body = H(u); return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width':1300,'height':900}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load' not in m.text else None); pg.route('**/*', handle)
    pg.goto('file://' + os.path.abspath(f'dist/{sport}/index.html')); pg.wait_for_timeout(2500)
    pg.evaluate("location.hash='#/sim?h=1&a=2'"); pg.wait_for_timeout(1500)
    info = pg.evaluate("""() => { const W = SPORT.sim.what, D = App.D; return { r1: W.roster(D, 1).slice(0,3), r2: W.roster(D, 2).slice(0,2), st: W.starters ? W.starters(D, 1).slice(0,2) : null }; }""")
    print(json.dumps(info)[:400])
    ids = [r['id'] for r in info['r1'][:2]]
    st = info['st'][0]['id'] if info.get('st') else None
    q = f"#/sim?h=1&a=2&x=t1&o={','.join(map(str,ids))}" + (f"&g=1:{st}" if st else '')
    pg.evaluate(f"location.hash={json.dumps(q)}"); pg.wait_for_timeout(2500)
    print('chips on:', pg.evaluate("document.querySelectorAll('.chip.on').length"), 'url', pg.evaluate("location.hash")[:120])
    pg.click('text=Run 1,000 games'); pg.wait_for_timeout(15000)
    print(pg.evaluate("[...document.querySelectorAll('#view .panel')].map(e=>e.innerText.replace(/\\n+/g,' | ').slice(0,260)).filter(t=>/simulated games/.test(t))"))
    pg.screenshot(path=f'tests/shots/{sport}_whatif.png'); print(errs[:4]); b.close()
