/* lab.js: Stat Kitchen, Zone Lab, Plot anything */
function statSelect(g, cur, onChange, { skip = () => false, cls = '' } = {}) {
  const gl = GROUPS[g]; let opts = '';
  for (const gr of gl) {
    const cs = COLS[g].filter(c => c.g === gr.id && !skip(c)); if (!cs.length) continue;
    opts += `<optgroup label="${esc(gr.l)}">${cs.map(c => `<option value="${c.k}"${c.k === cur ? ' selected' : ''}>${esc(c.l)}</option>`).join('')}</optgroup>`;
  }
  const s = h('select', { class: 'sel ' + cls, 'aria-label': 'Stat', html: opts, onchange: e => onChange(e.target.value) }); s.value = cur; return s;
}

const encIng = ing => Object.entries(ing).map(([k, w]) => `${k}:${w}`).join(',');
const decIng = (s, g) => { const o = {}; (s || '').split(',').forEach(p => { const [k, w] = p.split(':'); if (COLMAP[g][k] && isFinite(+w)) o[k] = +w; }); return o; };

function kitchen(D, q, box) {
  const pg = playerGroups(), g = pg.includes(q.g) ? q.g : pg[0], RECIPES = SPORT.lab.recipes;
  let ing = decIng(q.ing, g); if (!Object.keys(ing).length) ing = { ...RECIPES[g][0].ing };
  let ref = q.ref && COLMAP[g][q.ref] ? q.ref : SPORT.lab.ref[g], minPool = q.all === '1' ? 0 : 1;
  const out = h('div', { id: 'kout' });
  const save = () => setQ({ mode: 'kitchen', g, ing: encIng(ing), ref, all: minPool ? null : '1' });
  const compute = () => {
    let rows = minPool ? qualRows(D, g) : listOf(D, g).filter(r => !SPORT.groups[g].thr || r[SPORT.groups[g].thr.field] >= SPORT.groups[g].thr.loose);
    const keys = Object.keys(ing).filter(k => ing[k] !== 0), tot = keys.reduce((a, k) => a + Math.abs(ing[k]), 0) || 1;
    const sc = rows.map(r => { let s = 0, w = 0; for (const k of keys) { const p = pctile(D, g, k, r[k]); if (isFinite(p)) { s += Math.abs(ing[k]) * (ing[k] < 0 ? 100 - p : p); w += Math.abs(ing[k]); } } return { r, score: w >= tot * .6 ? s / w : NaN }; }).filter(x => isFinite(x.score));
    // negative weights: contribution uses inverted percentile, so score stays 0..100
    sc.sort((a, b) => b.score - a.score); sc.forEach((x, i) => x.rk = i + 1);
    const refRank = new Map(); rows.filter(r => isFinite(r[ref])).sort((a, b) => (COLMAP[g][ref].d < 0 ? a[ref] - b[ref] : b[ref] - a[ref])).forEach((r, i) => refRank.set(r.id, i + 1));
    return { sc, refRank, n: rows.length };
  };
  const drawOut = () => {
    if (!Object.keys(ing).length) { mount(out, h('div', { class: 'empty' }, 'Add at least one ingredient.')); return; }
    const { sc, refRank } = compute(); const top = sc.slice(0, 30);
    const refL = COLMAP[g][ref].l;
    const rowsH = top.map(x => { const rr = refRank.get(x.r.id), dl = rr ? rr - x.rk : NaN; return `<tr class="clk" onclick="location.hash='${pLink(x.r.id)}'"><td class="rk">${x.rk}</td><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${avatar(x.r.id, x.r.name, 24)}<b>${esc(x.r.name)}</b><span class="dim">${esc(abbrOf(D, x.r))}</span></span></td><td style="font-weight:700;background:${pctColor(x.score)}">${x.score.toFixed(1)}</td><td>${rr ? '#' + rr : '–'}</td><td><span class="delta ${dl > 3 ? 'up' : dl < -3 ? 'dn' : 'z'}">${isFinite(dl) ? (dl > 0 ? '▲' + dl : dl < 0 ? '▼' + (-dl) : '=') : ''}</span></td>${Object.keys(ing).slice(0, 4).map(k => `<td class="dim">${fmt(x.r[k], COLMAP[g][k].f)}</td>`).join('')}</tr>`; }).join('');
    const hdr = Object.keys(ing).slice(0, 4).map(k => `<th${statTip(COLMAP[g][k])}>${esc(COLMAP[g][k].l)}</th>`).join('');
    mount(out, h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'Top 30'), h('div', { class: 'row' }, h('small', {}, `${sc.length} ranked · score 0–100 is the weighted average percentile`), h('button', { class: 'btn sm', type: 'button', html: ICON.share + ' Share top 10', onclick: () => shareCard({ title: 'Stat Kitchen', sub: `${D.season} · ` + Object.keys(ing).map(k => `${ing[k]}×${COLMAP[g][k].l}`).join(' + '), rows: top.slice(0, 10).map(x => ({ name: x.r.name, team: abbrOf(D, x.r), color: tcol(x.r.tid), value: x.score.toFixed(1) })) }) }))),
      h('div', { class: 'sc', style: { padding: '4px 4px 6px', maxHeight: '75vh' }, html: `<table class="dt"><thead><tr><th>#</th><th style="text-align:left">Player</th><th>Score</th><th>${esc(refL)} rank</th><th>vs ${esc(refL)}</th>${hdr}</tr></thead><tbody>${rowsH}</tbody></table>` })));
  };
  const ingEls = h('div', { class: 'stack', style: { gap: '8px' } });
  const drawIng = () => {
    mount(ingEls, Object.keys(ing).map(k => { const c = COLMAP[g][k]; const sl = h('input', { type: 'range', min: -3, max: 3, step: .5, value: ing[k], 'aria-label': 'Weight for ' + c.l }); const wv = h('span', { class: 'w' + (ing[k] < 0 ? ' neg' : '') }, (ing[k] > 0 ? '+' : '') + ing[k]);
      sl.oninput = () => { ing[k] = +sl.value; wv.textContent = (ing[k] > 0 ? '+' : '') + ing[k]; wv.classList.toggle('neg', ing[k] < 0); save(); drawOut(); };
      return h('div', { class: 'ing' }, h('span', { 'data-tip': statTipHtml(c) }, c.l, h('span', { html: srcTag(c.src) })), h('span', { class: 'sl' }, sl), wv, h('button', { class: 'xbtn', type: 'button', 'aria-label': 'Remove', onclick: () => { delete ing[k]; save(); drawIng(); drawOut(); } }, '×')); }));
  };
  const addSel = statSelect(g, '', k => { if (k && !(k in ing)) { ing[k] = 1; save(); drawIng(); drawOut(); } addSel.value = ''; }, { skip: c => c.g === 'vol' && !['hr', 'sb'].includes(c.k) && false });
  addSel.insertAdjacentHTML('afterbegin', '<option value="" selected>+ Add an ingredient</option>'); addSel.value = '';
  const refSel = statSelect(g, ref, k => { ref = k; save(); drawOut(); });
  const rec = h('div', { class: 'chips' }, RECIPES[g].map(r => h('button', { class: 'chip', type: 'button', title: r.desc, onclick: () => { ing = { ...r.ing }; save(); drawIng(); drawOut(); } }, r.name)));
  const left = h('div', { class: 'panel pad stack', style: { gap: '14px' } }, h('div', {}, h('div', { class: 'row sb' }, h('h2', {}, 'Recipe'), pg.length > 1 ? segControl(pg.map(x => [x, SPORT.groups[x].tab || SPORT.groups[x].label]), g, v => navTo('/lab', { mode: 'kitchen', g: v }), 'sm') : null), h('p', { class: 'muted', style: { margin: '6px 0 0', fontSize: '13px' } }, 'Each ingredient is turned into a percentile among qualified players, then blended by weight. A negative weight rewards low values.')), h('div', {}, h('div', { class: 'cap', style: { marginBottom: '8px' } }, 'START FROM A RECIPE'), rec), ingEls, addSel,
    h('div', {}, h('div', { class: 'cap', style: { marginBottom: '6px' } }, 'COMPARE RANK AGAINST'), refSel), toggle('Qualified players only', !!minPool, v => { minPool = v ? 1 : 0; save(); drawOut(); }));
  mount(box, h('div', { class: 'lab2' }, left, out));
  drawIng(); drawOut();
}

/* ---- Plot anything ---- */
function plotter(D, q, box) {
  const g = SPORT.groups[q.g] ? q.g : SPORT.groupOrder[0];
  const def = SPORT.lab.plotDefaults[g];
  let x = COLMAP[g][q.x] ? q.x : def[0], y = COLMAP[g][q.y] ? q.y : def[1], qual = q.all !== '1', find = '';
  const plot = h('div', { class: 'panel pad' }), info = h('div', { class: 'cap' });
  const save = () => setQ({ mode: 'plot', g, x, y, all: qual ? null : '1' });
  const draw = () => {
    const cx = COLMAP[g][x], cy = COLMAP[g][y];
    let rows = (qual ? qualRows(D, g) : listOf(D, g).filter(r => !SPORT.groups[g].thr || r[SPORT.groups[g].thr.field] >= SPORT.groups[g].thr.loose / 2)).filter(r => isFinite(r[x]) && isFinite(r[y]));
    if (rows.length < 4) { mount(plot, h('div', { class: 'empty' }, 'Not enough data for that pair.')); return; }
    const isT = isTeamG(g), nm = r => isT ? D.teams.get(r.id)?.name : r.name, tid = r => isT ? r.id : r.tid;
    const f = find.trim().toLowerCase();
    const pts = rows.map(r => ({ x: r[x], y: r[y], color: tcol(tid(r)), r: f && nm(r).toLowerCase().includes(f) ? 9 : (isT ? 8 : 5), label: isT ? D.teams.get(r.id)?.abbr : nm(r), row: r }));
    let lab = pts.map((p, i) => i).filter(i => f ? pts[i].label.toLowerCase().includes(f) || nm(pts[i].row).toLowerCase().includes(f) : isT);
    if (!f && !isT) { const z = i => Math.abs((pts[i].x - mean(pts.map(p => p.x))) / (Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x)) || 1)) + Math.abs((pts[i].y - mean(pts.map(p => p.y))) / (Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y)) || 1)); lab = pts.map((p, i) => i).sort((a, b) => z(b) - z(a)).slice(0, 12); }
    const s = scatterSVG({ pts, xlab: cx.l, ylab: cy.l, xfmt: v => fmtv(v, cx.f), yfmt: v => fmtv(v, cy.f), labelIdx: lab });
    const el = h('div', { html: s.html }); mount(plot, el);
    info.textContent = `${pts.length} ${isT ? 'teams' : 'players'} · ${isFinite(s.r) ? 'r = ' + s.r.toFixed(2) : ''} · click a dot to open it`;
    tipBind(el, i => { const p = pts[i]; if (!p) return ''; const r = p.row; return `<b>${esc(nm(r))}</b>${isT ? '' : tr('Team', abbrOf(D, r))}${tr(cx.l, fmt(r[x], cx.f))}${tr(cy.l, fmt(r[y], cy.f))}`; });
    el.onclick = e => { const c = e.target.closest('[data-i]'); if (c && e.pointerType !== 'touch') { const r = pts[+c.dataset.i].row; navTo((isT ? '/team/' : '/player/') + r.id); } };
  };
  const fmtv = (v, f) => f === 'int' ? String(Math.round(v)) : f === 'f3' ? noLead(v.toFixed(3)) : f === 'f2' ? v.toFixed(2) : v.toFixed(1);
  const ctl = h('div', { class: 'row' },
    segControl(SPORT.groupOrder.map(x => [x, SPORT.groups[x].tab || SPORT.groups[x].label]), g, v => navTo('/lab', { mode: 'plot', g: v }), 'sm'),
    h('label', { class: 'row', style: { gap: '6px' } }, h('span', { class: 'cap' }, 'X'), statSelect(g, x, v => { x = v; save(); draw(); })),
    h('button', { class: 'btn sm', type: 'button', title: 'Swap axes', html: ICON.swap, onclick: () => { [x, y] = [y, x]; save(); render(true); } }),
    h('label', { class: 'row', style: { gap: '6px' } }, h('span', { class: 'cap' }, 'Y'), statSelect(g, y, v => { y = v; save(); draw(); })),
    isTeamG(g) ? null : toggle('Qualified', qual, v => { qual = v; save(); draw(); }),
    h('input', { class: 'fld', placeholder: 'Highlight a name', style: { width: '170px' }, oninput: debounce(e => { find = e.target.value; draw(); }, 150), 'aria-label': 'Highlight a name' }));
  mount(box, h('div', { class: 'panel', style: { padding: '12px' } }, ctl), h('div', { style: { marginTop: '14px' } }, plot, h('div', { style: { padding: '8px 4px' } }, info)));
  draw();
}

/* the groups the stat builder ranks: players, or the teams themselves in a sport that has no player stats */
const playerGroups = () => { const p = SPORT.groupOrder.filter(g => SPORT.groups[g].kind === 'player'); return p.length ? p : SPORT.groupOrder.slice(); };
App.pages.lab = async function ({ D, el, q }) {
  const extra = SPORT.lab.extra || [], all = [['kitchen', 'Stat Kitchen', 'Blend any stats into a new rating and see who wins', kitchen], ...extra.map(x => [x.id, x.title, x.desc, x.run]), ['plot', 'Plot anything', 'Any stat against any other for players or teams', plotter]];
  const mode = all.some(m => m[0] === q.mode) ? q.mode : 'kitchen';
  const box = h('div', { style: { marginTop: '16px' } });
  mount(el, pageHead('EXPERIMENTS', 'The Lab', 'Build your own metric, explore the data, or plot any two stats against each other.'),
    h('div', { class: 'modes', style: { '--n': all.length } }, all.map(([k, t, d]) => h('button', { class: 'mode' + (k === mode ? ' on' : ''), type: 'button', onclick: () => navTo('/lab', { mode: k }) }, h('b', {}, t), h('span', {}, d)))), box);
  all.find(m => m[0] === mode)[3](D, q, box);
};
