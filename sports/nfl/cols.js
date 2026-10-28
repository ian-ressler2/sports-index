/* cols.js: NFL column catalogue (passing, rushing, receiving, defense, kicking, punting, team offense, team defense) */
const NFL_G = {
  qb: [{ id: 'vol', l: 'Volume', on: 1 }, { id: 'eff', l: 'Efficiency', on: 1 }, { id: 'sco', l: 'Scoring & turnovers', on: 1 }, { id: 'rate', l: 'Passer ratings', on: 1 }],
  rb: [{ id: 'vol', l: 'Volume', on: 1 }, { id: 'eff', l: 'Efficiency', on: 1 }, { id: 'sco', l: 'Scoring & ball security', on: 1 }],
  rec: [{ id: 'vol', l: 'Volume', on: 1 }, { id: 'eff', l: 'Efficiency', on: 1 }, { id: 'sco', l: 'Scoring & big plays', on: 1 }],
  def: [{ id: 'tkl', l: 'Tackling', on: 1 }, { id: 'pr', l: 'Pass rush', on: 1 }, { id: 'cov', l: 'Coverage', on: 1 }, { id: 'ball', l: 'Takeaways', on: 1 }],
  k: [{ id: 'fg', l: 'Field goals', on: 1 }, { id: 'rng', l: 'By distance', on: 1 }, { id: 'xp', l: 'Extra points & scoring', on: 1 }],
  p: [{ id: 'vol', l: 'Punting', on: 1 }, { id: 'pos', l: 'Field position', on: 1 }],
  tof: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'sco', l: 'Scoring & yardage', on: 1 }, { id: 'pass', l: 'Passing', on: 1 }, { id: 'rush', l: 'Rushing', on: 1 }, { id: 'sit', l: 'Situational', on: 1 }, { id: 'ball', l: 'Ball security' }],
  tdf: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'prev', l: 'Points allowed', on: 1 }, { id: 'pr', l: 'Pass rush & havoc', on: 1 }, { id: 'ball', l: 'Takeaways', on: 1 }],
};
const NFL_REC = [C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('t', 'T', 'rec', 0, 'int', 'API'), C('pct', 'W%', 'rec', 1, 'f3', 'API'), C('diff', 'Pt diff/G', 'rec', 1, 'sg1', 'DER', 'Average scoring margin')];
Object.assign(COLS, {
  qb: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'), C('att', 'ATT', 'vol', 1, 'int', 'ESPN', 'Pass attempts'), C('cmp', 'CMP', 'vol', 1, 'int', 'ESPN'), C('yds', 'YDS', 'vol', 1, 'int', 'ESPN', 'Passing yards'), C('ypg', 'YDS/G', 'vol', 1, 'f1', 'ESPN'), C('attg', 'ATT/G', 'vol', 0, 'f1', 'DER'),
    C('cmpp', 'CMP%', 'eff', 1, 'f1', 'ESPN'), C('ypa', 'Y/A', 'eff', 1, 'f1', 'ESPN', 'Yards per attempt'), C('anya', 'ANY/A', 'eff', 1, 'f2', 'DER', 'Adjusted net yards per attempt: (yards + 20 TD − 45 INT − sack yards) ÷ (attempts + sacks)'), C('ypc', 'Y/C', 'eff', 1, 'f1', 'DER', 'Yards per completion'), C('lng', 'LNG', 'eff', 1, 'int', 'ESPN'),
    C('td', 'TD', 'sco', 1, 'int', 'ESPN'), C('int', 'INT', 'sco', -1, 'int', 'ESPN'), C('tdp', 'TD%', 'sco', 1, 'f1', 'DER', 'Touchdowns per attempt'), C('intp', 'INT%', 'sco', -1, 'f1', 'DER', 'Interceptions per attempt'), C('sck', 'SACK', 'sco', -1, 'int', 'ESPN', 'Times sacked'), C('sckp', 'SACK%', 'sco', -1, 'f1', 'DER', 'Sacks per dropback'), C('sckyds', 'SCK YDS', 'sco', -1, 'int', 'ESPN'),
    C('rtg', 'RTG', 'rate', 1, 'f1', 'ESPN', 'NFL passer rating'), C('qbr', 'QBR', 'rate', 1, 'f1', 'ESPN', 'ESPN Total QBR'), C('aqbr', 'adjQBR', 'rate', 1, 'f1', 'ESPN', 'ESPN QBR adjusted for opponent'),
  ],
  rb: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'), C('att', 'ATT', 'vol', 1, 'int', 'ESPN', 'Carries'), C('yds', 'YDS', 'vol', 1, 'int', 'ESPN', 'Rushing yards'), C('ypg', 'YDS/G', 'vol', 1, 'f1', 'ESPN'), C('attg', 'ATT/G', 'vol', 0, 'f1', 'DER'),
    C('ypc', 'Y/C', 'eff', 1, 'f2', 'ESPN', 'Yards per carry'), C('lng', 'LNG', 'eff', 1, 'int', 'ESPN'), C('fd', '1D', 'eff', 1, 'int', 'ESPN', 'Rushing first downs'), C('fdp', '1D%', 'eff', 1, 'f1', 'DER', 'Share of carries that earn a first down'), C('big', '20+', 'eff', 1, 'int', 'ESPN', 'Runs of 20 or more yards'), C('bigp', '20+ %', 'eff', 1, 'f1', 'DER'),
    C('td', 'TD', 'sco', 1, 'int', 'ESPN'), C('tdp', 'TD%', 'sco', 1, 'f1', 'DER'), C('fum', 'FUM', 'sco', -1, 'int', 'ESPN'), C('fuml', 'LOST', 'sco', -1, 'int', 'ESPN', 'Fumbles lost'), C('fumr', 'FUM/100', 'sco', -1, 'f2', 'DER', 'Fumbles per 100 carries'),
  ],
  rec: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'), C('tgt', 'TGT', 'vol', 1, 'int', 'ESPN', 'Targets'), C('rec', 'REC', 'vol', 1, 'int', 'ESPN', 'Receptions'), C('yds', 'YDS', 'vol', 1, 'int', 'ESPN', 'Receiving yards'), C('ypg', 'YDS/G', 'vol', 1, 'f1', 'ESPN'), C('tgtg', 'TGT/G', 'vol', 1, 'f1', 'DER'), C('recg', 'REC/G', 'vol', 1, 'f1', 'DER'),
    C('catch', 'CATCH%', 'eff', 1, 'f1', 'DER', 'Receptions per target'), C('ypr', 'Y/R', 'eff', 1, 'f1', 'ESPN', 'Yards per reception'), C('ypt', 'Y/TGT', 'eff', 1, 'f2', 'DER', 'Yards per target'), C('yac', 'YAC', 'eff', 1, 'int', 'ESPN', 'Yards after catch'), C('yacr', 'YAC/R', 'eff', 1, 'f1', 'DER', 'Yards after catch per reception'), C('fd', '1D', 'eff', 1, 'int', 'ESPN', 'Receiving first downs'),
    C('td', 'TD', 'sco', 1, 'int', 'ESPN'), C('tdt', 'TD/TGT%', 'sco', 1, 'f1', 'DER'), C('lng', 'LNG', 'sco', 1, 'int', 'ESPN'), C('big', '20+', 'sco', 1, 'int', 'ESPN', 'Catches of 20 or more yards'), C('fum', 'FUM', 'sco', -1, 'int', 'ESPN'),
  ],
  def: [
    C('gp', 'GP', 'tkl', 0, 'int', 'ESPN'), C('tkl', 'TKL', 'tkl', 1, 'int', 'ESPN', 'Total tackles'), C('solo', 'SOLO', 'tkl', 1, 'int', 'ESPN'), C('ast', 'AST', 'tkl', 0, 'int', 'ESPN', 'Assisted tackles'), C('tklg', 'TKL/G', 'tkl', 1, 'f1', 'DER'), C('tfl', 'TFL', 'tkl', 1, 'f1', 'ESPN', 'Tackles for loss'), C('tflg', 'TFL/G', 'tkl', 1, 'f2', 'DER'),
    C('sck', 'SACK', 'pr', 1, 'f1', 'ESPN'), C('sckg', 'SACK/G', 'pr', 1, 'f2', 'DER'), C('sckyds', 'SCK YDS', 'pr', 1, 'int', 'ESPN'), C('ff', 'FF', 'pr', 1, 'int', 'ESPN', 'Forced fumbles'),
    C('pd', 'PD', 'cov', 1, 'int', 'ESPN', 'Passes defended'), C('pdg', 'PD/G', 'cov', 1, 'f2', 'DER'), C('int', 'INT', 'cov', 1, 'int', 'ESPN'), C('intyds', 'INT YDS', 'cov', 1, 'int', 'ESPN'),
    C('fr', 'FR', 'ball', 1, 'int', 'ESPN', 'Fumble recoveries'), C('tk', 'TKAWAY', 'ball', 1, 'int', 'DER', 'Interceptions + fumble recoveries'), C('dtd', 'DEF TD', 'ball', 1, 'int', 'DER', 'Defensive touchdowns (interception and fumble returns)'),
  ],
  k: [
    C('gp', 'GP', 'fg', 0, 'int', 'ESPN'), C('fgm', 'FGM', 'fg', 1, 'int', 'ESPN'), C('fga', 'FGA', 'fg', 0, 'int', 'ESPN'), C('fgp', 'FG%', 'fg', 1, 'f1', 'ESPN'), C('lng', 'LNG', 'fg', 1, 'int', 'ESPN'),
    C('f40', '40-49 FG%', 'rng', 1, 'f1', 'DER', 'Field-goal percentage from 40 to 49 yards'), C('f50', '50+ FG%', 'rng', 1, 'f1', 'DER', 'Field-goal percentage from 50 yards or more'), C('m50', '50+ made', 'rng', 1, 'int', 'ESPN'), C('a50', '50+ att', 'rng', 0, 'int', 'ESPN'), C('m40', '40-49 made', 'rng', 1, 'int', 'ESPN'), C('m30', '30-39 made', 'rng', 1, 'int', 'ESPN'), C('m20', '20-29 made', 'rng', 1, 'int', 'ESPN'),
    C('xpm', 'XPM', 'xp', 1, 'int', 'ESPN'), C('xpa', 'XPA', 'xp', 0, 'int', 'ESPN'), C('xpp', 'XP%', 'xp', 1, 'f1', 'ESPN'), C('pts', 'PTS', 'xp', 1, 'int', 'DER', 'Points from field goals and extra points'), C('ptsg', 'PTS/G', 'xp', 1, 'f1', 'DER'),
  ],
  p: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'), C('punts', 'PUNTS', 'vol', 0, 'int', 'ESPN'), C('yds', 'YDS', 'vol', 0, 'int', 'ESPN'), C('avg', 'AVG', 'vol', 1, 'f1', 'ESPN', 'Gross average'), C('net', 'NET', 'vol', 1, 'f1', 'ESPN', 'Net average after returns and touchbacks'), C('lng', 'LNG', 'vol', 1, 'int', 'ESPN'),
    C('in20', 'IN 20', 'pos', 1, 'int', 'ESPN', 'Punts downed inside the 20'), C('in20p', 'IN 20%', 'pos', 1, 'f1', 'DER'), C('tb', 'TB', 'pos', -1, 'int', 'ESPN', 'Touchbacks'), C('tbp', 'TB%', 'pos', -1, 'f1', 'DER'), C('blk', 'BLK', 'pos', -1, 'int', 'ESPN', 'Punts blocked'), C('fc', 'FC', 'pos', 1, 'int', 'ESPN', 'Fair catches'), C('ret', 'RET YDS/P', 'pos', -1, 'f1', 'DER', 'Return yards allowed per punt'),
  ],
  tof: [
    ...NFL_REC,
    C('ppg', 'PPG', 'sco', 1, 'f1', 'API', 'Points per game'), C('ypg', 'YDS/G', 'sco', 1, 'f1', 'ESPN', 'Total yards per game'), C('ypp', 'Y/PLAY', 'sco', 1, 'f2', 'DER', 'Yards per play (pass attempts + sacks + rushes)'), C('plays', 'PLAYS/G', 'sco', 0, 'f1', 'DER'), C('prate', 'PASS%', 'sco', 0, 'f1', 'DER', 'Share of pass attempts among pass attempts and rushes'),
    C('pyg', 'PASS YDS/G', 'pass', 1, 'f1', 'ESPN'), C('cmpp', 'CMP%', 'pass', 1, 'f1', 'ESPN'), C('ypa', 'Y/A', 'pass', 1, 'f2', 'ESPN'), C('ptd', 'PASS TD', 'pass', 1, 'int', 'ESPN'), C('pint', 'INT', 'pass', -1, 'int', 'ESPN'), C('sck', 'SACKED', 'pass', -1, 'int', 'ESPN', 'Times sacked'), C('rtg', 'RTG', 'pass', 1, 'f1', 'ESPN'),
    C('ryg', 'RUSH YDS/G', 'rush', 1, 'f1', 'ESPN'), C('ratt', 'RUSH ATT/G', 'rush', 0, 'f1', 'DER'), C('ypc', 'Y/C', 'rush', 1, 'f2', 'ESPN'), C('rtd', 'RUSH TD', 'rush', 1, 'int', 'ESPN'),
    C('fdg', '1D/G', 'sit', 1, 'f1', 'DER'), C('thp', '3RD%', 'sit', 1, 'f1', 'ESPN', 'Third-down conversion percentage'), C('fop', '4TH%', 'sit', 1, 'f1', 'ESPN', 'Fourth-down conversion percentage'), C('peng', 'PEN/G', 'sit', -1, 'f1', 'DER', 'Penalties per game'), C('penyg', 'PEN YDS/G', 'sit', -1, 'f1', 'DER'),
    C('give', 'GIVEAWAYS', 'ball', -1, 'int', 'ESPN'), C('fuml', 'FUM LOST', 'ball', -1, 'int', 'ESPN'),
  ],
  tdf: [
    ...NFL_REC,
    C('pag', 'PA/G', 'prev', -1, 'f1', 'DER', 'Points allowed per game'), C('pa', 'PA', 'prev', -1, 'int', 'API'),
    C('sck', 'SACKS', 'pr', 1, 'int', 'DER', 'Sacks by the defense (summed over defenders)'), C('sckg', 'SACKS/G', 'pr', 1, 'f2', 'DER'), C('tfl', 'TFL', 'pr', 1, 'int', 'DER'), C('pd', 'PD', 'pr', 1, 'int', 'DER'), C('ff', 'FF', 'pr', 1, 'int', 'DER'),
    C('int', 'INT', 'ball', 1, 'int', 'ESPN'), C('fr', 'FR', 'ball', 1, 'int', 'DER'), C('take', 'TAKEAWAYS', 'ball', 1, 'int', 'ESPN'), C('takeg', 'TAKE/G', 'ball', 1, 'f2', 'DER'), C('dtd', 'DEF TD', 'ball', 1, 'int', 'DER'), C('tod', 'TO diff', 'ball', 1, 'sgi', 'ESPN', 'Takeaways minus giveaways'),
  ],
});
Object.assign(GROUPS, NFL_G);
Object.assign(GROUP_META, {
  qb: { label: 'Passing', singular: 'Quarterback', sort: 'yds', dir: -1 },
  rb: { label: 'Rushing', singular: 'Rusher', sort: 'yds', dir: -1 },
  rec: { label: 'Receiving', singular: 'Receiver', sort: 'yds', dir: -1 },
  def: { label: 'Defense', singular: 'Defender', sort: 'tkl', dir: -1 },
  k: { label: 'Kicking', singular: 'Kicker', sort: 'pts', dir: -1 },
  p: { label: 'Punting', singular: 'Punter', sort: 'net', dir: -1 },
  tof: { label: 'Team offense', singular: 'Team', sort: 'ppg', dir: -1 },
  tdf: { label: 'Team defense', singular: 'Team', sort: 'pag', dir: 1 },
});
