/* config.js: the NHL sport definition */
const NHL_ROLE = {
  sk: { tab: 'Skaters', plural: 'Skaters', kind: 'player', thr: { field: 'gp', label: 'GP', loose: 5 }, situ: false,
    qual: (D, r) => r.gp >= D.q.sk, qualText: D => `≥${D.q.sk} GP`, posLabel: 'All positions',
    posOptions: () => ['F', 'C', 'W', 'D'], posMatch: (r, o) => o === 'F' ? r.pos !== 'D' : o === 'W' ? ['LW', 'RW', 'L', 'R'].includes(r.pos) : r.pos === o, roleOf: r => r.pos === 'D' ? 'D' : 'F' },
  gk: { tab: 'Goalies', plural: 'Goalies', kind: 'player', thr: { field: 'gp', label: 'GP', loose: 3 }, situ: false,
    qual: (D, r) => r.gp >= D.q.gk, qualText: D => `≥${D.q.gk} GP`, posLabel: 'All', posOptions: () => [], posMatch: () => true, roleOf: () => 'G' },
  tsk: { kind: 'team', tab: 'Team scoring', plural: 'Teams' },
  tgk: { kind: 'team', tab: 'Team defense', plural: 'Teams' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...NHL_ROLE[g] };

const NHL_TAPE = {
  sk: ['gp', 'toig', 'g', 'a', 'pts', 'ptsgp', 'pm', 'p60', 'g60', 's', 'sgp', 'shp', 'ppp', 'pim', 'fop'],
  gk: ['gp', 'w', 'l', 'otl', 'gaa', 'svp', 'gsaa', 'gsaa60', 'sa60', 'so'],
  tsk: ['pts', 'ptp', 'w', 'gf', 'gfgp', 'diff', 'sgp', 'shp', 'sshare', 'ppp', 'pimgp'],
  tgk: ['pts', 'ptp', 'ga', 'gagp', 'svp', 'sagp', 'sdiff', 'pkp', 'pdo', 'so'],
};
const NHL_RADAR = {
  sk: [['p60', 'P/60'], ['g60', 'G/60'], ['a60', 'A/60'], ['s60', 'S/60'], ['shp', 'Sh%'], ['toig', 'TOI'], ['ppp', 'PPP'], ['pm', '+/-']],
  gk: [['svp', 'Sv%'], ['gaa', 'GAA'], ['gsaa', 'GSAA'], ['gsaa60', 'GSAA/60'], ['wp', 'W%'], ['so', 'SO']],
  tsk: [['gfgp', 'GF/GP'], ['sgp', 'S/GP'], ['shp', 'Sh%'], ['ppp', 'PP%'], ['sshare', 'Shot share'], ['ptp', 'P%']],
  tgk: [['gagp', 'GA/GP'], ['svp', 'Sv%'], ['sagp', 'SA/GP'], ['pkp', 'PK%'], ['sdiff', 'Shot diff'], ['ptp', 'P%']],
};
const NHL_RECIPES = {
  sk: [
    { name: 'Scorer', desc: 'Puts the puck in the net, a lot', ing: { g60: 2, s60: 1, shp: 1, ggp: 1 } },
    { name: 'Playmaker', desc: 'Creates for others', ing: { a60: 2, ptsgp: 1, ppa: .5 } },
    { name: 'Complete forward', desc: 'Production, volume and usage', ing: { p60: 2, ptsgp: 1.5, toig: 1, s60: 1, pm: .5 } },
    { name: 'Power-play specialist', desc: 'Lives on the man advantage', ing: { ppp: 2, ppsh: 1, ppg: 1 } },
    { name: 'Even-strength driver', desc: 'Produces away from the power play', ing: { npp: 2, pm: 1, toig: .5 } },
    { name: 'Shooting luck', desc: 'High shooting % on few shots; due to cool off', ing: { shp: 2, s60: -1 } },
    { name: 'Workhorse', desc: 'Eats minutes and shifts', ing: { toig: 2, shft: 1, gp: .5 } },
  ],
  gk: [
    { name: 'Best goalie', desc: 'Results above what the shots deserve', ing: { gsaa: 2, svp: 2, gsaa60: 1, gaa: 1 } },
    { name: 'Workload', desc: 'Faces the most rubber', ing: { sa60: 1, toi: 1.5, gp: 1 } },
    { name: 'Winner', desc: 'Wins and shutouts', ing: { w: 1, wp: 2, so: 1 } },
  ],
};
SPORT.groupOrder = ['sk', 'gk', 'tsk', 'tgk'];
Object.assign(SPORT, {
  id: 'nhl', name: 'Ice Index', first: 'Ice', word: 'INDEX', short: 'NHL', accent: '#5cc8ff',
  seasons: { first: 2008, current: nhlCurrentSeason(), label: s => `${s - 1}-${String(s).slice(2)}` },
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['charts', 'Shot maps'], ['games', 'Games'], ['sim', 'Simulator'], ['odds', 'Odds'], ['teams', 'Teams']],
  unit: 'GAME',
  credit: 'Data: ESPN',
  footer: 'Not affiliated with or endorsed by the National Hockey League or any club. Statistics and play-by-play come from ESPN’s public feeds.<br>Player photos and team logos are loaded from ESPN’s image host.',
  sourceNote: 'Sources: ESPN season totals and play-by-play. Rates per 60 use total time on ice; GSAA compares each goalie with the league save percentage on the same shots. Shading: percentile among qualified players (red high, blue low; flipped where lower is better).',
  searchHint: 'Type a name. Try “McDavid”, “Hellebuyck” or “Oilers”.',
  headshot: id => `https://a.espncdn.com/i/headshots/nhl/players/full/${id}.png`,
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || '#667788',
  playerTag: p => p.pos === 'G' ? 'Goalie' : (NHL_POS[p.pos] || 'Skater'),
  teamFilters: [['East', 'Eastern Conference'], ['West', 'Western Conference']],
  loadSeason,
  heroCanvas: nhlHero,
  home: {
    tag: 'SHOTS · GOALS · ICE // PLAY-BY-PLAY COORDINATES',
    blurb: 'Every skater, goalie and team ranked against the league, with shot maps drawn from play-by-play coordinates.',
    cards: [
      { href: '/stats/sk', title: 'Leaderboards', desc: 'Skaters, goalies and teams, sortable, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two players or teams side by side' },
      { href: '/charts', title: 'Shot maps', desc: 'Where a team or player shoots from, and where goalies get beat' },
    ],
    leaders: [
      { title: 'Points', g: 'sk', k: 'pts', f: 'int', qual: false }, { title: 'Goals', g: 'sk', k: 'g', f: 'int', qual: false }, { title: 'Points per 60', g: 'sk', k: 'p60', f: 'f2' },
      { title: 'Goals saved above average', g: 'gk', k: 'gsaa', f: 'sg1' }, { title: 'Team goals per game', g: 'tsk', k: 'gfgp', f: 'f2', qual: false }, { title: 'Team goals against per game', g: 'tgk', k: 'gagp', f: 'f2', qual: false, asc: true },
    ],
  },
});
/* Which season is “current”: the new season starts counting in October */
function nhlCurrentSeason() { const d = new Date(); return d.getFullYear() + (d.getMonth() >= 9 ? 1 : 0); }

SPORT.standings = {
  divOrder: ['Atlantic', 'Metropolitan', 'Central', 'Pacific'],
  sort: s => s.pts + s.pct / 1000 + (s.rw || 0) / 1e6,
  cols: [
    { l: 'GP', k: 'gp' }, { l: 'W', k: 'w' }, { l: 'L', k: 'l' }, { l: 'OTL', k: 'otl' }, { l: 'PTS', k: 'pts' }, { l: 'P%', k: 'ptp', f: 'f3' }, { l: 'RW', k: 'rw' },
    { l: 'GF', k: 'gf' }, { l: 'GA', k: 'ga' }, { l: 'Diff', k: 'diff', f: 'sgi' }, { l: 'Home', k: 'home' }, { l: 'Away', k: 'road' }, { l: 'L10', k: 'l10' }, { l: 'Strk', k: 'streak' },
  ],
  scatter: { title: 'Offense vs defense', note: 'down and right is best', x: s => s.gf / s.gp, y: s => s.ga / s.gp, xlab: 'Goals for per game', ylab: 'Goals against per game', dec: 2,
    tip: s => [['Record', `${s.w}-${s.l}-${s.otl}`], ['Points', s.pts], ['GF/GP', (s.gf / s.gp).toFixed(2)], ['GA/GP', (s.ga / s.gp).toFixed(2)]] },
};
SPORT.team = {
  tiles(D, id, st) {
    const t = D.tsk.get(id) || {};
    return [['Record', `${st.w}-${st.l}-${st.otl}`, NaN], ['Points', st.pts, pctile(D, 'tsk', 'pts', st.pts)], ['P%', fmt(st.ptp, 'f3'), pctile(D, 'tsk', 'ptp', st.ptp)], ['GF/GP', fmt(t.gfgp, 'f2'), pctile(D, 'tsk', 'gfgp', t.gfgp)], ['GA/GP', fmt(t.gagp, 'f2'), pctile(D, 'tgk', 'gagp', t.gagp)], ['Goal diff', fmt(st.diff, 'sgi'), pctile(D, 'tsk', 'diff', st.diff)], ['PP%', fmt(t.ppp, 'f1'), pctile(D, 'tsk', 'ppp', t.ppp)], ['PK%', fmt(t.pkp, 'f1'), pctile(D, 'tgk', 'pkp', t.pkp)]];
  },
  rankText: (D, t, st) => st.dr ? `${ord(st.dr)} in ${t.div}` : t.div,
  pills: (D, t, st) => [st.home && `Home ${st.home}`, st.road && `Away ${st.road}`, st.l10 && `L10 ${st.l10}`].filter(Boolean),
  bars: [
    { title: 'Scoring', g: 'tsk', keys: ['gfgp', 'sgp', 'shp', 'sshare', 'ppp', 'ppopg', 'diffgp', 'ptp'] },
    { title: 'Prevention', g: 'tgk', keys: ['gagp', 'sagp', 'svp', 'sdiff', 'pkp', 'pdo', 'so', 'pimgp'] },
  ],
  roster: [
    { g: 'sk', title: 'Skaters', keys: ['gp', 'toig', 'g', 'a', 'pts', 'pm', 'p60', 's60', 'shp', 'ppp'], sort: 'pts' },
    { g: 'gk', title: 'Goalies', keys: ['gp', 'w', 'l', 'otl', 'gaa', 'svp', 'gsaa', 'so'], sort: 'gp' },
  ],
  arc: mkTeamArc('goal'),
};
const NHL_LOG_COLS = { sk: ['goals', 'assists', 'points', 'plusMinus', 'penaltyMinutes', 'shotsTotal', 'powerPlayGoals', 'powerPlayAssists', 'timeOnIcePerGame'] };
SPORT.player = {
  roles: (D, id) => D.sk.has(id) ? ['sk'] : D.gk.has(id) ? ['gk'] : [],
  bio: ESPN_BIO,
  roleName: { sk: 'SKATER', gk: 'GOALIE' },
  roleLine: (role, r) => NHL_POS[r.pos] || (role === 'gk' ? 'Goalie' : 'Skater'),
  bioPills: (bio, r) => [bio?.h && `${bio.h} · ${bio.w}`, r?.age && `Age ${r.age}`, bio?.hand && `${r?.pos === 'G' ? 'Catches' : 'Shoots'} ${bio.hand}`, bio?.jersey, bio?.draft && `Draft ${bio.draft}`].filter(Boolean),
  tiles: { sk: ['gp', 'g', 'a', 'pts', 'pm', 'toig', 'shp', 'p60'], gk: ['gp', 'w', 'gaa', 'svp', 'gsaa', 'so', 'sa60', 'toi'] },
  pct: { sk: ['pts', 'ptsgp', 'p60', 'g60', 'a60', 's60', 'shp', 'ppp', 'pm', 'toig', 'fop'], gk: ['svp', 'gaa', 'gsaa', 'gsaa60', 'sa60', 'w', 'so'] },
  radar: { sk: NHL_RADAR.sk, gk: NHL_RADAR.gk },
  tabs: [['overview', 'Overview'], ['stats', 'Stats'], ['splits', 'Splits'], ['log', 'Game log'], ['shots', 'Shot map']],
  build: {
    splits: mkSplits(),
    log: mkGameLog({ cols: NHL_LOG_COLS, form: { sk: { name: 'points', label: 'points', mode: 'sum', win: 10 }, gk: { name: 'savePct', label: 'save %', mode: 'mean', win: 5, fmt: 'f3' } } }),
    shots: ({ D, id, role }) => { const host = h('div', {}); shotExplorer(D, { kind: 'player', id, role }, host); return host; },
  },
  seasonsPlayed: async id => (await ESPN_CAREER(id))[0]?.rows.map(r => r.season).filter(Boolean) || [],
  career: mkCareer((cats, role) => cats[0]),
  arc: mkMonthArc({ sk: { name: 'points', label: 'Points per game', mode: 'mean', fmt: 'f2' }, gk: { name: 'savePct', label: 'Save %', mode: 'mean', fmt: 'f3' } }),
};
SPORT.compare = { tape: NHL_TAPE, radar: NHL_RADAR };
SPORT.lab = { recipes: NHL_RECIPES, ref: { sk: 'pts', gk: 'gsaa' }, plotDefaults: { sk: ['s60', 'shp'], gk: ['sa60', 'svp'], tsk: ['gfgp', 'sgp'], tgk: ['gagp', 'sagp'] } };
