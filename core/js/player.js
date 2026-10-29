/* player.js: player profile shell, Overview and Stats tabs. Everything sport-specific comes from SPORT.player. */
const statCol = (role, k) => COLMAP[role][k];
const pctText = p => isFinite(p) ? ord(p) : '';
function tileHTML(D, role, r, k) {
  const c = statCol(role, k), v = r[k], p = c.d !== 0 ? pctile(D, role, k, v) : NaN;
  return `<div class="tile"><div class="k"${statTip(c)}>${esc(c.l)}</div><div class="v">${fmt(v, c.f)}</div>${c.d !== 0 ? `<div class="p"><i><b style="width:${isFinite(p) ? p : 0}%;background:${pctColor(p).replace(/,[.\d]+\)/, ',1)')}"></b></i><span>${pctText(p)}</span></div>` : '<div class="p">&nbsp;</div>'}</div>`;
}
function pctRows(D, role, r, keys) {
  return keys.map(k => { const c = statCol(role, k); if (!c) return null; const v = r[k]; if (!isFinite(v)) return null; const p = pctile(D, role, k, v); return { k, c, v, p }; }).filter(Boolean);
}

App.pages.player = async function ({ path, q, D, el }) {
  const P = SPORT.player, id = +path[1]; if (!id) return pageNotFound({ el });
  mount(el, loadingEl('Loading player'));
  const bio = await (P.bio ? P.bio(id).catch(() => null) : null);
  const roles = P.roles(D, id), listed = D.players.get(id);
  const name = bio?.fullName || bio?.displayName || listed?.name || 'Player';
  if (!roles.length) {
    const seasons = P.seasonsPlayed ? await P.seasonsPlayed(id).catch(() => []) : [];
    mount(el, h('div', { class: 'panel' }, h('div', { class: 'phead' }, h('div', { html: avatar(id, name, 88) }), h('div', {}, h('div', { class: 'eyebrow' }, 'NO ' + SPORT.seasons.label(D.season) + ' DATA'), h('h1', {}, name), h('div', { class: 'meta' }, (P.bioPills ? P.bioPills(bio, null, null, D) : []).map(x => h('span', { class: 'pill' }, x)))))),
      h('div', { class: 'panel pad', style: { marginTop: '14px' } }, h('h2', {}, `${name} has no ${SPORT.seasons.label(D.season)} line`), h('p', { class: 'muted' }, seasons.length ? 'Try one of the seasons played:' : 'No seasons found for this player.'), h('div', { class: 'chips' }, seasons.filter(s => s >= SPORT.seasons.first).sort((a, b) => b - a).map(s => h('a', { class: 'chip', href: '#/player/' + id + (s === App.defSeason ? '' : '?s=' + s) }, SPORT.seasons.label(s))))));
    return;
  }
  const role = roles.includes(q.role) ? q.role : roles[0];
  const r = D.maps[role].get(id), team = D.teams.get(r.tid);
  const TABS = P.tabs, tab = TABS.some(t => t[0] === q.tab) ? q.tab : 'overview';
  const go = patch => { const nq = { ...q, ...patch }; if (nq.tab === 'overview') delete nq.tab; navTo('/player/' + id, nq); };
  const tiles = P.tiles[role].map(k => tileHTML(D, role, r, k)).join('');
  const header = h('div', { class: 'panel', style: { overflow: 'hidden' } },
    h('div', { class: 'phead' }, h('div', { html: avatar(id, name, 92, true) }), h('div', { class: 'grow' },
      h('div', { class: 'eyebrow' }, `${P.roleName[role]} · ${seasonLabel(D)}`), h('h1', { style: { marginTop: '6px' } }, name),
      h('div', { class: 'meta' }, h('span', { html: team ? `<span class="row" style="gap:7px;flex-wrap:nowrap">${tbadge(D, team.id, 22)}<a href="${tLink(team.id)}" style="font-weight:550">${esc(team.name)}</a></span>` : '' }), h('span', { class: 'pill' }, P.roleLine(role, r)),
        (P.bioPills ? P.bioPills(bio, r, role, D) : []).map(x => h('span', { class: 'pill' }, x)), r.nt > 1 ? h('span', { class: 'pill' }, `${r.nt} teams`) : null)),
      h('div', { class: 'stack', style: { alignSelf: 'flex-start', alignItems: 'flex-end', gap: '8px' } }, h('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' } }, watchBtn('p', id), h('button', { class: 'btn sm', type: 'button', html: ICON.cardimg + ' <span>Card</span>', title: 'Make a shareable picture of this player', onclick: () => openPlayerCard({ D, id, role, r, name, team }) }), h('a', { class: 'btn sm', href: href('/compare/' + id), html: ICON.swap + ' Compare' })), roles.length > 1 ? segControl(roles.map(g => [g, SPORT.groups[g].tab || SPORT.groups[g].label]), role, v => go({ role: v }), 'sm') : null)),
    h('div', { class: 'tiles', html: tiles }));
  const tabsEl = h('div', { class: 'tabs panel', style: { marginTop: '14px', padding: '0 10px' } }, TABS.map(([k, l]) => h('button', { class: tab === k ? 'on' : '', type: 'button', onclick: () => go({ tab: k }) }, l)));
  const body = h('div', { style: { marginTop: '14px' } }, loadingEl('Loading'));
  mount(el, header, tabsEl, body);
  const build = (P.build && P.build[tab]) || { overview: tabOverview, stats: tabStats }[tab];
  try { mount(body, await build({ D, id, role, r, name, bio, q })); } catch (e) { console.error(e); mount(body, errorEl(e, () => render(true))); }
};

/* ---- Overview ---- */
async function tabOverview({ D, id, role, r, name }) {
  const P = SPORT.player, rows = pctRows(D, role, r, P.pct[role]);
  const bars = rows.map(x => pbar(x.c.l, fmt(x.v, x.c.f), x.p, x.c.src, statTip(x.c))).join('');
  const rad = (P.radar[role] || []).map(([k, l]) => [l, pctile(D, role, k, r[k])]);
  const sorted = rows.filter(x => x.c.d !== 0).slice().sort((a, b) => b.p - a.p);
  const best = sorted.filter(x => x.p >= 75).slice(0, 4), worst = sorted.filter(x => x.p <= 30).slice(-4).reverse();
  const chip = x => `<span class="pill" style="margin:0 6px 6px 0;background:${pctColor(x.p)};color:#fff">${esc(x.c.l)} ${fmt(x.v, x.c.f)} · ${pctText(x.p)}</span>`;
  const qual = isQual(D, role, r), gm = SPORT.groups[role];
  const left = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, 'Percentile rankings'), h('span', { class: 'cap' }, `vs ${qualRows(D, role).length} qualified ${gm.plural.toLowerCase()}`)), h('div', { class: 'pbars', style: { marginTop: '8px' }, html: bars }),
    qual ? null : h('p', { class: 'cap', style: { marginTop: '10px' } }, `Below the qualifying minimum (${gm.qualText(D)}). Percentiles compare against qualified players.`));
  const right = [];
  if (rad.length > 2) right.push(h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, 'Shape'), h('span', { class: 'cap' }, 'percentiles, farther out is better')), h('div', { style: { maxWidth: '400px', margin: '0 auto' }, html: radar({ labels: rad.map(x => x[0]), series: [{ name, color: 'var(--acc)', vals: rad.map(x => x[1]) }] }) })));
  const strengths = (h('div', { class: 'panel pad' }, h('h2', {}, 'Strengths and weaknesses'), h('div', { style: { marginTop: '10px' } }, h('div', { class: 'cap', style: { marginBottom: '8px' } }, 'AT THEIR BEST'), h('div', { html: best.length ? best.map(chip).join('') : '<span class="dim">No standout percentiles.</span>' })), h('div', { style: { marginTop: '8px' } }, h('div', { class: 'cap', style: { marginBottom: '8px' } }, 'LEAST FAVORABLE'), h('div', { html: worst.length ? worst.map(chip).join('') : '<span class="dim">No notable weak spots.</span>' }))));
  if (P.arc) { const box = h('div', { id: 'arc' }, h('div', { class: 'skel', style: { height: '200px' } })); right.push(h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, P.arc.title(role)), h('span', { class: 'cap' }, P.arc.note(role))), box)); setTimeout(() => P.arc.draw(D, id, role, box), 0); }
  return h('div', { class: 'grid2', style: { alignItems: 'start' } }, h('div', { class: 'stack' }, left, strengths), h('div', { class: 'stack' }, right));
}

/* ---- Stats ---- */
async function tabStats({ D, id, role, r }) {
  const groups = GROUPS[role], cols = COLS[role], n = qualRows(D, role).length;
  let rowsH = '';
  for (const gr of groups) {
    const cs = cols.filter(c => c.g === gr.id && isFinite(r[c.k])); if (!cs.length) continue;
    rowsH += `<tr><td colspan="5" style="background:var(--bg3);font:600 10.5px var(--f-mono);letter-spacing:.14em;color:var(--fg3);text-align:left">${esc(gr.l.toUpperCase())}</td></tr>`;
    for (const c of cs) {
      const v = r[c.k], p = c.d !== 0 ? pctile(D, role, c.k, v) : NaN, rk = c.d !== 0 ? rankOf(D, role, c.k, v) : NaN, av = leagueAvg(D, role, c.k);
      rowsH += `<tr><td${statTip(c)}>${esc(c.l)}${srcTag(c.src)}</td><td style="font-weight:700">${fmt(v, c.f)}</td><td style="width:160px;text-align:left">${isFinite(p) ? `<div style="display:flex;align-items:center;gap:8px"><i style="flex:1;height:6px;border-radius:9px;background:var(--bg4);overflow:hidden;display:block"><b style="display:block;height:100%;width:${p}%;background:${pctColor(p).replace(/,[.\d]+\)/, ',1)')}"></b></i><span style="min-width:24px;text-align:right">${p}</span></div>` : ''}</td><td class="dim">${isFinite(rk) ? '#' + rk + ' of ' + n : ''}</td><td class="dim">${isFinite(av) ? fmt(av, c.f) : ''}</td></tr>`;
    }
  }
  const tbl = h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, `${SPORT.seasons.label(D.season)} stat sheet`), h('small', {}, 'rank and average are among qualified players')), h('div', { class: 'sc', style: { padding: '8px 4px 4px', maxHeight: '70vh' }, html: `<table class="dt"><thead><tr><th>Stat</th><th>Value</th><th style="text-align:left">Percentile</th><th>Rank</th><th>Qualified avg</th></tr></thead><tbody>${rowsH}</tbody></table>` }));
  const out = [tbl];
  if (SPORT.player.career) { const c = await SPORT.player.career(D, id, role).catch(() => null); if (c && c.rows.length) out.push(h('div', { class: 'panel', style: { marginTop: '14px' } }, h('div', { class: 'hd' }, h('h2', {}, c.title || 'Career by season'), h('small', {}, c.note || '')), h('div', { class: 'sc', style: { padding: '8px 4px 4px' }, html: `<table class="dt"><thead><tr>${c.head.map((x, i) => `<th style="${i < (c.left || 2) ? 'text-align:left' : ''}">${esc(x)}</th>`).join('')}</tr></thead><tbody>${c.rows.map(rw => `<tr class="${rw.season && rw.season !== D.season ? 'clk' : ''}" ${rw.season && rw.season !== D.season ? `onclick="location.hash='#/player/${id}?s=${rw.season}'"` : ''}>${rw.cells.map((x, i) => `<td style="${i < (c.left || 2) ? 'text-align:left' : ''}">${x}</td>`).join('')}</tr>`).join('')}</tbody></table>` }))); }
  return h('div', {}, out);
}
