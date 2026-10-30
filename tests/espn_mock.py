"""Fixture server for the ESPN-backed sites. Mirrors the shapes returned by ESPN's public feeds (checked against live responses)."""
import json, math, random, re, urllib.parse

def J(o): return 200, 'application/json', json.dumps(o)

def logos(abbr, lg): return [{'href': f'https://a.espncdn.com/i/teamlogos/{lg}/500/{abbr.lower()}.png', 'width': 500, 'height': 500, 'rel': ['full', 'default']}]

class Spec:
    """sport: hockey/basketball/football. cats: list of (catName, [statNames]) for the athlete feed. gen(pos) -> {catName:[values]}"""
    def __init__(s, sp, lg, season_end, teams, divs, cats, positions, gen, tcats, tgen, stand_stats, gp, nplayers, glnames, gllabels, glgen, plays=None):
        s.sp, s.lg, s.season, s.teams, s.divs, s.cats, s.positions, s.gen, s.tcats, s.tgen, s.stand_stats, s.gp, s.nplayers = sp, lg, season_end, teams, divs, cats, positions, gen, tcats, tgen, stand_stats, gp, nplayers
        s.glnames, s.gllabels, s.glgen, s.plays = glnames, gllabels, glgen, plays

def team_obj(t, lg):
    return {'id': str(t['id']), 'uid': f"s:1~l:1~t:{t['id']}", 'name': t['name'], 'nickname': t['name'], 'abbreviation': t['abbr'], 'displayName': f"{t['loc']} {t['name']}", 'shortDisplayName': t['name'], 'location': t['loc'], 'color': t['color'], 'alternateColor': 'ffffff', 'logos': logos(t['abbr'], lg), 'links': []}

def make_handler(spec, seed=7):
    rnd = random.Random(seed)
    teams = spec.teams
    athletes = []
    for i in range(spec.nplayers):
        pos = spec.positions[i % len(spec.positions)]
        t = teams[i % len(teams)]
        athletes.append({'id': str(100000 + i), 'name': f'Player {i} Name{i}', 'pos': pos, 'team': t, 'age': 21 + i % 17, 'vals': spec.gen(pos, rnd)})
    def head_cats(): return [{'name': n, 'names': names, 'labels': names, 'displayName': n} for n, names in spec.cats]
    def athlete_row(a):
        return {'athlete': {'id': a['id'], 'uid': 'x', 'displayName': a['name'], 'shortName': a['name'], 'position': {'abbreviation': a['pos'], 'displayName': a['pos']}, 'teamShortName': a['team']['abbr'], 'age': a['age'], 'teams': [team_obj(a['team'], spec.lg)], 'links': []},
                'categories': [{'name': n, 'values': a['vals'].get(n, [0] * len(names)), 'totals': []} for n, names in spec.cats]}
    def handle(url):
        u = urllib.parse.urlparse(url); q = urllib.parse.parse_qs(u.query); path = u.path
        cp = getattr(spec, 'corepl', None)  # core API player feeds: leaders, athlete, season line, position
        if cp:
            if re.search(r'/seasons/\d+/types/\d+/leaders$', path): return J(cp['leaders']())
            m = re.search(r'/types/\d+/athletes/(\d+)/statistics/0$', path)
            if m: return J(cp['stats'](int(m.group(1))))
            m = re.search(r'/seasons/\d+/athletes/(\d+)$', path)
            if m: return J(cp['athlete'](int(m.group(1))))
            m = re.search(r'/positions/(\d+)$', path)
            if m: return J({'id': m.group(1), 'abbreviation': cp['pos'](int(m.group(1)))})
        if cp and '/statistics/byathlete' in path and q.get('sort', [''])[0].split(':')[0] in getattr(__import__('sys').modules.get('cfb'), 'SPECIAL', {}):
            ids = cp['special'](q['sort'][0].split(':')[0], int(q.get('limit', ['10'])[0]))
            return J({'athletes': [{'athlete': {'id': str(i)}} for i in ids], 'pagination': {'count': len(ids)}})
        if '/statistics/byathlete' in path:
            limit = int(q.get('limit', ['25'])[0]); page = int(q.get('page', ['1'])[0])
            if limit > 1000: return 400, 'text/plain', 'bad'
            chunk = athletes[(page - 1) * limit: page * limit]
            return J({'pagination': {'count': len(athletes), 'limit': limit, 'page': page, 'pages': math.ceil(len(athletes) / limit)}, 'athletes': [athlete_row(a) for a in chunk], 'requestedSeason': {'year': spec.season, 'displayName': f'{spec.season-1}-{spec.season%100:02d}'}, 'categories': head_cats()})
        if '/statistics/byteam' in path:
            return J({'teams': [{'team': team_obj(t, spec.lg), 'categories': [{'name': n, 'values': (spec.tgen(t, rnd, n, i) if spec.tgen.__code__.co_argcount > 3 else spec.tgen(t, rnd, n))} for i, (n, _) in enumerate(spec.tcats)]} for t in teams], 'categories': [{'name': n, 'names': names} for n, names in getattr(spec, 'thead', spec.tcats)]})
        if path.endswith('/standings'):
            ch = []
            for conf, dvs in spec.divs.items():
                kids = []
                for dv, ids in dvs.items():
                    ents = []
                    for tid in ids:
                        t = next(x for x in teams if x['id'] == tid); st = spec.stand_stats(t, rnd)
                        ents.append({'team': team_obj(t, spec.lg), 'stats': [{'name': k, 'value': v, 'displayValue': str(v)} for k, v in st.items() if not isinstance(v, str)] + [{'name': k, 'displayValue': v} for k, v in st.items() if isinstance(v, str)]})
                    kids.append({'name': dv, 'standings': {'entries': ents}})
                if getattr(spec, 'flat', False): ch.append({'name': conf, 'standings': {'entries': [e for kd in kids for e in kd['standings']['entries']]}})  # college: conferences hold the entries directly
                else: ch.append({'name': conf, 'children': kids})
            return J({'name': 'x', 'children': ch})
        m = re.search(r'/athletes/(\d+)/gamelog', path)
        if m:
            names, labels = spec.glnames, spec.gllabels; evs = {}; cats = []
            months = ['October', 'November', 'December', 'January', 'February', 'March']
            for mi, mo in enumerate(months):
                lst = []
                for k in range(min(14, spec.gp // 6)):
                    eid = f'{9000 + mi * 20 + k}'
                    evs[eid] = {'id': eid, 'atVs': 'vs' if k % 2 else '@', 'gameDate': f'2025-{(9 + mi) % 12 + 1:02d}-{k + 1:02d}T00:00:00Z', 'score': '4-3', 'homeTeamId': '1', 'awayTeamId': '2', 'homeTeamScore': '3', 'awayTeamScore': '4', 'gameResult': 'W' if k % 3 else 'L', 'opponent': {'id': str(teams[k % len(teams)]['id']), 'abbreviation': teams[k % len(teams)]['abbr'], 'displayName': 'Opp'}}
                    lst.append({'eventId': eid, 'stats': spec.glgen(rnd)})
                cats.append({'displayName': mo, 'type': 'event', 'events': lst})
            return J({'names': names, 'labels': labels, 'events': evs, 'seasonTypes': [{'displayName': getattr(spec, 'glst', 'Regular Season'), 'categories': cats}, {'displayName': 'Postseason', 'categories': []}]})
        if re.search(r'/athletes/\d+/splits', path):
            return J({'labels': spec.gllabels, 'names': spec.glnames, 'splitCategories': [{'displayName': 'split', 'splits': [{'displayName': n, 'stats': spec.glgen(rnd)} for n in ['All Splits', 'Home', 'Away']]}, {'displayName': 'Month', 'splits': [{'displayName': 'October', 'stats': spec.glgen(rnd)}]}]})
        if re.search(r'/athletes/\d+/stats', path):
            return J({'teams': {'x-team': {'abbreviation': 'EDM'}}, 'categories': [{'name': 'skater', 'displayName': 'Regular Season', 'labels': spec.gllabels, 'names': spec.glnames, 'totals': spec.glgen(rnd), 'statistics': [{'teamSlug': 'x-team', 'season': {'year': y, 'displayName': f'{y-1}-{y%100:02d}'}, 'stats': spec.glgen(rnd)} for y in (spec.season - 2, spec.season - 1, spec.season)]}]})
        if re.search(r'/athletes/\d+$', path):
            return J({'athlete': {'displayHeight': "6' 1\"", 'displayWeight': '194 lbs', 'displayDOB': '1/1/1997', 'displayBirthPlace': 'Town, CAN', 'displayExperience': '5th Season', 'displayJersey': '#97', 'displayDraft': '2015: Rd 1, Pk 1', 'hand': {'displayValue': 'Left'}, 'position': {'displayName': 'Center'}, 'status': {'name': 'Active'}}})
        if '/schedule' in path:
            tid = re.search(r'/teams/(\d+)/schedule', path).group(1)
            evs = []
            for k in range(min(40, spec.gp)):
                opp = teams[(k + 3) % len(teams)]
                done = k < 28
                sc = (lambda: {'value': rnd.randint(0, 6)}) if done else (lambda: {})
                evs.append({'id': f'{9000 + k}' if tid == str(teams[0]['id']) else f'g{tid}-{k}', 'date': f'2025-1{k % 3}-{k % 27 + 1:02d}T00:00Z', 'competitions': [{'status': {'type': {'completed': done, 'name': 'STATUS_FINAL' if done else 'STATUS_SCHEDULED'}}, 'competitors': [{'homeAway': 'home' if k % 2 else 'away', 'team': {'id': tid, 'abbreviation': 'ME'}, 'score': sc()}, {'homeAway': 'away' if k % 2 else 'home', 'team': {'id': str(opp['id']), 'abbreviation': opp['abbr'], 'displayName': opp['name']}, 'score': sc()}]}]})
            return J({'events': evs})
        if path.endswith('/scoreboard'):
            evs = []
            LV = {'points': 32, 'rebounds': 15, 'assists': 12, 'goals': 2, 'passingYards': 320, 'rushingYards': 110}
            for k in range(8):
                a, b = teams[(k * 2) % len(teams)], teams[(k * 2 + 1) % len(teams)]
                state = 'post' if k < 5 else 'in' if k == 5 else 'pre'
                lead = [{'name': n, 'shortDisplayName': n[:3].title(), 'leaders': [{'displayValue': str(v + k), 'value': v + k, 'athlete': {'id': str(100000 + k), 'shortName': f'P. {k}', 'displayName': f'Player {k}'}}]} for n, v in LV.items()]
                tm = lambda t, w, sc: {**({'curatedRank': {'current': 1 + len(t['name']) % 30}} if spec.lg.startswith('mens-college') else {}), 'homeAway': w, 'score': str(sc), 'team': {'id': str(t['id']), 'abbreviation': t.get('abbr', 'T'), 'displayName': t.get('name', 'Team'), 'logos': []}, 'records': [{'type': 'total', 'summary': '3-1'}], 'leaders': lead if state != 'pre' else []}
                comp = {'status': {'type': {'completed': state == 'post', 'state': state, 'shortDetail': 'Final' if state == 'post' else '3rd 4:12' if state == 'in' else '7:00 PM'}}, 'competitors': [tm(a, 'home', 24 + k), tm(b, 'away', 17 + k)]}
                if state == 'post':
                    comp['headlines'] = [{'shortLinkText': f'Team {k} wins a thriller', 'description': 'recap'}]
                    comp['highlights'] = [{'headline': f'Game {k} Highlights', 'duration': 72, 'thumbnail': 'https://example.com/t.jpg', 'links': {'source': {'href': 'https://example.com/v.mp4', 'HD': {'href': 'https://example.com/v.mp4'}}}}]
                evs.append({'id': str(9000 + k), 'date': f'2026-10-{20 + k % 6:02d}T23:00Z', 'competitions': [comp]})
            return J({'events': evs})
        if getattr(spec, 'core', None) and re.search(r'/seasons/\d+/types/\d+/teams/\d+/statistics$', path):
            tid = int(re.search(r'/teams/(\d+)/', path).group(1)); t = next(x for x in teams if x['id'] == tid)
            return J({'splits': {'categories': [{'name': n, 'stats': [{'name': k, 'value': v, 'displayValue': str(v)} for k, v in d.items()]} for n, d in spec.core(t, rnd).items()]}})
        if getattr(spec, 'roster', None) and re.search(r'/teams/\d+/roster$', path):
            tid = int(re.search(r'/teams/(\d+)/', path).group(1)); t = next(x for x in teams if x['id'] == tid)
            return J({'season': {'year': spec.season}, 'athletes': spec.roster(t, rnd)})
        if path.endswith('/summary') and getattr(spec, 'summary', None): return J(spec.summary(teams, rnd))
        if path.endswith('/summary'):
            return J({'videos': [{'headline': 'Game Highlights', 'duration': 72, 'thumbnail': 'https://example.com/t.jpg', 'links': {'source': {'href': 'https://example.com/a.mp4'}}}, {'headline': 'Top plays', 'duration': 95, 'links': {'source': {'href': 'https://example.com/b.mp4'}}}], 'header': {'competitions': [{'date': '2025-10-09T02:00Z', 'competitors': [{'team': {'id': '1', 'abbreviation': 'AAA'}, 'homeAway': 'home', 'score': '3'}, {'team': {'id': '2', 'abbreviation': 'BBB'}, 'homeAway': 'away', 'score': '4'}]}]}, 'boxscore': {'players': [{'team': {'id': '1'}, 'statistics': [{'name': 'goalies', 'athletes': [{'athlete': {'id': athletes[45]['id']}}]}]}, {'team': {'id': '2'}, 'statistics': [{'name': 'goalies', 'athletes': [{'athlete': {'id': athletes[46]['id']}}]}]}]}, **({'drives': {'previous': [{'plays': spec.plays(rnd, [a for a in athletes])}]}} if spec.sp == 'football' else {'plays': spec.plays(rnd, [a for a in athletes]) if spec.plays else []})})
        return 404, 'text/plain', 'no ' + path
    return handle
