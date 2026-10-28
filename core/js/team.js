/* team.js: standings page and team profile, driven by SPORT.standings and SPORT.team */
App.pages.teams = async function ({ D, el }) {
  const S = SPORT.standings, by = new Map();
  for (const t of D.teams.values()) { if (!D.stand.has(t.id)) continue; if (!by.has(t.div)) by.set(t.div, []); by.get(t.div).push(t); }
  const order = S.divOrder || [];
  const divs = [...by.keys()].sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99 || a.localeCompare(b));
  const cell = (c, s, t, i) => { const v = c.get ? c.get(s, t, i, D) : s[c.k]; return c.f ? fmt(v, c.f) : esc(v ?? ''); };
  const tbl = div => {
    const rows = by.get(div).sort((a, b) => S.sort(D.stand.get(b.id), b) - S.sort(D.stand.get(a.id), a));
    const body = rows.map((t, i) => { const s = D.stand.get(t.id); const mark = s.divChamp ? ' <span class="pill" style="font-size:10px" title="Division leader">DIV</span>' : (s.clinched ? ' <span class="pill" style="font-size:10px" title="In playoff position">PO</span>' : '');
      return `<tr class="clk" onclick="location.hash='${tLink(t.id)}'"><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${tbadge(D, t.id, 22)}<b>${esc(t.name)}</b>${mark}</span></td>${S.cols.map(c => `<td>${cell(c, s, t, i)}</td>`).join('')}</tr>`; }).join('');
    return h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, div)), h('div', { class: 'sc', style: { padding: '4px 4px 6px' }, html: `<table class="dt"><thead><tr><th style="text-align:left">Team</th>${S.cols.map(c => `<th title="${esc(c.desc || '')}">${esc(c.l)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>` }));
  };
  const out = [pageHead('LEAGUE', 'Standings & teams', `${seasonLabel(D)}. Click a team for its profile.`), h('div', { class: 'grid2 stgrid', style: { alignItems: 'start' } }, ...divs.map(tbl))];
  if (S.scatter) {
    const sc = S.scatter, pts = [...D.stand.values()].map(s => { const t = D.teams.get(s.id); return t ? { x: sc.x(s), y: sc.y(s), color: tcol(s.id), r: 8, label: t.abbr, id: s.id, s, t } : null; }).filter(Boolean);
    const plot = scatterSVG({ pts, xlab: sc.xlab, ylab: sc.ylab, xfmt: v => v.toFixed(sc.dec ?? 1), yfmt: v => v.toFixed(sc.dec ?? 1), trend: false, labelIdx: pts.map((_, i) => i) });
    const scEl = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, sc.title), h('span', { class: 'cap' }, sc.note || '')), h('div', { html: plot.html }));
    tipBind(scEl, i => { const p = pts[i]; return p ? `<b>${esc(p.t.name)}</b>${sc.tip(p.s).map(([k, v]) => tr(k, v)).join('')}` : ''; });
    scEl.addEventListener('click', e => { const c = e.target.closest('[data-i]'); if (c && e.pointerType !== 'touch') navTo('/team/' + pts[+c.dataset.i].id); });
    out.push(h('div', { style: { marginTop: '14px' } }, scEl));
  }
  mount(el, ...out);
};

App.pages.team = async function ({ path, D, el }) {
  const id = path[1] && /^\d+$/.test(path[1]) ? +path[1] : path[1], t = D.teams.get(id); if (!t) return pageNotFound({ el });
  const T = SPORT.team, st = D.stand.get(id) || {};
  const tilesH = T.tiles(D, id, st).map(([k, v, p]) => `<div class="tile"><div class="k"${teamTip(k)}>${k}</div><div class="v">${v}</div>${isFinite(p) ? `<div class="p"><i><b style="width:${p}%;background:${pctColor(p).replace(/,[.\d]+\)/, ',1)')}"></b></i><span>${ord(p)}</span></div>` : '<div class="p">&nbsp;</div>'}</div>`).join('');
  const rankTxt = T.rankText ? T.rankText(D, t, st) : (st.dr ? `${ord(st.dr)} in ${t.div}` : t.div);
  const header = h('div', { class: 'panel', style: { overflow: 'hidden' } }, h('div', { class: 'phead' }, h('div', { html: tbadge(D, id, 84) }), h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, `${t.lg ? t.lg + ' · ' : ''}${(t.div || '').toUpperCase()} · ${seasonLabel(D)}`), h('h1', { style: { marginTop: '6px' } }, t.name),
    h('div', { class: 'meta' }, h('span', { class: 'pill' }, rankTxt), t.venue ? h('span', { class: 'pill' }, t.venue) : null, st.streak ? h('span', { class: 'pill' }, 'Streak ' + st.streak) : null, st.divChamp ? h('span', { class: 'pill' }, 'Division champion') : null, (T.pills ? T.pills(D, t, st) : []).map(x => h('span', { class: 'pill' }, x)))),
    h('a', { class: 'btn', style: { alignSelf: 'flex-start' }, href: href('/compare/t' + id), html: ICON.swap + ' Compare' })),
    h('div', { class: 'tiles', html: tilesH }));
  const bars = T.bars.map(b => { const r = D.maps[b.g].get(id); return h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, b.title), h('span', { class: 'cap' }, `rank among ${D.lists[b.g].length} teams`)), h('div', { class: 'pbars', style: { marginTop: '8px' }, html: r ? b.keys.map(k => { const c = COLMAP[b.g][k]; if (!c || !isFinite(r[k])) return ''; return pbar(c.l, fmt(r[k], c.f), pctile(D, b.g, k, r[k]), c.src, statTip(c)); }).join('') : '' })); });
  const arc = T.arc ? h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, T.arc.title), h('span', { class: 'cap' }, T.arc.note || '')), h('div', { id: 'tarc' }, h('div', { class: 'skel', style: { height: '230px' } }))) : null;
  const hot = (g, k, v) => { const c = COLMAP[g][k]; if (!c || c.d === 0 || !isFinite(v)) return ''; const p = pctile(D, g, k, v); return isFinite(p) ? `background:${pctColor(p)}` : ''; };
  const rosters = (T.roster || []).map(R => {
    const rows = listOf(D, R.g).filter(r => String(r.tid) === String(id)).sort((a, b) => (b[R.sort] || 0) - (a[R.sort] || 0));
    const th = R.keys.map(k => `<th>${esc(COLMAP[R.g][k].l)}</th>`).join('');
    const body = rows.map(r => `<tr class="clk" onclick="location.hash='${pLink(r.id)}'"><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${avatar(r.id, r.name, 22)}<b>${esc(r.name)}</b></span></td><td class="dim">${esc(r.pos || '')}</td>${R.keys.map(k => `<td style="${hot(R.g, k, r[k])}">${fmt(r[k], COLMAP[R.g][k].f)}</td>`).join('')}</tr>`).join('');
    return h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, R.title), h('small', {}, rows.length + ' players · shading is percentile among all qualified')), h('div', { class: 'sc', style: { padding: '4px 4px 6px', maxHeight: '70vh' }, html: `<table class="dt"><thead><tr><th style="text-align:left">Player</th><th>Pos</th>${th}</tr></thead><tbody>${body || '<tr><td colspan="12" class="empty">None.</td></tr>'}</tbody></table>` }));
  });
  const left = bars.slice(0, Math.ceil(bars.length / 2)), right = [...bars.slice(Math.ceil(bars.length / 2)), arc].filter(Boolean);
  mount(el, header, h('div', { class: 'grid2', style: { alignItems: 'start', marginTop: '14px' } }, h('div', { class: 'stack' }, left), h('div', { class: 'stack' }, right)), h('div', { class: 'stack', style: { marginTop: '14px' } }, rosters));
  if (T.arc) T.arc.draw(D, id, $('#tarc'));
};
