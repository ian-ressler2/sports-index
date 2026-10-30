/* config.js: the soccer sport definition. The competition itself (id, name, ESPN league) comes from the league file loaded before this one. */
const SOC_ROLE = {
  pl: { tab: 'Players', plural: 'Players', kind: 'player', thr: { field: 'app', label: 'APP', loose: 2 }, situ: false,
    qual: (D, r) => r.app >= D.q.pl, qualText: D => `≥${D.q.pl} APP`, posLabel: 'All positions',
    posOptions: () => ['D', 'M', 'F'], posMatch: (r, o) => r.pos === o, roleOf: r => SOC_POS[r.pos] || 'Player' },
  gk: { tab: 'Goalkeepers', plural: 'Goalkeepers', kind: 'player', thr: { field: 'app', label: 'APP', loose: 1 }, situ: false,
    qual: (D, r) => r.app >= D.q.gk, qualText: D => `≥${D.q.gk} APP`, posLabel: 'Goalkeepers', posOptions: () => [], roleOf: () => 'Goalkeeper' },
  tof: { kind: 'team', tab: 'Attack', plural: 'Clubs' }, tpo: { kind: 'team', tab: 'Possession', plural: 'Clubs' }, tdf: { kind: 'team', tab: 'Defense', plural: 'Clubs' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...SOC_ROLE[g] };
SPORT.groupOrder = ['pl', 'gk', 'tof', 'tpo', 'tdf'];
const SOC_TAPE = {
  pl: ['app', 'st', 'g', 'a', 'ga', 'gpa', 'apa', 'sh', 'sot', 'sotp', 'conv', 'fc', 'fs', 'yc', 'rc'],
  gk: ['app', 'st', 'sv', 'sf', 'svp', 'svpa', 'gc', 'gcpa'],
  tof: ['w', 't', 'l', 'pts', 'gd', 'gfg', 'xg', 'shg', 'sotg', 'sotp', 'conv', 'bcg'],
  tpo: ['poss', 'pasg', 'passp', 'lbp', 'crsg', 'crsp', 'duelp', 'recg'],
  tdf: ['gag', 'xga', 'cs', 'csp', 'sfg', 'svp', 'tklg', 'intg', 'clrg', 'red'],
};
const SOC_RADAR = {
  pl: [['gpa', 'G/APP'], ['apa', 'A/APP'], ['shpa', 'SHOTS/APP'], ['sotp', 'SOT%'], ['conv', 'CONV%'], ['fspa', 'FOULED/APP']],
  gk: [['svp', 'SAVE%'], ['svpa', 'SAVES/APP'], ['gcpa', 'GA/APP'], ['sfpa', 'FACED/APP']],
  tof: [['gfg', 'GF/G'], ['xg', 'xG/G'], ['shg', 'SHOTS/G'], ['sotp', 'SOT%'], ['conv', 'CONV%'], ['bcg', 'BIG CH/G']],
  tpo: [['poss', 'POSS%'], ['passp', 'PASS%'], ['pasg', 'PASSES/G'], ['duelp', 'DUEL WIN%'], ['recg', 'RECOVERIES/G'], ['crsp', 'CROSS%']],
  tdf: [['gag', 'GA/G'], ['xga', 'xGA/G'], ['csp', 'CS%'], ['svp', 'SAVE%'], ['tklp', 'TACKLE%'], ['intg', 'INT/G']],
};
const SOC_RECIPES = {
  pl: [{ name: 'Goal threat', desc: 'Scores often and from good shots', ing: { gpa: 2, conv: 1.5, sotp: 1 } }, { name: 'Creator', desc: 'Sets up teammates', ing: { apa: 2, fspa: .5 } }, { name: 'Shot machine', desc: 'Volume of shots on target', ing: { shpa: 1.5, sotpa: 2 } }, { name: 'All-round attacker', desc: 'Goals and assists together', ing: { gapa: 2, ga: 1 } }, { name: 'Agitator', desc: 'Wins fouls, gives few away', ing: { fspa: 2, fcpa: -1 } }],
  gk: [{ name: 'Shot stopper', desc: 'Saves what comes', ing: { svp: 2, svpa: 1 } }, { name: 'Sheltered', desc: 'Concedes little', ing: { gcpa: -2, sfpa: -1 }}],
  tof: [{ name: 'Best attack', desc: 'Scores and creates', ing: { gfg: 2, xg: 1.5, sotg: 1, conv: 1 } }, { name: 'Chance creators', desc: 'Volume of good chances', ing: { xg: 2, bcg: 1.5, shg: 1 } }, { name: 'Clinical', desc: 'Scores more than the chances say', ing: { conv: 2, sotp: 1.5 } }],
  tpo: [{ name: 'Ball controllers', desc: 'Keep the ball and use it well', ing: { poss: 2, passp: 1.5, pasg: 1 } }, { name: 'Direct', desc: 'Go long and wide', ing: { lbg: 1.5, crsg: 1.5, lbp: 1 } }, { name: 'Ball winners', desc: 'Win duels, win it back', ing: { duelp: 2, recg: 1.5 } }],
  tdf: [{ name: 'Best defense', desc: 'Concedes little, keeps clean sheets', ing: { gag: -2, xga: -1.5, csp: 1 } }, { name: 'Wall in front of goal', desc: 'Block, clear, save', ing: { blkg: 1, clrg: 1, svp: 1.5 } }, { name: 'Disciplined', desc: 'Few fouls, few cards', ing: { fcg: -1.5, ycg: -1.5, red: -1 } }],
};
Object.assign(SPORT, {
  id: SOC.id, name: SOC.name, first: SOC.first, word: 'INDEX', short: SOC.short, accent: SOC.accent,
  seasons: { first: SOC.firstSeason, current: socCurrentSeason(), label: s => SOC.cal ? `${s}` : `${s}-${String(s + 1).slice(2)}` },
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['games', 'Matches'], ['today', 'Today'], ['watch', 'Watchlist'], ['teams', 'Table']],
  unit: 'MATCH',
  credit: 'Data: ESPN',
  footer: `Not affiliated with or endorsed by ${SOC.label} or any club. Statistics and match commentary come from ESPN’s public feeds.<br>Club logos are loaded from ESPN’s image host.`,
  sourceNote: `Sources: ESPN's ${SOC.label} table, club season totals and club rosters; match pages use ESPN's minute-by-minute commentary, whose shots carry pitch positions. Per-game rates divide ESPN's totals by matches played. Player lines come from each club's roster feed: appearances, starts, goals, assists, shots, fouls, cards and saves. ESPN's roster feed has no minutes, so player rates are per appearance, and percentiles compare players with at least 35% of a club's matches. xG is ESPN's own model and is a club figure only.`,
  searchHint: `Type a player or club. Try ${SOC.ex}.`,
  headshot: id => `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`,
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || socColor(id),
  playerTag: p => SOC_POS[p.pos] || 'Player',
  teamFilters: [],
  loadSeason,
  heroCanvas: socHero,
  home: {
    tag: SOC.tag, blurb: SOC.blurb,
    cards: [
      { href: '/stats/pl', title: 'Leaderboards', desc: 'Players and clubs, sortable, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two players or clubs side by side' },
      { href: '/games', title: 'Matches', desc: 'Replay any match on the pitch with a win-chance line' },
    ],
    leaders: [
      { title: 'Goals', g: 'pl', k: 'g', f: 'int', qual: false }, { title: 'Assists', g: 'pl', k: 'a', f: 'int', qual: false }, { title: 'Goals plus assists per appearance', g: 'pl', k: 'gapa', f: 'f2' },
      { title: 'Goalkeeper save %', g: 'gk', k: 'svp', f: 'f1' }, { title: 'Club goals per game', g: 'tof', k: 'gfg', f: 'f2', qual: false }, { title: 'Club possession', g: 'tpo', k: 'poss', f: 'f1', qual: false },
    ],
  },
});
/* European seasons are named for the year they start (July on); MLS plays one calendar year */
function socCurrentSeason() { const d = new Date(); return SOC.cal ? d.getFullYear() - (d.getMonth() < 1 ? 1 : 0) : d.getFullYear() - (d.getMonth() >= 6 ? 0 : 1); }

SPORT.standings = {
  divOrder: [],
  sort: s => s.pts * 1e6 + s.gd * 1e3 + s.gf,
  cols: [
    { l: 'P', k: 'gp', desc: 'Matches played' }, { l: 'W', k: 'w' }, { l: 'D', k: 't' }, { l: 'L', k: 'l' }, { l: 'GF', k: 'gf' }, { l: 'GA', k: 'ga' }, { l: 'GD', k: 'gd', f: 'sgi' }, { l: 'PTS', k: 'pts' }, { l: 'PTS/G', k: 'ppg', f: 'f2' },
  ],
  scatter: { title: 'Attack vs defense', note: 'down and right is best', x: s => s.gfpg, y: s => s.gapg, xlab: 'Goals per game', ylab: 'Goals against per game', dec: 2,
    tip: s => [['Record', `${s.w}-${s.t}-${s.l}`], ['Points', s.pts], ['GF/G', fmt(s.gfpg, 'f2')], ['GA/G', fmt(s.gapg, 'f2')]] },
};
SPORT.team = {
  tiles(D, id, st) {
    const o = D.tof.get(id) || {}, d = D.tdf.get(id) || {}, p = D.tpo.get(id) || {};
    return [['Record', `${st.w}-${st.t}-${st.l}`, NaN], ['Points', st.pts, pctile(D, 'tof', 'ppg', st.ppg)], ['GF/G', fmt(o.gfg, 'f2'), pctile(D, 'tof', 'gfg', o.gfg)], ['GA/G', fmt(d.gag, 'f2'), pctile(D, 'tdf', 'gag', d.gag)], ['GD', fmt(st.gd, 'sgi'), pctile(D, 'tof', 'gd', st.gd)], ['xG/G', fmt(o.xg, 'f2'), pctile(D, 'tof', 'xg', o.xg)], ['Possession', fmt(p.poss, 'f1') + '%', pctile(D, 'tpo', 'poss', p.poss)], ['Clean sheets', d.cs, pctile(D, 'tdf', 'cs', d.cs)]];
  },
  rankText: (D, t, st) => st.dr ? `${ord(st.dr)} in ${t.div}` : t.div,
  pills: (D, t, st) => [`${st.pts} points`, `GD ${fmt(st.gd, 'sgi')}`].filter(Boolean),
  bars: [
    { title: 'Attack', g: 'tof', keys: ['gfg', 'xg', 'shg', 'sotg', 'sotp', 'conv', 'bcg'] },
    { title: 'Possession', g: 'tpo', keys: ['poss', 'pasg', 'passp', 'crsp', 'duelp', 'recg'] },
    { title: 'Defense', g: 'tdf', keys: ['gag', 'xga', 'csp', 'svp', 'tklp', 'intg', 'clrg'] },
  ],
  roster: [
    { g: 'pl', title: 'Players', keys: ['app', 'g', 'a', 'ga', 'sh', 'sotp', 'yc', 'rc'], sort: 'ga' },
    { g: 'gk', title: 'Goalkeepers', keys: ['app', 'sv', 'svp', 'gc', 'gcpa'], sort: 'app' },
  ],
  arc: mkTeamArc('goal'),
};
SPORT.player = {
  roles: (D, id) => D.pl.has(id) ? ['pl'] : D.gk.has(id) ? ['gk'] : [],
  roleName: { pl: 'PLAYER', gk: 'GOALKEEPER' },
  roleLine: (role, r) => SOC_POS[r.pos] || 'Player',
  bioPills: (bio, r) => [r?.h, r?.age && `Age ${r.age}`, r?.jersey && `#${r.jersey}`, r?.nat].filter(Boolean),
  tiles: { pl: ['app', 'st', 'g', 'a', 'ga', 'sh', 'sotp', 'yc'], gk: ['app', 'st', 'sv', 'gc', 'svp', 'svpa'] },
  pct: { pl: ['gpa', 'apa', 'gapa', 'shpa', 'sotpa', 'sotp', 'conv', 'fspa', 'fcpa'], gk: ['svp', 'svpa', 'gcpa', 'sfpa'] },
  radar: { pl: SOC_RADAR.pl, gk: SOC_RADAR.gk },
  tabs: [['overview', 'Overview'], ['stats', 'Stats'], ['log', 'Game log']],
  build: {
    log: mkGameLog({ cols: { pl: ['minutes', 'starts', 'totalGoals', 'goalAssists', 'totalShots', 'shotsOnTarget', 'foulsCommitted', 'foulsSuffered', 'offsides', 'yellowCards', 'redCards'], gk: ['minutes', 'starts', 'saves', 'goalsConceded', 'cleanSheet', 'yellowCards', 'redCards'] }, form: { pl: { name: 'totalGoals', label: 'goals', mode: 'sum', win: 5 }, gk: { name: 'saves', label: 'saves', mode: 'mean', win: 5, fmt: 'f1' } } }),
  },
};
SPORT.compare = { tape: SOC_TAPE, radar: SOC_RADAR };
SPORT.lab = { recipes: SOC_RECIPES, ref: { pl: 'gapa', gk: 'svp', tof: 'gfg', tpo: 'poss', tdf: 'gag' }, plotDefaults: { pl: ['shpa', 'gpa'], gk: ['sfpa', 'svp'], tof: ['xg', 'gfg'], tpo: ['poss', 'passp'], tdf: ['xga', 'gag'] } };
