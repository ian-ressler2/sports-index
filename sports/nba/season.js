/* NBA season simulator rules: 30 teams, top six per conference plus the play-in for seeds 7 and 8, four best-of-seven rounds */
SPORT.season = {
  sigma: 12.5, hfa: 2.4, k: 8, prior: .35, unit: 'points per game', metric: 'wins', dec: 1,
  blurb: 'Plays out the rest of the NBA schedule thousands of times, including the play-in and every playoff round.',
  topLabel: 'Top seed', topDesc: 'Chance to finish with the best record in the conference', finalLabel: 'Finals', madeNote: ' (including the play-in)',
  rec: s => `${s.w}-${s.l}`,
  games: (D, prog) => espnSeasonData(D, prog),
  bracket(X) {
    const o = { made: [], top: [], conf: [], champ: null }, BO7 = 'HHAAHAH', fin = [];
    const ser = (a, b) => { const [x, y] = X.hl(a, b); return X.series(x, y, BO7); };
    for (const lg of X.lgs) {
      const s = X.sortLg(lg); o.top.push(s[0]);
      const w78 = X.game(s[6], s[7]), l78 = w78 === s[6] ? s[7] : s[6], w910 = X.game(s[8], s[9]), e8 = X.game(l78, w910);
      const sd = [...s.slice(0, 6), w78, e8]; o.made.push(...sd);
      const a = ser(sd[0], sd[7]), b = ser(sd[3], sd[4]), c = ser(sd[1], sd[6]), d = ser(sd[2], sd[5]);
      const cf = ser(ser(a, b), ser(c, d)); o.conf.push(cf); fin.push(cf);
    }
    o.champ = ser(fin[0], fin[1]); return o;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average scoring margin, adjusted for the opponents it faced and for home court, then pulled toward average (the fewer games played, the harder the pull). Last season counts for about a third as much as this one, since rosters change. Ratings are uncertain too, so every simulated season draws each team’s true strength from a range, which keeps early-season odds honest.</p>
  <p><b>Games.</b> Win chance comes from the rating gap plus a home-court edge of about 2.4 points, against a typical game spread of 12.5 points. The play-in (7 vs 8, 9 vs 10, then the loser of 7 vs 8 against the winner of 9 vs 10) is played as written. Playoff series are best of seven with 2-2-1-1-1 home court for the better record.</p>
  <p><b>Limits.</b> Ties are broken by head-to-head record among the tied teams, then conference and division record, then a coin flip; the later official steps (such as point differential) are not modeled. Injuries, trades and rest days are not modeled, and no team gets a playoff boost. Treat the numbers as a fair estimate, not a prediction.</p>`,
};
