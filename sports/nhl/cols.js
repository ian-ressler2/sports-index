/* cols.js: NHL column catalogue (skaters, goalies, team scoring, team defence) */
const SK_GROUPS = [
  { id: 'vol', l: 'Usage', on: 1 }, { id: 'sco', l: 'Scoring', on: 1 }, { id: 'rate', l: 'Rates per 60', on: 1, tag: 'DER' },
  { id: 'shoot', l: 'Shooting', on: 1 }, { id: 'pp', l: 'Power play', tag: 'API' }, { id: 'misc', l: 'Plus-minus, penalties, faceoffs' },
];
const GK_GROUPS = [
  { id: 'vol', l: 'Volume', on: 1 }, { id: 'res', l: 'Results', on: 1 }, { id: 'sv', l: 'Save performance', on: 1, tag: 'DER' },
];
const TSK_GROUPS = [
  { id: 'rec', l: 'Record', on: 1 }, { id: 'sco', l: 'Scoring', on: 1 }, { id: 'shoot', l: 'Shooting', on: 1 }, { id: 'sp', l: 'Special teams', on: 1 }, { id: 'misc', l: 'Penalties' },
];
const TGK_GROUPS = [
  { id: 'rec', l: 'Record', on: 1 }, { id: 'prev', l: 'Goal prevention', on: 1 }, { id: 'sa', l: 'Shots against', on: 1 }, { id: 'sp', l: 'Special teams & luck', on: 1 },
];
const REC_COLS = g => [
  C('gp', 'GP', 'rec', 0, 'int', 'API'), C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('otl', 'OTL', 'rec', -1, 'int', 'API', 'Overtime and shootout losses'),
  C('pts', 'PTS', 'rec', 1, 'int', 'API', 'Standings points'), C('ptp', 'P%', 'rec', 1, 'f3', 'DER', 'Points percentage: points earned over points available'), C('rw', 'RW', 'rec', 1, 'int', 'API', 'Regulation wins'),
];
Object.assign(COLS, {
  sk: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN', 'Games played'), C('toig', 'TOI/G', 'vol', 1, 'ms', 'ESPN', 'Time on ice per game'), C('toi', 'TOI', 'vol', 0, 'int', 'ESPN', 'Total minutes on ice'), C('shft', 'Shifts', 'vol', 0, 'int', 'ESPN'),
    C('g', 'G', 'sco', 1, 'int', 'ESPN', 'Goals'), C('a', 'A', 'sco', 1, 'int', 'ESPN', 'Assists'), C('pts', 'PTS', 'sco', 1, 'int', 'ESPN', 'Points'),
    C('ptsgp', 'P/GP', 'sco', 1, 'f2', 'DER', 'Points per game'), C('ggp', 'G/GP', 'sco', 1, 'f2', 'DER'), C('agp', 'A/GP', 'sco', 1, 'f2', 'DER'), C('gwg', 'GWG', 'sco', 1, 'int', 'ESPN', 'Game-winning goals'),
    C('g60', 'G/60', 'rate', 1, 'f2', 'DER', 'Goals per 60 minutes on ice'), C('a60', 'A/60', 'rate', 1, 'f2', 'DER', 'Assists per 60 minutes on ice'), C('p60', 'P/60', 'rate', 1, 'f2', 'DER', 'Points per 60 minutes on ice'), C('s60', 'S/60', 'rate', 1, 'f1', 'DER', 'Shots per 60 minutes on ice'),
    C('s', 'S', 'shoot', 1, 'int', 'ESPN', 'Shots on goal'), C('sgp', 'S/GP', 'shoot', 1, 'f1', 'DER'), C('shp', 'S%', 'shoot', 1, 'f1', 'DER', 'Shooting percentage'),
    C('ppg', 'PPG', 'pp', 1, 'int', 'ESPN', 'Power-play goals'), C('ppa', 'PPA', 'pp', 1, 'int', 'ESPN', 'Power-play assists'), C('ppp', 'PPP', 'pp', 1, 'int', 'DER', 'Power-play points'), C('npp', 'Non-PP pts', 'pp', 1, 'int', 'DER', 'Points scored away from the power play'), C('ppsh', 'PP share', 'pp', 0, 'pct0', 'DER', 'Share of points that came on the power play'),
    C('pm', '+/-', 'misc', 1, 'sgi', 'ESPN', 'Plus-minus'), C('pim', 'PIM', 'misc', -1, 'int', 'ESPN', 'Penalty minutes'), C('fow', 'FOW', 'misc', 1, 'int', 'ESPN'), C('fol', 'FOL', 'misc', -1, 'int', 'ESPN'), C('fop', 'FO%', 'misc', 1, 'f1', 'ESPN', 'Faceoff win percentage'),
  ],
  gk: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'), C('toi', 'TOI', 'vol', 0, 'int', 'ESPN', 'Minutes played'), C('sa', 'SA', 'vol', 0, 'int', 'ESPN', 'Shots against'), C('sv', 'SV', 'vol', 1, 'int', 'ESPN', 'Saves'), C('sa60', 'SA/60', 'vol', 0, 'f1', 'DER', 'Shots faced per 60 minutes'),
    C('w', 'W', 'res', 1, 'int', 'ESPN'), C('l', 'L', 'res', -1, 'int', 'ESPN'), C('otl', 'OTL', 'res', -1, 'int', 'ESPN'), C('wp', 'W%', 'res', 1, 'f3', 'DER', 'Wins over decisions'), C('ga', 'GA', 'res', -1, 'int', 'ESPN'), C('gaa', 'GAA', 'res', -1, 'f2', 'ESPN', 'Goals against average'), C('so', 'SO', 'res', 1, 'int', 'ESPN', 'Shutouts'),
    C('svp', 'SV%', 'sv', 1, 'f3', 'ESPN', 'Save percentage'), C('gsaa', 'GSAA', 'sv', 1, 'sg1', 'DER', 'Goals saved above average: saves minus what a league-average goalie would save on the same shots'), C('gsaa60', 'GSAA/60', 'sv', 1, 'sg2', 'DER'), C('svgp', 'SV/GP', 'sv', 0, 'f1', 'DER'),
  ],
  tsk: [
    ...REC_COLS(),
    C('gf', 'GF', 'sco', 1, 'int', 'ESPN', 'Goals for'), C('gfgp', 'GF/GP', 'sco', 1, 'f2', 'DER'), C('diff', 'Diff', 'sco', 1, 'sgi', 'API', 'Goal differential'), C('diffgp', 'Diff/GP', 'sco', 1, 'sg2', 'DER'),
    C('s', 'S', 'shoot', 1, 'int', 'ESPN', 'Shots for'), C('sgp', 'S/GP', 'shoot', 1, 'f1', 'DER'), C('shp', 'S%', 'shoot', 1, 'f1', 'ESPN', 'Team shooting percentage'), C('sshare', 'Shot share', 'shoot', 1, 'f1', 'DER', 'Shots for as a share of all shots in its games'),
    C('ppp', 'PP%', 'sp', 1, 'f1', 'ESPN', 'Power-play percentage'), C('ppo', 'PP opp.', 'sp', 1, 'int', 'ESPN'), C('ppopg', 'PP opp/GP', 'sp', 1, 'f2', 'DER'), C('ppgf', 'PPG', 'sp', 1, 'int', 'ESPN'), C('shg', 'SHG', 'sp', 1, 'int', 'ESPN', 'Short-handed goals'),
    C('pim', 'PIM', 'misc', -1, 'int', 'ESPN'), C('pimgp', 'PIM/GP', 'misc', -1, 'f1', 'DER'),
  ],
  tgk: [
    ...REC_COLS(),
    C('ga', 'GA', 'prev', -1, 'int', 'ESPN', 'Goals against'), C('gagp', 'GA/GP', 'prev', -1, 'f2', 'DER'), C('svp', 'SV%', 'prev', 1, 'f3', 'ESPN', 'Team save percentage'), C('so', 'SO', 'prev', 1, 'int', 'ESPN'),
    C('sa', 'SA', 'sa', -1, 'int', 'ESPN', 'Shots against'), C('sagp', 'SA/GP', 'sa', -1, 'f1', 'DER'), C('sdiff', 'Shot diff/GP', 'sa', 1, 'sg1', 'DER', 'Shots for minus shots against, per game'), C('sshare', 'Shot share', 'sa', 1, 'f1', 'DER'),
    C('pkp', 'PK%', 'sp', 1, 'f1', 'ESPN', 'Penalty-kill percentage'), C('pdo', 'PDO', 'sp', 0, 'f1', 'DER', 'Shooting % plus save %. Regresses toward 100'), C('pimgp', 'PIM/GP', 'sp', -1, 'f1', 'DER'),
  ],
});
Object.assign(GROUPS, { sk: SK_GROUPS, gk: GK_GROUPS, tsk: TSK_GROUPS, tgk: TGK_GROUPS });
Object.assign(GROUP_META, {
  sk: { label: 'Skaters', singular: 'Skater', sort: 'pts', dir: -1 },
  gk: { label: 'Goalies', singular: 'Goalie', sort: 'gsaa', dir: -1 },
  tsk: { label: 'Team scoring', singular: 'Team', sort: 'gfgp', dir: -1 },
  tgk: { label: 'Team defense', singular: 'Team', sort: 'gagp', dir: 1 },
});
