/* MLB season simulator rules: 30 teams, three division winners plus three wild cards per league, 12-team postseason */
SPORT.season = {
  sigma: 4.3, hfa: .26, k: 55, prior: .35, unit: 'runs per game', metric: 'wins', dec: 2,
  blurb: 'Plays out the rest of the MLB schedule thousands of times, then the full postseason.',
  topLabel: 'First-round bye', topDesc: 'Chance to be a top-two seed and skip the wild-card round', finalLabel: 'World Series',
  rec: s => `${s.w}-${s.l}`,
  async games(D, prog) {
    const yr = y => getJSON(`${API}/schedule?sportId=1&season=${y}&gameType=R&fields=dates,games,gamePk,status,abstractGameState,teams,home,away,team,id,score`).then(j => (j.dates || []).flatMap(d => d.games).map(g => ({ id: g.gamePk, h: g.teams.home.team.id, a: g.teams.away.team.id, hs: g.teams.home.score, as: g.teams.away.score, final: g.status?.abstractGameState === 'Final' })));
    const cur = await yr(D.season); prog && prog(.5);
    let prev = []; try { prev = (await yr(D.season - 1)).filter(g => g.final); } catch (e) { /* only a prior */ }
    prog && prog(1); const fin = g => g.final && isFinite(g.hs) && isFinite(g.as);
    return { cur: cur.filter(fin), rem: cur.filter(g => !g.final), prev };
  },
  bracket(X) {
    const o = { made: [], top: [], conf: [], champ: null }, fin = [];
    const ser = (a, b, pat) => { const [x, y] = X.hl(a, b); return X.series(x, y, pat); };
    for (const lg of X.lgs) {
      const dw = X.divs(lg).map(d => d[0]).sort((a, b) => X.key(b) - X.key(a)), wc = X.sortLg(lg).filter(i => !dw.includes(i)).slice(0, 3), sd = [...dw, ...wc];
      o.made.push(...sd); o.top.push(sd[0], sd[1]);
      const a = X.series(sd[2], sd[5], 'HHH'), b = X.series(sd[3], sd[4], 'HHH');
      const d1 = X.series(sd[0], b, 'HHAAH'), d2 = X.series(sd[1], a, 'HHAAH');
      const cf = ser(d1, d2, 'HHAAAHH'); o.conf.push(cf); fin.push(cf);
    }
    o.champ = ser(fin[0], fin[1], 'HHAAAHH'); return o;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average run margin per game, adjusted for the opponents it faced and for home field, then pulled toward average. Last season counts for about a third as much as this one. Ratings are uncertain, so each simulated season draws every team’s true strength from a range. Starting pitchers are not modeled, so a team’s rating is its overall level.</p>
  <p><b>Postseason.</b> The three division winners in each league take seeds 1 to 3 and the three best remaining records take 4 to 6. Seeds 1 and 2 get a bye; 3 plays 6 and 4 plays 5 in a best-of-three, seed 1 meets the 4/5 winner and seed 2 the 3/6 winner in a best-of-five, then best-of-seven league and World Series rounds, with home field to the better record.</p>
  <p><b>Limits.</b> Ties in the standings are broken at random, not by head-to-head and the other official tiebreakers. The more a baseball game is a coin flip, the more a short series is too, so even the best team rarely tops 20% to win it all.</p>`,
};
