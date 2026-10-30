/* cols.js: college football column catalogue. ESPN publishes no bulk player stats for college football, so the site is built on teams:
   offense, defense and special teams, each with the same stats measured for the opponents. */
const CFB_G = {
  tof: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'sco', l: 'Scoring & yardage', on: 1 }, { id: 'pass', l: 'Passing', on: 1 }, { id: 'rush', l: 'Rushing', on: 1 }, { id: 'sit', l: 'Situational', on: 1 }, { id: 'ball', l: 'Ball security' }],
  tdf: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'prev', l: 'Points & yards allowed', on: 1 }, { id: 'pass', l: 'Against the pass', on: 1 }, { id: 'rush', l: 'Against the run', on: 1 }, { id: 'pr', l: 'Pass rush', on: 1 }, { id: 'ball', l: 'Takeaways', on: 1 }],
  tsp: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'kick', l: 'Kicking', on: 1 }, { id: 'punt', l: 'Punting', on: 1 }, { id: 'ret', l: 'Returns', on: 1 }, { id: 'pen', l: 'Discipline', on: 1 }],
};
const CFB_REC = [C('gp', 'GP', 'rec', 0, 'int', 'ESPN'), C('w', 'W', 'rec', 1, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('pct', 'W%', 'rec', 1, 'f3', 'API'), C('diff', 'Pt diff/G', 'rec', 1, 'sg1', 'DER', 'Average scoring margin')];
Object.assign(COLS, {
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
  tof: { label: 'Team offense', singular: 'Team', sort: 'ppg', dir: -1 },
  tdf: { label: 'Team defense', singular: 'Team', sort: 'pag', dir: 1 },
  tsp: { label: 'Special teams', singular: 'Team', sort: 'fgp', dir: -1 },
});
