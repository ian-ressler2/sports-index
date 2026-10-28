import random
from espn_mock import Spec

NAMES = 'Cardinals Falcons Ravens Bills Panthers Bears Bengals Browns Cowboys Broncos Lions Packers Texans Colts Jaguars Chiefs Raiders Chargers Rams Dolphins Vikings Patriots Saints Giants Jets Eagles Steelers 49ers Seahawks Buccaneers Titans Commanders'.split()
TEAMS = [{'id': i + 1, 'name': NAMES[i], 'loc': f'City{i+1}', 'abbr': (NAMES[i][:3]).upper(), 'color': ['a40227', '000000', '241773', '00338d'][i % 4]} for i in range(32)]
DIVN = ['AFC East', 'AFC North', 'AFC South', 'AFC West', 'NFC East', 'NFC North', 'NFC South', 'NFC West']
DIVS = {'American Football Conference': {d: list(range(1 + 4 * i, 5 + 4 * i)) for i, d in enumerate(DIVN[:4])}, 'National Football Conference': {d: list(range(17 + 4 * i, 21 + 4 * i)) for i, d in enumerate(DIVN[4:])}}
CATS = [
    ('general', ['gamesPlayed', 'fumblesForced', 'fumblesRecovered', 'fumblesTouchdowns']),
    ('passing', ['completions', 'passingAttempts', 'completionPct', 'passingYards', 'yardsPerPassAttempt', 'passingYardsPerGame', 'longPassing', 'passingTouchdowns', 'interceptions', 'sacks', 'sackYardsLost', 'QBR', 'QBRating', 'adjQBR']),
    ('rushing', ['rushingAttempts', 'rushingYards', 'yardsPerRushAttempt', 'longRushing', 'rushingBigPlays', 'rushingTouchdowns', 'rushingYardsPerGame', 'rushingFumbles', 'rushingFumblesLost', 'rushingFirstDowns']),
    ('receiving', ['receptions', 'receivingTargets', 'receivingYards', 'yardsPerReception', 'receivingTouchdowns', 'longReception', 'receivingBigPlays', 'receivingYardsPerGame', 'receivingFumbles', 'receivingFumblesLost', 'receivingYardsAfterCatch', 'receivingFirstDowns']),
    ('defensive', ['soloTackles', 'assistTackles', 'totalTackles', 'sacks', 'sackYards', 'tacklesForLoss', 'passesDefended', 'longInterception']),
    ('defensiveinterceptions', ['interceptions', 'interceptionYards', 'interceptionTouchdowns']),
    ('kicking', ['fieldGoalsMade', 'fieldGoalAttempts', 'fieldGoalPct', 'longFieldGoalMade', 'fieldGoalsMade1_19', 'fieldGoalsMade20_29', 'fieldGoalsMade30_39', 'fieldGoalsMade40_49', 'fieldGoalsMade50', 'fieldGoalAttempts1_19', 'fieldGoalAttempts20_29', 'fieldGoalAttempts30_39', 'fieldGoalAttempts40_49', 'fieldGoalAttempts50', 'extraPointsMade', 'extraPointAttempts', 'extraPointPct']),
    ('punting', ['punts', 'puntYards', 'longPunt', 'grossAvgPuntYards', 'netAvgPuntYards', 'puntsBlocked', 'puntsInside20', 'touchbacks', 'fairCatches', 'puntReturns', 'puntReturnYards', 'avgPuntReturnYards']),
]
def gen(pos, r):
    gp = r.randint(4, 17); z = lambda n: [0] * n; v = {n: z(len(ns)) for n, ns in CATS}; v['general'] = [gp, r.randint(0, 3), r.randint(0, 3), 0]
    if pos == 'QB':
        att = gp * r.randint(18, 38); cm = int(att * r.uniform(.55, .7)); y = int(cm * r.uniform(9, 13)); v['passing'] = [cm, att, round(cm / att * 100, 1), y, round(y / att, 1), round(y / gp, 1), r.randint(30, 70), r.randint(5, 40), r.randint(2, 18), r.randint(5, 40), r.randint(30, 250), r.uniform(30, 80), r.uniform(70, 110), r.uniform(30, 80)]
        a = r.randint(10, 80); v['rushing'] = [a, a * 4, 4.0, 20, 1, r.randint(0, 5), 20.0, 2, 1, 10]
    elif pos in ('RB', 'FB'):
        a = gp * r.randint(5, 20); y = int(a * r.uniform(3.2, 5.5)); v['rushing'] = [a, y, round(y / a, 1), r.randint(15, 70), r.randint(0, 8), r.randint(0, 14), round(y / gp, 1), 2, 1, int(a * .25)]
        t = gp * r.randint(1, 5); rc = int(t * .75); v['receiving'] = [rc, t, rc * 7, 7.0, r.randint(0, 3), 25, 1, 20.0, 0, 0, rc * 4, int(rc * .5)]
    elif pos in ('WR', 'TE'):
        t = gp * r.randint(2, 11); rc = int(t * r.uniform(.55, .8)); y = int(rc * r.uniform(8, 16)); v['receiving'] = [rc, t, y, round(y / rc, 1), r.randint(0, 10), r.randint(20, 80), r.randint(0, 8), round(y / gp, 1), 1, 0, int(y * .4), int(rc * .6)]
    elif pos in ('PK', 'K'):
        a = gp * r.randint(1, 3); m = int(a * .85); v['kicking'] = [m, a, round(m / a * 100, 1), r.randint(40, 58), 0, m // 3, m // 3, m // 3, m // 5, 0, a // 3, a // 3, a // 3, a // 5, gp * 2, gp * 2, 100.0]
    elif pos == 'P':
        n = gp * r.randint(2, 5); v['punting'] = [n, n * 46, r.randint(55, 75), 46.5, 41.2, 0, n // 3, n // 10, n // 5, n // 3, n * 5, 7.5]
    else:
        v['defensive'] = [r.randint(5, 60), r.randint(2, 30), r.randint(8, 90), r.choice([0, 0, 0.5, 1, 3.5, 8]), 20, r.randint(0, 10), r.randint(0, 8), 20]; v['defensiveinterceptions'] = [r.choice([0, 0, 1, 2]), 15, 0]
    return v
TC = [('general', ['gamesPlayed', 'fumblesRecovered', 'fumblesLost']),
      ('passing', ['totalYards', 'yardsPerGame', 'netPassingYards', 'netPassingYardsPerGame', 'totalPoints', 'totalPointsPerGame', 'completions', 'passingYards', 'passingYardsPerGame', 'passingAttempts', 'completionPct', 'netTotalYards', 'netYardsPerGame', 'netYardsPerPassAttempt', 'yardsPerPassAttempt', 'longPassing', 'passingTouchdowns', 'interceptions', 'sacks', 'sackYardsLost', 'QBRating']),
      ('rushing', ['rushingYards', 'rushingYardsPerGame', 'rushingAttempts', 'rushingYards', 'yardsPerRushAttempt', 'rushingYardsPerGame', 'longRushing', 'rushingTouchdowns', 'rushingFumbles', 'rushingFumblesLost']),
      ('miscellaneous', ['firstDowns', 'firstDownsRushing', 'firstDownsPassing', 'firstDownsPenalty', 'thirdDownConvs', 'thirdDownAttempts', 'thirdDownConvPct', 'fourthDownConvs', 'fourthDownAttempts', 'fourthDownConvPct', 'totalPenalties', 'totalPenaltyYards', 'turnOverDifferential', 'totalTakeaways', 'totalGiveaways'])]
def tgen(t, r, cat):
    k = t['id']
    if cat == 'general': return [17, 8, 10]
    if cat == 'passing': return [5800 + k * 20, 340, 4700, 276, 450, 26, 380, 3900 + k * 10, 230, 560, 66.5, 5700, 335, 6.5, 7.0, 55, 25, 12, 38, 250, 90.0]
    if cat == 'rushing': return [1900 + k * 10, 111, 420, 1900, 4.5, 111, 40, 15, 12, 5]
    return [320, 100, 180, 20, 90, 200, 42.0, 10, 20, 50.0, 90, 800, 3, 22, 19]
def stand(t, r):
    w = 3 + (t['id'] * 7) % 12; l = 17 - w
    return {'wins': w, 'losses': l, 'ties': 0, 'winPercent': w / 17, 'pointsFor': 300 + t['id'] * 6, 'pointsAgainst': 450 - t['id'] * 4, 'differential': t['id'] * 10 - 150, 'playoffSeed': t['id'] % 7 + 1, 'streak': 'W2', 'clincher': 'x' if t['id'] % 3 == 0 else '', 'Home': '5-3', 'Road': '4-5', 'vs. Div.': '3-3', 'vs. Conf.': '7-5', 'gamesBehind': 1}
GLN = ['completions', 'passingAttempts', 'passingYards', 'completionPct', 'yardsPerPassAttempt', 'passingTouchdowns', 'interceptions', 'longPassing', 'sacks', 'QBRating', 'adjQBR', 'rushingAttempts', 'rushingYards', 'yardsPerRushAttempt', 'rushingTouchdowns', 'longRushing', 'receivingYards', 'totalTackles', 'fieldGoalsMade', 'punts']
GLL = ['CMP', 'ATT', 'YDS', 'CMP%', 'AVG', 'TD', 'INT', 'LNG', 'SACK', 'RTG', 'QBR', 'CAR', 'RYDS', 'RAVG', 'RTD', 'RLNG', 'RECYDS', 'TKL', 'FGM', 'PUNTS']
def glgen(r): return [str(r.randint(10, 30)), str(r.randint(20, 40)), str(r.randint(100, 380)), '62.5', '7.2', str(r.randint(0, 4)), str(r.randint(0, 2)), '45', '2', '95.0', '60.0', str(r.randint(0, 15)), str(r.randint(0, 120)), '4.5', str(r.randint(0, 2)), '20', str(r.randint(0, 150)), str(r.randint(0, 12)), str(r.randint(0, 3)), str(r.randint(0, 6))]
def plays(r, ath):
    out = []
    for i in range(140):
        k = r.choice(['rush', 'rush', 'pass', 'pass', 'inc', 'sack', 'pen']); off = r.choice(['1', '2']); a = ath[r.randrange(0, 40)]; b = ath[r.randrange(40, 100)]
        nm = lambda p: p['name'][0] + '.' + p['name'].split()[-1]
        st = {'down': r.randint(1, 4), 'distance': r.randint(1, 15), 'yardLine': 50, 'yardsToEndzone': r.randint(2, 98), 'team': {'id': off}}
        base = {'id': str(i), 'period': {'number': 1 + i // 35}, 'clock': {'displayValue': '9:10'}, 'teamParticipants': [{'id': off, 'type': 'offense'}, {'id': '2' if off == '1' else '1', 'type': 'defense'}], 'isPenalty': k == 'pen', 'start': st, 'end': st, 'isTurnover': False, 'scoringPlay': False}
        if k == 'rush': g = r.choice(['left end', 'left guard', 'up the middle', 'right tackle', 'right end']); y = r.randint(-3, 14); out.append({**base, 'type': {'text': 'Rush'}, 'text': f"(Shotgun) {nm(a)} {g} to KC 28 for {y} yards (X.Y).", 'statYardage': y})
        elif k == 'pass': y = r.randint(0, 40); out.append({**base, 'type': {'text': 'Pass Reception'}, 'text': f"{nm(a)} pass {r.choice(['short', 'deep'])} {r.choice(['left', 'middle', 'right'])} to {nm(b)} for {y} yards.", 'statYardage': y})
        elif k == 'inc': out.append({**base, 'type': {'text': 'Pass Incompletion'}, 'text': f"{nm(a)} pass incomplete short left to {nm(b)}.", 'statYardage': 0})
        elif k == 'sack': out.append({**base, 'type': {'text': 'Sack'}, 'text': f"{nm(a)} sacked at KC 20 for -7 yards (X.Y).", 'statYardage': -7})
        else: out.append({**base, 'type': {'text': 'Penalty'}, 'text': 'Penalty on X', 'statYardage': 0})
    return out
SPEC = Spec('football', 'nfl', 2026, TEAMS, DIVS, CATS, ['QB', 'RB', 'WR', 'WR', 'TE', 'LB', 'DE', 'CB', 'S', 'PK', 'P', 'DT'], gen, TC, tgen, stand, 17, 700, GLN, GLL, glgen, plays)
