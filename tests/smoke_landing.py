import os, sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, cs in ((1300, 'light'), (390, 'dark')):
        pg = b.new_page(viewport={'width': w, 'height': 900}, color_scheme=cs)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file:') else r.abort())
        pg.goto('file://' + os.path.abspath('dist/index.html'))
        pg.wait_for_timeout(500)
        links = pg.eval_on_selector_all('.lp-card', 'e=>e.map(x=>x.getAttribute("href"))')
        ov = pg.evaluate('document.documentElement.scrollWidth-innerWidth')
        os.makedirs('tests/shots', exist_ok=True)
        pg.screenshot(path=f'tests/shots/landing_{w}.png', full_page=True)
        print(w, cs, links, 'overflow', ov, errs)
    b.close()
