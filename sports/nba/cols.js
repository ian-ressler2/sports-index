/* cols.js: NBA column catalogue (players, team offense, team defense) */
const PL_GROUPS = [
  { id: 'vol', l: 'Usage', on: 1 }, { id: 'sco', l: 'Scoring', on: 1 }, { id: 'shoot', l: 'Shooting', on: 1 }, { id: 'adv', l: 'Efficiency & rates', on: 1, tag: 'DER' },
  { id: 'pm', l: 'Playmaking', on: 1 }, { id: 'reb', l: 'Rebounding', on: 1 }, { id: 'def', l: 'Defense' }, { id: 'p36', l: 'Per 36 minutes', tag: 'DER' }, { id: 'misc', l: 'Fouls & milestones' },
];
const TOF_GROUPS = [
  { id: 'rec', l: 'Record', on: 1 }, { id: 'sco', l: 'Scoring', on: 1 }, { id: 'shoot', l: 'Shooting', on: 1 }, { id: 'ff', l: 'Four factors', on: 1, tag: 'DER' }, { id: 'ball', l: 'Ball movement & boards' },
];
const TDF_GROUPS = [
  { id: 'rec', l: 'Record', on: 1 }, { id: 'prev', l: 'Points allowed', on: 1 }, { id: 'opp', l: 'Opponent shooting', on: 1 }, { id: 'ff', l: 'Four factors (defense)', on: 1, tag: 'DER' }, { id: 'dis', l: 'Disruption' },
];
const TREC = [
  C('gp', 'GP', 'rec', 0, 'int', 'ESPN'), C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('pct', 'W%', 'rec', 1, 'f3', 'API'),
  C('diff', 'Net pts/G', 'rec', 1, 'sg1', 'DER', 'Average scoring margin'),
];
Object.assign(COLS, {
  pl: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'), C('mpg', 'MPG', 'vol', 1, 'f1', 'ESPN', 'Minutes per game'), C('min', 'MIN', 'vol', 0, 'int', 'ESPN', 'Total minutes'),
    C('ppg', 'PPG', 'sco', 1, 'f1', 'ESPN', 'Points per game'), C('pts', 'PTS', 'sco', 1, 'int', 'ESPN'), C('fgapg', 'FGA/G', 'sco', 0, 'f1', 'ESPN'), C('tpmpg', '3PM/G', 'sco', 1, 'f1', 'ESPN'), C('tpapg', '3PA/G', 'sco', 0, 'f1', 'ESPN'), C('ftapg', 'FTA/G', 'sco', 0, 'f1', 'ESPN'), C('eff', 'EFF/G', 'sco', 1, 'f1', 'DER', 'Efficiency rating per game: PTS + REB + AST + STL + BLK minus missed shots and turnovers'),
    C('fgp', 'FG%', 'shoot', 1, 'f1', 'ESPN'), C('tpp', '3P%', 'shoot', 1, 'f1', 'ESPN'), C('ftp', 'FT%', 'shoot', 1, 'f1', 'ESPN'), C('fgm', 'FGM', 'shoot', 1, 'int', 'ESPN'), C('fga', 'FGA', 'shoot', 0, 'int', 'ESPN'), C('tpm', '3PM', 'shoot', 1, 'int', 'ESPN'), C('tpa', '3PA', 'shoot', 0, 'int', 'ESPN'), C('ftm', 'FTM', 'shoot', 1, 'int', 'ESPN'), C('fta', 'FTA', 'shoot', 0, 'int', 'ESPN'),
    C('ts', 'TS%', 'adv', 1, 'f1', 'DER', 'True shooting: points per shooting possession, counting threes and free throws'), C('efg', 'eFG%', 'adv', 1, 'f1', 'DER', 'Effective field-goal percentage, which gives threes 1.5× credit'), C('tpar', '3PA rate', 'adv', 0, 'f1', 'DER', 'Share of shots taken from three'), C('ftr', 'FT rate', 'adv', 1, 'f1', 'DER', 'Free-throw attempts per 100 field-goal attempts'),
    C('usg', 'USG%', 'adv', 0, 'f1', 'DER', 'Share of team possessions used while on the floor (team minutes approximated as 240 per game)'),
    C('apg', 'APG', 'pm', 1, 'f1', 'ESPN'), C('ast', 'AST', 'pm', 1, 'int', 'ESPN'), C('topg', 'TOV/G', 'pm', -1, 'f1', 'ESPN'), C('tov', 'TOV', 'pm', -1, 'int', 'ESPN'), C('astto', 'AST/TO', 'pm', 1, 'f2', 'DER'), C('astp', 'AST%', 'pm', 1, 'f1', 'DER', 'Share of teammates’ baskets assisted while on the floor'),
    C('rpg', 'RPG', 'reb', 1, 'f1', 'ESPN'), C('reb', 'REB', 'reb', 1, 'int', 'ESPN'), C('rebp', 'REB%', 'reb', 1, 'f1', 'DER', 'Share of available rebounds grabbed while on the floor'),
    C('spg', 'SPG', 'def', 1, 'f1', 'ESPN'), C('bpg', 'BPG', 'def', 1, 'f1', 'ESPN'), C('stl', 'STL', 'def', 1, 'int', 'ESPN'), C('blk', 'BLK', 'def', 1, 'int', 'ESPN'), C('stocks', 'Stocks/G', 'def', 1, 'f1', 'DER', 'Steals plus blocks per game'),
    C('pts36', 'PTS/36', 'p36', 1, 'f1', 'DER'), C('reb36', 'REB/36', 'p36', 1, 'f1', 'DER'), C('ast36', 'AST/36', 'p36', 1, 'f1', 'DER'), C('stl36', 'STL/36', 'p36', 1, 'f1', 'DER'), C('blk36', 'BLK/36', 'p36', 1, 'f1', 'DER'), C('tov36', 'TOV/36', 'p36', -1, 'f1', 'DER'),
    C('pfg', 'PF/G', 'misc', -1, 'f1', 'ESPN', 'Personal fouls per game'), C('dd2', 'DD', 'misc', 1, 'int', 'ESPN', 'Double-doubles'), C('td3', 'TD', 'misc', 1, 'int', 'ESPN', 'Triple-doubles'), C('tech', 'Tech', 'misc', -1, 'int', 'ESPN', 'Technical fouls'),
  ],
  tof: [
    ...TREC,
    C('ppg', 'PPG', 'sco', 1, 'f1', 'ESPN'), C('ortg', 'ORtg', 'sco', 1, 'f1', 'DER', 'Points scored per 100 estimated possessions'), C('pace', 'Pace', 'sco', 0, 'f1', 'DER', 'Estimated possessions per game'),
    C('fgp', 'FG%', 'shoot', 1, 'f1', 'ESPN'), C('tpp', '3P%', 'shoot', 1, 'f1', 'ESPN'), C('ftp', 'FT%', 'shoot', 1, 'f1', 'ESPN'), C('tpmpg', '3PM/G', 'shoot', 1, 'f1', 'ESPN'), C('tpapg', '3PA/G', 'shoot', 0, 'f1', 'ESPN'), C('ftapg', 'FTA/G', 'shoot', 0, 'f1', 'ESPN'),
    C('efg', 'eFG%', 'ff', 1, 'f1', 'DER'), C('tovp', 'TOV%', 'ff', -1, 'f1', 'DER', 'Turnovers per 100 possessions'), C('orebp', 'OREB%', 'ff', 1, 'f1', 'DER', 'Share of own misses rebounded'), C('ftr', 'FT rate', 'ff', 1, 'f1', 'DER', 'Free-throw attempts per 100 field-goal attempts'), C('ts', 'TS%', 'ff', 1, 'f1', 'DER'), C('tpar', '3PA rate', 'ff', 0, 'f1', 'DER'),
    C('apg', 'APG', 'ball', 1, 'f1', 'ESPN'), C('topg', 'TOV/G', 'ball', -1, 'f1', 'ESPN'), C('rpg', 'RPG', 'ball', 1, 'f1', 'ESPN'), C('orpg', 'OREB/G', 'ball', 1, 'f1', 'ESPN'), C('astrate', 'AST/FGM', 'ball', 1, 'f1', 'DER', 'Assists per 100 made field goals'),
  ],
  tdf: [
    ...TREC,
    C('oppg', 'Opp PPG', 'prev', -1, 'f1', 'DER', 'Points allowed per game'), C('drtg', 'DRtg', 'prev', -1, 'f1', 'DER', 'Points allowed per 100 estimated possessions'), C('net', 'NetRtg', 'prev', 1, 'sg1', 'DER', 'ORtg minus DRtg'),
    C('ofgp', 'Opp FG%', 'opp', -1, 'f1', 'DER'), C('otpp', 'Opp 3P%', 'opp', -1, 'f1', 'DER'), C('oftp', 'Opp FT%', 'opp', 0, 'f1', 'DER'), C('otpapg', 'Opp 3PA/G', 'opp', 0, 'f1', 'DER'),
    C('oefg', 'Opp eFG%', 'ff', -1, 'f1', 'DER'), C('otovp', 'Opp TOV%', 'ff', 1, 'f1', 'DER', 'Turnovers forced per 100 opponent possessions'), C('drebp', 'DREB%', 'ff', 1, 'f1', 'DER', 'Share of opponent misses rebounded'), C('oftr', 'Opp FT rate', 'ff', -1, 'f1', 'DER'),
    C('spg', 'SPG', 'dis', 1, 'f1', 'ESPN'), C('bpg', 'BPG', 'dis', 1, 'f1', 'ESPN'), C('pfg', 'PF/G', 'dis', -1, 'f1', 'ESPN'), C('drpg', 'DREB/G', 'dis', 1, 'f1', 'ESPN'), C('rdiff', 'Reb diff/G', 'dis', 1, 'sg1', 'DER'),
  ],
});
Object.assign(GROUPS, { pl: PL_GROUPS, tof: TOF_GROUPS, tdf: TDF_GROUPS });
Object.assign(GROUP_META, {
  pl: { label: 'Players', singular: 'Player', sort: 'ppg', dir: -1 },
  tof: { label: 'Team offense', singular: 'Team', sort: 'ortg', dir: -1 },
  tdf: { label: 'Team defense', singular: 'Team', sort: 'drtg', dir: 1 },
});
