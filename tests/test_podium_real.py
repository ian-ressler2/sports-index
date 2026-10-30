"""Podium tennis head-to-head against a match trimmed from a real ESPN scoreboard."""
import json, os, sys
from playwright.sync_api import sync_playwright
fx = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/real_shapes.json')))
rk = {"rankings": [{"ranks": [{"current": 1, "previous": 1, "points": 100, "athlete": {"displayName": "Federico Cina"}}, {"current": 2, "previous": 2, "points": 90, "athlete": {"displayName": "Joel Josef Schwaerzler"}}]}]}
def h(r):
    u = r.request.url
    if u.startswith('file:'): return r.continue_()
    b = rk if 'rankings' in u else fx['tennis'] if 'tennis' in u else None
    if b is None: return r.abort()
    r.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body=json.dumps(b))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', h)
    pg.goto('file://' + os.path.abspath('dist/podium/index.html') + '#tennis'); pg.wait_for_timeout(600)
    pg.select_option('#h2', 'Joel Josef Schwaerzler'); pg.click('#h2go'); pg.wait_for_timeout(500)
    t = pg.inner_text('#h2out'); print(t[:160].replace('\n', ' | '))
    ok = 'Federico Cina won' in t and '6-3 7-6' in t and not errs
    print('podium real-shape OK' if ok else f'FAIL {errs}'); sys.exit(0 if ok else 1)
