/* config.js: the college football sport definition. Teams only: ESPN has no bulk player stats for college football. */
const CFB_ROLE = {
  tof: { kind: 'team', tab: 'Team offense', plural: 'Teams' }, tdf: { kind: 'team', tab: 'Team defense', plural: 'Teams' }, tsp: { kind: 'team', tab: 'Special teams', plural: 'Teams' },
};
for (const g in GROUP_META) SPORT.groups[g] = { ...GROUP_META[g], ...CFB_ROLE[g] };
SPORT.groupOrder = ['tof', 'tdf', 'tsp'];
const CFB_TAPE = {
  tof: ['w', 'l', 'ppg', 'ypg', 'ypp', 'pyg', 'ryg', 'cmpp', 'ypc', 'thp', 'give', 'sckt'],
  tdf: ['w', 'l', 'pag', 'oypg', 'opyg', 'oryg', 'sck', 'int', 'take', 'tod'],
  tsp: ['w', 'l', 'fgp', 'f50', 'xpp', 'pavg', 'pnet', 'krav', 'prav', 'penpg'],
};
const CFB_RADAR = {
  tof: [['ppg', 'PPG'], ['ypp', 'Y/PLAY'], ['pyg', 'PASS YD/G'], ['ryg', 'RUSH YD/G'], ['thp', '3RD%'], ['give', 'Giveaways']],
  tdf: [['pag', 'PA/G'], ['opyg', 'PASS YD/G'], ['oryg', 'RUSH YD/G'], ['sckg', 'SACK/G'], ['takeg', 'TAKE/G'], ['othp', '3RD% ALLOWED']],
  tsp: [['fgp', 'FG%'], ['xpp', 'XP%'], ['pnet', 'NET PUNT'], ['krav', 'KR AVG'], ['prav', 'PR AVG'], ['penpg', 'PEN/G']],
};
const CFB_RECIPES = {
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
  sourceNote: 'Sources: ESPN team season totals and play-by-play for FBS football. ESPN publishes no player statistics for college football in bulk, so this site ranks the 138 FBS teams, and the same stats measured for their opponents give each defense. Takeaways are the opponents’ interceptions plus the team’s own fumble recoveries; giveaways are the reverse. Points come from the standings.',
  searchHint: 'Type a team. Try “Alabama”, “Ohio State” or “Oregon”.',
  headshot: () => '',
  teamLogo: id => App.D?.teams.get(+id)?.logo || '',
  teamColor: id => App.D?.teams.get(+id)?.color || '#667788',
  playerTag: () => 'Player',
  teamOnly: true,
  teamFilters: [],  /* filled with the conferences when a season loads */
  loadSeason,
  heroCanvas: nflHero,
  home: {
    tag: 'DRIVES · DOWNS · YARDS // TEAM STATS AND PLAY-BY-PLAY REPLAY',
    blurb: 'Every FBS team ranked on offense, defense and special teams, with any game replayed snap by snap on the field.',
    cards: [
      { href: '/stats/tof', title: 'Leaderboards', desc: 'Offense, defense and special teams, with percentiles' },
      { href: '/lab', title: 'The Lab', desc: 'Build a stat, filter the field, plot anything against anything' },
      { href: '/compare', title: 'Compare', desc: 'Two teams side by side' },
      { href: '/games', title: 'Games', desc: 'Replay any game snap by snap with a win-probability line' },
    ],
    leaders: [
      { title: 'Points per game', g: 'tof', k: 'ppg', f: 'f1', qual: false }, { title: 'Points allowed per game', g: 'tdf', k: 'pag', f: 'f1', qual: false }, { title: 'Yards per play', g: 'tof', k: 'ypp', f: 'f2', qual: false },
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
  roster: [],
  arc: mkTeamArc('point'),
};
/* no player pages: the contract still wants the hooks, so they say there are no players */
SPORT.player = { roles: () => [], roleName: {}, roleLine: () => 'Player', bioPills: () => [], tiles: {}, pct: {}, radar: {}, tabs: [['overview', 'Overview']], build: {} };
SPORT.compare = { tape: CFB_TAPE, radar: CFB_RADAR };
SPORT.lab = { recipes: CFB_RECIPES, ref: { tof: 'ppg', tdf: 'pag', tsp: 'fgp' }, plotDefaults: { tof: ['ppg', 'ypp'], tdf: ['pag', 'takeg'], tsp: ['fgp', 'pnet'] } };
