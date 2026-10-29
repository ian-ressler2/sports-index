/* game.js: play-by-play replays of real games and simulated games share one viewer.
   A game G = { id, sim, date, title, home, away, tot, perName(p), ev:[...] } where home/away are { id, abbr, name, color, logo, score }
   and every event is { per, clk, t, h, a, tid, tx, ctx, k, p } (t = elapsed time for the timeline, h/a = score after the play,
   k = 'sc' scoring, 'to' turnover, 'bg' big play, p = sport payload for the stage). The sport package supplies
   SPORT.loadGame(id) for real games, SPORT.sim.run(D, homeId, awayId, rng) for simulated ones and SPORT.stage.make(G) for the picture. */

/* seeded random numbers so a simulation can be shared by its seed */
function rngFrom(seed) {
  let a = 0x9e3779b9 ^ (typeof seed === 'number' ? seed : [...String(seed)].reduce((s, c) => (Math.imul(s, 31) + c.charCodeAt(0)) | 0, 7));
  const next = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = next; r.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)); r.pick = arr => arr[Math.floor(next() * arr.length)];
  r.norm = () => { let u = 0, v = 0; while (!u) u = next(); while (!v) v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  r.weighted = (items, w) => { let s = 0; for (const x of items) s += w(x); let t = next() * s; for (const x of items) { t -= w(x); if (t <= 0) return x; } return items[items.length - 1]; };
  r.chance = p => next() < p;
  return r;
}
const randSeed = () => Math.floor(Math.random() * 1e6).toString(36);
const clockSecs = s => { const m = String(s || '').match(/^(\d+):(\d{2})(?:\.\d+)?$/); return m ? +m[1] * 60 + +m[2] : (isFinite(+s) ? +s : 0); };
const gTeamColor = (D, id) => visColor(D?.teams?.get(+id)?.color || tcol(id) || '#667788');

/* win probability. normCdf is the normal curve; wpNormal turns "home leads by diff with remFrac of the game left" into the home win chance
   (sigma = spread of a full game's final margin, edge = home advantage over a full game, both in the sport's own scoring units, fat = extra late-game variance) */
function normCdf(z) { const t = 1 / (1 + .2316419 * Math.abs(z)), d = .3989423 * Math.exp(-z * z / 2), p = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function wpNormal(diff, remFrac, sigma, edge, fat = 0) {
  if (remFrac <= 0) return diff > 0 ? 1 : diff < 0 ? 0 : .5;
  /* a pure random walk is too sure of itself late: fouls, onside kicks and empty nets add variance, which fat (a share of the full-game variance) puts back */
  const v = sigma * sigma * (remFrac + fat * Math.pow(remFrac, .7) * Math.pow(1 - remFrac, 2)); return normCdf((diff + edge * remFrac) / Math.sqrt(v));
}
/* the home win chance after every play, plus the pre-game number; null when the sport has no model */
function winProbSeries(G) {
  if (!SPORT.winProb || !G.ev.length) return null;
  const ev = G.ev, start = { per: 1, clk: '', t: 0, h: 0, a: 0, tid: 0, tx: '', ctx: '', k: '', p: {} };
  const pre = clamp(SPORT.winProb(start, -1, G), .001, .999), p = ev.map((e, n) => clamp(SPORT.winProb(e, n, G), .001, .999));
  const done = G.sim || /^final/i.test(G.sub || ''), last = ev[ev.length - 1];
  if (done) p[p.length - 1] = last.h > last.a ? 1 : last.h < last.a ? 0 : .5;
  return { pre, p };
}

function gameViewer(host, G, D) {
  const ev = G.ev; if (!ev.length) { mount(host, h('div', { class: 'panel empty' }, 'No play-by-play is available for this game.')); return; }
  let i = 0, playing = false, speed = 2, timer = 0, only = '';
  const stage = SPORT.stage ? SPORT.stage.make(G, D) : null;
  const cb = cbOn(), ch = cb ? '#0072b2' : gTeamColor(D, G.home.id), ca = cb ? '#e69f00' : gTeamColor(D, G.away.id);
  /* scoreboard */
  const side = (t, c, cls) => `<div class="gtm ${cls}" style="--tc:${c}">${t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : ''}<div><div class="nm">${esc(t.name || t.abbr)}</div><div class="cap">${esc(cls === 'a' ? 'Away' : 'Home')}</div></div><div class="sc" data-s="${cls}">0</div></div>`;
  const sb = h('div', { class: 'gsb panel', html: `${side(G.away, ca, 'a')}<div class="gmid"><div class="per" data-per></div><div class="clk" data-clk></div></div>${side(G.home, ch, 'h')}` });
  const setSb = e => { sb.querySelector('[data-s=a]').textContent = e.a; sb.querySelector('[data-s=h]').textContent = e.h; sb.querySelector('[data-per]').textContent = SPORT.perName(e.per); sb.querySelector('[data-clk]').textContent = e.clk || ''; };
  /* play list */
  const rows = ev.map((e, n) => `<button class="gp${e.k ? ' ' + e.k : ''}" data-i="${n}"><span class="tm">${esc(SPORT.perName(e.per, true))} ${esc(e.clk || '')}</span><span class="tx">${esc(e.tx)}</span>${e.k === 'sc' ? `<span class="chip">${e.a}–${e.h}</span>` : ''}</button>`).join('');
  const list = h('div', { class: 'gl', html: rows });
  list.addEventListener('click', e => { const b = e.target.closest('.gp'); if (b) go(+b.dataset.i, true); });
  /* timeline of the score margin */
  const W = 640, H = 96, T = Math.max(1, G.tot || ev[ev.length - 1].t || 1), X = t => 6 + (clamp(t, 0, T) / T) * (W - 12);
  const marg = ev.map(e => e.h - e.a), mx = Math.max(3, ...marg.map(Math.abs)), Y = m => H / 2 - (m / mx) * (H / 2 - 8);
  let pts = `${X(0)},${Y(0)} `; ev.forEach((e, n) => { pts += `${X(e.t)},${Y(marg[n - 1] ?? 0)} ${X(e.t)},${Y(marg[n])} `; }); pts += `${X(T)},${Y(marg[marg.length - 1])}`;
  const divs = (G.dividers || []).map(t => `<line x1="${X(t)}" x2="${X(t)}" y1="0" y2="${H}" class="gdv"/>`).join('');
  const svgT = `<svg viewBox="0 0 ${W} ${H}" class="gtl" preserveAspectRatio="none"><defs><clipPath id="gcu"><rect x="0" y="0" width="${W}" height="${H / 2}"/></clipPath><clipPath id="gcd"><rect x="0" y="${H / 2}" width="${W}" height="${H / 2}"/></clipPath></defs>${divs}<line x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}" class="gdv"/>
    <polygon points="${pts} ${X(T)},${Y(0)}" fill="${ch}" opacity=".35" clip-path="url(#gcu)"/><polygon points="${pts} ${X(T)},${Y(0)}" fill="${ca}" opacity=".35" clip-path="url(#gcd)"/><polyline points="${pts}" fill="none" stroke="var(--fg2)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
    ${ev.map((e, n) => e.k === 'sc' ? `<circle cx="${X(e.t)}" cy="${Y(marg[n])}" r="2.6" fill="${e.tid == G.home.id ? ch : ca}"/>` : '').join('')}<line data-cur x1="0" x2="0" y1="0" y2="${H}" stroke="var(--acc)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
  const tl = h('div', { class: 'gtlw', html: svgT, tabindex: '0', role: 'slider', 'aria-label': 'Position in the game: use the arrow keys to step through plays', 'aria-valuemin': '0', 'aria-valuemax': String(Math.max(0, ev.length - 1)) });
  /* win probability chart: the home win chance after every play, with the biggest swings listed under it */
  const WP = winProbSeries(G); let wpPanel = null, wpNow = null;
  if (WP) {
    const WH = 110, Y2 = v => 4 + (1 - v) * (WH - 8); let q = `${X(0)},${Y2(WP.pre)} `; ev.forEach((e, n) => { q += `${X(e.t)},${Y2(n ? WP.p[n - 1] : WP.pre)} ${X(e.t)},${Y2(WP.p[n])} `; }); q += `${X(T)},${Y2(WP.p[WP.p.length - 1])}`;
    const svgW = `<svg viewBox="0 0 ${W} ${WH}" class="gtl gwp" preserveAspectRatio="none" role="img" aria-label="Win probability chart"><defs><clipPath id="gwu"><rect x="0" y="0" width="${W}" height="${Y2(.5)}"/></clipPath><clipPath id="gwd"><rect x="0" y="${Y2(.5)}" width="${W}" height="${WH}"/></clipPath></defs>${divs.replace(/y2="\d+"/g, `y2="${WH}"`)}
      <line x1="0" x2="${W}" y1="${Y2(.5)}" y2="${Y2(.5)}" class="gdv"/><polygon points="${q} ${X(T)},${Y2(.5)} ${X(0)},${Y2(.5)}" fill="${ch}" opacity=".35" clip-path="url(#gwu)"/><polygon points="${q} ${X(T)},${Y2(.5)} ${X(0)},${Y2(.5)}" fill="${ca}" opacity=".35" clip-path="url(#gwd)"/>
      <polyline points="${q}" fill="none" stroke="var(--fg2)" stroke-width="1.4" vector-effect="non-scaling-stroke"/><line data-wcur x1="0" x2="0" y1="0" y2="${WH}" stroke="var(--acc)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
    const wtl = h('div', { class: 'gtlw', html: svgW }); wtl.addEventListener('pointerdown', e => { drag = true; seekAt(e); }); wtl.addEventListener('pointermove', e => { if (drag) seekAt(e); });
    const swings = ev.map((e, n) => ({ n, d: WP.p[n] - (n ? WP.p[n - 1] : WP.pre) })).filter(x => Math.abs(x.d) >= .04).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 5);
    const sw = swings.length ? h('div', { class: 'gsw' }, h('div', { class: 'cap', style: { fontWeight: 600, margin: '8px 0 4px' } }, 'Biggest swings'), swings.map(({ n, d }) => { const e = ev[n], toHome = d > 0, t = toHome ? G.home : G.away; return h('button', { class: 'gswb', type: 'button', onclick: () => go(n, true), title: 'Jump to this play' }, h('b', { style: { color: toHome ? ch : ca } }, `${esc(t.abbr)} +${Math.round(Math.abs(d) * 100)}%`), h('span', { class: 'tm' }, `${SPORT.perName(e.per, true)} ${e.clk || ''}`), h('span', { class: 'tx' }, e.tx)); })) : null;
    wpNow = h('span', { class: 'cap', 'aria-live': 'off' });
    wpPanel = h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { marginBottom: '6px', flexWrap: 'wrap', gap: '6px' } }, h('h2', {}, 'Win probability'), wpNow), wtl, sw, h('div', { class: 'cap', style: { marginTop: '6px' } }, 'Estimated from the score, the time left and the situation. A simple model, not a betting line.'));
  }
  const seekAt = e => { const r = tl.getBoundingClientRect(), t = clamp((e.clientX - r.left) / r.width, 0, 1) * T; let b = 0; for (let n = 0; n < ev.length; n++) if (ev[n].t <= t) b = n; go(b, true); };
  let drag = false; tl.addEventListener('pointerdown', e => { drag = true; seekAt(e); }); addEventListener('pointerup', () => drag = false); tl.addEventListener('pointermove', e => { if (drag) seekAt(e); });
  /* controls */
  const slider = h('input', { type: 'range', min: 0, max: ev.length - 1, value: 0, class: 'gsl', 'aria-label': 'Play number', oninput: e => go(+e.target.value, true) });
  const pp = h('button', { class: 'btn pri', type: 'button', onclick: () => toggle() }, 'Play');
  const spd = h('select', { class: 'sel sm', 'aria-label': 'Speed', onchange: e => { speed = +e.target.value; } }, [[1, '1×'], [2, '2×'], [4, '4×'], [10, '10×'], [30, '30×']].map(([v, l]) => h('option', { value: v, selected: v === speed }, l)));
  const nextScore = () => { for (let n = i + 1; n < ev.length; n++) if (ev[n].k === 'sc') return go(n, true); go(ev.length - 1, true); };
  const ctrl = h('div', { class: 'gct' }, h('button', { class: 'btn sm', type: 'button', title: 'Back to the start (Home)', 'aria-label': 'Back to the start', onclick: () => go(0, true) }, '⏮'), h('button', { class: 'btn sm', type: 'button', title: 'Previous play (←)', 'aria-label': 'Previous play', onclick: () => go(i - 1, true) }, '◀'), pp,
    h('button', { class: 'btn sm', type: 'button', title: 'Next play (→)', 'aria-label': 'Next play', onclick: () => go(i + 1, true) }, '▶'), h('button', { class: 'btn sm', type: 'button', title: 'Jump to the next score', onclick: nextScore }, 'Next score ⏭'), spd, slider);
  const cap = h('div', { class: 'gcap' });
  const filt = segControl([['', 'All plays'], ['sc', 'Scoring'], ['key', 'Key plays']], only, v => { only = v; list.className = 'gl' + (v ? ' only-' + v : ''); }, 'sm');
  function update() {
    const e = ev[i]; setSb(e); stage?.show(i, e, G);
    cap.innerHTML = `<div class="ctx">${esc(e.ctx || '')}</div><div class="tx">${esc(e.tx)}</div>`;
    if (WP) { const pv = WP.p[i], c = wpPanel.querySelector('[data-wcur]'); c.setAttribute('x1', X(e.t)); c.setAttribute('x2', X(e.t)); wpNow.innerHTML = `<b style="color:${ca}">${esc(G.away.abbr)} ${Math.round((1 - pv) * 100)}%</b> · <b style="color:${ch}">${esc(G.home.abbr)} ${Math.round(pv * 100)}%</b>`; }
    slider.value = i; tl.setAttribute('aria-valuenow', String(i)); tl.setAttribute('aria-valuetext', `Play ${i + 1} of ${ev.length}: ${e.tx}`); tl.querySelector('[data-cur]').setAttribute('x1', X(e.t)); tl.querySelector('[data-cur]').setAttribute('x2', X(e.t));
    list.querySelector('.gp.cur')?.classList.remove('cur'); const b = list.children[i]; b.classList.add('cur'); const lt = b.offsetTop - list.clientHeight / 2 + b.clientHeight / 2; list.scrollTop = Math.max(0, lt);
  }
  function go(n, user) { if (user) stop(); i = clamp(n, 0, ev.length - 1); update(); }
  function stop() { playing = false; clearTimeout(timer); pp.textContent = i >= ev.length - 1 ? 'Replay' : 'Play'; }
  function tick() { if (!playing) return; if (!host.isConnected) return stop(); if (i >= ev.length - 1) return stop(); go(i + 1); const e = ev[i], big = e.k === 'sc' ? 1.8 : 1; timer = setTimeout(tick, 1100 * big / speed); }
  function toggle() { if (playing) return stop(); if (i >= ev.length - 1) i = 0; playing = true; pp.textContent = 'Pause'; update(); timer = setTimeout(tick, 900 / speed); }
  const key = e => { if (!host.isConnected) return removeEventListener('keydown', key); if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return; if (e.key === 'ArrowRight') { go(i + 1, true); e.preventDefault(); } else if (e.key === 'ArrowLeft') { go(i - 1, true); e.preventDefault(); } else if (e.key === 'Home') { go(0, true); e.preventDefault(); } else if (e.key === 'End') { go(ev.length - 1, true); e.preventDefault(); } else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { toggle(); e.preventDefault(); } };
  addEventListener('keydown', key);
  mount(host, sb, h('div', { class: 'ggrid' }, h('div', { class: 'stack' }, h('div', { class: 'panel gst' }, stage ? stage.el : null, cap, ctrl, h('div', { class: 'cap', style: { padding: '0 14px 10px' } }, 'Keyboard: ← → step through plays · space plays or pauses · Home and End jump to the start and end')), h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { marginBottom: '6px' } }, h('h2', {}, G.sim ? 'Score margin in this simulation' : 'Score margin'), h('span', { class: 'cap' }, `${esc(G.home.abbr)} ahead above the line · click to jump`)), tl), wpPanel),
    h('div', { class: 'panel gpl' }, h('div', { class: 'hd' }, h('h2', {}, 'Play by play'), filt), list)));
  update();
}

/* ---------- list of recent real games ---------- */
const ymd = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const parseYmd = n => new Date(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100);
App.pages.games = async function ({ q, D, el }) {
  const span = SPORT.gameSpan || 14, defEnd = App.season === SPORT.seasons.current ? new Date() : SPORT.seasonEnd(App.season);
  const end = q.d ? parseYmd(+q.d) : defEnd, start = new Date(end); start.setDate(start.getDate() - span + 1);
  const shift = k => { const d = new Date(end); d.setDate(d.getDate() + k * span); navTo('/games', { d: ymd(d) }); };
  const dateIn = h('input', { type: 'date', class: 'sel sm', value: end.toISOString().slice(0, 10), onchange: e => { const v = e.target.value; if (v) navTo('/games', { d: v.replaceAll('-', '') }); } });
  const bar = h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap', margin: '14px 0' } }, h('button', { class: 'btn sm', type: 'button', onclick: () => shift(-1) }, '‹ Earlier'), dateIn, h('button', { class: 'btn sm', type: 'button', onclick: () => shift(1) }, 'Later ›'), SPORT.sim ? h('a', { class: 'btn sm pri', href: href('/sim') }, 'Simulate a game') : null);
  const out = h('div', {}, loadingEl('Loading games'));
  mount(el, pageHead('GAME CENTER', 'Games', `Replay any finished ${SPORT.short} game play by play${SPORT.sim ? ', or simulate your own matchup' : ''}. ${SPORT.gamesNote || ''}`), bar, out);
  let games; try { games = await SPORT.listGames(ymd(start), ymd(end)); } catch (e) { mount(out, errorEl(e, () => render(true))); return; }
  if (!games.length) { mount(out, h('div', { class: 'panel empty' }, 'No games in this window. Try an earlier date.')); return; }
  const team = q.t ? +q.t : 0; const tsel = h('select', { class: 'sel sm', onchange: e => navTo('/games', { d: q.d, t: e.target.value || undefined }) }, h('option', { value: '' }, 'All teams'), [...D.teams.values()].sort((a, b) => a.name.localeCompare(b.name)).map(t => h('option', { value: t.id, selected: t.id === team }, t.name)));
  bar.insertBefore(tsel, bar.lastChild);
  const list = games.filter(g => !team || g.home.id === team || g.away.id === team).sort((a, b) => b.t.localeCompare(a.t));
  const byDay = new Map(); for (const g of list) { const k = g.day; (byDay.get(k) || byDay.set(k, []).get(k)).push(g); }
  const card = g => { const wa = g.final && g.away.score > g.home.score, wh = g.final && g.home.score > g.away.score; const row = (t, w) => `<div class="r${w ? ' w' : ''}">${t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : '<i></i>'}<span class="nm">${esc(t.name || t.abbr)}</span><b>${isFinite(t.score) ? t.score : ''}</b></div>`;
    return `<a class="gcard" href="${href('/game/' + g.id)}">${row(g.away, wa)}${row(g.home, wh)}<div class="cap">${esc(g.status || '')}</div></a>`; };
  mount(out, [...byDay].map(([d, gs]) => h('div', { class: 'stack', style: { marginBottom: '16px' } }, h('div', { class: 'cap', style: { fontWeight: 600 } }, new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })), h('div', { class: 'gcards', html: gs.map(card).join('') }))));
};

/* ---------- one real game ---------- */
App.pages.game = async function ({ path, D, el }) {
  const id = path[1]; mount(el, loadingEl('Loading play by play'));
  let G; try { G = await SPORT.loadGame(id, D); } catch (e) { mount(el, errorEl(e, () => render(true))); return; }
  const head = pageHead(`${G.date || ''} · REPLAY`, `${G.away.name} at ${G.home.name}`, G.sub || '', SPORT.sim ? h('a', { class: 'btn sm', href: href('/sim', { h: G.home.id, a: G.away.id }) }, 'Simulate this matchup') : null);
  const host = h('div', { class: 'stack' }); mount(el, h('div', { style: { marginBottom: '6px' } }, h('a', { class: 'cap', href: href('/games') }, '‹ All games')), head, highlightsPanel(G.videos) ? h('div', { style: { margin: '14px 0' } }, highlightsPanel(G.videos, 'Game highlights')) : null, host);
  gameViewer(host, G, D);
};

/* ---------- simulator ---------- */
App.pages.sim = async function ({ q, D, el }) {
  const teams = [...D.teams.values()].sort((a, b) => a.name.localeCompare(b.name)); let hid = +q.h || teams[0].id, aid = +q.a || teams[1].id, seed = q.x || (q.s && isNaN(+q.s) ? q.s : '') || randSeed();
  if (hid === aid) aid = teams.find(t => t.id !== hid).id;
  /* "what if" changes: players who are out, and who starts (goalie, pitcher). Kept in the link so a scenario can be shared. */
  const W = SPORT.sim.what, adj = { out: new Set(String(q.o || '').split(',').filter(Boolean)), start: Object.fromEntries(String(q.g || '').split(',').filter(Boolean).map(t => t.split(':'))) };
  const mine = () => { const on = id => id === hid || id === aid, o = [...adj.out].filter(id => W && [hid, aid].some(t => W.roster(D, t).some(r => String(r.id) === id))); return { o, g: Object.entries(adj.start).filter(([t]) => on(+t)) }; };
  const changed = () => { if (!W) return 0; const m = mine(); return m.o.length + m.g.length; };
  const Dx = () => changed() ? W.apply(D, { out: new Set(mine().o), start: Object.fromEntries(mine().g) }, hid, aid) : D;
  let ran = !!(q.x || (q.s && isNaN(+q.s)));
  const link = () => { const m = mine(); return href('/sim', { h: hid, a: aid, x: ran ? seed : undefined, o: m.o.join(','), g: m.g.map(([t, p]) => `${t}:${p}`).join(',') }); };
  const sel = (val, fn, lab) => h('label', { class: 'fld' }, h('span', { class: 'cap' }, lab), h('select', { class: 'sel', onchange: e => { fn(+e.target.value); drawWhat(); history.replaceState(null, '', link()); } }, teams.map(t => h('option', { value: t.id, selected: t.id === val }, t.name))));
  const out = h('div', { class: 'stack' }), stats = h('div', {}), whatBox = h('div', {}); const seedIn = h('input', { class: 'sel', value: seed, 'aria-label': 'Seed', style: { width: '120px', backgroundImage: 'none' }, oninput: e => { seed = e.target.value || randSeed(); } });
  const bar = h('div', { class: 'panel pad row', style: { gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', margin: '14px 0' } }, sel(aid, v => { aid = v; }, 'Away'), sel(hid, v => { hid = v; }, 'Home'), h('label', { class: 'fld' }, h('span', { class: 'cap' }, 'Seed'), seedIn),
    h('button', { class: 'btn', type: 'button', title: 'New random seed', onclick: () => { seed = randSeed(); seedIn.value = seed; run(); } }, 'Shuffle'), h('button', { class: 'btn pri', type: 'button', onclick: () => run() }, 'Simulate game'), h('button', { class: 'btn', type: 'button', onclick: () => many() }, 'Run 1,000 games'));
  mount(el, pageHead('SIMULATOR', 'Game simulator', `Pick any two ${SPORT.short} teams and play out a full game, play by play. ${SPORT.sim.blurb || ''}`), bar, whatBox, stats, out, h('details', { class: 'panel pad', style: { marginTop: '14px' } }, h('summary', {}, 'How the simulation works'), h('div', { class: 'cap', style: { marginTop: '8px', lineHeight: 1.6 }, html: SPORT.sim.note || '' })));
  function drawWhat() {
    if (!W) { whatBox.replaceChildren(); return; }
    const side = (tid, lab) => {
      const t = D.teams.get(tid), roster = W.roster(D, tid), st = W.starters ? W.starters(D, tid) : [];
      const chips = roster.map(r => { const on = adj.out.has(String(r.id)); return h('button', { class: 'chip' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', title: on ? 'Out: click to bring back' : 'Click to take out of the game', onclick: () => { if (on) adj.out.delete(String(r.id)); else adj.out.add(String(r.id)); drawWhat(); } }, r.name, r.tag ? h('small', {}, r.tag) : null, on ? h('small', {}, 'OUT') : null); });
      const stSel = st.length ? h('label', { class: 'fld', style: { marginBottom: '8px' } }, h('span', { class: 'cap' }, W.startLabel || 'Starter'), h('select', { class: 'sel', onchange: e => { if (e.target.value) adj.start[tid] = e.target.value; else delete adj.start[tid]; drawWhat(); } }, h('option', { value: '' }, 'Usual'), st.map(r => h('option', { value: r.id, selected: String(adj.start[tid]) === String(r.id) }, `${r.name}${r.note ? ' · ' + r.note : ''}`)))) : null;
      return h('div', { class: 'grow', style: { minWidth: '260px' } }, h('div', { class: 'cap', style: { fontWeight: 600, marginBottom: '6px' } }, `${t.name} (${lab})`), stSel, h('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap' } }, chips));
    };
    const n = changed();
    whatBox.replaceChildren(h('details', { class: 'panel pad', open: n > 0 ? true : null, style: { marginBottom: '14px' } }, h('summary', {}, 'What if?', n ? h('span', { class: 'pill', style: { marginLeft: '8px' } }, `${n} change${n > 1 ? 's' : ''}`) : null),
      h('div', { class: 'cap', style: { margin: '8px 0 10px', lineHeight: 1.6 } }, W.blurb || 'Take players out of the game or change who starts, then simulate to see how the odds move.'),
      h('div', { class: 'row', style: { gap: '18px', flexWrap: 'wrap', alignItems: 'flex-start' } }, side(aid, 'away'), side(hid, 'home')),
      n ? h('div', { style: { marginTop: '10px' } }, h('button', { class: 'btn sm', type: 'button', onclick: () => { adj.out.clear(); for (const k of Object.keys(adj.start)) delete adj.start[k]; drawWhat(); } }, 'Reset all changes')) : null));
    const m = mine(); setQ({ o: m.o.join(','), g: m.g.map(([t, p]) => `${t}:${p}`).join(',') });
  }
  function run() { ran = true; stats.replaceChildren(); history.replaceState(null, '', link()); const DD = Dx(), G = SPORT.sim.run(DD, hid, aid, rngFrom(`${hid}-${aid}-${seed}`)); G.sim = true; G.date = changed() ? 'SIMULATED · WHAT IF' : 'SIMULATED'; mount(out, h('div', { class: 'stack' })); gameViewer(out.firstChild, G, DD); }
  /* play N games and tally the result */
  async function tally(DD, N, key, prog) {
    const rng = rngFrom(`m${hid}-${aid}-${key}`); let hw = 0, hs = 0, as = 0, ot = 0; const diff = {};
    for (let n = 0; n < N; n++) { const G = SPORT.sim.run(DD, hid, aid, rng, { log: false }); hs += G.home.score; as += G.away.score; if (G.home.score > G.away.score) hw++; if (G.ot) ot++; const d = clamp(Math.round((G.home.score - G.away.score) / SPORT.sim.bin), -12, 12); diff[d] = (diff[d] || 0) + 1; if (n % 100 === 99) { prog && prog((n + 1) / N); await new Promise(r => setTimeout(r)); if (!stats.isConnected) return null; } }
    return { N, hw, aw: N - hw, hs, as, ot, diff };
  }
  async function many() {
    const T = id => D.teams.get(id), alt = changed() > 0, N = alt ? 2000 : 1000, note = h('div', { class: 'cap' }, 'Simulating…');
    mount(stats, h('div', { class: 'panel pad' }, note));
    const prog = (lab) => f => { note.textContent = `${lab} ${Math.round(f * 100)}%`; };
    const base = alt ? await tally(D, N, seed + 'b', prog('Usual lineups')) : null, r = await tally(Dx(), N, seed, prog(alt ? 'With your changes' : 'Simulating')); if (!r || (alt && !base)) return;
    const mxv = Math.max(...Object.values(r.diff)), bars = []; for (let d = -12; d <= 12; d++) { const v = r.diff[d] || 0; bars.push(`<rect x="${(d + 12) * 24 + 2}" y="${100 - v / mxv * 92}" width="20" height="${v / mxv * 92}" rx="2" fill="${d > 0 ? gTeamColor(D, hid) : d < 0 ? gTeamColor(D, aid) : 'var(--fg3)'}"><title>${v} games</title></rect>`); }
    const pct = x => (x * 100).toFixed(1) + '%', moe = p => 1.96 * Math.sqrt(p * (1 - p) / N) * 100;
    const tiles = [[`${T(aid).abbr} win`, pct(r.aw / N)], [`${T(hid).abbr} win`, pct(r.hw / N)], [`${T(aid).abbr} avg`, (r.as / N).toFixed(1)], [`${T(hid).abbr} avg`, (r.hs / N).toFixed(1)]];
    const cmp = alt ? (() => { const d = (r.hw - base.hw) / N * 100, se = Math.sqrt((base.hw / N) * (1 - base.hw / N) / N + (r.hw / N) * (1 - r.hw / N) / N) * 196, sig = Math.abs(d) > se; return h('div', { class: 'cap', style: { margin: '2px 0 10px', lineHeight: 1.6 }, html: `<b>${esc(T(hid).abbr)} win chance</b>: ${pct(base.hw / N)} usual → <b>${pct(r.hw / N)}</b> with your changes (${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} points). ${sig ? '' : 'That is within the noise of the simulation, so treat it as no real change. '}Each estimate is good to about ±${moe(.5).toFixed(1)} points.` }); })() : null;
    mount(stats, h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { flexWrap: 'wrap', gap: '8px' } }, h('h2', {}, `${N.toLocaleString()} simulated games${alt ? ' · what if' : ''}`), h('span', { class: 'cap' }, `${(r.ot / N * 100).toFixed(0)}% went to overtime`)),
      h('div', { class: 'tiles', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', margin: '10px 0' }, html: tiles.map(([k, v]) => `<div class="tile"><div class="k">${esc(k)}</div><div class="v">${v}</div><div class="p">&nbsp;</div></div>`).join('') }), cmp,
      h('div', { html: `<svg viewBox="0 0 604 120" style="width:100%;max-width:640px"><line x1="302" x2="302" y1="0" y2="100" stroke="var(--line2)"/>${bars.join('')}<text x="4" y="116" font-size="10" fill="var(--fg3)">${esc(T(aid).abbr)} wins by more</text><text x="600" y="116" font-size="10" text-anchor="end" fill="var(--fg3)">${esc(T(hid).abbr)} wins by more</text></svg>` })));
  }
  drawWhat();
  if (q.x || (q.s && isNaN(+q.s))) run();
};
