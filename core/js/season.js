/* season.js: season simulator ("Playoff odds").
   Estimates each team's strength from the scores so far, plays out the rest of the schedule thousands of times, then plays the
   postseason bracket, and reports every team's odds. Each sport supplies SPORT.season = { sigma, hfa, k, prior, unit, metric,
   key, games(D, prog), bracket(X), ... }. Everything here is sport-neutral. */

/* team strength: average margin per game against an average team, adjusted for opponent and home edge, shrunk toward 0.
   games: [{h, a, hs, as, w}] with w the weight of the game. */
function seasonRatings(ids, games, S) {
  const cap = 2.5 * S.sigma, r = new Map(ids.map(i => [i, 0])), n = new Map(ids.map(i => [i, 0]));
  for (const g of games) { n.set(g.h, n.get(g.h) + g.w); n.set(g.a, n.get(g.a) + g.w); }
  for (let it = 0; it < 16; it++) {
    const acc = new Map(ids.map(i => [i, 0]));
    for (const g of games) { const m = clamp(g.hs - g.as, -cap, cap) - S.hfa; acc.set(g.h, acc.get(g.h) + g.w * (m + r.get(g.a))); acc.set(g.a, acc.get(g.a) + g.w * (-m + r.get(g.h))); }
    for (const i of ids) r.set(i, acc.get(i) / (n.get(i) + S.k));
  }
  const mu = mean([...r.values()]); for (const i of ids) r.set(i, r.get(i) - (isFinite(mu) ? mu : 0));
  return { r, n };
}

/* play the season out N times. Resolves {rows: Map(id -> odds), rem, N} */
async function seasonSimulate(D, S, data, N, seed, prog, alive) {
  const ids = [...D.stand.keys()].filter(i => D.teams.has(i)), M = ids.length, ix = new Map(ids.map((i, k) => [i, k]));
  const games = [...data.cur.map(g => ({ ...g, w: 1 })), ...(data.prev || []).map(g => ({ ...g, w: S.prior }))].filter(g => ix.has(g.h) && ix.has(g.a) && isFinite(g.hs) && isFinite(g.as));
  const { r, n } = seasonRatings(ids, games, S);
  const R = ids.map(i => r.get(i)), SD = ids.map(i => S.sigma / Math.sqrt(n.get(i) + S.k));
  const rem = data.rem.filter(g => ix.has(g.h) && ix.has(g.a)), RH = Int16Array.from(rem, g => ix.get(g.h)), RA = Int16Array.from(rem, g => ix.get(g.a));
  const base = ids.map(i => { const s = D.stand.get(i); return { w: s.w || 0, t: s.t || 0, pts: s.pts || 0 }; });
  const team = ids.map(i => D.teams.get(i));
  const rng = rngFrom('season:' + seed), W = new Float64Array(M), T = new Float64Array(M), P = new Float64Array(M), rr = new Float64Array(M), key = new Float64Array(M);
  const tally = ids.map(() => ({ made: 0, div: 0, top: 0, conf: 0, champ: 0, sum: 0, hist: new Int32Array(200) }));
  const jit = S.metric === 'pts' ? .4 : .24;
  const lgs = [...new Set(team.map(t => t.lg))].sort(), divsOf = new Map(), allDivs = [...new Set(team.map(t => t.div))];
  for (const lg of lgs) divsOf.set(lg, [...new Set(team.filter(t => t.lg === lg).map(t => t.div))]);
  const X = {
    lgs, key: i => key[ix.get(i)],
    sortLg: lg => ids.filter(i => D.teams.get(i).lg === lg).sort((a, b) => key[ix.get(b)] - key[ix.get(a)]),
    sortDiv: dv => ids.filter(i => D.teams.get(i).div === dv).sort((a, b) => key[ix.get(b)] - key[ix.get(a)]),
    divs: lg => divsOf.get(lg).map(dv => X.sortDiv(dv)).sort((a, b) => key[ix.get(b[0])] - key[ix.get(a[0])]),
    /* the better record (the first argument is the home team) wins one game; neutral drops the home edge */
    game: (a, b, neutral) => rng() < normCdf((rr[ix.get(a)] - rr[ix.get(b)] + (neutral ? 0 : S.hfa)) / S.sigma) ? a : b,
    /* a is the better seed. pat marks who hosts each game ('H' = a at home); first to ceil(len/2) wins */
    series: (a, b, pat) => {
      const d = rr[ix.get(a)] - rr[ix.get(b)], ph = normCdf((d + S.hfa) / S.sigma), pa = normCdf((d - S.hfa) / S.sigma), need = Math.ceil(pat.length / 2); let x = 0, y = 0;
      for (let k = 0; k < pat.length && x < need && y < need; k++) { if (rng() < (pat[k] === 'H' ? ph : pa)) x++; else y++; }
      return x > y ? a : b;
    },
    hl: (a, b) => key[ix.get(a)] >= key[ix.get(b)] ? [a, b] : [b, a],
  };
  const step = Math.max(20, Math.round(N / 40));
  for (let sim = 0; sim < N; sim++) {
    for (let k = 0; k < M; k++) { rr[k] = R[k] + rng.norm() * SD[k]; W[k] = base[k].w; T[k] = base[k].t; P[k] = base[k].pts; }
    for (let g = 0; g < RH.length; g++) {
      const h = RH[g], a = RA[g], hw = rng() < normCdf((rr[h] - rr[a] + S.hfa) / S.sigma), wn = hw ? h : a, ls = hw ? a : h;
      W[wn]++; P[wn] += 2; if (S.otl && rng() < S.otl) P[ls]++;
    }
    for (let k = 0; k < M; k++) key[k] = (S.metric === 'pts' ? P[k] : W[k] + T[k] / 2) + rng() * jit;
    const out = S.bracket(X);
    for (const i of out.made) tally[ix.get(i)].made++;
    for (const i of out.top) tally[ix.get(i)].top++;
    for (const i of out.conf) tally[ix.get(i)].conf++;
    tally[ix.get(out.champ)].champ++;
    for (const dv of allDivs) { const w = X.sortDiv(dv)[0]; tally[ix.get(w)].div++; }
    for (let k = 0; k < M; k++) { const v = S.metric === 'pts' ? P[k] : W[k]; tally[k].sum += v; tally[k].hist[Math.min(199, Math.round(v))]++; }
    if ((sim + 1) % step === 0) { prog && prog((sim + 1) / N); await new Promise(res => setTimeout(res)); if (alive && !alive()) return null; }
  }
  const q = (hist, f) => { let c = 0; for (let v = 0; v < hist.length; v++) { c += hist[v]; if (c >= f * N) return v; } return 0; };
  const rows = new Map(ids.map((i, k) => { const t = tally[k]; return [i, { id: i, made: t.made / N, div: t.div / N, top: t.top / N, conf: t.conf / N, champ: t.champ / N, exp: t.sum / N, lo: q(t.hist, .1), hi: q(t.hist, .9), rating: R[k], n: n.get(i) }]; }));
  return { rows, rem: rem.length, N, games: games.length };
}

const oddsPct = p => !isFinite(p) || p <= 0 ? '–' : p >= .9995 ? '100%' : p < .001 ? '<0.1%' : p < .1 ? (p * 100).toFixed(1) + '%' : Math.round(p * 100) + '%';

App.pages.odds = async function ({ q, D, el }) {
  const S = SPORT.season; if (!S) return pageNotFound({ el });
  let N = [1000, 2000, 5000].includes(+q.n) ? +q.n : 2000, seed = q.x || 'v1'; let token = 0;
  const sizeSel = h('select', { class: 'sel sm', 'aria-label': 'Number of simulated seasons', onchange: e => { navTo('/odds', { n: e.target.value === '2000' ? undefined : e.target.value, x: q.x }); } }, [1000, 2000, 5000].map(n => h('option', { value: n, selected: n === N }, `${n.toLocaleString()} seasons`)));
  const again = h('button', { class: 'btn sm pri', type: 'button', onclick: () => navTo('/odds', { n: q.n, x: randSeed() }) }, 'Run again');
  const out = h('div', { class: 'stack' }, loadingEl('Loading the schedule'));
  mount(el, pageHead('SEASON SIMULATOR', 'Playoff odds', `${seasonLabel(D)}. ${S.blurb}`, h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } }, sizeSel, again)), out);
  const my = ++token, alive = () => my === token && out.isConnected;
  let data; try { data = await S.games(D, f => { const m = $('#lmsg'); if (m && alive()) m.textContent = `Loading the schedule (${Math.round(f * 100)}%)`; }); } catch (e) { mount(out, errorEl(e, () => render(true))); return; }
  if (!alive()) return;
  if (D.final) data.rem = [];
  const bar = h('div', { class: 'meter' }, h('i', { style: { width: '0%' } })), info = h('div', { class: 'cap' }, 'Simulating');
  mount(out, h('div', { class: 'panel pad' }, info, bar));
  let res; try { res = await seasonSimulate(D, S, data, N, seed, f => { bar.firstChild.style.width = Math.round(f * 100) + '%'; info.textContent = `Simulating ${N.toLocaleString()} seasons… ${Math.round(f * 100)}%`; }, alive); } catch (e) { mount(out, errorEl(e, () => render(true))); return; }
  if (!res) return;
  const lgs = [...new Set([...D.teams.values()].filter(t => res.rows.has(t.id)).map(t => t.lg))].sort();
  const cols = [['made', 'Playoffs', 'Chance to make the playoffs' + (S.madeNote || '')], ['div', 'Division', 'Chance to finish first in the division'], ['top', S.topLabel, S.topDesc], ['conf', S.finalLabel, 'Chance to reach the championship round'], ['champ', 'Title', 'Chance to win the championship']];
  const cell = (p, k) => `<td${k === 'div' || k === 'top' ? ' class="opt"' : ''}><span class="odd${k === 'champ' ? ' ch' : ''}"><i style="width:${(p * 100).toFixed(1)}%"></i><b>${oddsPct(p)}</b></span></td>`;
  const table = lg => {
    const rows = [...res.rows.values()].filter(r => D.teams.get(r.id).lg === lg).sort((a, b) => b.made - a.made || b.champ - a.champ || b.exp - a.exp);
    const body = rows.map(r => { const t = D.teams.get(r.id), s = D.stand.get(r.id);
      return `<tr class="clk" onclick="location.hash='${tLink(r.id)}'"><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${tbadge(D, r.id, 22)}<b>${esc(t.name)}</b></span></td><td>${esc(S.rec(s))}</td><td class="opt" title="${esc(`Rating ${r.rating >= 0 ? '+' : ''}${r.rating.toFixed(2)} ${S.unit} against an average team`)}">${r.rating >= 0 ? '+' : ''}${r.rating.toFixed(S.dec ?? 1)}</td><td class="opt" title="${esc(`Middle 80% of simulated seasons: ${r.lo} to ${r.hi}`)}">${r.exp.toFixed(S.metric === 'pts' ? 0 : 1)}</td>${cols.map(([k]) => cell(r[k], k)).join('')}</tr>`; }).join('');
    return h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, lg)), h('div', { class: 'sc', style: { padding: '4px 4px 6px' }, html: `<table class="dt odds"><thead><tr><th style="text-align:left">Team</th><th title="Record so far">Record</th><th class="opt" title="Estimated strength: average ${esc(S.unit)} against an average team, after adjusting for opponents and home edge">Rating</th><th class="opt" title="Projected final ${S.metric === 'pts' ? 'points' : 'wins'}">${S.metric === 'pts' ? 'Proj. pts' : 'Proj. wins'}</th>${cols.map(([k, l, d]) => `<th${k === 'div' || k === 'top' ? ' class="opt"' : ''} title="${esc(d)}">${esc(l)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>` }));
  };
  const done = D.final || !res.rem;
  mount(out,
    h('div', { class: 'cap', style: { lineHeight: 1.6 } }, done ? `The regular season is complete, so these odds replay the postseason from the real seeds ${N.toLocaleString()} times.` : `${res.rem.toLocaleString()} regular-season games left, played out ${N.toLocaleString()} times from today’s standings.`),
    ...lgs.map(table),
    h('details', { class: 'panel pad' }, h('summary', {}, 'How the odds are made'), h('div', { class: 'cap', style: { marginTop: '8px', lineHeight: 1.6 }, html: S.note })));
};
