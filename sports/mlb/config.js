/* config.js: the MLB sport definition */
const MLB_GROUP_EXTRA = {
  bat: { kind: 'player', tab: 'Batters', plural: 'Batters', thr: { field: 'pa', label: 'PA', loose: 50 }, sitThr: { field: 'pa', label: 'PA' }, situ: true,
    qual: (D, r) => r.pa >= D.q.bat, qualText: D => `≥${D.q.bat} PA`, posLabel: 'All positions',
    posOptions: D => [...new Set(D.batList.filter(r => r.pa >= 100).map(r => r.pos).filter(Boolean))].sort((a, b) => (POS_ORDER.indexOf(a) + 99) % 99 - (POS_ORDER.indexOf(b) + 99) % 99),
    posMatch: (r, o) => r.pos === o, roleOf: r => r.pos || '' },
  pit: { kind: 'player', tab: 'Pitchers', plural: 'Pitchers', thr: { field: 'ipn', label: 'IP', loose: 10 }, sitThr: { field: 'bf', label: 'BF' }, situ: true,
    qual: (D, r) => r.ipn >= D.q.pit, qualText: D => `≥${D.q.pit} IP`, posLabel: 'All roles',
    posOptions: () => ['SP', 'RP'], posMatch: (r, o) => (o === 'SP') === !!(r.gs && r.gs >= r.g * 0.5), roleOf: r => r.gs && r.gs >= r.g * 0.5 ? 'SP' : 'RP' },
  tbat: { kind: 'team', tab: 'Team offense', plural: 'Teams' },
  tpit: { kind: 'team', tab: 'Team defense', plural: 'Teams' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...MLB_GROUP_EXTRA[g] };
Object.assign(SPORT, {
  id: 'mlb', name: 'Diamond Index', first: 'Diamond', word: 'INDEX', short: 'MLB', accent: '#ff8a4c',
  groupOrder: ['bat', 'pit', 'tbat', 'tpit'],
  seasons: { first: FIRST_SEASON, current: CUR_SEASON, label: s => String(s) },
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['charts', 'Charts'], ['teams', 'Teams']],
  credit: 'Data: MLB Stats API · Baseball Savant',
  footer: 'Not affiliated with or endorsed by Major League Baseball or any club. Built on MLB Stats API and Baseball Savant Statcast data.<br>Charts are drawn from public tracking data. Player photos are loaded from MLB’s image host.',
  sourceNote: 'Sources: MLB Stats API (box score stats, WAR, wRC+, FIP) · Baseball Savant Statcast (expected stats, exit velocity, bat tracking, plate discipline, sprint speed, outs above average). Shading: percentile among qualified players (red high, blue low; flipped where lower is better, none for style stats).',
  searchHint: 'Type a name. Try “Judge”, “Skenes” or “Dodgers”.',
  headshot: id => `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_160,q_auto:best/v1/people/${id}/headshot/67/current`,
  playerTag: p => p.bat && p.pit ? 'Bat · Pitch' : p.pit ? 'Pitcher' : 'Batter',
  teamFilters: [['AL', 'American League'], ['NL', 'National League']],
  loadSeason,
  sit: { quick: SIT_QUICK, all: SIT_ALL, label: SIT_LABEL, cols: SIT_COLS, load: loadSituation },
  home: {
    tag: 'PITCHES · SWINGS · SPRAYS // PLATE COORDINATES',
    blurb: 'Pitches, swings and batted balls from Statcast tracking, mapped to the plate and the field and matched to the season’s results.',
    cards: [
      { href: '/stats/bat', title: 'Leaderboards', desc: 'Every batter, pitcher and team, sortable, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, carve up the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two players or teams side by side' },
      { href: '/charts', title: 'Chart explorer', desc: 'Every home run on the map, plus spray charts and zone maps for any player' },
    ],
    leaders: [
      { title: 'wRC+', g: 'bat', k: 'wrcp', f: 'int' }, { title: 'Home runs', g: 'bat', k: 'hr', f: 'int', qual: false }, { title: 'Pitcher WAR', g: 'pit', k: 'war', f: 'f1', qual: false },
      { title: 'Pitcher K−BB%', g: 'pit', k: 'kbb', f: 'f1' }, { title: 'Team runs per game', g: 'tbat', k: 'rpg', f: 'f2', qual: false }, { title: 'Team runs allowed per game', g: 'tpit', k: 'rapg', f: 'f2', qual: false, asc: true },
    ],
  },
});
