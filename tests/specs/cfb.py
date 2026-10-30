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

# core API player feeds: the top of each leaderboard, then each player's own line
CORE = 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football'
POS = {1: 'QB', 2: 'RB', 3: 'WR', 4: 'LB', 5: 'CB', 6: 'PK', 7: 'P', 8: 'WR'}
LEADS = {'passingTouchdowns': (1000, 6), 'rushingTouchdowns': (2000, 10), 'receptions': (3000, 12), 'passingYards': (1000, 8), 'rushingYards': (2000, 24), 'receivingYards': (3000, 40), 'totalTackles': (4000, 56), 'sacks': (4000, 56), 'interceptions': (5000, 8)}
def _kind(i): return i // 1000
SPECIAL = {'kicking.fieldGoalsMade': 6000, 'punting.punts': 7000, 'returning.kickReturnYards': 8000, 'returning.puntReturnYards': 8000}  # 1000.. quarterbacks, 2000.. rushers, 3000.. receivers, 4000.. linebackers, 5000.. defensive backs
def _leaders():
    return {'categories': [{'name': n, 'leaders': [{'value': 100 - k, 'athlete': {'$ref': f'{CORE}/seasons/2026/athletes/{b + k}?lang=en&region=us'}} for k in range(n_)]} for n, (b, n_) in LEADS.items()]}
def _athlete(i):
    k = _kind(i); t = TEAMS[i % len(TEAMS)]
    return {'id': str(i), 'displayName': f'Player {i} Name', 'fullName': f'Player {i} Name', 'displayHeight': "6' 1\"", 'displayWeight': '215 lbs', 'jersey': str(i % 99), 'experience': {'abbreviation': 'JR'}, 'position': {'$ref': f'{CORE}/positions/{k}?lang=en&region=us'}, 'team': {'$ref': f'{CORE}/seasons/2026/teams/{t["id"]}?lang=en&region=us'}}
def _stats(i):
    k = _kind(i); j = i % 1000
    c = [{'name': 'general', 'stats': [{'name': 'gamesPlayed', 'value': 8}]}]
    def cat(n, d): c.append({'name': n, 'stats': [{'name': a, 'value': b} for a, b in d.items()]})
    if k == 1:
        cat('passing', {'completions': 150 - j, 'passingAttempts': 230 - j, 'completionPct': 65.2 - j, 'passingYards': 2000 - 40 * j, 'passingYardsPerGame': 250 - 5 * j, 'yardsPerPassAttempt': 8.7 - j * .1, 'yardsPerCompletion': 13.3, 'passingTouchdowns': 20 - j, 'interceptions': 3 + j % 4, 'passingTouchdownPct': 8.6, 'interceptionPct': 1.5, 'QBRating': 160 - 3 * j, 'sacks': 10 + j, 'sackYardsLost': 60, 'longPassing': 70, 'passingFirstDowns': 90, 'passingBigPlays': 20})
        cat('rushing', {'rushingAttempts': 60 - j, 'rushingYards': 300 - 10 * j, 'rushingYardsPerGame': 37.5 - j, 'yardsPerRushAttempt': 5.0, 'rushingTouchdowns': 4})
    if k == 2:
        cat('rushing', {'rushingAttempts': 200 - 4 * j, 'rushingYards': 1100 - 30 * j, 'rushingYardsPerGame': 137 - 3 * j, 'yardsPerRushAttempt': 5.5 - j * .05, 'rushingTouchdowns': 12 - j % 9, 'longRushing': 70 - j, 'rushingFirstDowns': 50, 'rushingBigPlays': 9, 'rushingFumbles': 1, 'rushingFumblesLost': 1, 'totalYardsFromScrimmage': 1300 - 30 * j, 'yardsFromScrimmagePerGame': 160 - 3 * j})
        cat('receiving', {'receptions': 20, 'receivingYards': 180, 'receivingTouchdowns': 1})
    if k == 3: cat('receiving', {'receptions': 70 - j, 'receivingTargets': 100 - j, 'receivingYards': 1000 - 15 * j, 'receivingYardsPerGame': 125 - 2 * j, 'yardsPerReception': 14.2, 'receivingTouchdowns': 9 - j % 7, 'longReception': 80 - j, 'receivingYardsAfterCatch': 300 - j, 'receivingFirstDowns': 45, 'receivingBigPlays': 11, 'receivingFumbles': 0})
    if k == 6: cat('kicking', {'fieldGoalsMade': 14 - j, 'fieldGoalAttempts': 17 - j, 'fieldGoalPct': 82.0, 'fieldGoalsMade20_29': 3, 'fieldGoalsMade30_39': 4, 'fieldGoalsMade40_49': 5, 'fieldGoalsMade50': 2, 'longFieldGoalMade': 54 - j, 'extraPointsMade': 30, 'extraPointAttempts': 31, 'extraPointPct': 96.7, 'totalKickingPoints': 72 - j, 'avgKickoffYards': 62.0, 'touchbackPct': 70.0})
    if k == 7: cat('punting', {'punts': 40 - j, 'puntYards': 1800 - 20 * j, 'grossAvgPuntYards': 45.0 - j * .3, 'netAvgPuntYards': 40.0 - j * .3, 'longPunt': 68, 'puntsInside20': 15, 'puntsInside20Pct': 37.5, 'puntsBlocked': 0})
    if k == 8: cat('returning', {'kickReturns': 14 - j % 5, 'kickReturnYards': 300 - 5 * j, 'yardsPerKickReturn': 21.4, 'longKickReturn': 55, 'kickReturnTouchdowns': j % 2, 'puntReturns': 10, 'puntReturnYards': 120, 'yardsPerPuntReturn': 12.0, 'longPuntReturn': 40, 'puntReturnTouchdowns': 0})
    if k in (4, 5):
        cat('defensive', {'soloTackles': 50 - j, 'assistTackles': 30, 'totalTackles': 80 - j, 'tacklesForLoss': 9.5 - j * .1, 'stuffs': 6, 'sacks': 5 - j % 5, 'QBHits': 8, 'hurries': 11, 'passesDefended': 6, 'safeties': 0, 'kicksBlocked': 0})
        cat('defensiveInterceptions', {'interceptions': 2 if k == 5 else 0, 'interceptionYards': 20, 'interceptionTouchdowns': 0})
    return {'splits': {'categories': c}}
def _special(sort, n):
    base = SPECIAL[sort]; ids = [base + i for i in range(int(n))]
    return ids
SPEC.corepl = {'special': lambda sort, n: _special(sort, min(n, 8)), 'leaders': _leaders, 'athlete': _athlete, 'stats': _stats, 'pos': lambda p: POS.get(p, 'ATH')}
