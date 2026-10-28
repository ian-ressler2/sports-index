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
        if '/statistics/byathlete' in path:
            limit = int(q.get('limit', ['25'])[0]); page = int(q.get('page', ['1'])[0])
            if limit > 1000: return 400, 'text/plain', 'bad'
            chunk = athletes[(page - 1) * limit: page * limit]
            return J({'pagination': {'count': len(athletes), 'limit': limit, 'page': page, 'pages': math.ceil(len(athletes) / limit)}, 'athletes': [athlete_row(a) for a in chunk], 'requestedSeason': {'year': spec.season, 'displayName': f'{spec.season-1}-{spec.season%100:02d}'}, 'categories': head_cats()})
        if '/statistics/byteam' in path:
            return J({'teams': [{'team': team_obj(t, spec.lg), 'categories': [{'name': n, 'values': (spec.tgen(t, rnd, n, i) if spec.tgen.__code__.co_argcount > 3 else spec.tgen(t, rnd, n))} for i, (n, _) in enumerate(spec.tcats)]} for t in teams], 'categories': [{'name': n, 'names': names} for n, names in spec.tcats]})
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
                ch.append({'name': conf, 'children': kids})
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
            return J({'names': names, 'labels': labels, 'events': evs, 'seasonTypes': [{'displayName': 'Regular Season', 'categories': cats}, {'displayName': 'Postseason', 'categories': []}]})
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
                evs.append({'id': f'{9000 + k}', 'date': f'2025-1{k % 3}-{k % 27 + 1:02d}T00:00Z', 'competitions': [{'status': {'type': {'completed': True, 'name': 'STATUS_FINAL'}}, 'competitors': [{'homeAway': 'home' if k % 2 else 'away', 'team': {'id': tid, 'abbreviation': 'ME'}, 'score': {'value': rnd.randint(0, 6)}}, {'homeAway': 'away' if k % 2 else 'home', 'team': {'id': str(opp['id']), 'abbreviation': opp['abbr'], 'displayName': opp['name']}, 'score': {'value': rnd.randint(0, 6)}}]}]})
            return J({'events': evs})
        if path.endswith('/summary'):
            return J({'header': {'competitions': [{'date': '2025-10-09T02:00Z', 'competitors': [{'team': {'id': '1', 'abbreviation': 'AAA'}, 'homeAway': 'home', 'score': '3'}, {'team': {'id': '2', 'abbreviation': 'BBB'}, 'homeAway': 'away', 'score': '4'}]}]}, 'boxscore': {'players': [{'team': {'id': '1'}, 'statistics': [{'name': 'goalies', 'athletes': [{'athlete': {'id': athletes[45]['id']}}]}]}, {'team': {'id': '2'}, 'statistics': [{'name': 'goalies', 'athletes': [{'athlete': {'id': athletes[46]['id']}}]}]}]}, **({'drives': {'previous': [{'plays': spec.plays(rnd, [a for a in athletes])}]}} if spec.sp == 'football' else {'plays': spec.plays(rnd, [a for a in athletes]) if spec.plays else []})})
        return 404, 'text/plain', 'no ' + path
    return handle
