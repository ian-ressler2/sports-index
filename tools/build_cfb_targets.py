"""Count college football pass targets from ESPN play-by-play text and write a small JSON the CFB site loads.

ESPN's own player stats report zero targets, but every pass play names the intended receiver
("pass incomplete short left to #7 M.Knight"). This walks the season's finished games, keeps one tiny
record per game in a cache file, and writes dist/cfb/targets.json (per team: receiver key -> [targets, catches]).
Usage: python3 tools/build_cfb_targets.py <cache.json> <out.json> [max_new_games]
"""
import json, re, sys, time, datetime, urllib.request, concurrent.futures as cf

SITE = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football'
UA = {'User-Agent': 'sports-index-targets/1.0'}
STOP = r"(?:\s+(?:caught|for|thrown|broken|at|ran|pushed|tackled|out|to|intended|incomplete|complete|-|,)\b|\s*[,(]|\s*$)"
RX = re.compile(r"\bto\s+(?:#\d+\s+)?([A-Z])\.\s?([A-Za-z][A-Za-z'’\-\. ]*?)" + STOP)

def key(initial, last):
    last = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b\.?$", '', last.strip().lower())
    return initial.lower() + re.sub(r'[^a-z]', '', last)

def parse_plays(plays):
    """-> {team_id: {receiver_key: [targets, catches]}} from a list of (team_id, play) pairs."""
    out = {}
    for tid, p in plays:
        ty = (p.get('type') or {}).get('text', ''); tx = p.get('text') or ''
        if not re.search('pass', ty, re.I) or re.search('sack', ty, re.I): continue
        m = RX.search(tx)
        if not m: continue
        k = key(m.group(1), m.group(2))
        rec = out.setdefault(str(tid), {}).setdefault(k, [0, 0])
        rec[0] += 1
        if re.search('reception|touchdown', ty, re.I) and not re.search('incomplete|intercept', ty + ' ' + tx, re.I): rec[1] += 1
    return out

def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: return json.load(r)
        except Exception:
            time.sleep(1 + i)
    return None

def finished_games(start, end):
    ids = []
    d = start
    while d <= end:
        j = get(f"{SITE}/scoreboard?dates={d:%Y%m%d}&groups=80&limit=300")
        for e in (j or {}).get('events', []):
            if (e.get('status') or {}).get('type', {}).get('completed'): ids.append(e['id'])
        d += datetime.timedelta(days=1)
    return list(dict.fromkeys(ids))

def one_game(gid):
    j = get(f"{SITE}/summary?event={gid}")
    if not j: return gid, None
    plays = [((d.get('team') or {}).get('id'), p) for d in (j.get('drives') or {}).get('previous', []) for p in d.get('plays', [])]
    return gid, parse_plays(plays)

def main():
    cache_path, out_path = sys.argv[1], sys.argv[2]
    cap = int(sys.argv[3]) if len(sys.argv) > 3 else 250
    today = datetime.date.today()
    season = today.year if today.month >= 8 else today.year - 1
    try: cache = json.load(open(cache_path))
    except Exception: cache = {}
    if cache.get('season') != season or cache.get('v') != 2: cache = {'season': season, 'v': 2, 'games': {}}
    games = cache['games']
    start = datetime.date(season, 8, 20); end = min(today, datetime.date(season + 1, 1, 15))
    todo = [g for g in finished_games(start, end) if g not in games][:cap]
    print(f'{len(games)} cached, {len(todo)} new games to read')
    with cf.ThreadPoolExecutor(8) as ex:
        for gid, res in ex.map(one_game, todo):
            if res is not None: games[gid] = res
    cache['updated'] = datetime.datetime.utcnow().isoformat() + 'Z'
    json.dump(cache, open(cache_path, 'w'), separators=(',', ':'))
    teams = {}
    for g in games.values():
        for tid, recs in g.items():
            t = teams.setdefault(tid, {})
            for k, (a, b) in recs.items():
                x = t.setdefault(k, [0, 0]); x[0] += a; x[1] += b
    json.dump({'season': season, 'games': len(games), 'updated': cache['updated'], 'teams': teams}, open(out_path, 'w'), separators=(',', ':'))
    print(f'wrote {out_path}: {len(games)} games, {len(teams)} teams')

if __name__ == '__main__':
    main()
