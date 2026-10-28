import random
from espn_mock import Spec

NAMES = 'Bruins Sabres Wings Panthers Habs Sens Lightning Leafs Canes Devils Isles Rangers Flyers Pens Caps Jackets Hawks Avs Stars Wild Preds Blues Jets Utah Ducks Flames Oilers Kings Sharks Kraken Canucks Knights'.split()
COLORS = ['fdb827', '003087', 'ce1126', '041e42', 'a6192e', 'c52032', '002868', '00205b', 'cc0000', 'ce1126', '00539b', '0038a8', 'f74902', 'fcb514', 'c8102e', '002654', 'ce1126', '6f263d', '006847', '154734', 'ffb81c', '002f87', '041e42', '6cace4', 'f47a38', 'c8102e', 'ff4c00', '111111', '006d75', '001628', '00205b', 'b4975a']
TEAMS = [{'id': i + 1, 'name': NAMES[i], 'loc': f'City{i+1}', 'abbr': (NAMES[i][:3]).upper(), 'color': COLORS[i]} for i in range(32)]
DIVS = {'Eastern Conference': {'Atlantic Division': list(range(1, 9)), 'Metropolitan Division': list(range(9, 17))}, 'Western Conference': {'Central Division': list(range(17, 25)), 'Pacific Division': list(range(25, 33))}}
CATS = [
    ('general', ['games', 'plusMinus', 'timeOnIcePerGame', 'shifts', 'production', 'wins', 'losses', 'timeOnIce']),
    ('offensive', ['goals', 'assists', 'points', 'powerPlayGoals', 'powerPlayAssists', 'shotsTotal', 'shootingPct', 'gameWinningGoals', 'faceoffsWon', 'faceoffsLost', 'faceoffPercent', 'shootoutAttempts', 'shootoutGoals', 'shootoutShotPct']),
    ('defensive', ['overtimeLosses', 'avgGoalsAgainst', 'shotsAgainst', 'goalsAgainst', 'saves', 'savePct', 'shootoutShotsAgainst', 'shootoutSaves', 'shootoutSavePct', 'shutouts']),
    ('penalties', ['penaltyMinutes']),
]
def gen(pos, r):
    if pos == 'G':
        gp = r.randint(5, 62); sa = gp * r.randint(24, 32); sv = int(sa * r.uniform(.88, .93)); toi = gp * 3500
        return {'general': [gp, 0, 0, 0, 0, r.randint(0, gp // 2), r.randint(0, gp // 3), toi], 'offensive': [0] * 14, 'defensive': [r.randint(0, 6), round((sa - sv) / gp, 2), sa, sa - sv, sv, round(sv / sa, 3), 0, 0, 0, r.randint(0, 6)], 'penalties': [r.randint(0, 6)]}
    gp = r.randint(20, 82); toi = gp * r.randint(900, 1400); g = r.randint(0, 45); a = r.randint(0, 70); s = max(g, r.randint(40, 300))
    return {'general': [gp, r.randint(-25, 40), toi // gp, gp * 22, 0, 0, 0, toi], 'offensive': [g, a, g + a, r.randint(0, 12), r.randint(0, 20), s, round(g / s * 100, 1), r.randint(0, 8), r.randint(0, 400), r.randint(0, 400), 50.0, 0, 0, 0.0], 'defensive': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'penalties': [r.randint(0, 80)]}
TCATS = [('general', ['games', 'wins', 'losses']), ('offensive', ['avgGoals', 'goals', 'assists', 'points', 'powerPlayGoals', 'powerPlayOpportunities', 'powerPlayPct', 'shortHandedGoals', 'shotsTotal', 'shootingPct', 'shootoutAttempts', 'shootoutGoals', 'shootoutShotPct']),
         ('defensive', ['penaltyKillPct', 'avgGoalsAgainst', 'overtimeLosses', 'shotsAgainst', 'goalsAgainst', 'saves', 'savePct', 'shootoutShotsAgainst', 'shootoutSaves', 'shootoutSavePct', 'shutouts']), ('penalties', ['penaltyMinutes'])]
def tgen(t, r, cat):
    if cat == 'general': return [82, 30 + t['id'], 40 - t['id'] // 2]
    if cat == 'offensive': gf = 230 + t['id'] * 3; return [round(gf / 82, 2), gf, gf * 2, gf * 4, 50, 250, 20.5, 5, 2300 + t['id'] * 5, round(gf / (2300 + t['id'] * 5) * 100, 2), 20, 5, 25.0]
    if cat == 'defensive': ga = 280 - t['id'] * 2; return [78.2, round(ga / 82, 2), 8, 2300, ga, 2300 - ga, round(1 - ga / 2300, 3), 10, 7, .7, 4]
    return [800 + t['id']]
def stand(t, r):
    w = 30 + t['id']; l = 40 - t['id'] // 2; otl = 82 - w - l
    return {'gamesPlayed': 82, 'wins': w, 'losses': l, 'otLosses': otl, 'points': 2 * w + otl, 'pointsFor': 230 + t['id'] * 3, 'pointsAgainst': 280 - t['id'] * 2, 'pointDifferential': t['id'] * 5 - 50, 'playoffSeed': t['id'] % 8 + 1, 'regWins': w - 8, 'rotWins': w - 3, 'streak': 'W2', 'clincher': 'x' if t['id'] % 3 == 0 else '', 'Home': '20-15-6', 'Road': '18-17-6', 'Last Ten Games': '6-3-1, 0 PTS'}
GLN = ['goals', 'assists', 'points', 'plusMinus', 'penaltyMinutes', 'shotsTotal', 'shootingPct', 'powerPlayGoals', 'powerPlayAssists', 'shortHandedGoals', 'shortHandedAssists', 'gameWinningGoals', 'timeOnIcePerGame', 'production']
GLL = ['G', 'A', 'PTS', '+/-', 'PIM', 'S', 'SPCT', 'PPG', 'PPA', 'SHG', 'SHA', 'GWG', 'TOI/G', 'PROD']
def glgen(r): return [str(r.randint(0, 2)), str(r.randint(0, 2)), str(r.randint(0, 3)), str(r.randint(-2, 2)), '0', str(r.randint(0, 6)), '12.5', '0', '0', '0', '0', '0', '18:30', '9:10']
def plays(r, ath):
    out = []
    for i in range(120):
        ty = r.choice(['Shot', 'Shot', 'Missed', 'Blocked', 'Goal', 'Face Off', 'Hit'])
        a = ath[r.randrange(0, 40)]; tid = r.choice(['1', '2'])
        p = {'id': str(i), 'type': {'text': ty}, 'text': f"{a['name']} Wrist Shot", 'team': {'id': tid}, 'period': {'number': 1 + i // 40}, 'clock': {'displayValue': '1:51'}, 'shootingPlay': ty in ('Shot', 'Missed', 'Blocked', 'Goal'), 'scoringPlay': ty == 'Goal',
             'coordinate': {'x': r.choice([-1, 1]) * r.randint(30, 95), 'y': r.randint(-35, 35)}, 'participants': [{'athlete': {'id': a['id'], 'shortName': a['name']}, 'type': 'scorer' if ty == 'Goal' else 'shooter'}, {'athlete': {'id': ath[r.randrange(40, 60)]['id'], 'shortName': 'G'}, 'type': 'saver' if ty == 'Shot' else 'goalie'}]}
        out.append(p)
    out.append({'id': 'x', 'type': {'text': 'Shot'}, 'coordinate': {'x': -214748340, 'y': -214748365}, 'participants': []})
    return out
SPEC = Spec('hockey', 'nhl', 2026, TEAMS, DIVS, CATS, ['C', 'LW', 'RW', 'D', 'D', 'C', 'G'], gen, TCATS, tgen, stand, 82, 700, GLN, GLL, glgen, plays)
