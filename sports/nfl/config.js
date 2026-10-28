/* config.js: the NFL sport definition */
const NFL_LOOSE = { qb: ['att', 'ATT', 40], rb: ['att', 'ATT', 15], rec: ['tgt', 'TGT', 10], def: ['gp', 'GP', 2], k: ['fga', 'FGA', 3], p: ['punts', 'PUNTS', 8] };
const NFL_POSOPT = { qb: [], rb: ['RB', 'FB', 'QB', 'WR'], rec: ['WR', 'TE', 'RB'], def: ['DL', 'LB', 'DB'], k: [], p: [] };
const NFL_POSMATCH = { DL: ['DE', 'DT', 'NT'], LB: ['LB', 'ILB', 'OLB', 'MLB'], DB: ['CB', 'S', 'FS', 'SS', 'DB'] };
const NFL_ROLE = {};
for (const g of ['qb', 'rb', 'rec', 'def', 'k', 'p']) {
  const [f, lb, lo] = NFL_LOOSE[g], tot = { qb: 'qb', rb: 'rb', rec: 'rec' }[g];
  NFL_ROLE[g] = { tab: GROUP_META[g].label, plural: GROUP_META[g].label, kind: 'player', thr: { field: f, label: lb, loose: lo }, situ: false,
    qual: (D, r) => r[f] >= D.q[g], qualText: D => `≥${D.q[g]} ${lb}`, posLabel: 'All positions', posOptions: () => NFL_POSOPT[g],
    posMatch: (r, o) => (NFL_POSMATCH[o] || [o]).includes(r.pos), roleOf: r => g.toUpperCase() };
}
NFL_ROLE.tof = { kind: 'team', tab: 'Team offense', plural: 'Teams' }; NFL_ROLE.tdf = { kind: 'team', tab: 'Team defense', plural: 'Teams' };
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...NFL_ROLE[g] };

const NFL_TAPE = {
  qb: ['gp', 'att', 'cmpp', 'yds', 'ypg', 'ypa', 'anya', 'td', 'int', 'tdp', 'intp', 'sckp', 'rtg', 'qbr'],
  rb: ['gp', 'att', 'yds', 'ypg', 'ypc', 'td', 'fdp', 'bigp', 'lng', 'fumr'],
  rec: ['gp', 'tgt', 'rec', 'yds', 'ypg', 'ypr', 'catch', 'ypt', 'yac', 'td', 'big'],
  def: ['gp', 'tkl', 'solo', 'tfl', 'sck', 'pd', 'int', 'ff', 'fr', 'dtd'],
  k: ['gp', 'fgm', 'fga', 'fgp', 'lng', 'm50', 'f40', 'xpp', 'pts'],
  p: ['gp', 'punts', 'avg', 'net', 'lng', 'in20p', 'tbp', 'blk'],
  tof: ['w', 'l', 'ppg', 'ypg', 'ypp', 'pyg', 'ryg', 'cmpp', 'ypc', 'thp', 'give', 'sck'],
  tdf: ['w', 'l', 'pag', 'sck', 'tfl', 'pd', 'int', 'take', 'tod'],
};
const NFL_RADAR = {
  qb: [['ypa', 'Y/A'], ['cmpp', 'CMP%'], ['anya', 'ANY/A'], ['tdp', 'TD%'], ['intp', 'INT%'], ['sckp', 'SACK%'], ['ypg', 'YDS/G']],
  rb: [['ypg', 'YDS/G'], ['ypc', 'Y/C'], ['fdp', '1D%'], ['bigp', '20+ %'], ['tdp', 'TD%'], ['attg', 'ATT/G']],
  rec: [['ypg', 'YDS/G'], ['tgtg', 'TGT/G'], ['catch', 'CATCH%'], ['ypt', 'Y/TGT'], ['yacr', 'YAC/R'], ['ypr', 'Y/R']],
  def: [['tklg', 'TKL/G'], ['tflg', 'TFL/G'], ['sckg', 'SACK/G'], ['pdg', 'PD/G'], ['tk', 'TKAWAY'], ['ff', 'FF']],
  k: [['fgp', 'FG%'], ['f40', '40-49%'], ['f50', '50+%'], ['xpp', 'XP%'], ['lng', 'LNG'], ['ptsg', 'PTS/G']],
  p: [['avg', 'AVG'], ['net', 'NET'], ['in20p', 'IN 20%'], ['tbp', 'TB%'], ['lng', 'LNG']],
  tof: [['ppg', 'PPG'], ['ypp', 'Y/PLAY'], ['pyg', 'PASS YD/G'], ['ryg', 'RUSH YD/G'], ['thp', '3RD%'], ['give', 'Giveaways']],
  tdf: [['pag', 'PA/G'], ['sckg', 'SACK/G'], ['takeg', 'TAKE/G'], ['pd', 'PD'], ['tfl', 'TFL'], ['tod', 'TO diff']],
};
const NFL_RECIPES = {
  qb: [
    { name: 'Efficient passer', desc: 'Moves the chains without mistakes', ing: { anya: 2, cmpp: 1, tdp: 1, intp: -1, sckp: -.5 } },
    { name: 'Gunslinger', desc: 'Pushes the ball downfield', ing: { ypa: 2, ypc: 1, att: .5, lng: .5 } },
    { name: 'Caretaker', desc: 'Protects the football', ing: { intp: -2, sckp: -1, cmpp: 1 } },
    { name: 'Volume thrower', desc: 'Lots of yards and attempts', ing: { yds: 2, att: 1.5, td: 1 } },
  ],
  rb: [
    { name: 'Workhorse', desc: 'Carries the load', ing: { att: 2, yds: 2, ypg: 1, td: 1 } },
    { name: 'Explosive', desc: 'Breaks long runs', ing: { bigp: 2, ypc: 1.5, lng: 1 } },
    { name: 'Chain mover', desc: 'Turns carries into first downs and scores', ing: { fdp: 2, tdp: 1, ypc: .5 } },
    { name: 'Ball security', desc: 'Rarely fumbles', ing: { fumr: -2, att: .5 } },
  ],
  rec: [
    { name: 'Alpha', desc: 'Target hog who produces', ing: { tgtg: 2, ypg: 2, td: 1 } },
    { name: 'Deep threat', desc: 'Big yards per catch', ing: { ypr: 2, big: 1.5, lng: 1 } },
    { name: 'Reliable hands', desc: 'Catches what comes his way', ing: { catch: 2, ypt: 1, fd: 1 } },
    { name: 'After the catch', desc: 'Creates once the ball arrives', ing: { yacr: 2, yac: 1 } },
  ],
  def: [
    { name: 'Pass rusher', desc: 'Lives in the backfield', ing: { sckg: 2, tflg: 1.5, ff: 1 } },
    { name: 'Playmaker', desc: 'Takeaways and touchdowns', ing: { tk: 2, pdg: 1, dtd: 1.5 } },
    { name: 'Tackling machine', desc: 'Always around the ball', ing: { tklg: 2, solo: 1.5 } },
    { name: 'Coverage', desc: 'Breaks up passes', ing: { pdg: 2, int: 1.5 } },
  ],
  k: [{ name: 'Accurate', desc: 'Makes what he should', ing: { fgp: 2, xpp: 1, f40: 1 } }, { name: 'Leg', desc: 'Range and power', ing: { f50: 1.5, m50: 1.5, lng: 1 } }],
  p: [{ name: 'Field flipper', desc: 'Pins offenses deep', ing: { net: 2, in20p: 1.5, tbp: -1 } }],
  tof: [{ name: 'Best offense', desc: 'Scores and moves the ball', ing: { ppg: 2, ypp: 1.5, thp: 1, give: -1 } }],
  tdf: [{ name: 'Best defense', desc: 'Stops points and takes the ball', ing: { pag: -2, takeg: 1, sckg: 1 } }],
};
SPORT.groupOrder = ['qb', 'rb', 'rec', 'def', 'k', 'p', 'tof', 'tdf'];
Object.assign(SPORT, {
  id: 'nfl', name: 'Gridiron Index', first: 'Gridiron', word: 'INDEX', short: 'NFL', accent: '#3fbf6f',
  seasons: { first: 2012, current: nflCurrentSeason(), label: s => `${s}` },
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['charts', 'Tendencies'], ['teams', 'Teams']],
  unit: 'GAME',
  credit: 'Data: ESPN',
  footer: 'Not affiliated with or endorsed by the National Football League or any club. Statistics and play-by-play come from ESPN’s public feeds.<br>Player photos and team logos are loaded from ESPN’s image host.',
  sourceNote: 'Sources: ESPN season totals and play-by-play. Team defense sums individual defenders’ stats (a traded player counts for his current team) and uses points allowed from the standings. Success rate: 40% of yards to go on 1st down, 60% on 2nd, 100% on 3rd and 4th. Shading: percentile among qualified players (red high, blue low; flipped where lower is better).',
  searchHint: 'Type a name. Try “Mahomes”, “Henry” or “Packers”.',
  headshot: id => `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`,
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || '#667788',
  playerTag: p => NFL_POS[p.pos] || 'Player',
  teamFilters: [['AFC', 'American Football Conference'], ['NFC', 'National Football Conference']],
  loadSeason,
  heroCanvas: nflHero,
  home: {
    tag: 'DOWNS · DRIVES · YARDS // PLAY-BY-PLAY TENDENCIES',
    blurb: 'Every passer, rusher, receiver, defender and team ranked against the league, with tendencies drawn from play-by-play.',
    cards: [
      { href: '/stats/qb', title: 'Leaderboards', desc: 'Passing, rushing, receiving, defense, kicking and teams' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two players or teams side by side' },
      { href: '/charts', title: 'Tendencies', desc: 'Run and pass splits by down, distance, field position and gap' },
    ],
    leaders: [
      { title: 'Passing yards', g: 'qb', k: 'yds', f: 'int', qual: false }, { title: 'Passer ANY/A', g: 'qb', k: 'anya', f: 'f2' }, { title: 'Rushing yards', g: 'rb', k: 'yds', f: 'int', qual: false },
      { title: 'Receiving yards', g: 'rec', k: 'yds', f: 'int', qual: false }, { title: 'Sacks', g: 'def', k: 'sck', f: 'f1', qual: false }, { title: 'Team points per game', g: 'tof', k: 'ppg', f: 'f1', qual: false },
    ],
  },
});
/* The NFL season is named for the year it starts, from September */
function nflCurrentSeason() { const d = new Date(); return d.getFullYear() - (d.getMonth() >= 8 ? 0 : 1); }

SPORT.standings = {
  divOrder: ['AFC East', 'AFC North', 'AFC South', 'AFC West', 'NFC East', 'NFC North', 'NFC South', 'NFC West'],
  sort: s => s.pct + (s.diff || 0) / 1e4,
  cols: [
    { l: 'W', k: 'w' }, { l: 'L', k: 'l' }, { l: 'T', k: 't' }, { l: 'W%', k: 'pct', f: 'f3' }, { l: 'PF', k: 'pf' }, { l: 'PA', k: 'pa' }, { l: 'Diff', k: 'rdiff', f: 'sgi' },
    { l: 'Home', k: 'home' }, { l: 'Away', k: 'road' }, { l: 'Div', k: 'divrec' }, { l: 'Conf', k: 'conf' }, { l: 'Strk', k: 'streak' },
  ],
  scatter: { title: 'Offense vs defense', note: 'down and right is best', x: s => s.ppg, y: s => s.oppg, xlab: 'Points per game', ylab: 'Points allowed per game', dec: 1,
    tip: s => [['Record', `${s.w}-${s.l}${s.t ? '-' + s.t : ''}`], ['PPG', fmt(s.ppg, 'f1')], ['Opp PPG', fmt(s.oppg, 'f1')], ['Margin', fmt(s.diff, 'sg1')]] },
};
SPORT.team = {
  tiles(D, id, st) {
    const o = D.tof.get(id) || {}, d = D.tdf.get(id) || {};
    return [['Record', `${st.w}-${st.l}${st.t ? '-' + st.t : ''}`, NaN], ['W%', fmt(st.pct, 'f3'), pctile(D, 'tof', 'pct', st.pct)], ['PPG', fmt(o.ppg, 'f1'), pctile(D, 'tof', 'ppg', o.ppg)], ['PA/G', fmt(d.pag, 'f1'), pctile(D, 'tdf', 'pag', d.pag)], ['Pt diff/G', fmt(st.diff, 'sg1'), pctile(D, 'tof', 'diff', st.diff)], ['Yds/G', fmt(o.ypg, 'f1'), pctile(D, 'tof', 'ypg', o.ypg)], ['Y/play', fmt(o.ypp, 'f2'), pctile(D, 'tof', 'ypp', o.ypp)], ['TO diff', fmt(d.tod, 'sgi'), pctile(D, 'tdf', 'tod', d.tod)]];
  },
  rankText: (D, t, st) => st.dr ? `${ord(st.dr)} in ${t.div}` : t.div,
  pills: (D, t, st) => [st.home && `Home ${st.home}`, st.road && `Away ${st.road}`, st.divrec && `Div ${st.divrec}`].filter(Boolean),
  bars: [
    { title: 'Offense', g: 'tof', keys: ['ppg', 'ypg', 'ypp', 'pyg', 'ryg', 'cmpp', 'ypc', 'thp'] },
    { title: 'Defense', g: 'tdf', keys: ['pag', 'sckg', 'tfl', 'pd', 'int', 'takeg', 'tod'] },
  ],
  roster: [
    { g: 'qb', title: 'Passing', keys: ['gp', 'att', 'cmpp', 'yds', 'ypa', 'td', 'int', 'rtg'], sort: 'yds' },
    { g: 'rb', title: 'Rushing', keys: ['gp', 'att', 'yds', 'ypc', 'td', 'lng'], sort: 'yds' },
    { g: 'rec', title: 'Receiving', keys: ['gp', 'tgt', 'rec', 'yds', 'ypr', 'td', 'catch'], sort: 'yds' },
    { g: 'def', title: 'Defense', keys: ['gp', 'tkl', 'tfl', 'sck', 'pd', 'int', 'ff'], sort: 'tkl' },
  ],
  arc: mkTeamArc('point'),
};
const NFL_CAREER = { qb: /passing/, rb: /rushing/, rec: /receiving/, def: /defensive/, k: /kicking/, p: /punting/ };
const NFL_FORM = { qb: { name: 'passingYards', label: 'passing yards', mode: 'mean', win: 4, fmt: 'int' }, rb: { name: 'rushingYards', label: 'rushing yards', mode: 'mean', win: 4, fmt: 'int' }, rec: { name: 'receivingYards', label: 'receiving yards', mode: 'mean', win: 4, fmt: 'int' }, def: { name: 'totalTackles', label: 'tackles', mode: 'mean', win: 4, fmt: 'f1' }, k: { name: 'fieldGoalsMade', label: 'field goals', mode: 'mean', win: 4, fmt: 'f1' }, p: { name: 'punts', label: 'punts', mode: 'mean', win: 4, fmt: 'f1' } };
SPORT.player = {
  roles: (D, id) => {
    const t = { qb: D.qb.get(id)?.att >= 10, rb: D.rb.get(id)?.att >= 8, rec: (D.rec.get(id)?.tgt || 0) >= 5, def: D.def.has(id), k: D.k.has(id), p: D.p.has(id) };
    const all = ['qb', 'rb', 'rec', 'def', 'k', 'p'].filter(g => D[g].has(id)), good = all.filter(g => t[g]);
    return good.length ? good : all.slice(0, 1);
  },
  bio: ESPN_BIO,
  roleName: { qb: 'PASSING', rb: 'RUSHING', rec: 'RECEIVING', def: 'DEFENSE', k: 'KICKING', p: 'PUNTING' },
  roleLine: (role, r) => NFL_POS[r.pos] || 'Player',
  bioPills: (bio, r) => [bio?.h && `${bio.h} · ${bio.w}`, r?.age && `Age ${r.age}`, bio?.jersey, bio?.exp, bio?.draft && `Draft ${bio.draft}`].filter(Boolean),
  tiles: { qb: ['gp', 'cmpp', 'yds', 'td', 'int', 'ypa', 'rtg', 'anya'], rb: ['gp', 'att', 'yds', 'ypc', 'td', 'lng', 'fdp', 'ypg'], rec: ['gp', 'tgt', 'rec', 'yds', 'td', 'ypr', 'catch', 'ypg'], def: ['gp', 'tkl', 'tfl', 'sck', 'pd', 'int', 'ff', 'fr'], k: ['gp', 'fgm', 'fga', 'fgp', 'lng', 'xpp', 'pts', 'm50'], p: ['gp', 'punts', 'avg', 'net', 'lng', 'in20', 'tb', 'blk'] },
  pct: { qb: ['yds', 'cmpp', 'ypa', 'anya', 'tdp', 'intp', 'sckp', 'rtg', 'qbr'], rb: ['yds', 'ypg', 'ypc', 'fdp', 'bigp', 'tdp', 'fumr'], rec: ['yds', 'ypg', 'tgtg', 'catch', 'ypt', 'yacr', 'ypr', 'tdt'], def: ['tklg', 'tflg', 'sckg', 'pdg', 'int', 'ff', 'tk'], k: ['fgp', 'f40', 'f50', 'xpp', 'lng', 'ptsg'], p: ['avg', 'net', 'in20p', 'tbp', 'lng'] },
  radar: NFL_RADAR,
  tabs: [['overview', 'Overview'], ['stats', 'Stats'], ['splits', 'Splits'], ['log', 'Game log'], ['plays', 'Plays']],
  tabFilter: (D, id, role) => role === 'qb' || role === 'rb' || role === 'rec',
  build: {
    splits: mkSplits(),
    log: mkGameLog({ form: NFL_FORM }),
    plays: ({ D, id, role }) => { const host = h('div', {}); if (!['qb', 'rb', 'rec'].includes(role)) { mount(host, h('div', { class: 'panel empty' }, 'Play tendencies are available for passers, rushers and receivers.')); return host; } playExplorer(D, { kind: 'player', id, role }, host); return host; },
  },
  seasonsPlayed: async id => (await ESPN_CAREER(id))[0]?.rows.map(r => r.season).filter(Boolean) || [],
  career: mkCareer((cats, role) => cats.find(c => NFL_CAREER[role]?.test((c.name || '').toLowerCase())) || cats[0]),
  arc: mkMonthArc({ qb: { name: 'passingYards', label: 'Passing yards per game', mode: 'mean', fmt: 'int' }, rb: { name: 'rushingYards', label: 'Rushing yards per game', mode: 'mean', fmt: 'int' }, rec: { name: 'receivingYards', label: 'Receiving yards per game', mode: 'mean', fmt: 'int' }, def: { name: 'totalTackles', label: 'Tackles per game', mode: 'mean', fmt: 'f1' } }),
};
SPORT.compare = { tape: NFL_TAPE, radar: NFL_RADAR };
SPORT.lab = { recipes: NFL_RECIPES, ref: { qb: 'yds', rb: 'yds', rec: 'yds', def: 'tkl', k: 'pts', p: 'net', tof: 'ppg', tdf: 'pag' },
  plotDefaults: { qb: ['att', 'anya'], rb: ['att', 'ypc'], rec: ['tgtg', 'ypt'], def: ['tklg', 'sckg'], k: ['fga', 'fgp'], p: ['avg', 'in20p'], tof: ['ppg', 'ypp'], tdf: ['pag', 'takeg'] } };
