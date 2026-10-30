import random
from espn_mock import Spec

LOCS = 'Arsenal|Aston Villa|Bournemouth|Brentford|Brighton|Chelsea|Crystal Palace|Everton|Fulham|Leeds|Liverpool|Manchester City|Manchester United|Newcastle|Nottingham Forest|Spurs|Sunderland|West Ham|Wolves|Burnley'.split('|')
TEAMS = [{'id': 359 + i, 'name': LOCS[i], 'loc': '', 'abbr': (LOCS[i][:3]).upper(), 'color': 'c8102e'} for i in range(20)]
DIVS = {'English Premier League': {'x': [t['id'] for t in TEAMS]}}
GP = 8
def stand(t, r):
    k = t['id'] - 359; w = (k * 5) % 8; d = k % 3; l = GP - w - d; gf = 8 + (k * 7) % 14; ga = 22 - (k * 3) % 13
    return {'gamesplayed': GP, 'wins': w, 'ties': d, 'losses': l, 'points': 3 * w + d, 'pointsfor': gf, 'pointsagainst': ga, 'pointdifferential': gf - ga, 'rank': k + 1, 'ppg': 0, 'wins_home': 99}
def core(t, r):
    k = t['id'] - 359
    return {'offensive': {'totalShots': 90 + k * 4, 'shotsOnTarget': 30 + k, 'possessionPct': 40 + k * 1.4, 'totalPasses': 3000 + k * 60, 'accuratePasses': 2400 + k * 60, 'avgExpectedGoals': 1.0 + k / 20, 'avgBigChanceCreated': 1.0 + k / 30, 'goalAssists': 6 + k % 5,
                         'totalCrosses': 120, 'accurateCrosses': 35, 'totalLongBalls': 300, 'accurateLongBalls': 140, 'offsides': 20, 'headedGoals': 2, 'penaltyKickGoals': 1, 'freeKickGoals': 0},
            'defensive': {'totalTackles': 150, 'effectiveTackles': 90, 'interceptions': 60, 'totalClearance': 150, 'blockedShots': 30, 'recoveries': 330},
            'general': {'appearances': GP, 'foulsCommitted': 90, 'foulsSuffered': 100, 'yellowCards': 12, 'redCards': k % 2, 'secondYellow': 0, 'wonCorners': 45, 'duelsWon': 360, 'duels': 720, 'avgExpectedGoalDifferential': (k - 10) / 15},
            'goalKeeping': {'cleanSheet': k % 5, 'saves': 22 + k, 'shotsFaced': 40 + k, 'penaltyKicksSaved': 0, 'bigChanceSaves': 5, 'avgExpectedGoalsConceded': 1.7 - k / 30}}
def summary(teams, r):
    a, b = teams[0], teams[1]; cm = []
    def add(seq, ty, tx, clk, val, per, team=None, xy=None):
        p = {'id': str(seq), 'type': {'text': ty}, 'text': tx, 'period': {'number': per}, 'clock': {'value': val, 'displayValue': clk}}
        if team: p['team'] = {'displayName': team['name']}
        if xy: p['fieldPositionX'], p['fieldPositionY'] = xy
        cm.append({'sequence': seq, 'time': {'value': val, 'displayValue': clk}, 'text': tx, 'play': p})
    add(0, '', 'Lineups are announced and players are warming up.', '', 0, 1)
    add(1, 'Kickoff', 'First Half begins.', '', 0, 1)
    hs = as_ = 0; seq = 2
    for m in range(2, 92, 3):
        tm = a if r.random() < .55 else b; per = 1 if m < 46 else 2; ty = r.choice(['Shot Off Target', 'Shot On Target', 'Shot Blocked', 'Foul', 'Corner Awarded', 'Yellow Card', 'Goal', 'Shot Hit Woodwork'])
        if ty == 'Goal':
            if tm is a: hs += 1
            else: as_ += 1
            tx = f"Goal! {a['name']} {hs}, {b['name']} {as_}. Someone ({tm['name']}) shot."
        else: tx = f"{ty} by someone ({tm['name']})."
        add(seq, ty, tx, f"{m}'", m * 60, per, tm, (r.uniform(70, 98), r.uniform(25, 75)) if ty.startswith(('Shot', 'Goal')) else None); seq += 1
    add(seq, '', f"Match ends, {a['name']} {hs}, {b['name']} {as_}.", '', 0, 2)
    cm.reverse()
    return {'videos': [], 'commentary': cm, 'header': {'competitions': [{'date': '2026-10-24T14:00Z', 'status': {'type': {'detail': 'FT'}}, 'competitors': [{'team': {'id': str(a['id']), 'abbreviation': a['abbr'], 'displayName': a['name']}, 'homeAway': 'home', 'score': str(hs)}, {'team': {'id': str(b['id']), 'abbreviation': b['abbr'], 'displayName': b['name']}, 'homeAway': 'away', 'score': str(as_)}]}]}}
def roster(t, r):
    out = []
    for i in range(12):
        pos = 'G' if i == 0 else 'DMF'[i % 3]
        app = 3 + (i * 5 + t['id']) % 6
        gen = {'appearances': app, 'subIns': i % 3, 'foulsCommitted': i % 7, 'foulsSuffered': i % 5, 'redCards': 0, 'yellowCards': i % 4, 'ownGoals': 0}
        cats = [{'name': 'general', 'stats': [{'name': k, 'value': v} for k, v in gen.items()]},
                {'name': 'offensive', 'stats': [{'name': 'totalGoals', 'value': (i * 2) % 5}, {'name': 'goalAssists', 'value': i % 4}, {'name': 'totalShots', 'value': 4 + i}, {'name': 'shotsOnTarget', 'value': 2 + i % 4}, {'name': 'offsides', 'value': i % 3}]},
                {'name': 'goalKeeping', 'stats': [{'name': 'saves', 'value': 12 if pos == 'G' else 0}, {'name': 'shotsFaced', 'value': 17 if pos == 'G' else 0}, {'name': 'goalsConceded', 'value': 5 if pos == 'G' else 0}]}]
        out.append({'id': str(300000 + t['id'] * 20 + i), 'displayName': f"Player {t['id']}-{i}", 'age': 20 + i, 'jersey': str(i + 1), 'displayHeight': "6' 0\"", 'citizenship': 'England',
                    'position': {'abbreviation': pos}, 'statistics': {'splits': {'categories': cats}}})
    return out
SPEC = Spec('soccer', 'eng.1', 2026, TEAMS, DIVS, [], ['F'], lambda pos, r: {}, [], lambda *a: [], stand, GP, 0, [], [], lambda r: [], None)
SPEC.flat = True; SPEC.core = core; SPEC.summary = summary; SPEC.roster = roster
