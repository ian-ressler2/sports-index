/* cols.js: column catalogue, groups, situations, team colours */
const TEAM_COLORS = {
  108: ['#BA0021', '#003263'], 109: ['#A71930', '#E3D4AD'], 110: ['#DF4601', '#111111'], 111: ['#BD3039', '#0C2340'],
  112: ['#0E3386', '#CC3433'], 113: ['#C6011F', '#111111'], 114: ['#E31937', '#0C2340'], 115: ['#4b3f8f', '#C4CED4'],
  116: ['#0C2340', '#FA4616'], 117: ['#EB6E1F', '#002D62'], 118: ['#004687', '#BD9B60'], 119: ['#005A9C', '#EF3E42'],
  120: ['#AB0003', '#14225A'], 121: ['#002D72', '#FF5910'], 133: ['#00594a', '#EFB21E'], 134: ['#FDB827', '#27251F'],
  135: ['#2F241D', '#FFC425'], 136: ['#0C2C56', '#2a9d8f'], 137: ['#FD5A1E', '#27251F'], 138: ['#C41E3A', '#0C2340'],
  139: ['#092C5C', '#8FBCE6'], 140: ['#003278', '#C0111F'], 141: ['#134A8E', '#1D2D5C'], 142: ['#002B5C', '#D31145'],
  143: ['#E81828', '#002D72'], 144: ['#CE1141', '#13274F'], 145: ['#27251F', '#C4CED4'], 146: ['#00A3E0', '#EF3340'],
  147: ['#0C2340', '#C4CED3'], 158: ['#12284B', '#FFC52F'],
};
SPORT.teamColor = id => (TEAM_COLORS[id] || ['#667788', '#99aabb'])[0];

/* g = group id, d = direction (1 higher better, -1 lower better, 0 none), f = format */
const BAT_GROUPS = [
  { id: 'vol', l: 'Volume', on: 1 }, { id: 'prod', l: 'Production', on: 1 }, { id: 'exp', l: 'Expected', on: 1, tag: 'SAV' },
  { id: 'con', l: 'Contact quality', on: 1, tag: 'SAV' }, { id: 'disc', l: 'Discipline', tag: 'SAV' }, { id: 'bb', l: 'Batted ball', tag: 'SAV' },
  { id: 'swing', l: 'Bat tracking', tag: 'SAV' }, { id: 'run', l: 'Run & field', tag: 'SAV' },
];
const PIT_GROUPS = [
  { id: 'vol', l: 'Volume', on: 1 }, { id: 'res', l: 'Results', on: 1 }, { id: 'exp', l: 'Expected', on: 1, tag: 'SAV' },
  { id: 'con', l: 'Contact allowed', on: 1, tag: 'SAV' }, { id: 'stuff', l: 'Stuff & command', tag: 'SAV' }, { id: 'bb', l: 'Batted ball', tag: 'SAV' },
];
const TBAT_GROUPS = [
  { id: 'rec', l: 'Record', on: 1 }, { id: 'vol', l: 'Volume', on: 1 }, { id: 'prod', l: 'Production', on: 1 }, { id: 'sav', l: 'Statcast (PA-weighted)', on: 1, tag: 'SAV' },
];
const TPIT_GROUPS = [
  { id: 'rec', l: 'Record', on: 1 }, { id: 'vol', l: 'Volume', on: 1 }, { id: 'res', l: 'Results', on: 1 }, { id: 'sav', l: 'Statcast (BF-weighted)', on: 1, tag: 'SAV' }, { id: 'fld', l: 'Fielding', tag: 'SAV' },
];

Object.assign(COLS, {
  bat: [
    C('g', 'G', 'vol', 0, 'int', 'API', 'Games played'), C('pa', 'PA', 'vol', 0, 'int', 'API', 'Plate appearances'), C('ab', 'AB', 'vol', 0, 'int', 'API'),
    C('h', 'H', 'vol', 1, 'int', 'API'), C('d2', '2B', 'vol', 1, 'int', 'API'), C('d3', '3B', 'vol', 1, 'int', 'API'), C('hr', 'HR', 'vol', 1, 'int', 'API', 'Home runs'),
    C('r', 'R', 'vol', 1, 'int', 'API'), C('rbi', 'RBI', 'vol', 1, 'int', 'API'), C('bb', 'BB', 'vol', 1, 'int', 'API'), C('so', 'SO', 'vol', -1, 'int', 'API'),
    C('sb', 'SB', 'vol', 1, 'int', 'API'), C('cs', 'CS', 'vol', -1, 'int', 'API'),
    C('avg', 'AVG', 'prod', 1, 'f3', 'API'), C('obp', 'OBP', 'prod', 1, 'f3', 'API'), C('slg', 'SLG', 'prod', 1, 'f3', 'API'), C('ops', 'OPS', 'prod', 1, 'f3', 'API'),
    C('iso', 'ISO', 'prod', 1, 'f3', 'DER', 'Isolated power, SLG minus AVG'), C('babip', 'BABIP', 'prod', 0, 'f3', 'API', 'Batting average on balls in play'),
    C('woba', 'wOBA', 'prod', 1, 'f3', 'API', 'Weighted on-base average'), C('wrcp', 'wRC+', 'prod', 1, 'int', 'API', 'Runs created, park and league adjusted. 100 is average'),
    C('wraa', 'wRAA', 'prod', 1, 'sg1', 'API', 'Weighted runs above average'), C('war', 'WAR', 'prod', 1, 'f1', 'API', 'Wins above replacement (MLB Stats API model)'),
    C('batr', 'Bat runs', 'prod', 1, 'sg1', 'API'), C('bsr', 'BsR', 'prod', 1, 'sg1', 'API', 'Baserunning runs'), C('fldr', 'Fld runs', 'prod', 1, 'sg1', 'API', 'Fielding runs'),
    C('xba', 'xBA', 'exp', 1, 'f3', 'SAV', 'Expected batting average from exit velocity and launch angle'), C('xslg', 'xSLG', 'exp', 1, 'f3', 'SAV'), C('xwoba', 'xwOBA', 'exp', 1, 'f3', 'SAV', 'Expected weighted on-base average'),
    C('xobp', 'xOBP', 'exp', 1, 'f3', 'SAV'), C('xiso', 'xISO', 'exp', 1, 'f3', 'SAV'), C('xwobacon', 'xwOBAcon', 'exp', 1, 'f3', 'SAV', 'Expected wOBA on contact'),
    C('wdiff', 'wOBA−xwOBA', 'exp', 0, 'sg3', 'DER', 'Positive means results ran ahead of contact quality'),
    C('ev', 'Avg EV', 'con', 1, 'f1', 'SAV', 'Average exit velocity (mph)'), C('evb', 'EV50', 'con', 1, 'f1', 'SAV', 'Average of the hardest half of batted balls'),
    C('la', 'Avg LA', 'con', 0, 'f1', 'SAV', 'Average launch angle'), C('sweet', 'Sweet-spot%', 'con', 1, 'f1', 'SAV', 'Batted balls at 8 to 32 degrees'),
    C('brl', 'Barrel%', 'con', 1, 'f1', 'SAV', 'Barrels per batted ball event'), C('hh', 'Hard-hit%', 'con', 1, 'f1', 'SAV', '95+ mph'),
    C('kp', 'K%', 'disc', -1, 'f1', 'API'), C('bbp', 'BB%', 'disc', 1, 'f1', 'API'), C('whiff', 'Whiff%', 'disc', -1, 'f1', 'SAV', 'Swings and misses per swing'),
    C('swing', 'Swing%', 'disc', 0, 'f1', 'SAV'), C('zswing', 'Z-Swing%', 'disc', 0, 'f1', 'SAV'), C('oswing', 'Chase%', 'disc', -1, 'f1', 'SAV', 'Swings at pitches outside the zone'),
    C('izcon', 'Z-Contact%', 'disc', 1, 'f1', 'SAV'), C('occon', 'O-Contact%', 'disc', 0, 'f1', 'SAV'), C('zone', 'Zone%', 'disc', 0, 'f1', 'SAV', 'Share of pitches seen in the zone'),
    C('edge', 'Edge%', 'disc', 0, 'f1', 'SAV'), C('meat', 'Meatball Swing%', 'disc', 1, 'f1', 'SAV', 'Swing rate on pitches down the middle'),
    C('gb', 'GB%', 'bb', 0, 'f1', 'SAV'), C('ld', 'LD%', 'bb', 0, 'f1', 'SAV'), C('fb', 'FB%', 'bb', 0, 'f1', 'SAV'), C('pu', 'PU%', 'bb', -1, 'f1', 'SAV'),
    C('pull', 'Pull%', 'bb', 0, 'f1', 'SAV'), C('straight', 'Straight%', 'bb', 0, 'f1', 'SAV'), C('oppo', 'Oppo%', 'bb', 0, 'f1', 'SAV'),
    C('bs', 'Bat speed', 'swing', 1, 'f1', 'SAV', 'Average bat speed (mph), 2023 onward'), C('fast', 'Fast-swing%', 'swing', 1, 'f1', 'SAV', 'Swings at 75+ mph'),
    C('sq', 'Squared-up%', 'swing', 1, 'f1', 'SAV', 'Squared-up per bat contact'), C('blast', 'Blast%', 'swing', 1, 'f1', 'SAV'), C('sl', 'Swing length', 'swing', 0, 'f1', 'SAV'),
    C('spr', 'Sprint speed', 'run', 1, 'f1', 'SAV', 'Feet per second'), C('bolts', 'Bolts', 'run', 1, 'int', 'SAV', 'Runs at 30+ ft/s'),
    C('oaa', 'OAA', 'run', 1, 'sgi', 'SAV', 'Outs above average'), C('frp', 'Fld runs prev.', 'run', 1, 'sgi', 'SAV'),
  ],
  pit: [
    C('g', 'G', 'vol', 0, 'int', 'API'), C('gs', 'GS', 'vol', 0, 'int', 'API'), C('ipn', 'IP', 'vol', 0, 'ip', 'API'), C('w', 'W', 'vol', 1, 'int', 'API'), C('l', 'L', 'vol', -1, 'int', 'API'),
    C('sv', 'SV', 'vol', 1, 'int', 'API'), C('hld', 'HLD', 'vol', 1, 'int', 'API'), C('bf', 'BF', 'vol', 0, 'int', 'API'), C('h', 'H', 'vol', -1, 'int', 'API'),
    C('r', 'R', 'vol', -1, 'int', 'API'), C('er', 'ER', 'vol', -1, 'int', 'API'), C('hr', 'HR', 'vol', -1, 'int', 'API'), C('bb', 'BB', 'vol', -1, 'int', 'API'), C('so', 'SO', 'vol', 1, 'int', 'API'), C('np', 'Pitches', 'vol', 0, 'int', 'API'),
    C('era', 'ERA', 'res', -1, 'f2', 'API'), C('whip', 'WHIP', 'res', -1, 'f2', 'API'), C('fip', 'FIP', 'res', -1, 'f2', 'API', 'Fielding independent pitching'), C('xfip', 'xFIP', 'res', -1, 'f2', 'API'),
    C('xera', 'xERA', 'res', -1, 'f2', 'SAV', 'Expected ERA from quality of contact'), C('eram', 'ERA-', 'res', -1, 'int', 'API', '100 is average, lower is better'), C('fipm', 'FIP-', 'res', -1, 'int', 'API'),
    C('war', 'WAR', 'res', 1, 'f1', 'API'), C('ra9w', 'RA9-WAR', 'res', 1, 'f1', 'API'),
    C('k9', 'K/9', 'res', 1, 'f2', 'API'), C('bb9', 'BB/9', 'res', -1, 'f2', 'API'), C('hr9', 'HR/9', 'res', -1, 'f2', 'API'),
    C('kp', 'K%', 'res', 1, 'f1', 'API'), C('bbp', 'BB%', 'res', -1, 'f1', 'API'), C('kbb', 'K−BB%', 'res', 1, 'f1', 'DER'), C('lob', 'LOB%', 'res', 0, 'f1', 'DER', 'Left-on-base percentage'),
    C('babip', 'BABIP', 'res', 0, 'f3', 'API'), C('avg', 'AVG against', 'res', -1, 'f3', 'API'), C('obp', 'OBP against', 'res', -1, 'f3', 'API'), C('slg', 'SLG against', 'res', -1, 'f3', 'API'), C('ops', 'OPS against', 'res', -1, 'f3', 'API'),
    C('xba', 'xBA', 'exp', -1, 'f3', 'SAV'), C('xslg', 'xSLG', 'exp', -1, 'f3', 'SAV'), C('xwoba', 'xwOBA', 'exp', -1, 'f3', 'SAV'), C('woba', 'wOBA against', 'exp', -1, 'f3', 'SAV'),
    C('xwobacon', 'xwOBAcon', 'exp', -1, 'f3', 'SAV'), C('wdiff', 'wOBA−xwOBA', 'exp', 0, 'sg3', 'DER'),
    C('ev', 'EV allowed', 'con', -1, 'f1', 'SAV'), C('la', 'LA allowed', 'con', 0, 'f1', 'SAV'), C('sweet', 'Sweet-spot%', 'con', -1, 'f1', 'SAV'), C('brl', 'Barrel%', 'con', -1, 'f1', 'SAV'), C('hh', 'Hard-hit%', 'con', -1, 'f1', 'SAV'),
    C('fbv', 'Fastball velo', 'stuff', 1, 'f1', 'SAV', 'Average four-seam (or sinker) velocity'), C('whiff', 'Whiff%', 'stuff', 1, 'f1', 'SAV'), C('oswing', 'Chase%', 'stuff', 1, 'f1', 'SAV', 'Swings induced outside the zone'),
    C('swing', 'Swing%', 'stuff', 0, 'f1', 'SAV'), C('zswing', 'Z-Swing%', 'stuff', 0, 'f1', 'SAV'), C('izcon', 'Z-Contact%', 'stuff', -1, 'f1', 'SAV'), C('occon', 'O-Contact%', 'stuff', 0, 'f1', 'SAV'),
    C('zone', 'Zone%', 'stuff', 0, 'f1', 'SAV'), C('edge', 'Edge%', 'stuff', 0, 'f1', 'SAV'), C('fstrike', 'F-Strike%', 'stuff', 1, 'f1', 'SAV'),
    C('gb', 'GB%', 'bb', 0, 'f1', 'SAV'), C('ld', 'LD%', 'bb', -1, 'f1', 'SAV'), C('fb', 'FB%', 'bb', 0, 'f1', 'SAV'), C('pu', 'PU%', 'bb', 1, 'f1', 'SAV'),
    C('pull', 'Pull%', 'bb', 0, 'f1', 'SAV'), C('straight', 'Straight%', 'bb', 0, 'f1', 'SAV'), C('oppo', 'Oppo%', 'bb', 0, 'f1', 'SAV'),
  ],
  tbat: [
    C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('pct', 'W%', 'rec', 1, 'f3', 'API'), C('rs', 'RS', 'rec', 1, 'int', 'API'), C('ra', 'RA', 'rec', -1, 'int', 'API'),
    C('rdiff', 'Run diff', 'rec', 1, 'sgi', 'API'), C('pyth', 'Pythag W%', 'rec', 1, 'f3', 'DER', 'Expected win percentage from runs scored and allowed'),
    C('g', 'G', 'vol', 0, 'int', 'API'), C('pa', 'PA', 'vol', 0, 'int', 'API'), C('r', 'R', 'vol', 1, 'int', 'API'), C('h', 'H', 'vol', 1, 'int', 'API'), C('d2', '2B', 'vol', 1, 'int', 'API'), C('d3', '3B', 'vol', 1, 'int', 'API'),
    C('hr', 'HR', 'vol', 1, 'int', 'API'), C('rbi', 'RBI', 'vol', 1, 'int', 'API'), C('bb', 'BB', 'vol', 1, 'int', 'API'), C('so', 'SO', 'vol', -1, 'int', 'API'), C('sb', 'SB', 'vol', 1, 'int', 'API'), C('cs', 'CS', 'vol', -1, 'int', 'API'),
    C('rpg', 'R/G', 'prod', 1, 'f2', 'DER'), C('avg', 'AVG', 'prod', 1, 'f3', 'API'), C('obp', 'OBP', 'prod', 1, 'f3', 'API'), C('slg', 'SLG', 'prod', 1, 'f3', 'API'), C('ops', 'OPS', 'prod', 1, 'f3', 'API'),
    C('iso', 'ISO', 'prod', 1, 'f3', 'DER'), C('babip', 'BABIP', 'prod', 0, 'f3', 'API'), C('kp', 'K%', 'prod', -1, 'f1', 'DER'), C('bbp', 'BB%', 'prod', 1, 'f1', 'DER'),
    C('xwoba', 'xwOBA', 'sav', 1, 'f3', 'SAV'), C('ev', 'Avg EV', 'sav', 1, 'f1', 'SAV'), C('brl', 'Barrel%', 'sav', 1, 'f1', 'SAV'), C('hh', 'Hard-hit%', 'sav', 1, 'f1', 'SAV'),
    C('whiff', 'Whiff%', 'sav', -1, 'f1', 'SAV'), C('oswing', 'Chase%', 'sav', -1, 'f1', 'SAV'), C('bs', 'Bat speed', 'sav', 1, 'f1', 'SAV'), C('spr', 'Sprint speed', 'sav', 1, 'f1', 'SAV'),
  ],
  tpit: [
    C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('pct', 'W%', 'rec', 1, 'f3', 'API'), C('rs', 'RS', 'rec', 1, 'int', 'API'), C('ra', 'RA', 'rec', -1, 'int', 'API'),
    C('rdiff', 'Run diff', 'rec', 1, 'sgi', 'API'), C('pyth', 'Pythag W%', 'rec', 1, 'f3', 'DER'),
    C('g', 'G', 'vol', 0, 'int', 'API'), C('ipn', 'IP', 'vol', 0, 'ip', 'API'), C('sv', 'SV', 'vol', 1, 'int', 'API'), C('h', 'H', 'vol', -1, 'int', 'API'), C('r', 'R', 'vol', -1, 'int', 'API'), C('er', 'ER', 'vol', -1, 'int', 'API'),
    C('hr', 'HR', 'vol', -1, 'int', 'API'), C('bb', 'BB', 'vol', -1, 'int', 'API'), C('so', 'SO', 'vol', 1, 'int', 'API'),
    C('rapg', 'RA/G', 'res', -1, 'f2', 'DER'), C('era', 'ERA', 'res', -1, 'f2', 'API'), C('fip', 'FIP', 'res', -1, 'f2', 'DER', 'Computed from team totals with a league constant'), C('whip', 'WHIP', 'res', -1, 'f2', 'API'),
    C('k9', 'K/9', 'res', 1, 'f2', 'API'), C('bb9', 'BB/9', 'res', -1, 'f2', 'API'), C('hr9', 'HR/9', 'res', -1, 'f2', 'API'), C('kp', 'K%', 'res', 1, 'f1', 'DER'), C('bbp', 'BB%', 'res', -1, 'f1', 'DER'),
    C('kbb', 'K−BB%', 'res', 1, 'f1', 'DER'), C('lob', 'LOB%', 'res', 0, 'f1', 'DER'), C('babip', 'BABIP', 'res', 0, 'f3', 'DER'), C('avg', 'AVG against', 'res', -1, 'f3', 'API'), C('obp', 'OBP against', 'res', -1, 'f3', 'API'),
    C('slg', 'SLG against', 'res', -1, 'f3', 'API'), C('ops', 'OPS against', 'res', -1, 'f3', 'API'),
    C('xwoba', 'xwOBA', 'sav', -1, 'f3', 'SAV'), C('xera', 'xERA', 'sav', -1, 'f2', 'SAV'), C('ev', 'EV allowed', 'sav', -1, 'f1', 'SAV'), C('brl', 'Barrel%', 'sav', -1, 'f1', 'SAV'), C('hh', 'Hard-hit%', 'sav', -1, 'f1', 'SAV'),
    C('whiff', 'Whiff%', 'sav', 1, 'f1', 'SAV'), C('oswing', 'Chase%', 'sav', 1, 'f1', 'SAV'), C('fbv', 'Fastball velo', 'sav', 1, 'f1', 'SAV'),
    C('oaa', 'OAA', 'fld', 1, 'sgi', 'SAV', 'Outs above average, summed over fielders'), C('frp', 'Fld runs prev.', 'fld', 1, 'sgi', 'SAV'),
  ],
});
Object.assign(GROUPS, { bat: BAT_GROUPS, pit: PIT_GROUPS, tbat: TBAT_GROUPS, tpit: TPIT_GROUPS });
Object.assign(GROUP_META, {
  bat: { label: 'Batters', singular: 'Batter', sort: 'wrcp', dir: -1, qlabel: 'PA', fixed: ['pa'] },
  pit: { label: 'Pitchers', singular: 'Pitcher', sort: 'war', dir: -1, qlabel: 'IP' },
  tbat: { label: 'Team offense', singular: 'Team', sort: 'rs', dir: -1 },
  tpit: { label: 'Team defense', singular: 'Team', sort: 'ra', dir: 1 },
});

/* situational splits served by the Stats API (one request per code) */
const SIT_QUICK = [
  { id: 'risp', l: 'RISP' }, { id: 'risp2', l: 'RISP, 2 out' }, { id: 'lc', l: 'Late & close' }, { id: '2s', l: 'Two strikes' },
  { id: 'ac', l: 'Ahead in count' }, { id: 'bc', l: 'Behind in count' }, { id: 'vl', l: 'vs left' }, { id: 'vr', l: 'vs right' },
];
const SIT_ALL = [
  { h: 'BASES & OUTS', items: [['r0', 'Bases empty'], ['ron', 'Runners on'], ['risp', 'Scoring position'], ['risp2', 'Scoring position, 2 out'], ['r1', 'Runner on 1st'], ['r2', 'Runner on 2nd'], ['r3', 'Runner on 3rd'], ['r13', 'Runners on 1st & 3rd'], ['r123', 'Bases loaded'], ['r3l2', '3rd, less than 2 out'], ['o0', 'No outs'], ['o1', 'One out'], ['o2', 'Two outs']] },
  { h: 'COUNT', items: [['fp', 'First pitch'], ['ac', 'Ahead in count'], ['bc', 'Behind in count'], ['ec', 'Even count'], ['2s', 'Two strikes'], ['fc', 'Full count'], ['c00', '0-0'], ['c01', '0-1'], ['c02', '0-2'], ['c10', '1-0'], ['c11', '1-1'], ['c12', '1-2'], ['c20', '2-0'], ['c21', '2-1'], ['c22', '2-2'], ['c30', '3-0'], ['c31', '3-1'], ['c32', '3-2']] },
  { h: 'GAME STATE', items: [['lc', 'Late & close'], ['sah', 'Team ahead'], ['sbh', 'Team behind'], ['sti', 'Score tied'], ['1r', 'One-run games'], ['ex', 'Extra innings'], ['twn', 'Team wins'], ['tls', 'Team losses']] },
  { h: 'OPPONENT', items: [['vl', 'vs left-handed'], ['vr', 'vs right-handed'], ['vls', 'vs left-handed starter'], ['vrs', 'vs right-handed starter'], ['vdv', 'vs division'], ['int', 'Interleague']] },
  { h: 'WHERE & WHEN', items: [['h', 'Home'], ['a', 'Away'], ['d', 'Day'], ['n', 'Night'], ['g', 'Grass'], ['t', 'Turf'], ['h1', 'First half'], ['h2', 'Second half'], ['d7', 'Last 7 days'], ['d30', 'Last 30 days'], ['3', 'March / April'], ['4', 'April'], ['5', 'May'], ['6', 'June'], ['7', 'July'], ['8', 'August'], ['9', 'September'], ['10', 'October']] },
  { h: 'INNING', items: [['i01', '1st inning'], ['ig01', 'Innings 1 to 6'], ['ig07', '7th or later'], ['ig09', '9th or later']] },
];
const SIT_LABEL = {}; SIT_ALL.forEach(g => g.items.forEach(([c, l]) => SIT_LABEL[c] = l)); SIT_QUICK.forEach(s => SIT_LABEL[s.id] = s.l);
const SIT_COLS = {
  bat: ['g', 'pa', 'ab', 'h', 'd2', 'd3', 'hr', 'r', 'rbi', 'bb', 'so', 'sb', 'avg', 'obp', 'slg', 'ops', 'iso', 'babip', 'kp', 'bbp'],
  pit: ['g', 'ipn', 'bf', 'h', 'r', 'er', 'hr', 'bb', 'so', 'era', 'whip', 'avg', 'obp', 'slg', 'ops', 'babip', 'kp', 'bbp', 'kbb'],
};
const POS_ORDER = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'OF', 'IF', 'P', 'TWP'];
const MONTHS = { 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct' };
const PITCH_NAMES = { FF: '4-Seam', SI: 'Sinker', FC: 'Cutter', SL: 'Slider', ST: 'Sweeper', SV: 'Slurve', CU: 'Curveball', KC: 'Knuckle curve', CH: 'Changeup', FS: 'Splitter', FO: 'Forkball', KN: 'Knuckleball', EP: 'Eephus', SC: 'Screwball', CS: 'Slow curve', FA: 'Fastball', PO: 'Pitchout', IN: 'Intent ball', UN: 'Unknown', AB: 'Auto ball' };
const PITCH_COLORS = { FF: '#e5484d', SI: '#f08a4b', FC: '#c9893a', SL: '#e6c229', ST: '#8ccf4a', SV: '#46b88a', CU: '#3aa6d9', KC: '#4a74e0', CH: '#9a66e0', FS: '#d95fb3', FO: '#b0527f', KN: '#8a97a3', EP: '#6f7f89', SC: '#6a8f7b', CS: '#4aa8b8', FA: '#e5484d' };
