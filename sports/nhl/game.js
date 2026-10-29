/* game.js (NHL): real-game replay from ESPN's play-by-play, drawn on a full rink. Shots, goals, hits and faceoffs have coordinates. */
SPORT.perName = (p, short) => p <= 3 ? `P${p}` : p === 4 ? 'OT' : p === 5 ? 'SO' : `${p - 3}OT`;
SPORT.seasonEnd = s => new Date(s, 5, 25);
SPORT.gameSpan = 3;
SPORT.gamesNote = 'Open a game to see every shot, hit and goal placed on the ice as it happened.';
const NHL_NONPEN = /^(Face Off|Hit|Blocked|Giveaway|Stoppage|Missed|Shot|Takeaway|Goal|Closing Hand|Shootout|Challenge|Official|Timeout|Delayed|Video)/i;
const NHL_SKIP = /^(Period Start|Period End|End Period|Game End|Game Start|Start of|End of|Shootout (Start|End))/i;
SPORT.gameEvents = (j, G) => {
  const raw = (j.plays || []).filter(p => p.text && !NHL_SKIP.test(p.type?.text || ''));
  const len = {}; for (const p of raw) { const n = p.period?.number || 1; len[n] = Math.max(len[n] || 0, n <= 3 ? 1200 : 300, clockSecs(p.clock?.displayValue)); }
  const base = {}; let acc = 0; for (const n of Object.keys(len).map(Number).sort((a, b) => a - b)) { base[n] = acc; acc += n === 5 ? 60 : len[n]; }
  const ev = []; let hs = 0, as = 0;
  for (const p of raw) {
    const ty = p.type?.text || '', per = p.period?.number || 1; hs = p.homeScore ?? hs; as = p.awayScore ?? as;
    const c = p.coordinate, okc = c && isFinite(c.x) && isFinite(c.y) && Math.abs(c.x) <= 110 && Math.abs(c.y) <= 50, tx = p.text.replace(/\s+/g, ' ').trim();
    const so = per === 5, t = so ? base[5] + ev.filter(e => e.per === 5).length : base[per] + len[per] - Math.min(len[per], clockSecs(p.clock?.displayValue));
    const kind = ty === 'Goal' ? 'G' : ty === 'Shot' ? 'S' : ty === 'Missed' ? 'M' : ty === 'Blocked' ? 'B' : '';
    ev.push({ per, clk: so ? '' : p.clock?.displayValue || '', t, h: hs, a: as, tid: +p.team?.id || 0, tx, ctx: ty, k: p.scoringPlay ? 'sc' : ty && !NHL_NONPEN.test(ty) ? 'bg' : '', p: { kind, x: okc ? c.x : null, y: okc ? c.y : null, ty, tid: +p.team?.id || 0 } });
  }
  G.ev = ev; G.tot = acc || 3600; G.dividers = [1200, 2400, 3600].filter(t => t < G.tot); return G;
};
function nhlFullRink(inner) {
  const L = 'stroke="var(--line2)" fill="none" stroke-width=".35"', R = '#d6455d', B = '#3a7ae0';
  return `<svg viewBox="-1 -1 202 87" class="gstage" role="img" aria-label="Ice rink with the current play">
<rect x="0" y="0" width="200" height="85" rx="28" fill="var(--bg3)" stroke="var(--line2)" stroke-width=".7"/>
<line x1="100" y1="0" x2="100" y2="85" stroke="${R}" stroke-width="1.1" opacity=".75"/><line x1="75" y1="0" x2="75" y2="85" stroke="${B}" stroke-width="1.1" opacity=".6"/><line x1="125" y1="0" x2="125" y2="85" stroke="${B}" stroke-width="1.1" opacity=".6"/>
<line x1="11" y1="4" x2="11" y2="81" stroke="${R}" stroke-width=".4" opacity=".8"/><line x1="189" y1="4" x2="189" y2="81" stroke="${R}" stroke-width=".4" opacity=".8"/>
<path d="M11 36.5A6 6 0 0 1 11 48.5Z" fill="rgba(92,200,255,.2)" stroke="${R}" stroke-width=".3"/><path d="M189 36.5A6 6 0 0 0 189 48.5Z" fill="rgba(92,200,255,.2)" stroke="${R}" stroke-width=".3"/>
<g ${L}><circle cx="100" cy="42.5" r="15"/><circle cx="31" cy="20.5" r="15"/><circle cx="31" cy="64.5" r="15"/><circle cx="169" cy="20.5" r="15"/><circle cx="169" cy="64.5" r="15"/></g>
<g fill="${R}" opacity=".6"><circle cx="100" cy="42.5" r="1"/><circle cx="31" cy="20.5" r="1"/><circle cx="31" cy="64.5" r="1"/><circle cx="169" cy="20.5" r="1"/><circle cx="169" cy="64.5" r="1"/></g>${inner}</svg>`;
}
SPORT.stage = {
  make(G, D) {
    const ch = gTeamColor(D, G.home.id), ca = gTeamColor(D, G.away.id), col = id => id === G.home.id ? ch : ca;
    const el = h('div', {});
    return { el, show(i, e) {
      let s = '';
      for (let n = 0; n <= i; n++) {
        const q = G.ev[n].p; if (q.x == null || !q.kind) continue; const x = clamp(q.x, -100, 100) + 100, y = 42.5 + clamp(q.y, -42.5, 42.5), c = col(q.tid), cur = n === i;
        if (q.kind === 'G') s += `<circle cx="${x}" cy="${y}" r="${cur ? 2.8 : 2.1}" fill="${c}" stroke="#fff" stroke-width=".5"/><circle cx="${x}" cy="${y}" r="${cur ? 4.6 : 3.6}" fill="none" stroke="${c}" stroke-width=".5" opacity=".7"/>`;
        else if (q.kind === 'S') s += `<circle cx="${x}" cy="${y}" r="${cur ? 2 : 1.25}" fill="${c}" opacity="${cur ? 1 : .6}"/>`;
        else if (q.kind === 'M') s += `<circle cx="${x}" cy="${y}" r="${cur ? 2 : 1.25}" fill="none" stroke="${c}" stroke-width=".45" opacity="${cur ? 1 : .6}"/>`;
        else s += `<g stroke="${c}" stroke-width=".45" opacity="${cur ? 1 : .55}"><line x1="${x - 1.2}" y1="${y - 1.2}" x2="${x + 1.2}" y2="${y + 1.2}"/><line x1="${x - 1.2}" y1="${y + 1.2}" x2="${x + 1.2}" y2="${y - 1.2}"/></g>`;
      }
      const c = e.p;
      if (c.x != null) { const x = clamp(c.x, -100, 100) + 100, y = 42.5 + clamp(c.y, -42.5, 42.5), cl = col(c.tid) || 'var(--acc)'; s += `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="${cl}" stroke-width=".6"><animate attributeName="r" from="2" to="6.5" dur="1.1s" repeatCount="2"/><animate attributeName="opacity" from=".9" to="0" dur="1.1s" repeatCount="2"/></circle>`; if (!c.kind) s += `<circle cx="${x}" cy="${y}" r="1.4" fill="${cl}" stroke="#fff" stroke-width=".4"/>`; }
      el.innerHTML = nhlFullRink(s) + `<div class="cap" style="padding:6px 14px 4px;display:flex;gap:14px;flex-wrap:wrap"><span><b style="color:${ca}">●</b> ${esc(G.away.abbr)}</span><span><b style="color:${ch}">●</b> ${esc(G.home.abbr)}</span><span>big dot = goal, solid = shot on goal, ring = missed, × = blocked</span></div>`;
    } };
  },
};
/* win probability: goals are rare, so the spread of a final margin is only about 2.4 goals; a tie after 60 minutes is a coin flip in overtime */
SPORT.winProb = e => { const end = e.per <= 3 ? 3600 : e.per === 4 ? 3900 : 3960; return wpNormal(e.h - e.a, Math.max(0, end - e.t) / 3600, 2.4, .15, .17); };
