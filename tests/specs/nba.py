import random
from espn_mock import Spec

NAMES = 'Hawks Celtics Nets Hornets Bulls Cavaliers Mavericks Nuggets Pistons Warriors Rockets Pacers Clippers Lakers Grizzlies Heat Bucks Wolves Pelicans Knicks Thunder Magic Sixers Suns Blazers Kings Spurs Raptors Jazz Wizards'.split()
COLORS = ['c8102e', '007a33', '000000', '1d1160', 'ce1141', '860038', '00538c', '0e2240', 'c8102e', '1d428a', 'ce1141', '002d62', 'c8102e', '552583', '5d76a9', '98002e', '00471b', '0c2340', '0c2340', '006bb6', '007ac1', '0077c0', '006bb6', '1d1160', 'e03a3e', '5a2d81', 'c4ced4', 'ce1141', '002b5c', '002b5c']
TEAMS = [{'id': i + 1, 'name': NAMES[i], 'loc': f'City{i+1}', 'abbr': (NAMES[i][:3]).upper(), 'color': COLORS[i]} for i in range(30)]
DIVS = {'Eastern Conference': {'Atlantic': list(range(1, 6)), 'Central': list(range(6, 11)), 'Southeast': list(range(11, 16))},
        'Western Conference': {'Northwest': list(range(16, 21)), 'Pacific': list(range(21, 26)), 'Southwest': list(range(26, 31))}}
CATS = [
    ('general', ['gamesPlayed', 'minutes', 'avgMinutes', 'rebounds', 'avgRebounds', 'fouls', 'avgFouls', 'technicalFouls', 'doubleDouble', 'tripleDouble']),
    ('offensive', ['points', 'avgPoints', 'fieldGoalsMade', 'fieldGoalsAttempted', 'avgFieldGoalsAttempted', 'fieldGoalPct', 'threePointFieldGoalsMade', 'threePointFieldGoalsAttempted', 'avgThreePointFieldGoalsMade', 'avgThreePointFieldGoalsAttempted', 'threePointFieldGoalPct', 'freeThrowsMade', 'freeThrowsAttempted', 'avgFreeThrowsAttempted', 'freeThrowPct', 'assists', 'avgAssists', 'turnovers', 'avgTurnovers']),
    ('defensive', ['steals', 'avgSteals', 'blocks', 'avgBlocks']),
]
def gen(pos, r):
    gp = r.randint(8, 82); mpg = r.uniform(8, 36); mn = round(gp * mpg); ppg = r.uniform(2, 28); pts = round(ppg * gp)
    fga = round(pts / 2.2); fgm = round(fga * r.uniform(.4, .55)); tpa = round(fga * .35); tpm = round(tpa * r.uniform(.28, .4)); fta = round(fga * .25); ftm = round(fta * .78)
    reb = round(gp * r.uniform(1, 11)); ast = round(gp * r.uniform(.5, 9)); tov = round(gp * r.uniform(.3, 3.5)); stl = round(gp * r.uniform(.2, 1.8)); blk = round(gp * r.uniform(.1, 2))
    return {'general': [gp, mn, round(mpg, 1), reb, round(reb / gp, 1), round(gp * 2), 2.0, r.randint(0, 3), r.randint(0, 10), r.randint(0, 2)],
            'offensive': [pts, round(ppg, 1), fgm, fga, round(fga / gp, 1), round(fgm / fga * 100, 1), tpm, tpa, round(tpm / gp, 1), round(tpa / gp, 1), round(tpm / max(tpa, 1) * 100, 1), ftm, fta, round(fta / gp, 1), round(ftm / max(fta, 1) * 100, 1), ast, round(ast / gp, 1), tov, round(tov / gp, 1)],
            'defensive': [stl, round(stl / gp, 1), blk, round(blk / gp, 1)]}
TC = [('general', ['gamesPlayed', 'rebounds', 'avgRebounds', 'fouls', 'avgFouls']),
      ('offensive', ['points', 'avgPoints', 'fieldGoalsMade', 'fieldGoalsAttempted', 'fieldGoalPct', 'threePointFieldGoalsMade', 'threePointFieldGoalsAttempted', 'avgThreePointFieldGoalsMade', 'avgThreePointFieldGoalsAttempted', 'threePointFieldGoalPct', 'freeThrowsAttempted', 'avgFreeThrowsAttempted', 'freeThrowPct', 'offensiveRebounds', 'avgOffensiveRebounds', 'assists', 'avgAssists', 'turnovers', 'avgTurnovers']),
      ('defensive', ['steals', 'avgSteals', 'blocks', 'avgBlocks', 'defensiveRebounds', 'avgDefensiveRebounds']),
      ('differential', ['avgPointsDifferential', 'avgReboundsDifferential']),
      ('general', ['gamesPlayed', 'rebounds', 'avgRebounds', 'fouls', 'avgFouls']),
      ('offensive', ['points', 'avgPoints', 'fieldGoalsMade', 'fieldGoalsAttempted', 'fieldGoalPct', 'threePointFieldGoalsMade', 'threePointFieldGoalsAttempted', 'avgThreePointFieldGoalsMade', 'avgThreePointFieldGoalsAttempted', 'threePointFieldGoalPct', 'freeThrowsAttempted', 'avgFreeThrowsAttempted', 'freeThrowPct', 'offensiveRebounds', 'avgOffensiveRebounds', 'assists', 'avgAssists', 'turnovers', 'avgTurnovers']),
      ('defensive', ['steals', 'avgSteals', 'blocks', 'avgBlocks', 'defensiveRebounds', 'avgDefensiveRebounds'])]
def tgen(t, r, cat, i=0):
    k = t['id']; g = 82
    if i in (0, 4): return [g, 3600 + k * 5, round((3600 + k * 5) / g, 1), 1700, 20.7]
    if i in (1, 5):
        pts = 9000 + k * 20 + (i == 5) * 150; fga = 6900; fgm = 3200 + k * 3
        return [pts, round(pts / g, 1), fgm, fga, round(fgm / fga * 100, 1), 1200, 3300, 14.6, 40.2, 36.4, 1800, 22, 78.1, 900, 11, 2000, 24.4, 1100, 13.4]
    if i in (2, 6): return [650, 7.9, 380, 4.6, 2600, 31.7]
    return [round((k - 15) / 3, 1), round((k - 15) / 8, 1)]
def stand(t, r):
    w = 20 + t['id']; l = 62 - t['id']
    return {'wins': w, 'losses': l, 'winPercent': w / 82, 'gamesBehind': 3, 'pointsFor': 9000 + t['id'] * 20, 'pointsAgainst': 9100 - t['id'] * 10, 'avgPointsFor': 110.0 + t['id'] / 5, 'avgPointsAgainst': 113.0 - t['id'] / 8, 'differential': t['id'] / 2, 'playoffSeed': t['id'] % 15 + 1, 'streak': 'W2', 'clincher': 'x' if t['id'] % 3 == 0 else '', 'Home': '20-21', 'Road': '19-22', 'Last Ten Games': '6-4', 'vs. Conf.': '25-27'}
GLN = ['minutes', 'points', 'totalRebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls', 'plusMinus']
GLL = ['MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-']
def glgen(r): return [str(r.randint(10, 38)), str(r.randint(0, 40)), str(r.randint(0, 14)), str(r.randint(0, 12)), str(r.randint(0, 4)), str(r.randint(0, 4)), str(r.randint(0, 6)), str(r.randint(0, 5)), str(r.randint(-20, 20))]
def plays(r, ath):
    out = []
    for i in range(160):
        ty = r.choice(['Jump Shot', 'Layup Shot', 'Dunk', 'Three Point Jump Shot', 'Free Throw', 'Rebound'])
        a = ath[r.randrange(0, 60)]; tid = r.choice(['1', '2']); made = r.random() < .46
        if ty == 'Rebound': out.append({'id': str(i), 'type': {'text': 'Defensive Rebound'}, 'text': 'rebound', 'team': {'id': tid}, 'shootingPlay': False, 'participants': []}); continue
        three = ty.startswith('Three'); ft = ty == 'Free Throw'
        c = {'x': -214748340, 'y': -214748365} if ft else ({'x': r.randint(2, 48), 'y': r.randint(24, 40)} if three else {'x': r.randint(15, 35), 'y': r.randint(0, 18)})
        out.append({'id': str(i), 'type': {'text': ty}, 'text': f"{a['name']} {'makes' if made else 'misses'} {ty}", 'team': {'id': tid}, 'period': {'number': 1 + i // 40}, 'clock': {'displayValue': '5:11'}, 'shootingPlay': True, 'scoringPlay': made,
                    'scoreValue': (1 if ft else 3 if three else 2) if made else 0, 'coordinate': c, 'participants': [{'athlete': {'id': a['id']}}] + ([{'athlete': {'id': ath[(i + 5) % 60]['id']}}] if made else [])})
    return out
class _S(Spec):
    pass
SPEC = Spec('basketball', 'nba', 2026, TEAMS, DIVS, CATS, ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'], gen, TC, tgen, stand, 82, 480, GLN, GLL, glgen, plays)
