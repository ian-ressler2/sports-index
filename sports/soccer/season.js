/* Soccer season simulators: Premier League title/Europe/relegation odds, MLS playoff odds and Champions League knockout odds.
   Same engine as the other sports (core/js/season.js); soccer adds draws, three points for a win, goal-difference tiebreaks
   and two-legged ties. */
const SOC_BASE = {
  doneNote: 'The season is complete, so these odds reflect the final table and, where there is one, the real knockout seeding.', sigma: 1.6, hfa: .32, k: 6, prior: .4, unit: 'goals per game', metric: 'pts', dec: 2, draw: .45, ptsWin: 3, tb: 'gd', noDiv: true, sortBy: r => r.exp,
  rec: s => `${s.w}-${s.t}-${s.l}`,
  games: async (D, prog) => {
    const d = await espnSeasonData(D, prog);
    if (SOC.id !== 'ucl') return d;
    /* league phase only (eight matches each): later knockout fixtures between the same clubs are not table games */
    const n = new Map(), keep = new Set();
    for (const g of [...d.cur, ...d.rem].sort((x, y) => String(x.id).localeCompare(String(y.id)))) { if ((n.get(g.h) || 0) < 8 && (n.get(g.a) || 0) < 8) { keep.add(g.id); n.set(g.h, (n.get(g.h) || 0) + 1); n.set(g.a, (n.get(g.a) || 0) + 1); } }
    return { cur: d.cur.filter(g => keep.has(g.id)), rem: d.rem.filter(g => keep.has(g.id)), prev: d.prev };
  },
};
const SOC_NOTE_STRENGTH = `<p><b>Strength.</b> Each club’s rating is its average goal margin per match, adjusted for the opponents it faced and for home advantage, then pulled toward average (the fewer matches played, the harder the pull). Last season counts for about 40% as much as this one. Ratings are uncertain, so every simulated season draws each club’s true strength from a range.</p>
  <p><b>Matches.</b> A match is simulated as a goal margin around the two ratings plus home advantage; margins under half a goal are draws (about a quarter of matches). A win is three points, a draw one. Table ties are broken by goal difference (simulated from the margins), then head-to-head record.</p>`;
if (SOC.id === 'epl') {
  SPORT.season = {
    ...SOC_BASE, blurb: 'Plays out the rest of the Premier League season thousands of times for title, Europe and relegation odds.',
    cols: [['made', 'Top 4', 'Chance to finish in the top four (Champions League places)'], ['top', 'Top 6', 'Chance to finish in the top six'], ['conf', 'Relegated', 'Chance to finish in the bottom three'], ['champ', 'Title', 'Chance to win the league']],
    bracket(X) { const all = X.all(); return { made: all.slice(0, 4), top: all.slice(0, 6), conf: all.slice(-3), champ: all[0] }; },
    note: SOC_NOTE_STRENGTH + `<p><b>Limits.</b> European places are taken as the top four and top six; the exact allocation (cup winners, European winners passing their spot on) is not modeled. Injuries, transfers and fixture congestion are not modeled.</p>`,
  };
} else if (SOC.id === 'mls') {
  SPORT.season = {
    ...SOC_BASE, blurb: 'Plays out the rest of the MLS regular season thousands of times, then the playoffs.', groupBy: t => t.div, k: 8,
    cols: [['made', 'Playoffs', 'Chance to finish in the top nine of the conference'], ['top', 'Top seed', 'Chance to finish first in the conference'], ['conf', 'MLS Cup final', 'Chance to reach the MLS Cup final'], ['champ', 'MLS Cup', 'Chance to win MLS Cup']],
    bracket(X) {
      const o = { made: [], top: [], conf: [], champ: null }, fin = [];
      for (const dv of X.divsAll) {
        const s = X.sortDiv(dv).slice(0, 9); if (s.length < 9) continue; o.made.push(...s); o.top.push(s[0]);
        const w = X.game(s[7], s[8], false), bo3 = (a, b) => { const [x, y] = X.hl(a, b); return X.series(x, y, 'HAH'); }, one = (a, b) => { const [x, y] = X.hl(a, b); return X.game(x, y, false); };
        const q = [bo3(s[0], w), bo3(s[1], s[6]), bo3(s[2], s[5]), bo3(s[3], s[4])];
        const cf = one(one(q[0], q[3]), one(q[1], q[2])); o.conf.push(cf); fin.push(cf);
      }
      const [a, b] = X.hl(fin[0], fin[1]); o.champ = X.game(a, b, false); return o;
    },
    note: SOC_NOTE_STRENGTH + `<p><b>Playoffs.</b> The top nine in each conference qualify; 8th hosts 9th in a single match, then round one is best-of-three (seeds 1 to 4 against the lowest remaining seeds), followed by single matches in the conference semifinals and final and a single MLS Cup match hosted by the better record.</p><p><b>Limits.</b> The format changes between seasons, so the bracket may differ from the official one. Table ties use goal difference and head-to-head only, not wins or other official steps.</p>`,
  };
} else if (SOC.id === 'ucl') {
  SPORT.season = {
    ...SOC_BASE, blurb: 'Plays out the rest of the league phase thousands of times, then the knockout rounds.', k: 5,
    cols: [['made', 'Top 24', 'Chance to reach the knockout rounds (top 24)'], ['top', 'Top 8', 'Chance to finish top eight and skip the playoff round'], ['conf', 'Final', 'Chance to reach the final'], ['champ', 'Winner', 'Chance to win the Champions League']],
    bracket(X) {
      const all = X.all(), o = { made: all.slice(0, 24), top: all.slice(0, 8), conf: [], champ: null };
      if (all.length < 24) { o.champ = all[0]; return o; }
      const tie = (a, b) => { const [x, y] = X.hl(a, b); return X.agg(x, y); };
      /* playoff round: 9 v 24, 10 v 23 ... 16 v 17; the top eight then face the winners */
      const po = [8, 9, 10, 11, 12, 13, 14, 15].map(k => tie(all[k], all[23 - k]));
      const r16 = [0, 1, 2, 3, 4, 5, 6, 7].map(k => tie(all[k], po[7 - k]));
      const qf = [tie(r16[0], r16[1]), tie(r16[2], r16[3]), tie(r16[4], r16[5]), tie(r16[6], r16[7])];
      const sf = [tie(qf[0], qf[1]), tie(qf[2], qf[3])]; o.conf.push(...sf);
      const [a, b] = X.hl(sf[0], sf[1]); o.champ = X.game(a, b, true); return o;
    },
    note: SOC_NOTE_STRENGTH + `<p><b>Format.</b> The top eight of the 36-club league phase go straight to the round of 16; 9th to 24th play two-legged playoffs (9th v 24th down to 16th v 17th), and the winners meet the top eight. Quarterfinals and semifinals are two-legged on aggregate and the final is one neutral match.</p><p><b>Limits.</b> The knockout bracket paths are simplified (the official draw restricts some pairings), and extra time and penalties are a coin flip on level aggregate. Only league-phase matches are used for the table.</p>`,
  };
}
