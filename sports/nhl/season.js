/* NHL season simulator rules: 32 teams, three per division plus two wild cards per conference, four best-of-seven rounds */
SPORT.season = {
  sigma: 2.35, hfa: .16, k: 30, prior: .35, otl: .23, unit: 'goals per game', metric: 'pts', dec: 2,
  blurb: 'Plays out the rest of the NHL schedule thousands of times, then the Stanley Cup bracket.',
  topLabel: 'Top seed', topDesc: 'Chance to finish with the most points in the conference', finalLabel: 'Cup Final',
  rec: s => `${s.w}-${s.l}-${s.otl}`,
  games: (D, prog) => espnSeasonData(D, prog),
  bracket(X) {
    const o = { made: [], top: [], conf: [], champ: null }, BO7 = 'HHAAHAH', fin = [];
    const ser = (a, b) => { const [x, y] = X.hl(a, b); return X.series(x, y, BO7); };
    for (const lg of X.lgs) {
      const dv = X.divs(lg), top3 = dv.map(d => d.slice(0, 3)), taken = new Set(top3.flat());
      const wc = X.sortLg(lg).filter(i => !taken.has(i)).slice(0, 2); o.made.push(...taken, ...wc); o.top.push(X.sortLg(lg)[0]);
      const [A, B] = top3, a = ser(ser(A[0], wc[1]), ser(A[1], A[2])), b = ser(ser(B[0], wc[0]), ser(B[1], B[2]));
      const cf = ser(a, b); o.conf.push(cf); fin.push(cf);
    }
    o.champ = ser(fin[0], fin[1]); return o;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average goal margin, adjusted for the opponents it faced and for home ice, then pulled toward average (the fewer games played, the harder the pull). Last season counts for about a third as much as this one. Ratings are uncertain, so each simulated season draws every team’s true strength from a range.</p>
  <p><b>Points.</b> A win is worth two points. In about 23% of games the loser gets a point for losing in overtime or a shootout, which is the league average; the model does not tilt that by team. Seeds follow the real format: the top three in each division plus two wild cards per conference, the division winner with more points facing the lower wild card, then division brackets, conference finals and the Cup Final, all best of seven with 2-2-1-1-1 home ice.</p>
  <p><b>Limits.</b> Points ties are broken at random, not by regulation wins and the other official tiebreakers. Goalies, injuries and trades are not modeled. Treat the numbers as a fair estimate, not a prediction.</p>`,
};
