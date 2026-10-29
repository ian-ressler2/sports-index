/* game.js (NBA): real-game replay from ESPN's play-by-play, shown as a shot chart that fills in as the game goes on */
SPORT.perName = p => p <= 4 ? `Q${p}` : p === 5 ? 'OT' : `${p - 4}OT`;
SPORT.seasonEnd = s => new Date(s, 5, 25);
SPORT.gameSpan = 3;
SPORT.gamesNote = 'Open a game to watch every possession and see the shot chart build up shot by shot.';
const NBA_SKIP = /^(Substitution|End Period|End Game|Start Period|Start of|End of)/i;
const nbaClock = (per, clk) => { const len = per <= 4 ? 720 : 300, base = per <= 4 ? (per - 1) * 720 : 2880 + (per - 5) * 300; return base + len - Math.min(len, clockSecs(clk)); };
SPORT.gameEvents = (j, G) => {
  const ev = []; let hs = 0, as = 0;
  for (const p of j.plays || []) {
    const ty = p.type?.text || ''; if (NBA_SKIP.test(ty) || !p.text) continue;
    hs = p.homeScore ?? hs; as = p.awayScore ?? as;
    const per = p.period?.number || 1, c = p.coordinate, tid = +p.team?.id || 0, sc = !!p.scoringPlay, tx = p.text.replace(/\s+/g, ' ').trim();
    const ft = /free throw/i.test(tx), shot = !!p.shootingPlay && !ft, hasXY = shot && c && c.x >= -5 && c.x <= 55 && c.y >= -8 && c.y <= 50;
    const th = /three point/i.test(tx), turn = /turnover/i.test(ty) || /turnover|bad pass|traveling|lost ball/i.test(tx) && !shot;
    const big = sc && (th || /dunk|alley/i.test(tx)) || /block/i.test(tx) && !sc || /steal/i.test(tx);
    ev.push({ per, clk: p.clock?.displayValue || '', t: nbaClock(per, p.clock?.displayValue), h: hs, a: as, tid, tx, ctx: ty, k: sc ? 'sc' : turn ? 'to' : big ? 'bg' : '', p: { x: hasXY ? c.x : null, y: hasXY ? c.y : null, m: sc ? 1 : 0, v: sc ? (p.scoreValue || (ft ? 1 : 2)) : 0, th, ft, shot, tid } });
  }
  const maxPer = Math.max(4, ...ev.map(e => e.per));
  G.ev = ev; G.tot = 2880 + (maxPer - 4) * 300; G.dividers = [720, 1440, 2160, 2880].concat(Array.from({ length: maxPer - 4 }, (_, i) => 2880 + (i + 1) * 300)).filter(t => t < G.tot);
  return G;
};
/* the stage: a half court that collects every located shot so far (all of them are drawn toward the same basket, as in the shot chart pages) */
SPORT.stage = {
  make(G, D) {
    const ch = gTeamColor(D, G.home.id), ca = gTeamColor(D, G.away.id), col = id => id === G.home.id ? ch : ca;
    const el = h('div', { class: 'nbastage' });
    return { el, show(i, e) {
      let s = '';
      for (let n = 0; n <= i; n++) {
        const q = G.ev[n].p; if (q.x == null) continue; const [x, y] = courtXY(q), cur = n === i, c = col(q.tid), r = cur ? 1.25 : .85;
        s += q.m ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#fff" stroke-width=".25" opacity="${cur ? 1 : .8}"/>` : `<g stroke="${c}" stroke-width="${cur ? .55 : .3}" opacity="${cur ? 1 : .6}"><line x1="${x - r * .8}" y1="${y - r * .8}" x2="${x + r * .8}" y2="${y + r * .8}"/><line x1="${x - r * .8}" y1="${y + r * .8}" x2="${x + r * .8}" y2="${y - r * .8}"/></g>`;
        if (cur) s += `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="${c}" stroke-width=".4"><animate attributeName="r" from="1.5" to="4.2" dur="1.1s" repeatCount="2"/><animate attributeName="opacity" from=".9" to="0" dur="1.1s" repeatCount="2"/></circle>`;
      }
      el.innerHTML = nbaCourt(s) + `<div class="cap" style="padding:0 14px 6px;display:flex;gap:14px;flex-wrap:wrap"><span><b style="color:${ca}">●</b> ${esc(G.away.abbr)}</span><span><b style="color:${ch}">●</b> ${esc(G.home.abbr)}</span><span>filled dot = made, × = missed. Free throws have no location.</span></div>`;
    } };
  },
};
