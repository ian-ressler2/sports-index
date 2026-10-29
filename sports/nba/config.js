/* config.js: the NBA sport definition */
const NBA_ROLE = {
  pl: { tab: 'Players', plural: 'Players', kind: 'player', thr: { field: 'gp', label: 'GP', loose: 10 }, situ: false,
    qual: (D, r) => r.gp >= D.q.pl, qualText: D => `≥${D.q.pl} GP`, posLabel: 'All positions',
    posOptions: () => ['G', 'F', 'C'], posMatch: (r, o) => o === 'G' ? /G/.test(r.pos) : o === 'F' ? /F/.test(r.pos) : /C/.test(r.pos), roleOf: r => r.pos || 'F' },
  tof: { kind: 'team', tab: 'Team offense', plural: 'Teams' },
  tdf: { kind: 'team', tab: 'Team defense', plural: 'Teams' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...NBA_ROLE[g] };

const NBA_TAPE = {
  pl: ['gp', 'mpg', 'ppg', 'rpg', 'apg', 'spg', 'bpg', 'topg', 'fgp', 'tpp', 'ftp', 'ts', 'efg', 'usg', 'eff'],
  tof: ['w', 'l', 'pct', 'diff', 'ppg', 'ortg', 'pace', 'efg', 'tovp', 'orebp', 'ftr', 'tpar'],
  tdf: ['w', 'l', 'pct', 'oppg', 'drtg', 'net', 'oefg', 'otovp', 'drebp', 'spg', 'bpg'],
};
const NBA_RADAR = {
  pl: [['ppg', 'PPG'], ['rpg', 'RPG'], ['apg', 'APG'], ['stocks', 'Stocks'], ['ts', 'TS%'], ['usg', 'USG%'], ['tpmpg', '3PM'], ['astto', 'AST/TO']],
  tof: [['ortg', 'ORtg'], ['efg', 'eFG%'], ['tovp', 'TOV%'], ['orebp', 'OREB%'], ['ftr', 'FT rate'], ['pace', 'Pace']],
  tdf: [['drtg', 'DRtg'], ['oefg', 'Opp eFG%'], ['otovp', 'Opp TOV%'], ['drebp', 'DREB%'], ['oftr', 'Opp FT rate'], ['net', 'NetRtg']],
};
const NBA_RECIPES = {
  pl: [
    { name: 'Scorer', desc: 'Volume and efficiency', ing: { ppg: 2, ts: 1.5, usg: 1, fgapg: .5 } },
    { name: 'Playmaker', desc: 'Creates for others without turning it over', ing: { apg: 2, astp: 1.5, astto: 1, topg: -.5 } },
    { name: 'Rim protector', desc: 'Blocks, boards and efficiency inside', ing: { bpg: 2, rebp: 1.5, fgp: 1 } },
    { name: 'Three-and-D', desc: 'Spaces the floor and gets stops', ing: { tpmpg: 1.5, tpp: 1, spg: 1, stocks: 1 } },
    { name: 'Efficiency king', desc: 'Scores a lot on few possessions', ing: { ts: 2, efg: 1.5, ftr: .5 } },
    { name: 'Glass cleaner', desc: 'Dominates the boards', ing: { rpg: 2, rebp: 2, reb36: 1 } },
    { name: 'Per-minute star', desc: 'Impact when on the floor', ing: { pts36: 1.5, reb36: 1, ast36: 1, tov36: -.5 } },
    { name: 'Workhorse', desc: 'Plays heavy minutes', ing: { mpg: 2, gp: 1, usg: .5 } },
  ],
  tof: [{ name: 'Best offense', desc: 'Efficient and sustainable', ing: { ortg: 2, efg: 1.5, tovp: -1 } }],
  tdf: [{ name: 'Best defense', desc: 'Forces misses and turnovers', ing: { drtg: -2, oefg: -1.5, otovp: 1 } }],
};
SPORT.groupOrder = ['pl', 'tof', 'tdf'];
Object.assign(SPORT, {
  id: 'nba', name: 'Court Index', first: 'Court', word: 'INDEX', short: 'NBA', accent: '#ff6b57',
  seasons: { first: 2008, current: nbaCurrentSeason(), label: s => `${s - 1}-${String(s).slice(2)}` },
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['charts', 'Shot charts'], ['games', 'Games'], ['today', 'Today'], ['sim', 'Simulator'], ['odds', 'Odds'], ['watch', 'Watchlist'], ['teams', 'Teams']],
  unit: 'GAME',
  credit: 'Data: ESPN',
  footer: 'Not affiliated with or endorsed by the National Basketball Association or any club. Statistics and play-by-play come from ESPN’s public feeds.<br>Player photos and team logos are loaded from ESPN’s image host.',
  sourceNote: 'Sources: ESPN season totals and play-by-play. TS%, eFG%, rates and per-36 figures are derived from totals; USG%, AST% and REB% are estimated from team totals (a player traded mid-season is measured against his current team only). Shading: percentile among qualified players (red high, blue low; flipped where lower is better).',
  searchHint: 'Type a name. Try “Jokic”, “Wembanyama” or “Celtics”.',
  headshot: id => `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`,
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || '#667788',
  playerTag: p => NBA_POS[p.pos] || 'Player',
  teamFilters: [['East', 'Eastern Conference'], ['West', 'Western Conference']],
  loadSeason,
  heroCanvas: nbaHero,
  home: {
    tag: 'SHOTS · RATES · COURT // PLAY-BY-PLAY COORDINATES',
    blurb: 'Every player and team ranked against the league, with shot charts drawn from play-by-play coordinates.',
    cards: [
      { href: '/stats/pl', title: 'Leaderboards', desc: 'Players and teams, sortable, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two players or teams side by side' },
      { href: '/charts', title: 'Shot charts', desc: 'Where a team or player shoots from, by zone and type' },
    ],
    leaders: [
      { title: 'Points per game', g: 'pl', k: 'ppg', f: 'f1' }, { title: 'Rebounds per game', g: 'pl', k: 'rpg', f: 'f1' }, { title: 'Assists per game', g: 'pl', k: 'apg', f: 'f1' },
      { title: 'True shooting %', g: 'pl', k: 'ts', f: 'f1' }, { title: 'Team offensive rating', g: 'tof', k: 'ortg', f: 'f1', qual: false }, { title: 'Team defensive rating', g: 'tdf', k: 'drtg', f: 'f1', qual: false, asc: true },
    ],
  },
});
/* The new season starts counting in October */
function nbaCurrentSeason() { const d = new Date(); return d.getFullYear() + (d.getMonth() >= 9 ? 1 : 0); }

SPORT.standings = {
  divOrder: ['Atlantic', 'Central', 'Southeast', 'Northwest', 'Pacific', 'Southwest'],
  sort: s => s.pct,
  cols: [
    { l: 'W', k: 'w' }, { l: 'L', k: 'l' }, { l: 'W%', k: 'pct', f: 'f3' }, { l: 'GB', k: 'gb' }, { l: 'PPG', k: 'ppg', f: 'f1' }, { l: 'Opp', k: 'oppg', f: 'f1' }, { l: 'Diff', k: 'diff', f: 'sg1' },
    { l: 'Home', k: 'home' }, { l: 'Away', k: 'road' }, { l: 'Conf', k: 'conf' }, { l: 'L10', k: 'l10' }, { l: 'Strk', k: 'streak' },
  ],
  scatter: { title: 'Offense vs defense', note: 'down and right is best', x: s => s.ppg, y: s => s.oppg, xlab: 'Points per game', ylab: 'Points allowed per game', dec: 1,
    tip: s => [['Record', `${s.w}-${s.l}`], ['PPG', fmt(s.ppg, 'f1')], ['Opp PPG', fmt(s.oppg, 'f1')], ['Margin', fmt(s.diff, 'sg1')]] },
};
SPORT.team = {
  tiles(D, id, st) {
    const o = D.tof.get(id) || {};
    return [['Record', `${st.w}-${st.l}`, NaN], ['W%', fmt(st.pct, 'f3'), pctile(D, 'tof', 'pct', st.pct)], ['Net pts/G', fmt(o.diff, 'sg1'), pctile(D, 'tof', 'diff', o.diff)], ['ORtg', fmt(o.ortg, 'f1'), pctile(D, 'tof', 'ortg', o.ortg)], ['DRtg', fmt(o.drtg, 'f1'), pctile(D, 'tdf', 'drtg', o.drtg)], ['NetRtg', fmt(o.net, 'sg1'), pctile(D, 'tdf', 'net', o.net)], ['Pace', fmt(o.pace, 'f1'), pctile(D, 'tof', 'pace', o.pace)], ['eFG%', fmt(o.efg, 'f1'), pctile(D, 'tof', 'efg', o.efg)]];
  },
  rankText: (D, t, st) => st.dr ? `${ord(st.dr)} in ${t.div}` : t.div,
  pills: (D, t, st) => [st.home && `Home ${st.home}`, st.road && `Away ${st.road}`, st.l10 && `L10 ${st.l10}`].filter(Boolean),
  bars: [
    { title: 'Offense', g: 'tof', keys: ['ppg', 'ortg', 'efg', 'tpar', 'tpp', 'tovp', 'orebp', 'ftr'] },
    { title: 'Defense', g: 'tdf', keys: ['oppg', 'drtg', 'oefg', 'otpp', 'otovp', 'drebp', 'spg', 'bpg'] },
  ],
  roster: [
    { g: 'pl', title: 'Players', keys: ['gp', 'mpg', 'ppg', 'rpg', 'apg', 'fgp', 'tpp', 'ts', 'usg'], sort: 'ppg' },
  ],
  arc: mkTeamArc('point'),
};
const NBA_LOG_COLS = { pl: ['minutes', 'points', 'totalRebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls', 'plusMinus'] };
SPORT.player = {
  roles: (D, id) => D.pl.has(id) ? ['pl'] : [],
  bio: ESPN_BIO,
  roleName: { pl: 'PLAYER' },
  roleLine: (role, r) => NBA_POS[r.pos] || 'Player',
  bioPills: (bio, r) => [bio?.h && `${bio.h} · ${bio.w}`, r?.age && `Age ${r.age}`, bio?.jersey, bio?.draft && `Draft ${bio.draft}`].filter(Boolean),
  tiles: { pl: ['gp', 'mpg', 'ppg', 'rpg', 'apg', 'fgp', 'tpp', 'ts'] },
  pct: { pl: ['ppg', 'rpg', 'apg', 'spg', 'bpg', 'ts', 'efg', 'usg', 'astp', 'rebp', 'tpmpg', 'ftr', 'topg'] },
  radar: { pl: NBA_RADAR.pl },
  tabs: [['overview', 'Overview'], ['stats', 'Stats'], ['splits', 'Splits'], ['log', 'Game log'], ['shots', 'Shot chart']],
  build: {
    splits: mkSplits(),
    log: mkGameLog({ cols: NBA_LOG_COLS, form: { pl: { name: 'points', label: 'points', mode: 'mean', win: 10, fmt: 'f1' } } }),
    shots: ({ D, id, role }) => { const host = h('div', {}); shotExplorer(D, { kind: 'player', id, role }, host); return host; },
  },
  seasonsPlayed: async id => (await ESPN_CAREER(id))[0]?.rows.map(r => r.season).filter(Boolean) || [],
  career: mkCareer(cats => cats.find(c => /averages/i.test(c.name)) || cats[0]),
  arc: mkMonthArc({ pl: { name: 'points', label: 'Points per game', mode: 'mean', fmt: 'f1' } }),
};
SPORT.compare = { tape: NBA_TAPE, radar: NBA_RADAR };
SPORT.lab = { recipes: NBA_RECIPES, ref: { pl: 'ppg' }, plotDefaults: { pl: ['usg', 'ts'], tof: ['ortg', 'pace'], tdf: ['drtg', 'oefg'] } };
