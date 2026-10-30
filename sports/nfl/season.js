/* NFL season simulator rules: 32 teams, four division winners plus three wild cards per conference, single-game playoffs */
SPORT.season = {
  sigma: 13.3, hfa: 1.9, k: 8, prior: .3, unit: 'points per game', metric: 'wins', dec: 1,
  blurb: 'Plays out the rest of the NFL schedule thousands of times, then the playoff bracket and the Super Bowl.',
  topLabel: 'No. 1 seed', topDesc: 'Chance to earn the conference’s only first-round bye', finalLabel: 'Super Bowl',
  rec: s => `${s.w}-${s.l}${s.t ? '-' + s.t : ''}`,
  games: (D, prog) => espnSeasonData(D, prog),
  bracket(X) {
    const o = { made: [], top: [], conf: [], champ: null }, fin = [];
    for (const lg of X.lgs) {
      const dw = X.divs(lg).map(d => d[0]).sort((a, b) => X.key(b) - X.key(a)), rest = X.sortLg(lg).filter(i => !dw.includes(i)).slice(0, 3), sd = [...dw, ...rest];
      o.made.push(...sd); o.top.push(sd[0]); const rk = i => sd.indexOf(i), G = (a, b) => X.game(a, b);
      const s = [sd[0], G(sd[1], sd[6]), G(sd[2], sd[5]), G(sd[3], sd[4])].sort((a, b) => rk(a) - rk(b));
      const d1 = G(s[0], s[3]), d2 = G(s[1], s[2]), cf = rk(d1) < rk(d2) ? G(d1, d2) : G(d2, d1); o.conf.push(cf); fin.push(cf);
    }
    o.champ = X.game(fin[0], fin[1], true); return o;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average scoring margin, adjusted for the opponents it faced and for home field, then pulled toward average. With only a handful of games in the books the pull is strong, and last season counts for about a third as much as this one. Ratings are uncertain, so each simulated season draws every team’s true strength from a range.</p>
  <p><b>Games.</b> Win chance comes from the rating gap plus a home edge of about two points, against a typical game spread of 13 points. Seeding follows the real format: four division winners and three wild cards per conference, the No. 1 seed gets a bye, the bracket is reseeded after the wild-card round, and the Super Bowl is played on a neutral field.</p>
  <p><b>Limits.</b> Ties are broken by head-to-head record among the tied teams, then conference and division record, then a coin flip; strength of victory, strength of schedule and the later official steps are not modeled. Tied games, injuries and quarterback changes are not modeled. Treat the numbers as a fair estimate, not a prediction.</p>`,
};
