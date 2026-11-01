"""The 'Image' share button makes a real PNG: python3 tests/test_image.py"""
import importlib, os, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'specs'))
from playwright.sync_api import sync_playwright
from espn_mock import make_handler
H = make_handler(importlib.import_module('nba').SPEC)
def handle(route):
    u = route.request.url
    if u.startswith('file:'): return route.continue_()
    if 'espn.com' in u:
        st, ct, body = H(u); return route.fulfill(status=st, content_type=ct, body=body, headers={'access-control-allow-origin': '*'})
    route.abort()
ok = True
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.route('**/*', handle)
    pg.goto('file://' + os.path.abspath('dist/nba/index.html')); pg.wait_for_timeout(1500)
    for hsh, sel in [('#/odds', '.panel:has(table.odds)'), ('#/game/9000', '.stack:has(.dt)')]:
        pg.evaluate(f"location.hash='{hsh}'"); pg.wait_for_timeout(6000)
        r = pg.evaluate("""async (sel) => { const n = document.querySelector(sel); if (!n) return 'no node'; const blob = await panelImage(n); const buf = new Uint8Array(await blob.arrayBuffer()); return { type: blob.type, size: blob.size, sig: [...buf.slice(0, 4)].join(',') }; }""", sel)
        print(hsh, r); ok &= isinstance(r, dict) and r['type'] == 'image/png' and r['size'] > 3000
        btn = pg.evaluate("document.querySelectorAll('button[data-noimg]').length"); print(' image buttons', btn); ok &= btn > 0
    print('errors', errs[:2]); b.close(); sys.exit(0 if ok and not errs else 1)
