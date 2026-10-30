import random
from espn_mock import Spec
import nfl  # the play-by-play generator is the same drive feed

NAMES = 'Crimson Tide|Buckeyes|Ducks|Bulldogs|Longhorns|Wolverines|Fighting Irish|Tigers|Sooners|Nittany Lions|Seminoles|Hurricanes|Aggies|Utes|Cowboys|Tar Heels'.split('|')
LOCS = 'Alabama|Ohio State|Oregon|Georgia|Texas|Michigan|Notre Dame|Clemson|Oklahoma|Penn State|Florida State|Miami|Texas A&M|Utah|Oklahoma State|North Carolina'.split('|')
ABBR = 'ALA OSU ORE UGA TEX MICH ND CLEM OU PSU FSU MIA TAMU UTAH OKST UNC'.split()
COLORS = ['9e1b32', 'bb0000', '154733', 'ba0c2f', 'bf5700', '00274c', '0c2340', 'f56600', '841617', '041e42', '782f40', 'f47321', '500000', 'cc0000', 'ff7300', '7bafd4']
TEAMS = [{'id': 200 + i, 'name': NAMES[i], 'loc': LOCS[i], 'abbr': ABBR[i], 'color': COLORS[i]} for i in range(16)]
DIVS = {'Southeastern Conference': {'x': [200 + i for i in (0, 3, 7, 12)]}, 'Big Ten Conference': {'x': [200 + i for i in (1, 5, 9)]}, 'Big 12 Conference': {'x': [200 + i for i in (4, 8, 14)]},
        'Atlantic Coast Conference': {'x': [200 + i for i in (10, 11, 15)]}, 'FBS Independents': {'x': [206]}, 'Pac-12 Conference': {'x': [202, 213]}}

# the feed lists every category twice (the team, then its opponents); the header has one entry per category
HEAD = [('general', ['gamesPlayed', 'fumblesRecovered']),
        ('passing', ['yardsPerPassAttempt', 'totalYards', 'passingYards', 'passingYardsPerGame', 'totalPoints', 'totalPointsPerGame', 'completions', 'passingAttempts', 'completionPct', 'passingYards', 'longPassing', 'passingTouchdowns', 'interceptions', 'sacks', 'sackYardsLost', 'QBRating', 'yardsPerGame', 'passingYardsPerGame']),
        ('rushing', ['rushingYardsPerGame', 'rushingYards', 'yardsPerRushAttempt', 'rushingYardsPerGame', 'rushingAttempts', 'rushingYards', 'longRushing', 'rushingFumbles', 'rushingTouchdowns']),
        ('receiving', ['receptions', 'receivingYards', 'receivingYardsPerGame', 'yardsPerReception', 'longReception', 'receivingTouchdowns']),
        ('kicking', ['fieldGoalAttempts', 'fieldGoalsMade', 'fieldGoalPct', 'fieldGoalsMade1_19', 'fieldGoalsMade20_29', 'fieldGoalsMade30_39', 'fieldGoalsMade40_49', 'fieldGoalsMade50', 'fieldGoalAttempts1_19', 'fieldGoalAttempts20_29', 'fieldGoalAttempts30_39', 'fieldGoalAttempts40_49', 'fieldGoalAttempts50', 'extraPointsMade', 'extraPointAttempts', 'extraPointPct', 'longFieldGoalMade']),
        ('returning', ['kickReturns', 'kickReturnYards', 'yardsPerKickReturn', 'longKickReturn', 'kickReturnTouchdowns', 'puntReturns', 'puntReturnYards', 'yardsPerPuntReturn', 'longPuntReturn', 'puntReturnTouchdowns']),
        ('punting', ['punts', 'puntYards', 'longPunt', 'grossAvgPuntYards', 'netAvgPuntYards']),
        ('miscellaneous', ['thirdDownConvs', 'thirdDownAttempts', 'fourthDownConvs', 'fourthDownConvPct', 'totalPenalties', 'totalPenaltyYards', 'fourthDownAttempts', 'thirdDownConvPct', 'firstDowns', 'firstDownsPenalty', 'firstDownsRushing', 'firstDownsPassing'])]
CATS = HEAD
TC = [x for h in HEAD for x in (h, h)]
GP = 8
def tgen(t, r, cat, i=0):
    k = t['id'] - 200; opp = i % 2; n = len(HEAD[i // 2][1]); c = HEAD[i // 2][0]
    o = -opp * 40
    if c == 'general': return [GP, 5 - opp]
    if c == 'passing': return [8.0 - opp, 3000 + k * 20 + o * 5, 1900 + k * 15 + o * 3, 237 - opp * 12, 280, 35, 150, 240, 62.0 - opp * 2, 1900, 60, 15 - opp * 3, 6 + opp * 2 + k % 3, 14 - opp * 4 + k % 4, 90, 140 - opp * 8, 400 + k * 3, 237]
    if c == 'rushing': return [170 + k * 3 + o / 4, 1400 + k * 25 + o, 4.8 - opp * .6, 170, 290, 1400, 70, 3, 14 - opp * 3]
    if c == 'receiving': return [150, 1900, 237, 12.6, 70, 15]
    if c == 'kicking': return [10, 8, 80.0 - opp * 5, 0, 1, 3, 3, 1, 0, 1, 3, 3, 2, 30, 31, 96.7, 52]
    if c == 'returning': return [14, 300, 21.4, 60, 0, 10, 80, 8.0, 35, 0 + (k % 2)]
    if c == 'punting': return [30, 1300, 70, 43.3, 38.5]
    return [45, 100, 4, 50.0, 40, 330, 8, 45.0 + k - opp * 5, 150, 10, 60, 80]
def stand(t, r):
    k = t['id'] - 200; w = 2 + (k * 5) % 7; l = GP - w
    return {'wins': w, 'losses': l, 'winpercent': w / GP, 'gamesbehind': 1, 'playoffseed': 1, 'pointsfor': 220 + k * 9, 'pointsagainst': 310 - k * 7, 'pointdifferential': k * 16 - 90,
            'streak': 'W2', 'total': f'{w}-{l}', 'homerecord': f'{w // 2 + 1}-{l // 2}', 'awayrecord': f'{w // 2}-{l - l // 2}', 'vsconf': f'{w // 2}-{l // 2}', 'vsaprankedteams': f'{k % 3}-{k % 2}',
            'homerecord_wins': 99, 'vsconf_wins': 1}
SPEC = Spec('football', 'college-football', 2026, TEAMS, DIVS, CATS, ['QB'], lambda pos, r: {}, TC, tgen, stand, GP, 120, nfl.GLN, nfl.GLL, nfl.glgen, nfl.plays)
SPEC.thead = HEAD; SPEC.flat = True
