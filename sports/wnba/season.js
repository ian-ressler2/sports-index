/* WNBA season simulator rules: every team is ranked together, the top eight make the playoffs (no conferences in the bracket),
   a best-of-three first round, best-of-five semifinals and a best-of-seven final */
SPORT.season = {
  sigma: 11, hfa: 2.0, k: 8, prior: .3, unit: 'points per game', metric: 'wins', dec: 1, noDiv: true,
  blurb: 'Plays out the rest of the WNBA schedule thousands of times, then the eight-team playoff bracket.',
  topLabel: 'Best record', topDesc: 'Chance to finish with the best record in the league', finalLabel: 'Finals',
  rec: s => `${s.w}-${s.l}`,
  games: (D, prog) => espnSeasonData(D, prog),
  bracket(X) {
    const o = { made: [], top: [], conf: [], champ: null }, BO3 = 'HAH', BO5 = 'HHAAH', BO7 = 'HHAAHAH', all = X.all();
    const ser = (a, b, pat) => { const [x, y] = X.hl(a, b); return X.series(x, y, pat); };
    o.top.push(all[0]); const sd = all.slice(0, 8); o.made.push(...sd);
    const a = ser(sd[0], sd[7], BO3), b = ser(sd[3], sd[4], BO3), c = ser(sd[1], sd[6], BO3), d = ser(sd[2], sd[5], BO3);
    const s1 = ser(a, b, BO5), s2 = ser(c, d, BO5); o.conf.push(s1, s2);
    o.champ = ser(s1, s2, BO7); return o;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average scoring margin, adjusted for the opponents it faced and for home court, then pulled toward average (the fewer games played, the harder the pull). Last season counts for about a third as much as this one, since rosters change. Ratings are uncertain too, so every simulated season draws each team’s true strength from a range, which keeps early-season odds from being overconfident.</p>
  <p><b>Games.</b> Win chance comes from the rating gap plus a home-court edge of about 2 points, against a typical game spread of 11 points. The eight best records make the playoffs and are seeded one through eight regardless of conference. The first round is best of three, the semifinals best of five and the finals best of seven; the better record hosts first.</p>
  <p><b>Limits.</b> Ties in the standings are broken at random, not by the league’s full tiebreaker list. The real bracket is not reseeded exactly as modeled, injuries and rest are not modeled, and no team gets a playoff boost. Treat the numbers as a fair estimate, not a prediction.</p>`,
};
