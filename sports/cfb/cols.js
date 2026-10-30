/* cols.js: college football column catalogue. Teams: offense, defense and special teams, each with the same stats measured for the opponents.
   Players: the top 100 in ESPN's passing, rushing, receiving and defensive leaderboards, each with their own season line. */
const CFB_G = {
  qb: [{ id: 'vol', l: 'Games', on: 1 }, { id: 'pass', l: 'Passing', on: 1 }, { id: 'eff', l: 'Efficiency', on: 1 }, { id: 'rush', l: 'Rushing', on: 1 }],
  rb: [{ id: 'vol', l: 'Games', on: 1 }, { id: 'rush', l: 'Rushing', on: 1 }, { id: 'rec', l: 'Receiving', on: 1 }, { id: 'tot', l: 'Totals', on: 1 }],
  wr: [{ id: 'vol', l: 'Games', on: 1 }, { id: 'rec', l: 'Receiving', on: 1 }, { id: 'eff', l: 'Efficiency', on: 1 }, { id: 'ball', l: 'Ball security' }],
  df: [{ id: 'vol', l: 'Games', on: 1 }, { id: 'tack', l: 'Tackling', on: 1 }, { id: 'pr', l: 'Pass rush', on: 1 }, { id: 'cov', l: 'Coverage', on: 1 }],
  tof: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'sco', l: 'Scoring & yardage', on: 1 }, { id: 'pass', l: 'Passing', on: 1 }, { id: 'rush', l: 'Rushing', on: 1 }, { id: 'sit', l: 'Situational', on: 1 }, { id: 'ball', l: 'Ball security' }],
  tdf: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'prev', l: 'Points & yards allowed', on: 1 }, { id: 'pass', l: 'Against the pass', on: 1 }, { id: 'rush', l: 'Against the run', on: 1 }, { id: 'pr', l: 'Pass rush', on: 1 }, { id: 'ball', l: 'Takeaways', on: 1 }],
  tsp: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'kick', l: 'Kicking', on: 1 }, { id: 'punt', l: 'Punting', on: 1 }, { id: 'ret', l: 'Returns', on: 1 }, { id: 'pen', l: 'Discipline', on: 1 }],
};
const CFB_REC = [C('gp', 'GP', 'rec', 0, 'int', 'ESPN'), C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('pct', 'W%', 'rec', 1, 'f3', 'API'), C('diff', 'Pt diff/G', 'rec', 1, 'sg1', 'DER', 'Average scoring margin')];
Object.assign(COLS, {
  qb: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'),
    C('cmp', 'CMP', 'pass', 1, 'int', 'ESPN'), C('att', 'ATT', 'pass', 0, 'int', 'ESPN'), C('cmpp', 'CMP%', 'pass', 1, 'f1', 'ESPN'), C('pyds', 'PASS YDS', 'pass', 1, 'int', 'ESPN'), C('pypg', 'YDS/G', 'pass', 1, 'f1', 'ESPN', 'Passing yards per game'), C('ptd', 'PASS TD', 'pass', 1, 'int', 'ESPN'), C('pint', 'INT', 'pass', -1, 'int', 'ESPN', 'Interceptions thrown'), C('plng', 'LNG', 'pass', 1, 'int', 'ESPN', 'Longest completion'),
    C('ypa', 'Y/A', 'eff', 1, 'f2', 'ESPN', 'Yards per attempt'), C('ypcm', 'Y/C', 'eff', 1, 'f1', 'ESPN', 'Yards per completion'), C('tdp', 'TD%', 'eff', 1, 'f1', 'ESPN', 'Touchdowns per attempt'), C('intp', 'INT%', 'eff', -1, 'f1', 'ESPN', 'Interceptions per attempt'), C('rtg', 'RTG', 'eff', 1, 'f1', 'ESPN', 'Passer rating'), C('sckd', 'SACKED', 'eff', -1, 'int', 'ESPN'), C('p1d', '1D', 'eff', 1, 'int', 'ESPN', 'Passing first downs'),
    C('ratt', 'RUSH ATT', 'rush', 0, 'int', 'ESPN'), C('ryds', 'RUSH YDS', 'rush', 1, 'int', 'ESPN'), C('ypc', 'Y/C', 'rush', 1, 'f2', 'ESPN', 'Yards per carry'), C('rtd', 'RUSH TD', 'rush', 1, 'int', 'ESPN'),
  ],
  rb: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'),
    C('ratt', 'ATT', 'rush', 0, 'int', 'ESPN', 'Carries'), C('ryds', 'RUSH YDS', 'rush', 1, 'int', 'ESPN'), C('rypg', 'YDS/G', 'rush', 1, 'f1', 'ESPN', 'Rushing yards per game'), C('ypc', 'Y/C', 'rush', 1, 'f2', 'ESPN', 'Yards per carry'), C('rtd', 'RUSH TD', 'rush', 1, 'int', 'ESPN'), C('rlng', 'LNG', 'rush', 1, 'int', 'ESPN', 'Longest run'), C('r1d', '1D', 'rush', 1, 'int', 'ESPN', 'Rushing first downs'), C('rbig', '20+', 'rush', 1, 'int', 'ESPN', 'Rushes of 20 yards or more'), C('rfum', 'FUM', 'rush', -1, 'int', 'ESPN', 'Fumbles'),
    C('rec', 'REC', 'rec', 1, 'int', 'ESPN'), C('recyds', 'REC YDS', 'rec', 1, 'int', 'ESPN'), C('rctd', 'REC TD', 'rec', 1, 'int', 'ESPN'),
    C('scrim', 'SCRIM YDS', 'tot', 1, 'int', 'ESPN', 'Yards from scrimmage'), C('scrimpg', 'SCRIM/G', 'tot', 1, 'f1', 'ESPN', 'Yards from scrimmage per game'), C('tdt', 'TOTAL TD', 'tot', 1, 'int', 'DER', 'Rushing plus receiving touchdowns'),
  ],
  wr: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'),
    C('rec', 'REC', 'rec', 1, 'int', 'ESPN'), C('recyds', 'REC YDS', 'rec', 1, 'int', 'ESPN'), C('recpg', 'YDS/G', 'rec', 1, 'f1', 'ESPN', 'Receiving yards per game'), C('recpg2', 'REC/G', 'rec', 1, 'f1', 'DER'), C('rctd', 'REC TD', 'rec', 1, 'int', 'ESPN'), C('lrec', 'LNG', 'rec', 1, 'int', 'ESPN', 'Longest reception'),
    C('ypr', 'Y/R', 'eff', 1, 'f1', 'ESPN', 'Yards per reception'), C('yac', 'YAC', 'eff', 1, 'int', 'ESPN', 'Yards after the catch'), C('c1d', '1D', 'eff', 1, 'int', 'ESPN', 'Receiving first downs'), C('cbig', '20+', 'eff', 1, 'int', 'ESPN', 'Catches of 20 yards or more'),
    C('cfum', 'FUM', 'ball', -1, 'int', 'ESPN', 'Fumbles'),
  ],
  df: [
    C('gp', 'GP', 'vol', 0, 'int', 'ESPN'),
    C('tot', 'TACKLES', 'tack', 1, 'int', 'ESPN', 'Total tackles'), C('solo', 'SOLO', 'tack', 1, 'int', 'ESPN'), C('ast', 'AST', 'tack', 1, 'int', 'ESPN', 'Assisted tackles'), C('tpg', 'TKL/G', 'tack', 1, 'f1', 'DER', 'Tackles per game'), C('tfl', 'TFL', 'tack', 1, 'f1', 'ESPN', 'Tackles for loss'), C('stf', 'STUFFS', 'tack', 1, 'int', 'ESPN', 'Runs stopped at or behind the line'),
    C('sck', 'SACKS', 'pr', 1, 'f1', 'ESPN'), C('sckpg', 'SACKS/G', 'pr', 1, 'f2', 'DER'), C('qbh', 'QB HITS', 'pr', 1, 'int', 'ESPN'), C('hur', 'HURRIES', 'pr', 1, 'int', 'ESPN'),
    C('pd', 'PD', 'cov', 1, 'int', 'ESPN', 'Passes defended'), C('int', 'INT', 'cov', 1, 'int', 'ESPN'), C('intyd', 'INT YDS', 'cov', 1, 'int', 'ESPN'), C('inttd', 'INT TD', 'cov', 1, 'int', 'ESPN'), C('kb', 'BLOCKS', 'cov', 1, 'int', 'ESPN', 'Kicks blocked'),
  ],
  tof: [
    ...CFB_REC,
    C('ppg', 'PPG', 'sco', 1, 'f1', 'API', 'Points per game'), C('ypg', 'YDS/G', 'sco', 1, 'f1', 'ESPN', 'Total yards per game'), C('ypp', 'Y/PLAY', 'sco', 1, 'f2', 'DER', 'Yards per play (pass attempts plus rushes)'), C('plg', 'PLAYS/G', 'sco', 0, 'f1', 'DER', 'Offensive plays per game'),
    C('pyg', 'PASS YDS/G', 'pass', 1, 'f1', 'ESPN'), C('cmpp', 'CMP%', 'pass', 1, 'f1', 'ESPN'), C('ypa', 'Y/A', 'pass', 1, 'f2', 'ESPN'), C('ptd', 'PASS TD', 'pass', 1, 'int', 'ESPN'), C('pint', 'INT', 'pass', -1, 'int', 'ESPN', 'Interceptions thrown'), C('rtg', 'RTG', 'pass', 1, 'f1', 'ESPN', 'Team passer rating'), C('sckt', 'SACKED', 'pass', -1, 'int', 'ESPN', 'Times the offense was sacked'),
    C('ryg', 'RUSH YDS/G', 'rush', 1, 'f1', 'ESPN'), C('ratt', 'RUSH ATT/G', 'rush', 0, 'f1', 'DER'), C('ypc', 'Y/C', 'rush', 1, 'f2', 'ESPN', 'Yards per carry'), C('rtd', 'RUSH TD', 'rush', 1, 'int', 'ESPN'), C('rlng', 'LNG RUSH', 'rush', 1, 'int', 'ESPN'),
    C('fdg', '1D/G', 'sit', 1, 'f1', 'DER', 'First downs per game'), C('thp', '3RD%', 'sit', 1, 'f1', 'ESPN', 'Third-down conversion percentage'), C('fop', '4TH%', 'sit', 1, 'f1', 'ESPN', 'Fourth-down conversion percentage'),
    C('give', 'GIVEAWAYS', 'ball', -1, 'int', 'DER', 'Interceptions thrown plus fumbles lost to the opponent'), C('fuml', 'FUM LOST', 'ball', -1, 'int', 'ESPN', 'Fumbles recovered by the opponent'),
  ],
  tdf: [
    ...CFB_REC,
    C('pag', 'PA/G', 'prev', -1, 'f1', 'API', 'Points allowed per game'), C('pa', 'PA', 'prev', -1, 'int', 'API'), C('oypg', 'YDS/G', 'prev', -1, 'f1', 'ESPN', 'Total yards allowed per game'), C('oypp', 'Y/PLAY', 'prev', -1, 'f2', 'DER', 'Yards allowed per play'),
    C('opyg', 'PASS YDS/G', 'pass', -1, 'f1', 'ESPN', 'Passing yards allowed per game'), C('ocmpp', 'CMP%', 'pass', -1, 'f1', 'ESPN', 'Completion percentage allowed'), C('oypa', 'Y/A', 'pass', -1, 'f2', 'ESPN', 'Yards allowed per attempt'), C('optd', 'PASS TD', 'pass', -1, 'int', 'ESPN', 'Passing touchdowns allowed'), C('ortg', 'RTG', 'pass', -1, 'f1', 'ESPN', 'Passer rating of opposing offenses'),
    C('oryg', 'RUSH YDS/G', 'rush', -1, 'f1', 'ESPN', 'Rushing yards allowed per game'), C('oypc', 'Y/C', 'rush', -1, 'f2', 'ESPN', 'Yards allowed per carry'), C('ortd', 'RUSH TD', 'rush', -1, 'int', 'ESPN', 'Rushing touchdowns allowed'), C('othp', '3RD%', 'rush', -1, 'f1', 'ESPN', 'Opponent third-down conversion percentage'),
    C('sck', 'SACKS', 'pr', 1, 'int', 'ESPN', 'Sacks by the defense'), C('sckg', 'SACKS/G', 'pr', 1, 'f2', 'DER'), C('sckp', 'SACK%', 'pr', 1, 'f1', 'DER', 'Sacks per opposing dropback'),
    C('int', 'INT', 'ball', 1, 'int', 'ESPN', 'Interceptions'), C('fr', 'FR', 'ball', 1, 'int', 'ESPN', 'Fumbles recovered'), C('take', 'TAKEAWAYS', 'ball', 1, 'int', 'DER', 'Interceptions plus fumble recoveries'), C('takeg', 'TAKE/G', 'ball', 1, 'f2', 'DER'), C('tod', 'TO DIFF', 'ball', 1, 'sgi', 'DER', 'Takeaways minus giveaways'),
  ],
  tsp: [
    ...CFB_REC,
    C('fgm', 'FGM', 'kick', 1, 'int', 'ESPN'), C('fga', 'FGA', 'kick', 0, 'int', 'ESPN'), C('fgp', 'FG%', 'kick', 1, 'f1', 'ESPN'), C('f50', '50+ FGM', 'kick', 1, 'int', 'ESPN', 'Field goals made from 50 yards or more'), C('xpp', 'XP%', 'kick', 1, 'f1', 'ESPN'), C('klng', 'LNG FG', 'kick', 1, 'int', 'ESPN'),
    C('punts', 'PUNTS', 'punt', 0, 'int', 'ESPN'), C('pavg', 'AVG', 'punt', 1, 'f1', 'ESPN', 'Gross punt average'), C('pnet', 'NET', 'punt', 1, 'f1', 'ESPN', 'Net punt average'),
    C('krav', 'KR AVG', 'ret', 1, 'f1', 'ESPN', 'Yards per kickoff return'), C('prav', 'PR AVG', 'ret', 1, 'f1', 'ESPN', 'Yards per punt return'), C('retd', 'RET TD', 'ret', 1, 'int', 'ESPN', 'Kick and punt returns for touchdowns'),
    C('penpg', 'PEN/G', 'pen', -1, 'f1', 'ESPN', 'Penalties per game'), C('penyg', 'PEN YDS/G', 'pen', -1, 'f1', 'ESPN', 'Penalty yards per game'),
  ],
});
Object.assign(GROUPS, CFB_G);
Object.assign(GROUP_META, {
  qb: { label: 'Quarterbacks', singular: 'Quarterback', sort: 'pyds', dir: -1 },
  rb: { label: 'Rushers', singular: 'Rusher', sort: 'ryds', dir: -1 },
  wr: { label: 'Receivers', singular: 'Receiver', sort: 'recyds', dir: -1 },
  df: { label: 'Defenders', singular: 'Defender', sort: 'tot', dir: -1 },
  tof: { label: 'Team offense', singular: 'Team', sort: 'ppg', dir: -1 },
  tdf: { label: 'Team defense', singular: 'Team', sort: 'pag', dir: 1 },
  tsp: { label: 'Special teams', singular: 'Team', sort: 'fgp', dir: -1 },
});
