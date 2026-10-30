/* game.js (college football): real-game replay from ESPN's drive feed on the football field. Play-by-play has no coordinates, so each play is drawn from its yard line and text. */
SPORT.evVer = 1;
SPORT.playsOf = j => (j.drives?.previous || []).concat(j.drives?.current ? [j.drives.current] : []).flatMap(d => d.plays || []);
SPORT.perName = p => p <= 4 ? `Q${p}` : p === 5 ? 'OT' : `OT${p - 4}`;
SPORT.seasonEnd = s => new Date(s + 1, 0, 25);
SPORT.gameSpan = 7;
SPORT.noteRef = {}; SPORT.closeMargin = 3;
SPORT.gamesNote = 'Pick any week, then open a game to watch every snap on the field. Ranked teams show their AP number.';
const NFL_SKIP = /^(End Period|End of Half|End of Regulation|End of Game|Two-minute warning|Official Timeout|Timeout|Coin Toss|Start of|Game Start)/i;
const nflClock = (per, clk) => { const len = per <= 4 ? 900 : 600, base = per <= 4 ? (per - 1) * 900 : 3600 + (per - 5) * 600; return base + len - Math.min(len, clockSecs(clk)); };
/* where the ball is in field coordinates (0 = left goal line) given the team with the ball and its yards to the end zone */
const nflAbs = (G, team, yte) => +team === G.away.id ? 100 - yte : yte;
SPORT.gameEvents = (j, G) => {
  const ev = [], plays = SPORT.playsOf(j); let hs = 0, as = 0, drv = 0, lastOff = 0;
  const gaps = { 'left end': 'LE', 'left tackle': 'LT', 'left guard': 'LG', 'up the middle': 'M', 'right guard': 'RG', 'right tackle': 'RT', 'right end': 'RE' };
  for (const p of plays) {
    const ty = p.type?.text || ''; if (NFL_SKIP.test(ty) || !p.text) continue;
    const st = p.start || {}, en = p.end || {}; hs = p.homeScore ?? hs; as = p.awayScore ?? as;
    const off = +((p.teamParticipants || []).find(t => t.type === 'offense')?.id || st.team?.id || 0); if (off !== lastOff) { drv++; lastOff = off; }
    const tx = p.text.replace(/\s+/g, ' ').trim(), lc = tx.toLowerCase(), yds = p.statYardage || 0;
    let k = '', ek = '';
    if (/^Kickoff/.test(ty)) k = 'o'; else if (/^Punt/.test(ty)) k = 'u'; else if (/^Field Goal/.test(ty)) k = 'f';
    else if (/^Sack/.test(ty)) k = 's'; else if (/^Rush|Rushing Touchdown/.test(ty)) k = 'r'; else if (/Pass|Interception/.test(ty)) k = 'p'; else if (p.isPenalty || /^Penalty/.test(ty)) k = 'n';
    const hasS = st.yardsToEndzone != null && st.team?.id, x0 = hasS ? nflAbs(G, st.team.id, st.yardsToEndzone) : 50, x1 = en.yardsToEndzone != null && en.team?.id ? nflAbs(G, en.team.id, en.yardsToEndzone) : null;
    const td = !!p.scoringPlay && /Touchdown/.test(ty), inc = /Incompletion/.test(ty), to = !!p.isTurnover || /Interception/.test(ty);
    const dir = off === G.away.id ? 1 : -1, gap = Object.keys(gaps).find(g => lc.includes(g));
    const lane = k === 'r' ? (gap ? NF_RUN_LANE[gaps[gap]] : 0) : k === 'p' || k === 's' ? (() => { const m = lc.match(/pass (?:incomplete )?(?:short|deep)? ?(left|middle|right)/) || lc.match(/intended for/) && lc.match(/\b(left|middle|right)\b/); return m ? NF_PASS_LANE[m[1][0]] : 0; })() : 0;
    const dep = /deep/.test(lc) ? 'd' : 's';
    const P = { k, x0, x1, dir, y: yds, lane, inc, to, td, dep, dr: drv, made: /Good/.test(ty), wide: /left/i.test(tx) ? -1 : 1, dn: st.down || 0, dist: st.distance || 0, off };
    if (k === 'f') { P.y = yds; P.x0 = x0 - dir * 7; }
    const big = Math.abs(yds) >= 20 || (k === 'f' && !P.made) || to || /fumble/i.test(ty), sc = !!p.scoringPlay;
    ev.push({ per: p.period?.number || 1, clk: p.clock?.displayValue || '', t: nflClock(p.period?.number || 1, p.clock?.displayValue), h: hs, a: as, tid: off, tx, ctx: k === 'o' ? 'Kickoff' : st.downDistanceText || st.possessionText || '', k: sc ? 'sc' : to ? 'to' : big ? 'bg' : '', p: P });
  }
  /* the score the feed shows at a play is the score after it, so fill gaps from neighbours */
  G.ev = ev; G.tot = Math.max(3600, ...ev.map(e => e.t)); G.dividers = [900, 1800, 2700, 3600].filter(t => t < G.tot);
  return G;
};
/* the football field stage */
SPORT.stage = {
  make(G, D) {
    const bg = nflFieldBg({ abbr: G.away.abbr, color: gTeamColor(D, G.away.id) }, { abbr: G.home.abbr, color: gTeamColor(D, G.home.id) });
    const el = h('div', {}); el.innerHTML = `<svg class="gstage" viewBox="0 0 ${NF.W} ${NF.H}" role="img" aria-label="Football field with the current play"><g>${bg}</g><g class="fl"></g></svg>`;
    const layer = el.querySelector('.fl');
    return { el, show(i, e) {
      const P = e.p; let s = '';
      /* the drive so far, faded */
      for (let n = i - 1; n >= 0 && n > i - 14; n--) { const q = G.ev[n].p; if (q.dr !== P.dr || q.k === 'n' || !q.k) continue; s += `<g opacity=".4">${nflStroke(nflGeom(q), 3)}</g>`; }
      if (P.k) {
        const d = P.dir; if (P.k !== 'n') { const g = nflGeom(P); s += nflStroke(g, 5) + nflEnd(g); }
        if (P.k !== 'o' && P.k !== 'u' && P.k !== 'f' && P.k !== 'n') {
          s += `<line x1="${NF.X(P.x0)}" x2="${NF.X(P.x0)}" y1="14" y2="546" stroke="#4c8dff" stroke-width="4" opacity=".9"/>`;
          if (P.dist && P.dn) { const fx = clamp(P.x0 + d * P.dist, -10, 110); s += `<line x1="${NF.X(fx)}" x2="${NF.X(fx)}" y1="14" y2="546" stroke="#f5d142" stroke-width="4" opacity=".95"/>`; }
        }
        if (P.k === 'o' || P.k === 'u' || P.k === 'n') s += `<ellipse cx="${NF.X(P.x0)}" cy="${NF.CY}" rx="13" ry="8" fill="#8b4a1f" stroke="#fff" stroke-width="2"/>`;
        else s += `<ellipse cx="${NF.X(P.x0)}" cy="${NF.CY + P.lane * P.dir * NF.LANE * (P.k === 'r' ? .5 : 1)}" rx="12" ry="7.5" fill="#8b4a1f" stroke="#fff" stroke-width="2"/>`;
      }
      layer.innerHTML = s;
    } };
  },
};
/* win probability: the score margin against the time left, plus the value of who has the ball and where (expected points from the spot of the next snap) */
const nflEP = yte => Math.max(-.6, 6 * Math.pow(1 - yte / 100, 1.6) - .5);
SPORT.winProb = (e, n, G) => {
  const end = e.per <= 4 ? 3600 : 3600 + (e.per - 4) * 600; let d = e.h - e.a; const nx = G.ev[n + 1]?.p;
  if (nx && nx.k && 'rps'.includes(nx.k) && isFinite(nx.x0)) d += (nx.off === G.home.id ? 1 : -1) * nflEP(nx.dir > 0 ? 100 - nx.x0 : nx.x0);
  return wpNormal(d, Math.max(0, end - e.t) / 3600, 16, 2.5, .95);
};
