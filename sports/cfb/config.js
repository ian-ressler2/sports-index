/* config.js: the college football sport definition. Teams, plus the top 100 players in each of ESPN's passing, rushing, receiving and defensive leaderboards. */
const CFB_DEFPOS = { DL: ['DE', 'DT', 'DL', 'NT'], LB: ['LB', 'OLB', 'ILB', 'MLB'], DB: ['CB', 'S', 'SS', 'FS', 'DB'] };
const CFB_POSNAME = { QB: 'Quarterback', RB: 'Running back', FB: 'Fullback', WR: 'Wide receiver', TE: 'Tight end', DE: 'Defensive end', DT: 'Defensive tackle', DL: 'Defensive lineman', NT: 'Nose tackle', LB: 'Linebacker', OLB: 'Linebacker', ILB: 'Linebacker', MLB: 'Linebacker', CB: 'Cornerback', S: 'Safety', SS: 'Safety', FS: 'Safety', DB: 'Defensive back', PK: 'Kicker', P: 'Punter', ATH: 'Athlete' };
const cfbPlayerRole = (g, tab, plural, thr, posOptions, posMatch) => ({ tab, plural, kind: 'player', thr, situ: false, qual: () => true, qualText: () => 'top 100', posLabel: 'All positions', posOptions, posMatch, roleOf: r => CFB_POSNAME[r.pos] || r.pos || 'Player' });
const CFB_ROLE = {
  qb: cfbPlayerRole('qb', 'Quarterbacks', 'Quarterbacks', { field: 'att', label: 'ATT', loose: 1 }, () => [], () => true),
  rb: cfbPlayerRole('rb', 'Rushers', 'Rushers', { field: 'ratt', label: 'ATT', loose: 1 }, () => ['QB', 'RB', 'WR'], (r, o) => r.pos === o),
  wr: cfbPlayerRole('wr', 'Receivers', 'Receivers', { field: 'rec', label: 'REC', loose: 1 }, () => ['WR', 'TE', 'RB'], (r, o) => r.pos === o),
  k: cfbPlayerRole('k', 'Kickers', 'Kickers', { field: 'fga', label: 'FGA', loose: 1 }, () => [], () => true),
  p: cfbPlayerRole('p', 'Punters', 'Punters', { field: 'punts', label: 'PUNTS', loose: 1 }, () => [], () => true),
  kr: cfbPlayerRole('kr', 'Returners', 'Returners', { field: 'retn', label: 'RET', loose: 1 }, () => [], () => true),
  df: cfbPlayerRole('df', 'Defenders', 'Defenders', { field: 'tot', label: 'TKL', loose: 1 }, () => ['DL', 'LB', 'DB'], (r, o) => (CFB_DEFPOS[o] || []).includes(r.pos)),
  tof: { kind: 'team', tab: 'Team offense', plural: 'Teams' }, tdf: { kind: 'team', tab: 'Team defense', plural: 'Teams' }, tsp: { kind: 'team', tab: 'Special teams', plural: 'Teams' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...CFB_ROLE[g] };
SPORT.groupOrder = ['qb', 'rb', 'wr', 'df', 'k', 'p', 'kr', 'tof', 'tdf', 'tsp'];
const CFB_TAPE = {
  k: ['gp', 'fgm', 'fga', 'fgp', 'fg40', 'f50', 'fgl', 'xpp', 'kpts'],
  p: ['gp', 'punts', 'pavg', 'pnet', 'plong', 'in20', 'in20p'],
  kr: ['gp', 'krn', 'krav', 'krtd', 'prn', 'prav', 'prtd', 'retyds'],
  qb: ['gp', 'cmpp', 'pyds', 'pypg', 'ypa', 'ptd', 'pint', 'rtg', 'sckd', 'ryds', 'rtd'],
  rb: ['gp', 'ratt', 'ryds', 'rypg', 'ypc', 'rtd', 'rlng', 'rec', 'recyds', 'scrim', 'tdt'],
  wr: ['gp', 'rec', 'recyds', 'recpg', 'ypr', 'rctd', 'lrec', 'yac', 'c1d'],
  df: ['gp', 'tot', 'solo', 'tpg', 'tfl', 'sck', 'qbh', 'pd', 'int'],
  tof: ['w', 'l', 'ppg', 'ypg', 'ypp', 'pyg', 'ryg', 'cmpp', 'ypc', 'thp', 'give', 'sckt'],
  tdf: ['w', 'l', 'pag', 'oypg', 'opyg', 'oryg', 'sck', 'int', 'take', 'tod'],
  tsp: ['w', 'l', 'fgp', 'f50', 'xpp', 'pavg', 'pnet', 'krav', 'prav', 'penpg'],
};
const CFB_RADAR = {
  k: [['fgp', 'FG%'], ['fgm', 'FGM'], ['f50', '50+'], ['fgl', 'LNG'], ['xpp', 'XP%'], ['kpts', 'PTS']],
  p: [['pavg', 'AVG'], ['pnet', 'NET'], ['plong', 'LNG'], ['in20', 'IN 20'], ['in20p', 'IN 20%'], ['punts', 'PUNTS']],
  kr: [['krav', 'KR AVG'], ['prav', 'PR AVG'], ['retyds', 'RET YDS'], ['krlg', 'KR LNG'], ['prlg', 'PR LNG'], ['rettd', 'RET TD']],
  qb: [['pypg', 'PASS YD/G'], ['cmpp', 'CMP%'], ['ypa', 'Y/A'], ['tdp', 'TD%'], ['rtg', 'RATING'], ['rypg', 'RUSH YD/G']],
  rb: [['rypg', 'RUSH YD/G'], ['ypc', 'Y/C'], ['rtd', 'RUSH TD'], ['rbig', '20+ RUNS'], ['recyds', 'REC YDS'], ['scrimpg', 'SCRIM/G']],
  wr: [['recpg', 'REC YD/G'], ['ypr', 'Y/R'], ['recpg2', 'REC/G'], ['rctd', 'REC TD'], ['yac', 'YAC'], ['cbig', '20+ CATCHES']],
  df: [['tpg', 'TKL/G'], ['tfl', 'TFL'], ['sck', 'SACKS'], ['qbh', 'QB HITS'], ['pd', 'PD'], ['int', 'INT']],
  tof: [['ppg', 'PPG'], ['ypp', 'Y/PLAY'], ['pyg', 'PASS YD/G'], ['ryg', 'RUSH YD/G'], ['thp', '3RD%'], ['give', 'Giveaways']],
  tdf: [['pag', 'PA/G'], ['opyg', 'PASS YD/G'], ['oryg', 'RUSH YD/G'], ['sckg', 'SACK/G'], ['takeg', 'TAKE/G'], ['othp', '3RD% ALLOWED']],
  tsp: [['fgp', 'FG%'], ['xpp', 'XP%'], ['pnet', 'NET PUNT'], ['krav', 'KR AVG'], ['prav', 'PR AVG'], ['penpg', 'PEN/G']],
};
const CFB_RECIPES = {
  k: [{ name: 'Automatic', desc: 'Makes what he attempts', ing: { fgp: 2, xpp: 1, fgm: 1 } }, { name: 'Long range', desc: 'Makes the long ones', ing: { f50: 2, fg40: 1.5, fgl: 1 } }],
  p: [{ name: 'Field flipper', desc: 'Distance and placement', ing: { pnet: 2, pavg: 1, in20p: 1.5 } }],
  kr: [{ name: 'Game breaker', desc: 'Long, explosive returns', ing: { krav: 1.5, prav: 1.5, rettd: 2 } }],
  qb: [{ name: 'Gunslinger', desc: 'Yards and touchdowns through the air', ing: { pypg: 2, ptd: 1.5, ypa: 1 } }, { name: 'Efficient passer', desc: 'Accurate and careful', ing: { cmpp: 1.5, rtg: 2, intp: -1 } }, { name: 'Dual threat', desc: 'Hurts you with the arm and the legs', ing: { pypg: 1.5, ryds: 1.5, rtd: 1 } }],
  rb: [{ name: 'Workhorse', desc: 'Piles up yards and carries', ing: { rypg: 2, ratt: 1.5, rtd: 1 } }, { name: 'Big-play back', desc: 'Breaks long runs', ing: { ypc: 2, rbig: 1.5, rlng: 1 } }, { name: 'Three-down back', desc: 'Runs and catches', ing: { scrimpg: 2, rec: 1, rctd: .5 } }],
  wr: [{ name: 'Top target', desc: 'Volume and production', ing: { recpg: 2, rec: 1.5, rctd: 1 } }, { name: 'Deep threat', desc: 'Yards on every catch', ing: { ypr: 2, yac: 1, cbig: 1.5 } }, { name: 'Chain mover', desc: 'Catches that keep drives alive', ing: { c1d: 2, recpg2: 1.5 } }],
  df: [{ name: 'Tackling machine', desc: 'Everywhere on the field', ing: { tpg: 2, solo: 1 } }, { name: 'Disruptor', desc: 'Behind the line of scrimmage', ing: { tfl: 2, sck: 1.5, qbh: 1, stf: .5 } }, { name: 'Ball hawk', desc: 'Breaks up and takes passes', ing: { pd: 1.5, int: 2, inttd: 1 } }],
  tof: [{ name: 'Best offense', desc: 'Scores and moves the ball', ing: { ppg: 2, ypp: 1.5, thp: 1, give: -1 } }, { name: 'Air raid', desc: 'Lives on the forward pass', ing: { pyg: 2, ypa: 1.5, ptd: 1 } }, { name: 'Ground and pound', desc: 'Wins with the run', ing: { ryg: 2, ypc: 1.5, rtd: 1 } }],
  tdf: [{ name: 'Best defense', desc: 'Stops points and takes the ball', ing: { pag: -2, takeg: 1, sckg: 1 } }, { name: 'Lockdown secondary', desc: 'Nothing through the air', ing: { opyg: -2, ocmpp: -1, int: 1 } }, { name: 'Run stoppers', desc: 'Nothing on the ground', ing: { oryg: -2, oypc: -1.5 } }],
  tsp: [{ name: 'Kicking game', desc: 'Makes kicks and flips the field', ing: { fgp: 2, xpp: 1, pnet: 1 } }, { name: 'Returners', desc: 'Dangerous on returns', ing: { krav: 1.5, prav: 1.5, retd: 1 } }],
};
Object.assign(SPORT, {
  id: 'cfb', name: 'Saturday Index', first: 'Saturday', word: 'INDEX', short: 'CFB', accent: '#e8b931',
  seasons: { first: 2004, current: cfbCurrentSeason(), label: s => `${s}` },
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['games', 'Games'], ['today', 'Today'], ['watch', 'Watchlist'], ['teams', 'Teams']],
  unit: 'GAME',
  credit: 'Data: ESPN',
  footer: 'Not affiliated with or endorsed by the NCAA or any school or conference. Statistics and play-by-play come from ESPN’s public feeds.<br>Team logos are loaded from ESPN’s image host.',
  sourceNote: 'Sources: ESPN team season totals and play-by-play for FBS football, and ESPN’s passing, rushing, receiving and defensive leaderboards. ESPN’s bulk player table is empty for college football, so the player pool is the leaders in passing, rushing and receiving yards and touchdowns, receptions, tackles, sacks and interceptions (100 each), plus the top kickers, punters and returners, each read from the player’s own season line; percentiles compare players within their pool. The same team stats measured for opponents give each defense. Takeaways are the opponents’ interceptions plus the team’s own fumble recoveries; giveaways are the reverse. Points come from the standings.',
  searchHint: 'Type a player or team. Try “Jeremiah Smith”, “Ohio State” or “Oregon”.',
  headshot: id => `https://a.espncdn.com/i/headshots/college-football/players/full/${id}.png`,
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || '#667788',
  playerTag: p => CFB_POSNAME[p.pos] || p.pos || 'Player',
  teamFilters: [],  /* filled with the conferences when a season loads */
  loadSeason,
  heroCanvas: nflHero,
  home: {
    tag: 'DRIVES · DOWNS · YARDS // TEAM STATS AND PLAY-BY-PLAY REPLAY',
    blurb: 'Every FBS team and the top players at each position ranked, with any game replayed snap by snap on the field.',
    cards: [
      { href: '/stats/qb', title: 'Leaderboards', desc: 'Players and teams, sortable, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two players or teams side by side' },
      { href: '/games', title: 'Games', desc: 'Replay any game snap by snap with a win-probability line' },
    ],
    leaders: [
      { title: 'Passing yards', g: 'qb', k: 'pyds', f: 'int', qual: false }, { title: 'Rushing yards', g: 'rb', k: 'ryds', f: 'int', qual: false }, { title: 'Receiving yards', g: 'wr', k: 'recyds', f: 'int', qual: false },
      { title: 'Tackles', g: 'df', k: 'tot', f: 'int', qual: false }, { title: 'Points per game', g: 'tof', k: 'ppg', f: 'f1', qual: false }, { title: 'Points allowed per game', g: 'tdf', k: 'pag', f: 'f1', qual: false }, { title: 'Yards per play', g: 'tof', k: 'ypp', f: 'f2', qual: false },
      { title: 'Passing yards per game', g: 'tof', k: 'pyg', f: 'f1', qual: false }, { title: 'Rushing yards per game', g: 'tof', k: 'ryg', f: 'f1', qual: false }, { title: 'Sacks per game', g: 'tdf', k: 'sckg', f: 'f2', qual: false },
    ],
  },
});
/* The season is named for the year it starts, from August */
function cfbCurrentSeason() { const d = new Date(); return d.getFullYear() - (d.getMonth() >= 7 ? 0 : 1); }

SPORT.standings = {
  divOrder: [],  /* the power conferences first, set when a season loads */
  sort: s => s.cpct * 1000 + s.pct,
  cols: [
    { l: 'Conf', k: 'conf', desc: 'Conference record' }, { l: 'W', k: 'w' }, { l: 'L', k: 'l' }, { l: 'W%', k: 'pct', f: 'f3' }, { l: 'PF', k: 'pf' }, { l: 'PA', k: 'pa' }, { l: 'Diff', k: 'rdiff', f: 'sgi' },
    { l: 'Home', k: 'home' }, { l: 'Away', k: 'road' }, { l: 'Top 25', k: 'top25', desc: 'Record against AP top-25 teams' }, { l: 'Strk', k: 'streak' },
  ],
  scatter: { title: 'Offense vs defense', note: 'down and right is best', x: s => s.ppg, y: s => s.oppg, xlab: 'Points per game', ylab: 'Points allowed per game', dec: 1,
    tip: s => [['Record', `${s.w}-${s.l}`], ['PPG', fmt(s.ppg, 'f1')], ['Opp PPG', fmt(s.oppg, 'f1')], ['Margin', fmt(s.diff, 'sg1')]] },
};
SPORT.team = {
  tiles(D, id, st) {
    const o = D.tof.get(id) || {}, d = D.tdf.get(id) || {};
    return [['Record', `${st.w}-${st.l}`, NaN], ['W%', fmt(st.pct, 'f3'), pctile(D, 'tof', 'pct', st.pct)], ['PPG', fmt(o.ppg, 'f1'), pctile(D, 'tof', 'ppg', o.ppg)], ['PA/G', fmt(d.pag, 'f1'), pctile(D, 'tdf', 'pag', d.pag)], ['Pt diff/G', fmt(st.diff, 'sg1'), pctile(D, 'tof', 'diff', st.diff)], ['Yds/G', fmt(o.ypg, 'f1'), pctile(D, 'tof', 'ypg', o.ypg)], ['Y/play', fmt(o.ypp, 'f2'), pctile(D, 'tof', 'ypp', o.ypp)], ['TO diff', fmt(d.tod, 'sgi'), pctile(D, 'tdf', 'tod', d.tod)]];
  },
  rankText: (D, t, st) => st.dr ? `${ord(st.dr)} in ${t.div}` : t.div,
  pills: (D, t, st) => [st.home && `Home ${st.home}`, st.road && `Away ${st.road}`, st.conf && `Conf ${st.conf}`, st.top25 && `Top 25 ${st.top25}`].filter(Boolean),
  bars: [
    { title: 'Offense', g: 'tof', keys: ['ppg', 'ypg', 'ypp', 'pyg', 'ryg', 'cmpp', 'ypc', 'thp'] },
    { title: 'Defense', g: 'tdf', keys: ['pag', 'oypg', 'opyg', 'oryg', 'sckg', 'int', 'takeg', 'tod'] },
    { title: 'Special teams', g: 'tsp', keys: ['fgp', 'xpp', 'pnet', 'krav', 'prav', 'penpg'] },
  ],
  roster: [
    { g: 'qb', title: 'Quarterbacks', keys: ['gp', 'cmpp', 'pyds', 'ptd', 'pint', 'rtg', 'ryds'], sort: 'pyds' },
    { g: 'rb', title: 'Rushers', keys: ['gp', 'ratt', 'ryds', 'ypc', 'rtd', 'rec'], sort: 'ryds' },
    { g: 'wr', title: 'Receivers', keys: ['gp', 'rec', 'recyds', 'ypr', 'rctd'], sort: 'recyds' },
    { g: 'df', title: 'Defenders', keys: ['gp', 'tot', 'tfl', 'sck', 'int', 'pd'], sort: 'tot' },
    { g: 'k', title: 'Kickers', keys: ['gp', 'fgm', 'fga', 'fgp', 'f50', 'xpp', 'kpts'], sort: 'fgm' },
    { g: 'p', title: 'Punters', keys: ['gp', 'punts', 'pavg', 'pnet', 'in20'], sort: 'punts' },
    { g: 'kr', title: 'Returners', keys: ['gp', 'krn', 'krav', 'prn', 'prav', 'retyds'], sort: 'retyds' },
  ],
  arc: mkTeamArc('point'),
};
SPORT.player = {
  roles: (D, id) => ['qb', 'rb', 'wr', 'df', 'k', 'p', 'kr'].filter(g => D.maps[g]?.has(id)),
  roleName: { qb: 'QUARTERBACK', rb: 'RUSHER', wr: 'RECEIVER', df: 'DEFENDER', k: 'KICKER', p: 'PUNTER', kr: 'RETURNER' },
  roleLine: (role, r) => CFB_POSNAME[r.pos] || r.pos || 'Player',
  bioPills: (bio, r) => [r?.h && r?.wt ? `${r.h} · ${r.wt}` : r?.h, r?.exp, r?.jersey && `#${r.jersey}`].filter(Boolean),
  tiles: { qb: ['gp', 'cmpp', 'pyds', 'ptd', 'pint', 'rtg', 'ypa', 'ryds'], rb: ['gp', 'ratt', 'ryds', 'ypc', 'rtd', 'rec', 'recyds', 'scrim'], wr: ['gp', 'rec', 'recyds', 'ypr', 'rctd', 'recpg', 'yac', 'c1d'], df: ['gp', 'tot', 'solo', 'tfl', 'sck', 'int', 'pd', 'qbh'], k: ['gp', 'fgm', 'fga', 'fgp', 'f50', 'fgl', 'xpp', 'kpts'], p: ['gp', 'punts', 'pavg', 'pnet', 'plong', 'in20', 'in20p', 'pyd'], kr: ['gp', 'krn', 'krav', 'krtd', 'prn', 'prav', 'prtd', 'retyds'] },
  pct: { qb: ['pypg', 'cmpp', 'ypa', 'tdp', 'intp', 'rtg', 'ryds'], rb: ['rypg', 'ypc', 'rtd', 'rbig', 'rlng', 'recyds', 'scrimpg'], wr: ['recpg', 'recpg2', 'ypr', 'rctd', 'yac', 'cbig', 'c1d'], df: ['tpg', 'tfl', 'sck', 'qbh', 'hur', 'pd', 'int'], k: ['fgp', 'fgm', 'f50', 'fg40', 'fgl', 'xpp', 'kpts'], p: ['pavg', 'pnet', 'plong', 'in20', 'in20p'], kr: ['krav', 'prav', 'retyds', 'krlg', 'prlg', 'rettd'] },
  radar: { qb: CFB_RADAR.qb, rb: CFB_RADAR.rb, wr: CFB_RADAR.wr, df: CFB_RADAR.df, k: CFB_RADAR.k, p: CFB_RADAR.p, kr: CFB_RADAR.kr },
  tabs: [['overview', 'Overview'], ['stats', 'Stats'], ['log', 'Game log']],
  build: {
    log: mkGameLog({ form: {
      qb: { name: 'passingYards', label: 'passing yards', mode: 'mean', win: 3, fmt: 'f1' }, rb: { name: 'rushingYards', label: 'rushing yards', mode: 'mean', win: 3, fmt: 'f1' },
      wr: { name: 'receivingYards', label: 'receiving yards', mode: 'mean', win: 3, fmt: 'f1' }, df: { name: 'totalTackles', label: 'tackles', mode: 'mean', win: 3, fmt: 'f1' },
      k: { name: 'totalKickingPoints', label: 'kicking points', mode: 'mean', win: 3, fmt: 'f1' }, p: { name: 'grossAvgPuntYards', label: 'punt average', mode: 'mean', win: 3, fmt: 'f1' },
    } }),
  },
};
SPORT.compare = { tape: CFB_TAPE, radar: CFB_RADAR };
SPORT.lab = { recipes: CFB_RECIPES, ref: { k: 'fgp', p: 'pnet', kr: 'retyds', qb: 'pypg', rb: 'rypg', wr: 'recpg', df: 'tpg', tof: 'ppg', tdf: 'pag', tsp: 'fgp' }, plotDefaults: { k: ['fga', 'fgp'], p: ['pavg', 'pnet'], kr: ['krav', 'prav'], qb: ['ypa', 'cmpp'], rb: ['ratt', 'ypc'], wr: ['recpg2', 'ypr'], df: ['tfl', 'sck'], tof: ['ppg', 'ypp'], tdf: ['pag', 'takeg'], tsp: ['fgp', 'pnet'] } };
