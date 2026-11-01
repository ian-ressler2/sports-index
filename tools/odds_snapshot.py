"""Save today's season-simulator odds for every site that has them, so the Odds page can chart how each team's chances moved.

Opens each built site in headless Chromium (real network), lets the Odds page simulate, reads the bars out of its tables and
appends one record per day to <history_dir>/<sport>.json. The site loads that file as odds_history.json.
Usage: python3 tools/odds_snapshot.py <dist_dir> <history_dir> [sport ...]
"""
import datetime, json, os, re, sys, concurrent.futures as cf
from playwright.sync_api import sync_playwright

SPORTS = ['nba', 'nhl', 'nfl', 'mlb', 'wnba', 'cfb', 'cbb', 'epl', 'mls', 'ucl']
UA = 'sports-index-odds/1.0 (+https://github.com/ian-ressler2/sports-index)'  # identify ourselves plainly
KEEP = 400  # most daily records kept per sport

READ = """() => {
  const rows = [...document.querySelectorAll('table.odds tbody tr')];
  if (!rows.length) return null;
  const head = [...document.querySelector('table.odds thead tr').children].map(x => x.innerText.trim());
  const first = head.findIndex(x => /^(Playoffs?|NCAA|Playoff)$/i.test(x));
  const cols = head.slice(first >= 0 ? first : 4);
  const teams = {};
  for (const r of rows) {
    const m = /team\\/(\\d+)/.exec(r.getAttribute('onclick') || ''); if (!m) continue;
    const cells = [...r.children].slice(head.length - cols.length);
    teams[m[1]] = cells.map(c => { const i = c.querySelector('i'); return i ? Math.round(parseFloat(i.style.width) * 10) : 0; });
  }
  return { cols, teams, season: String(App.season), done: /season is complete|season is over|regular season is over|from the final|real seeds/i.test(document.body.innerText) };
}"""

def fetch_with_cors(route):
    """The site is opened from disk, so the browser would block ESPN's answers for lack of a matching origin: fetch from Python's side and hand the page the answer with open CORS."""
    u = route.request.url
    if u.startswith(('file:', 'data:', 'blob:')): return route.continue_()
    try:
        hd = {k: v for k, v in route.request.headers.items() if k.lower() != 'user-agent'}; hd['user-agent'] = UA
        r = route.fetch(headers=hd, timeout=40000); h = dict(r.headers); h['access-control-allow-origin'] = '*'
        route.fulfill(response=r, headers=h)
    except Exception: route.abort()

def snapshot(sport, dist, page_setup=None, wait_s=150):
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1300, 'height': 900})
        if page_setup: page_setup(pg)
        else: pg.route('**/*', fetch_with_cors)
        msgs, bad = [], []
        pg.on('console', lambda m: msgs.append(m.text[:140]) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: msgs.append('PAGEERR ' + str(e)[:140]))
        pg.on('requestfailed', lambda r: bad.append(r.url[:110]))
        pg.goto('file://' + os.path.abspath(f'{dist}/{sport}/index.html')); pg.wait_for_timeout(1500)
        pg.evaluate("location.hash='#/odds?n=5000'")
        try: pg.wait_for_selector('table.odds tbody tr', timeout=wait_s * 1000)
        except Exception:
            try: print(f'--- {sport}: no table; page says:', pg.evaluate("document.querySelector('#view')?.innerText.slice(0, 400).replace(/\\n/g, ' | ')"), '| console:', msgs[:6], '| failed requests:', bad[:6], flush=True)
            except Exception: pass
            b.close(); return None
        pg.wait_for_timeout(500); out = pg.evaluate(READ); b.close(); return out

def merge(path, snap, day):
    hist = []
    if os.path.exists(path):
        try: hist = json.load(open(path)).get('days', [])
        except Exception: hist = []
    hist = [d for d in hist if d['d'] != day] + [{'d': day, 's': snap['season'], 'done': snap['done'], 't': snap['teams']}]
    hist = hist[-KEEP:]
    json.dump({'cols': snap['cols'], 'days': hist}, open(path, 'w'), separators=(',', ':'))

def main():
    dist, hist_dir = sys.argv[1], sys.argv[2]; sports = [s for a in sys.argv[3:] for s in a.replace(',', ' ').split()] or SPORTS
    os.makedirs(hist_dir, exist_ok=True); day = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
    def one(s):
        try:
            snap = snapshot(s, dist)
            if not snap or not snap['teams']: print(s, 'no odds table'); return s, False
            merge(os.path.join(hist_dir, f'{s}.json'), snap, day); print(s, len(snap['teams']), 'teams'); return s, True
        except Exception as e: print(s, 'failed', repr(e)[:120]); return s, False
    with cf.ThreadPoolExecutor(3) as ex: res = list(ex.map(one, sports))
    sys.exit(0 if any(ok for _, ok in res) else 1)

if __name__ == '__main__': main()
