/* config.js: the soccer sport definition. The competition itself (id, name, ESPN league) comes from the league file loaded before this one. Clubs only: ESPN publishes no bulk player stats for soccer. */
const SOC_ROLE = {
  tof: { kind: 'team', tab: 'Attack', plural: 'Clubs' }, tpo: { kind: 'team', tab: 'Possession', plural: 'Clubs' }, tdf: { kind: 'team', tab: 'Defense', plural: 'Clubs' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...SOC_ROLE[g] };
SPORT.groupOrder = ['tof', 'tpo', 'tdf'];
const SOC_TAPE = {
  tof: ['w', 't', 'l', 'pts', 'gd', 'gfg', 'xg', 'shg', 'sotg', 'sotp', 'conv', 'bcg'],
  tpo: ['poss', 'pasg', 'passp', 'lbp', 'crsg', 'crsp', 'duelp', 'recg'],
  tdf: ['gag', 'xga', 'cs', 'csp', 'sfg', 'svp', 'tklg', 'intg', 'clrg', 'red'],
};
const SOC_RADAR = {
  tof: [['gfg', 'GF/G'], ['xg', 'xG/G'], ['shg', 'SHOTS/G'], ['sotp', 'SOT%'], ['conv', 'CONV%'], ['bcg', 'BIG CH/G']],
  tpo: [['poss', 'POSS%'], ['passp', 'PASS%'], ['pasg', 'PASSES/G'], ['duelp', 'DUEL WIN%'], ['recg', 'RECOVERIES/G'], ['crsp', 'CROSS%']],
  tdf: [['gag', 'GA/G'], ['xga', 'xGA/G'], ['csp', 'CS%'], ['svp', 'SAVE%'], ['tklp', 'TACKLE%'], ['intg', 'INT/G']],
};
const SOC_RECIPES = {
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
  sourceNote: `Sources: ESPN's ${SOC.label} table and club season totals; match pages use ESPN's minute-by-minute commentary, whose shots carry pitch positions. Per-game rates divide ESPN's totals by matches played. ESPN publishes no player statistics for soccer in bulk, so these pages rank clubs. xG is ESPN's own model.`,
  searchHint: `Type a club. Try ${SOC.ex}.`,
  headshot: () => '',
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || socColor(id),
  playerTag: () => 'Player',
  teamOnly: true,
  teamFilters: [],
  loadSeason,
  heroCanvas: socHero,
  home: {
    tag: SOC.tag, blurb: SOC.blurb,
    cards: [
      { href: '/stats/tof', title: 'Leaderboards', desc: 'Attack, possession and defense, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two clubs side by side' },
      { href: '/games', title: 'Matches', desc: 'Replay any match on the pitch with a win-chance line' },
    ],
    leaders: [
      { title: 'Goals per game', g: 'tof', k: 'gfg', f: 'f2', qual: false }, { title: 'Expected goals per game', g: 'tof', k: 'xg', f: 'f2', qual: false }, { title: 'Possession', g: 'tpo', k: 'poss', f: 'f1', qual: false },
      { title: 'Pass accuracy', g: 'tpo', k: 'passp', f: 'f1', qual: false }, { title: 'Goals against per game', g: 'tdf', k: 'gag', f: 'f2', qual: false }, { title: 'Clean-sheet rate', g: 'tdf', k: 'csp', f: 'f1', qual: false },
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
  roster: [],
  arc: mkTeamArc('goal'),
};
SPORT.player = { roles: () => [], roleName: {}, roleLine: () => 'Player', bioPills: () => [], tiles: {}, pct: {}, radar: {}, tabs: [['overview', 'Overview']], build: {} };
SPORT.compare = { tape: SOC_TAPE, radar: SOC_RADAR };
SPORT.lab = { recipes: SOC_RECIPES, ref: { tof: 'gfg', tpo: 'poss', tdf: 'gag' }, plotDefaults: { tof: ['xg', 'gfg'], tpo: ['poss', 'passp'], tdf: ['xga', 'gag'] } };
