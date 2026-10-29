import random
from espn_mock import Spec

NAMES = 'Blue Devils|Tar Heels|Wildcats|Jayhawks|Cougars|Bulldogs|Spartans|Huskies|Boilermakers|Gators|Tigers|Longhorns|Hawkeyes|Cardinals|Zags'.split('|')
LOCS = 'Duke|North Carolina|Kentucky|Kansas|Houston|Georgia|Michigan State|UConn|Purdue|Florida|Auburn|Texas|Iowa|Louisville|Gonzaga'.split('|')
ABBR = 'DUKE UNC UK KU HOU UGA MSU CONN PUR FLA AUB TEX IOWA LOU GONZ'.split()
COLORS = ['003087', '7bafd4', '0033a0', 'e8000d', 'c8102e', 'ba0c2f', '18453b', '000e2f', 'ceb888', 'fa4616', '0c2340', 'bf5700', 'ffcd00', 'c9001f', '041e42']
TEAMS = [{'id': 100 + i, 'name': NAMES[i], 'loc': LOCS[i], 'abbr': ABBR[i], 'color': COLORS[i]} for i in range(15)]
DIVS = {'Atlantic Coast Conference': {'x': [100 + i for i in range(0, 5)]}, 'Big 12 Conference': {'x': [100 + i for i in range(5, 10)]}, 'Mid-Eastern Athletic Conference': {'x': [100 + i for i in range(10, 15)]}}

# name lists copied from ESPN's college feeds
CATS = [
    ('general', ['gamesPlayed', 'avgMinutes', 'avgFouls', 'flagrantFouls', 'technicalFouls', 'ejections', 'doubleDouble', 'tripleDouble', 'PER', 'minutes', 'rebounds', 'fouls', 'avgRebounds']),
    ('offensive', ['avgPoints', 'avgFieldGoalsMade', 'avgFieldGoalsAttempted', 'fieldGoalPct', 'avgThreePointFieldGoalsMade', 'avgThreePointFieldGoalsAttempted', 'threePointFieldGoalPct', 'avgFreeThrowsMade', 'avgFreeThrowsAttempted', 'freeThrowPct', 'avgAssists', 'avgTurnovers', 'points', 'fieldGoalsMade', 'fieldGoalsAttempted', 'threePointFieldGoalsMade', 'threePointFieldGoalsAttempted', 'freeThrowsMade', 'freeThrowsAttempted', 'assists', 'turnovers']),
    ('defensive', ['avgSteals', 'avgBlocks', 'steals', 'blocks']),
]
def gen(pos, r):
    gp = r.randint(12, 31); mpg = r.uniform(8, 36); mn = round(gp * mpg); ppg = r.uniform(2, 24); pts = round(ppg * gp)
    fga = round(pts / 2.0); fgm = round(fga * r.uniform(.38, .55)); tpa = round(fga * .35); tpm = round(tpa * r.uniform(.28, .4)); fta = round(fga * .3); ftm = round(fta * .72)
    reb = round(gp * r.uniform(1, 10)); ast = round(gp * r.uniform(.5, 7)); tov = round(gp * r.uniform(.3, 3.2)); stl = round(gp * r.uniform(.2, 1.8)); blk = round(gp * r.uniform(.1, 2))
    return {'general': [gp, round(mpg, 1), 2.0, 0, r.randint(0, 2), 0, r.randint(0, 8), r.randint(0, 1), round(r.uniform(5, 25), 1), mn, reb, round(gp * 2), round(reb / gp, 1)],
            'offensive': [round(ppg, 1), round(fgm / gp, 1), round(fga / gp, 1), round(fgm / fga * 100, 1), round(tpm / gp, 1), round(tpa / gp, 1), round(tpm / max(tpa, 1) * 100, 1), round(ftm / gp, 1), round(fta / gp, 1), round(ftm / max(fta, 1) * 100, 1), round(ast / gp, 1), round(tov / gp, 1), pts, fgm, fga, tpm, tpa, ftm, fta, ast, tov],
            'defensive': [round(stl / gp, 1), round(blk / gp, 1), stl, blk]}

GP = 31
GEN_N = ['totalRebounds', 'avgRebounds', 'avgRebounds', 'teamAssistTurnoverRatio', 'technicalFouls', 'rebounds', 'assistTurnoverRatio', 'gamesPlayed', 'avgFouls', 'fouls']
DEF_N = ['defensiveRebounds', 'avgDefensiveRebounds', 'avgSteals', 'avgBlocks', 'blocks', 'steals']
OFF_N = ['avgPoints', 'fieldGoalPct', 'threePointFieldGoalPct', 'freeThrowPct', 'avgTurnovers', 'turnovers', 'avgFieldGoalsMade', 'avgFieldGoalsAttempted', 'avgThreePointFieldGoalsMade', 'avgThreePointFieldGoalsAttempted', 'avgFreeThrowsMade', 'avgFreeThrowsAttempted', 'avgOffensiveRebounds', 'avgAssists', 'points', 'fieldGoalsMade', 'fieldGoalsAttempted', 'threePointFieldGoalsMade', 'threePointFieldGoalsAttempted', 'freeThrowsMade', 'freeThrowsAttempted', 'offensiveRebounds', 'assists', 'offensiveReboundPct', 'scoringEfficiency', 'shootingEfficiency', 'threePointPct']
DIF_N = ['avgPointsDifferential', 'avgReboundsDifferential']
# the real feed lists each category twice (the team, then its opponents) and puts the opponent copies after the team's, in header order of first appearance
TC = [('general', GEN_N), ('general', GEN_N), ('defensive', DEF_N), ('defensive', DEF_N), ('offensive', OFF_N), ('offensive', OFF_N), ('differential', DIF_N)]
THEAD = [('general', GEN_N), ('defensive', DEF_N), ('offensive', OFF_N), ('differential', DIF_N)]
def tgen(t, r, cat, i=0):
    k = t['id'] - 100; opp = i in (1, 3, 5)
    if i in (0, 1): return [1300 - opp * 60, 41.9 - opp * 2, 41.9 - opp * 2, 1.3, 4, 1300 - opp * 60, 1.3, GP, 17.5, 540]
    if i in (2, 3): return [900 - opp * 40, 29, 7.2 - opp, 3.4 - opp, 105 - opp * 15, 223 - opp * 25]
    if i in (4, 5):
        pts = 2250 + k * 12 + (70 if i == 4 else -20) ; fga = 2000 + k * 5; fgm = round(fga * .44); tpa = 800; tpm = 280; fta = 620; ftm = 450; tov = 400 + opp * 20; oreb = 330 - opp * 20; ast = 450
        return [round(pts / GP, 1), round(fgm / fga * 100, 1), round(tpm / tpa * 100, 1), round(ftm / fta * 100, 1), round(tov / GP, 1), tov, round(fgm / GP, 1), round(fga / GP, 1), round(tpm / GP, 1), round(tpa / GP, 1), round(ftm / GP, 1), round(fta / GP, 1), round(oreb / GP, 1), round(ast / GP, 1), pts, fgm, fga, tpm, tpa, ftm, fta, oreb, ast, 31.2, 50.0, 52.0, 35.0]
    return [round((k - 7) / 2.5, 1), round((k - 7) / 8, 1)]
# standings are keyed by ESPN's stat *type* (the same names repeat for the home, road and conference splits)
def stand(t, r):
    w = 10 + t['id'] - 100; l = GP - w
    return {'wins': w, 'losses': l, 'winpercent': w / GP, 'gamesbehind': 3, 'pointsfor': 2300 + t['id'] * 6, 'pointsagainst': 2250 - t['id'] * 4, 'avgpointsfor': 74.0 + (t['id'] - 100) / 3, 'avgpointsagainst': 70.0 - (t['id'] - 100) / 5, 'pointdifferential': 50 + t['id'] - 100, 'playoffseed': (t['id'] - 100) % 5 + 1,
            'streak': 'W2', 'total': f'{w}-{l}', 'home': f'{w // 2 + 3}-{l // 3}', 'road': f'{w // 2 - 3}-{l - l // 3}', 'vsaprankedteams': f'{(t["id"] - 100) % 4}-{(t["id"] - 100) % 3}', 'vsconf': f'{w // 2}-{l // 2}',
            'home_wins': 99, 'vsconf_wins': 1}
GLN = ['minutes', 'points', 'totalRebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls', 'plusMinus']
GLL = ['MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', '+/-']
def glgen(r): return [str(r.randint(10, 38)), str(r.randint(0, 30)), str(r.randint(0, 14)), str(r.randint(0, 12)), str(r.randint(0, 4)), str(r.randint(0, 4)), str(r.randint(0, 6)), str(r.randint(0, 5)), str(r.randint(-20, 20))]
def plays(r, ath):
    out = []
    for i in range(160):
        ty = r.choice(['JumpShot', 'LayUpShot', 'DunkShot', 'ThreePointJumper', 'MadeFreeThrow', 'Defensive Rebound'])
        a = ath[r.randrange(0, 60)]; tid = str(100 + r.randrange(15)); made = r.random() < .46
        if ty == 'Defensive Rebound': out.append({'id': str(i), 'type': {'text': ty}, 'text': 'rebound', 'team': {'id': tid}, 'shootingPlay': False, 'participants': []}); continue
        three = ty.startswith('Three'); ft = ty == 'MadeFreeThrow'
        c = {'x': -214748340, 'y': -214748365} if ft else ({'x': r.randint(2, 48), 'y': r.randint(24, 40)} if three else {'x': r.randint(18, 32), 'y': r.randint(0, 18)})
        out.append({'id': str(i), 'type': {'text': ty}, 'text': f"{a['name']} {'makes' if made else 'misses'} {'three point jumper' if three else 'free throw' if ft else 'layup'}", 'team': {'id': tid}, 'period': {'number': 1 + i // 80}, 'clock': {'displayValue': '9:11'}, 'shootingPlay': True, 'scoringPlay': made,
                    'scoreValue': (1 if ft else 3 if three else 2) if made else 0, 'coordinate': c, 'participants': [{'athlete': {'id': a['id']}}] + ([{'athlete': {'id': ath[(i + 5) % 60]['id']}}] if made else [])})
    return out
SPEC = Spec('basketball', 'mens-college-basketball', 2026, TEAMS, DIVS, CATS, ['G', 'F', 'C'], gen, TC, tgen, stand, GP, 240, GLN, GLL, glgen, plays)
SPEC.thead = THEAD; SPEC.flat = True
