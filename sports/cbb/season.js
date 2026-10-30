/* CBB season simulator rules: Division I men, conference tournaments for the automatic bids, 68-team NCAA tournament with a First Four */
SPORT.season = {
  sigma: 11, hfa: 3.2, k: 8, prior: .3, unit: 'points per game', metric: 'wins', dec: 1, noDiv: true,
  blurb: 'Plays out the rest of the Division I schedule thousands of times, then the conference tournaments and the 68-team NCAA tournament.',
  cols: [['made', 'NCAA', 'Chance to make the 68-team NCAA tournament (automatic bid or at-large)'], ['top', 'No. 1 seed', 'Chance to be one of the four top seeds'], ['conf', 'Final Four', 'Chance to reach the Final Four'], ['champ', 'Champion', 'Chance to win the national championship']],
  rec: s => `${s.w}-${s.l}`,
  games: (D, prog) => espnSeasonData(D, prog),
  doneNote: 'The regular season is over, so these odds replay the conference tournaments and the NCAA tournament from the final records. The real field is picked by a committee, which this page can only imitate.',
  bracket(X) {
    const out = { made: [], top: [], conf: [], champ: null }, kr = i => X.key(i), N = (a, b) => !a ? b : !b ? a : X.game(a, b, true); /* a missing team (a field smaller than 68) gives the other a walkover */
    /* conference tournaments: the top eight in each conference play a single-elimination bracket on neutral courts */
    const autos = [];
    for (const lg of X.lgs) {
      const t = X.sortLg(lg).sort((a, b) => X.cw(b) - X.cw(a) || X.key(b) - X.key(a)).slice(0, 8); /* seeded by conference wins */ if (!t.length) continue;
      const slot = [0, 7, 3, 4, 1, 6, 2, 5]; let rd = slot.map(k => t[k]); /* 1v8, 4v5, 2v7, 3v6 */
      while (rd.length > 1) { const nx = []; for (let k = 0; k < rd.length; k += 2) nx.push(rd[k] && rd[k + 1] ? N(rd[k], rd[k + 1]) : rd[k] || rd[k + 1]); rd = nx; }
      autos.push(rd[0]);
    }
    const isAuto = new Set(autos), rest = X.all().filter(i => !isAuto.has(i)), atLarge = rest.slice(0, Math.max(0, 68 - autos.length));
    const byKey = (a, b) => kr(b) - kr(a), A = autos.slice().sort(byKey), L = atLarge.slice().sort(byKey);
    const nf = Math.min(4, A.length, L.length), ffA = A.slice(A.length - nf), ffL = L.slice(L.length - nf), direct = [...A.slice(0, A.length - nf), ...L.slice(0, L.length - nf)].sort(byKey);
    out.made.push(...A, ...L);
    /* First Four: the four weakest automatic bids play for two 16 seeds, the four weakest at-large teams for two 11 seeds */
    const f16 = nf ? [N(ffA[0], ffA[nf - 1]), N(ffA[1], ffA[nf - 2])] : [], f11 = nf ? [N(ffL[0], ffL[nf - 1]), N(ffL[1], ffL[nf - 2])] : [];
    const lineSize = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 4, 4, 4, 4, 2], lines = []; let p = 0;
    for (let s = 0; s < 16; s++) { const line = direct.slice(p, p + lineSize[s]); p += lineSize[s]; if (s === 10) line.push(...f11); if (s === 15) line.push(...f16); lines.push(line.sort(byKey)); }
    out.top.push(...lines[0].filter(Boolean));
    /* four regions; each seed line is dealt out in a snake so the regions stay balanced */
    const reg = [[], [], [], []]; lines.forEach((line, s) => line.forEach((tm, k) => tm && (reg[s % 2 ? 3 - k : k][s] = tm)));
    const ord16 = 0, order = [[0, 15], [7, 8], [4, 11], [3, 12], [5, 10], [2, 13], [6, 9], [1, 14]], ff = [];
    for (const r of reg) { let rd = order.map(([a, b]) => N(r[a], r[b])); while (rd.length > 1) { const nx = []; for (let k = 0; k < rd.length; k += 2) nx.push(N(rd[k], rd[k + 1])); rd = nx; } ff.push(rd[0]); }
    out.conf.push(...ff.filter(Boolean)); out.champ = N(N(ff[0], ff[3]), N(ff[1], ff[2])); return out;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average scoring margin, adjusted for the opponents it faced and for home court, then pulled toward average. Early in the year the pull is strong, and last season counts for about a third as much as this one. Games against non-Division I teams count toward records but not ratings. Each simulated season draws every team’s true strength from a range, because ratings are uncertain.</p>
  <p><b>Games.</b> Win chance comes from the rating gap plus a home edge of about three points, against a typical game margin spread of about 11 points. Conference tournaments and the NCAA tournament are played on neutral courts.</p>
  <p><b>Tournament.</b> Each conference sends the winner of a tournament among its top eight teams in the simulated standings. The rest of the 68 are the best remaining teams by simulated record. The four weakest automatic bids play for two 16 seeds and the four weakest at-large teams for two 11 seeds. Seeds are dealt out in order of strength, 1 to 16 in four regions, then the bracket is played with 1 against 16, 8 against 9 and so on.</p>
  <p><b>Limits.</b> The real field is picked by a selection committee using NET and quality wins; here the order is each team’s simulated record, then head-to-head, conference and division record, strength of victory, strength of schedule and point differential, so a strong team from a weak conference may land differently. Conference tournaments are seeded by conference wins (ties go to the better overall ranking), and a few small conferences send fewer than eight teams. Teams that are ineligible, injuries and bracket geography are not modeled.</p>`,
};
