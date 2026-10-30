/* cols.js: soccer column catalogue. Club rates come from ESPN's season totals per club; player lines come from each club's roster feed (appearances, goals, assists, shots, fouls, cards, saves; no minutes). */
const SOC_G = {
  pl: [{ id: 'vol', l: 'Appearances', on: 1 }, { id: 'sco', l: 'Scoring & creating', on: 1 }, { id: 'sht', l: 'Shooting', on: 1 }, { id: 'dis', l: 'Fouls & discipline', on: 1 }],
  gk: [{ id: 'vol', l: 'Appearances', on: 1 }, { id: 'sav', l: 'Shot stopping', on: 1 }, { id: 'dis', l: 'Discipline' }],
  tof: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'sco', l: 'Scoring', on: 1 }, { id: 'chn', l: 'Chance creation', on: 1 }, { id: 'set', l: 'Set pieces & headers' }],
  tpo: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'ball', l: 'Possession & passing', on: 1 }, { id: 'wid', l: 'Width & depth', on: 1 }, { id: 'duel', l: 'Duels & recoveries', on: 1 }],
  tdf: [{ id: 'rec', l: 'Record', on: 1 }, { id: 'prev', l: 'Goals prevented', on: 1 }, { id: 'gk', l: 'Goalkeeping', on: 1 }, { id: 'def', l: 'Defending', on: 1 }, { id: 'dis', l: 'Discipline', on: 1 }],
};
const SOC_REC = [C('gp', 'GP', 'rec', 0, 'int', 'API'), C('w', 'W', 'rec', 1, 'int', 'API'), C('t', 'D', 'rec', 0, 'int', 'API'), C('l', 'L', 'rec', -1, 'int', 'API'), C('pts', 'PTS', 'rec', 1, 'int', 'API'),
  C('ppg', 'PTS/G', 'rec', 1, 'f2', 'DER', 'Points per game'), C('gd', 'GD', 'rec', 1, 'sgi', 'API', 'Goal difference'), C('diff', 'GD/G', 'rec', 1, 'sg1', 'DER', 'Goal difference per game')];
Object.assign(COLS, {
  pl: [
    C('app', 'APP', 'vol', 0, 'int', 'ESPN', 'Appearances, starts and substitute appearances together'), C('st', 'STARTS', 'vol', 1, 'int', 'DER', 'Appearances minus substitute appearances'), C('sub', 'SUB', 'vol', 0, 'int', 'ESPN', 'Appearances as a substitute'),
    C('g', 'GOALS', 'sco', 1, 'int', 'ESPN'), C('a', 'ASSISTS', 'sco', 1, 'int', 'ESPN'), C('ga', 'G+A', 'sco', 1, 'int', 'DER', 'Goals plus assists'),
    C('gpa', 'G/APP', 'sco', 1, 'f2', 'DER', 'Goals per appearance'), C('apa', 'A/APP', 'sco', 1, 'f2', 'DER', 'Assists per appearance'), C('gapa', 'G+A/APP', 'sco', 1, 'f2', 'DER', 'Goal contributions per appearance'),
    C('sh', 'SHOTS', 'sht', 1, 'int', 'ESPN'), C('sot', 'SOT', 'sht', 1, 'int', 'ESPN', 'Shots on target'), C('shpa', 'SHOTS/APP', 'sht', 0, 'f2', 'DER'), C('sotpa', 'SOT/APP', 'sht', 1, 'f2', 'DER'),
    C('sotp', 'SOT%', 'sht', 1, 'f1', 'DER', 'Share of shots on target'), C('conv', 'CONV%', 'sht', 1, 'f1', 'DER', 'Goals per shot'),
    C('fc', 'FOULS', 'dis', -1, 'int', 'ESPN', 'Fouls committed'), C('fs', 'FOULED', 'dis', 1, 'int', 'ESPN', 'Fouls suffered'), C('fcpa', 'FOULS/APP', 'dis', -1, 'f2', 'DER'), C('fspa', 'FOULED/APP', 'dis', 1, 'f2', 'DER'),
    C('yc', 'YELLOWS', 'dis', -1, 'int', 'ESPN'), C('rc', 'REDS', 'dis', -1, 'int', 'ESPN'), C('ofs', 'OFFSIDES', 'dis', -1, 'int', 'ESPN'), C('og', 'OWN GOALS', 'dis', -1, 'int', 'ESPN'),
  ],
  gk: [
    C('app', 'APP', 'vol', 0, 'int', 'ESPN'), C('st', 'STARTS', 'vol', 1, 'int', 'DER', 'Appearances minus substitute appearances'), C('sub', 'SUB', 'vol', 0, 'int', 'ESPN'),
    C('sv', 'SAVES', 'sav', 1, 'int', 'ESPN'), C('sf', 'SHOTS FACED', 'sav', 0, 'int', 'ESPN', 'Shots on target faced'), C('gc', 'CONCEDED', 'sav', -1, 'int', 'ESPN', 'Goals conceded'), C('svp', 'SAVE%', 'sav', 1, 'f1', 'DER', 'Saves per shot on target faced'),
    C('svpa', 'SAVES/APP', 'sav', 1, 'f2', 'DER'), C('sfpa', 'FACED/APP', 'sav', 0, 'f2', 'DER'), C('gcpa', 'GA/APP', 'sav', -1, 'f2', 'DER', 'Goals conceded per appearance'),
    C('yc', 'YELLOWS', 'dis', -1, 'int', 'ESPN'), C('rc', 'REDS', 'dis', -1, 'int', 'ESPN'),
  ],
  tof: [
    ...SOC_REC,
    C('gf', 'GF', 'sco', 1, 'int', 'API', 'Goals scored'), C('gfg', 'GF/G', 'sco', 1, 'f2', 'DER'), C('xg', 'xG/G', 'sco', 1, 'f2', 'ESPN', 'Expected goals per game'), C('xgd', 'xGD/G', 'sco', 1, 'sg1', 'ESPN', 'Expected goal difference per game'),
    C('shg', 'SHOTS/G', 'chn', 1, 'f1', 'DER'), C('sotg', 'SOT/G', 'chn', 1, 'f1', 'DER'), C('sotp', 'SOT%', 'chn', 1, 'f1', 'DER', 'Share of shots on target'), C('conv', 'CONV%', 'chn', 1, 'f1', 'DER', 'Goals per shot'), C('bcg', 'BIG CH/G', 'chn', 1, 'f2', 'ESPN', 'Big chances created per game'), C('ast', 'ASSISTS', 'chn', 1, 'int', 'ESPN'),
    C('hdg', 'HEADED', 'set', 1, 'int', 'ESPN', 'Headed goals'), C('pkg', 'PEN GOALS', 'set', 1, 'int', 'ESPN', 'Penalty-kick goals'), C('fkg', 'FK GOALS', 'set', 1, 'int', 'ESPN', 'Direct free-kick goals'), C('crng', 'CORNERS/G', 'set', 1, 'f1', 'DER', 'Corners won per game'),
  ],
  tpo: [
    ...SOC_REC,
    C('poss', 'POSS%', 'ball', 1, 'f1', 'ESPN', 'Average share of possession'), C('pasg', 'PASSES/G', 'ball', 1, 'f0', 'DER'), C('passp', 'PASS%', 'ball', 1, 'f1', 'DER', 'Pass completion'),
    C('lbg', 'LONG BALLS/G', 'wid', 0, 'f1', 'DER'), C('lbp', 'LONG%', 'wid', 1, 'f1', 'DER', 'Long-ball accuracy'), C('crsg', 'CROSSES/G', 'wid', 0, 'f1', 'DER'), C('crsp', 'CROSS%', 'wid', 1, 'f1', 'DER', 'Cross accuracy'), C('offg', 'OFFSIDES/G', 'wid', -1, 'f2', 'DER'),
    C('duelp', 'DUEL WIN%', 'duel', 1, 'f1', 'DER', 'Share of duels won'), C('recg', 'RECOVERIES/G', 'duel', 1, 'f1', 'DER', 'Ball recoveries per game'), C('fsg', 'FOULS WON/G', 'duel', 1, 'f1', 'DER', 'Fouls suffered per game'),
  ],
  tdf: [
    ...SOC_REC,
    C('ga', 'GA', 'prev', -1, 'int', 'API', 'Goals conceded'), C('gag', 'GA/G', 'prev', -1, 'f2', 'DER'), C('xga', 'xGA/G', 'prev', -1, 'f2', 'ESPN', 'Expected goals conceded per game'), C('cs', 'CLEAN SHEETS', 'prev', 1, 'int', 'ESPN'), C('csp', 'CS%', 'prev', 1, 'f1', 'DER', 'Share of matches without conceding'),
    C('sfg', 'SHOTS FACED/G', 'gk', -1, 'f1', 'DER'), C('svg', 'SAVES/G', 'gk', 0, 'f1', 'DER'), C('svp', 'SAVE%', 'gk', 1, 'f1', 'DER', 'Saves per shot on target faced'), C('pks', 'PENS SAVED', 'gk', 1, 'int', 'ESPN'), C('bcs', 'BIG SAVES', 'gk', 1, 'int', 'ESPN', 'Big-chance saves'),
    C('tklg', 'TACKLES/G', 'def', 1, 'f1', 'DER'), C('tklp', 'TACKLE%', 'def', 1, 'f1', 'DER', 'Share of tackles that win the ball'), C('intg', 'INT/G', 'def', 1, 'f1', 'DER', 'Interceptions per game'), C('clrg', 'CLEAR/G', 'def', 1, 'f1', 'DER', 'Clearances per game'), C('blkg', 'BLOCKS/G', 'def', 1, 'f1', 'DER', 'Blocked shots per game'),
    C('fcg', 'FOULS/G', 'dis', -1, 'f1', 'DER', 'Fouls committed per game'), C('ycg', 'YELLOWS/G', 'dis', -1, 'f2', 'DER'), C('red', 'REDS', 'dis', -1, 'int', 'ESPN', 'Red cards (including second yellows)'),
  ],
});
Object.assign(GROUPS, SOC_G);
Object.assign(GROUP_META, {
  pl: { label: 'Players', singular: 'Player', sort: 'ga', dir: -1 },
  gk: { label: 'Goalkeepers', singular: 'Goalkeeper', sort: 'svp', dir: -1 },
  tof: { label: 'Attack', singular: 'Club', sort: 'gfg', dir: -1 },
  tpo: { label: 'Possession', singular: 'Club', sort: 'poss', dir: -1 },
  tdf: { label: 'Defense', singular: 'Club', sort: 'gag', dir: 1 },
});
