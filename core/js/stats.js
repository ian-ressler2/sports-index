/* stats.js: leaderboards */
const statTabs = () => SPORT.groupOrder.map(g => [g, SPORT.groups[g].tab || SPORT.groups[g].label]);

function playerCellHTML(D, g, r) {
  if (isTeamG(g)) { const t = D.teams.get(r.id); return `<div class="pc">${tbadge(D, r.id, 32)}<div><b>${esc(t.name)}</b><small>${esc(t.div || '')}</small></div></div>`; }
  const t = D.teams.get(r.tid); const gm = SPORT.groups[g]; let role = gm.roleOf ? gm.roleOf(r) : (r.pos || '');
  return `<div class="pc">${avatar(r.id, r.name, 32)}<div><b>${esc(r.name)}</b><small>${esc(t?.abbr || '')} · ${esc(role)}${r.nt > 1 ? ' · ' + r.nt + ' tms' : ''}</small></div></div>`;
}

App.pages.stats = async function ({ path, q, D, el }) {
  const g = SPORT.groups[path[1]] ? path[1] : SPORT.groupOrder[0];
  const meta = SPORT.groups[g], isTeam = meta.kind === 'team', groups = GROUPS[g], sitOK = !!SPORT.sit && !isTeam && meta.situ !== false;
  const S = {
    sort: q.sort || meta.sort, dir: q.dir || (meta.dir < 0 ? 'desc' : 'asc'), situ: q.situ || '', qual: q.qual !== '0', min: +q.min || 0, f: q.f || '', pos: q.pos || '', team: q.team || '',
    vp: q.vp === 'p' ? 'p' : 'v', shade: q.shade !== '0', n: +q.n || 100, sitRows: null, sitLoading: false,
    groups: new Set(q.groups ? q.groups.split(',') : groups.filter(x => x.on).map(x => x.id)),
  };
  const sync = () => setQ({ sort: S.sort === meta.sort ? '' : S.sort, dir: S.dir === (meta.dir < 0 ? 'desc' : 'asc') ? '' : S.dir, situ: S.situ, qual: S.qual ? '' : '0', min: S.min || '', f: S.f, pos: S.pos, team: S.team, vp: S.vp === 'p' ? 'p' : '', shade: S.shade ? '' : '0', n: S.n === 100 ? '' : S.n, groups: groups.filter(x => x.on).map(x => x.id).join(',') === [...S.groups].join(',') ? '' : [...S.groups].join(',') });

  const SIT_LABEL = SPORT.sit?.label || {};
  const tabs = segControl(statTabs(), g, v => navTo('/stats/' + v));
  const head = pageHead(`LEADERBOARDS · ${seasonLabel(D)}`, meta.label, null, tabs);

  /* toolbar */
  const tb = h('div', { class: 'toolbar' });
  const sitRow = h('div', { class: 'sit' }); const ctlRow = h('div', { class: 'row' });
  const twrap = h('div', { class: 'tw' }), noteEl = h('div', { class: 'note' }, sourceNote());
  const panel = h('div', { class: 'panel' }, tb, twrap, noteEl);

  function sitUI() {
    if (!sitOK) return;
    const SIT_QUICK = SPORT.sit.quick, SIT_ALL = SPORT.sit.all;
    const items = [h('span', { class: 'lab' }, 'SITUATION')];
    SIT_QUICK.forEach(s => items.push(h('button', { class: 'chip' + (S.situ === s.id ? ' on' : ''), type: 'button', onclick: () => setSit(S.situ === s.id ? '' : s.id) }, s.l)));
    const menu = h('div', { class: 'menu', style: { display: 'none', minWidth: '300px' } });
    SIT_ALL.forEach(grp => { menu.append(h('div', { class: 'mh' }, grp.h)); grp.items.forEach(([c, l]) => menu.append(h('button', { class: S.situ === c ? 'on' : '', type: 'button', onclick: () => { menu.style.display = 'none'; setSit(c); } }, h('span', {}, l)))); });
    const inList = SIT_QUICK.some(s => s.id === S.situ);
    const btn = h('button', { class: 'chip' + (S.situ && !inList ? ' on' : ''), type: 'button', onclick: () => { menu.style.display = menu.style.display === 'none' ? '' : 'none'; }, html: `${ICON.filter.replace('<svg', '<svg width="14" height="14"')} ${S.situ && !inList ? esc(SIT_LABEL[S.situ] || S.situ) : 'All filters'}` });
    document.addEventListener('click', function f(e) { if (!document.body.contains(btn)) return document.removeEventListener('click', f); if (!btn.parentElement.contains(e.target)) menu.style.display = 'none'; });
    items.push(h('div', { class: 'pop' }, btn, menu));
    if (S.situ) items.push(h('span', { class: 'dim mono', style: { fontSize: '11.5px' } }, 'Standard stats only for situational splits'));
    mount(sitRow, items);
  }
  async function setSit(code) {
    S.situ = code; S.sitRows = null; sync(); sitUI(); ctlUI();
    if (code) { S.sitLoading = true; draw(); try { S.sitRows = await SPORT.sit.load(D, g, code); } catch (e) { S.sitRows = []; toast('Could not load that split'); } S.sitLoading = false; }
    S.min = S.situ ? (S.min || meta.sitMin || 40) : S.min; draw();
  }
  function ctlUI() {
    const kids = [];
    kids.push(h('input', { class: 'fld', placeholder: isTeam ? 'Filter teams' : 'Filter players or teams', value: S.f, style: { width: '210px' }, 'aria-label': 'Filter', oninput: debounce(e => { S.f = e.target.value; S.n = 100; sync(); draw(); }, 120) }));
    if (!isTeam) {
      const thr = S.situ ? (meta.sitThr?.label || meta.thr.label) : meta.thr.label;
      if (!S.situ) kids.push(toggle(h('span', {}, 'Qualified ', h('span', { class: 'mono dim' }, meta.qualText(D))), S.qual, v => { S.qual = v; S.n = 100; sync(); ctlUI(); draw(); }));
      if (S.situ || !S.qual) kids.push(h('label', { class: 'row', style: { gap: '6px', color: 'var(--fg2)' } }, `Min ${thr}`, h('input', { class: 'fld', type: 'number', min: 0, value: S.min || (S.situ ? 40 : 0), style: { width: '78px' }, oninput: debounce(e => { S.min = +e.target.value || 0; S.n = 100; sync(); draw(); }, 150) })));
      const posSel = h('select', { class: 'sel sm', 'aria-label': 'Position', onchange: e => { S.pos = e.target.value; S.n = 100; sync(); draw(); } }, h('option', { value: '' }, meta.posLabel || 'All positions'));
      const opts = meta.posOptions ? meta.posOptions(D) : [];
      opts.forEach(o => posSel.append(h('option', { value: o, selected: S.pos === o ? true : null }, o))); posSel.value = S.pos; if (opts.length) kids.push(posSel);
    }
    const tsel = h('select', { class: 'sel sm', 'aria-label': 'Team', onchange: e => { S.team = e.target.value; S.n = 100; sync(); draw(); } }, h('option', { value: '' }, 'All teams'), (SPORT.teamFilters || []).map(([v, l]) => h('option', { value: v }, l)));
    [...D.teams.values()].sort((a, b) => a.name.localeCompare(b.name)).forEach(t => tsel.append(h('option', { value: t.id }, t.name))); tsel.value = S.team; kids.push(tsel);
    kids.push(h('span', { class: 'grow' }));
    kids.push(segControl([['v', 'Values'], ['p', 'Percentiles']], S.vp, v => { S.vp = v; sync(); draw(); }, 'sm'));
    kids.push(toggle('Shade', S.shade, v => { S.shade = v; sync(); draw(); }));
    kids.push(h('button', { class: 'btn sm', type: 'button', html: ICON.share + ' Share top 10', onclick: shareTop }));
    mount(ctlRow, kids);
    const chips = h('div', { class: 'row', style: { gap: '8px' } });
    if (!S.situ) groups.forEach(gr => chips.append(h('button', { class: 'chip' + (S.groups.has(gr.id) ? ' on' : ''), type: 'button', onclick: () => { S.groups.has(gr.id) ? S.groups.delete(gr.id) : S.groups.add(gr.id); sync(); ctlUI(); draw(); }, html: `${esc(gr.l)}${gr.tag ? ` <small>${gr.tag}</small>` : ''}` })));
    mount(tb, sitRow, ctlRow, S.situ ? null : chips);
  }

  function curRows() {
    let rows = S.situ ? (S.sitRows || []) : listOf(D, g);
    const f = slugify(S.f.trim());
    return rows.filter(r => {
      if (!isTeam) {
        if (S.situ) { if (r[(meta.sitThr || meta.thr).field] < (S.min || 40)) return false; }
        else if (S.qual) { if (!isQual(D, g, r)) return false; }
        else if (S.min && r[meta.thr.field] < S.min) return false;
        if (S.pos && meta.posMatch && !meta.posMatch(r, S.pos)) return false;
      }
      const tid = isTeam ? r.id : r.tid;
      if (S.team) { if ((SPORT.teamFilters || []).some(x => x[0] === S.team)) { if (D.teams.get(tid)?.lg !== S.team) return false; } else if (String(S.team) !== String(tid)) return false; }
      if (f) { const t = D.teams.get(tid); const hay = slugify((isTeam ? '' : r.name + ' ') + (t ? t.name + ' ' + t.abbr : '')); if (!hay.includes(f)) return false; }
      return true;
    });
  }
  function visibleCols() { const all = COLS[g]; if (S.situ) return SPORT.sit.cols[g].map(k => COLMAP[g][k]).filter(Boolean); return all.filter(c => S.groups.has(c.g)); }
  function localPct(rows, cols) { const P = {}; for (const c of cols) P[c.k] = rows.map(r => r[c.k]).filter(isFinite).sort((a, b) => a - b); return (c, v) => { const a = P[c.k]; if (!a || a.length < 5 || !isFinite(v)) return NaN; const [lo, hi] = bounds(a, v); let p = (lo + .5 * (hi - lo)) / a.length * 100; if (c.d < 0) p = 100 - p; return clamp(Math.round(p), 1, 99); }; }

  let lastRows = [], lastCols = [];
  function draw() {
    if (S.situ && !S.sitRows) { mount(twrap, loadingEl('Loading ' + (SIT_LABEL[S.situ] || S.situ) + ' splits')); return; }
    const cols = visibleCols(); let rows = curRows();
    const sc = COLMAP[g][S.sort]; const sdir = S.dir === 'asc' ? 1 : -1;
    rows = rows.slice().sort((a, b) => {
      let x, y; if (S.sort === 'name') { x = (a.name || D.teams.get(a.id)?.name || ''); y = (b.name || D.teams.get(b.id)?.name || ''); return x.localeCompare(y) * sdir; }
      x = a[S.sort]; y = b[S.sort]; const nx = !isFinite(x), ny = !isFinite(y); if (nx || ny) return nx && ny ? 0 : nx ? 1 : -1; return (x - y) * sdir;
    });
    lastRows = rows; lastCols = cols;
    const pcf = S.situ ? localPct(S.sitRows.filter(r => r[(meta.sitThr || meta.thr).field] >= (S.min || 40)), cols) : (c, v) => pctile(D, g, c.k, v);
    let gh = '<tr class="g"><th class="rk"></th><th class="pl"></th>', ch = `<tr class="c"><th class="rk">#</th><th class="pl${S.sort === 'name' ? ' s' : ''}" data-k="name">${meta.singular}</th>`;
    if (!S.situ) { let i = 0; while (i < cols.length) { let j = i; while (j < cols.length && cols[j].g === cols[i].g) j++; const gr = groups.find(x => x.id === cols[i].g); gh += `<th colspan="${j - i}" class="sep">${esc((gr?.l || '').toUpperCase())}</th>`; i = j; } } else gh += `<th colspan="${cols.length}" class="sep">${esc((SIT_LABEL[S.situ] || S.situ).toUpperCase())}</th>`;
    cols.forEach((c, i) => { const first = i === 0 || cols[i - 1].g !== c.g; ch += `<th data-k="${c.k}" tabindex="0" class="${first ? 'sep ' : ''}${S.sort === c.k ? 's' : ''}"${statTip(c)}>${esc(c.l)}${S.sort === c.k ? `<span class="ar">${S.dir === 'asc' ? '↑' : '↓'}</span>` : ''}</th>`; });
    gh += '</tr>'; ch += '</tr>';
    const shown = rows.slice(0, S.n); let body = '';
    shown.forEach((r, i) => {
      const id = r.id; body += `<tr data-id="${id}"><td class="rk">${i + 1}</td><td class="pl">${playerCellHTML(D, g, r)}</td>`;
      cols.forEach((c, j) => {
        const v = r[c.k], p = c.d !== 0 ? pcf(c, v) : NaN; const first = j === 0 || cols[j - 1].g !== c.g;
        const txt = S.vp === 'p' && c.d !== 0 ? (isFinite(p) ? p : '–') : fmt(v, c.f);
        body += `<td class="${first && !S.situ ? 'sep ' : ''}${S.sort === c.k ? 's' : ''}" style="${S.shade && c.d !== 0 && isFinite(p) ? heat(p) : ''}">${txt}</td>`;
      });
      body += '</tr>';
    });
    if (!rows.length) body = `<tr><td colspan="${cols.length + 2}" class="empty" style="text-align:center;height:120px">Nobody matches these filters.</td></tr>`;
    twrap.innerHTML = `<table class="lb"><thead>${gh}${ch}</thead><tbody>${body}</tbody></table>${rows.length > S.n ? `<div class="more"><button class="btn" type="button" id="moreb">Show ${Math.min(100, rows.length - S.n)} more of ${rows.length - S.n} remaining</button></div>` : `<div class="more dim mono" style="font-size:11.5px">${rows.length} ${isTeam ? 'teams' : 'players'}</div>`}`;
    $('#moreb', twrap)?.addEventListener('click', () => { S.n += 100; sync(); const top = twrap.scrollTop; draw(); twrap.scrollTop = top; });
  }
  twrap.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('th[data-k]')) { e.preventDefault(); e.target.click(); } });
  twrap.addEventListener('click', e => {
    const th = e.target.closest('th[data-k]');
    if (th) { const k = th.dataset.k; if (S.sort === k) S.dir = S.dir === 'asc' ? 'desc' : 'asc'; else { S.sort = k; const c = COLMAP[g][k]; S.dir = k === 'name' ? 'asc' : (c && c.d < 0 ? 'asc' : 'desc'); } sync(); draw(); return; }
    const tr = e.target.closest('tr[data-id]'); if (tr) navTo((isTeam ? '/team/' : '/player/') + tr.dataset.id);
  });
  function shareTop() {
    const c = COLMAP[g][S.sort]; const top = lastRows.slice(0, 10);
    if (!top.length) return toast('Nothing to share');
    shareImage({
      title: `${meta.label} · ${c ? c.l : 'Name'}`, sub: `${SPORT.seasons.label(D.season)}${S.situ ? ' · ' + (SIT_LABEL[S.situ] || S.situ) : ''}`,
      rows: top.map(r => ({ name: isTeam ? D.teams.get(r.id).name : r.name, team: isTeam ? D.teams.get(r.id).abbr : (D.teams.get(r.tid)?.abbr || ''), color: tcol(isTeam ? r.id : r.tid), value: c ? fmt(r[S.sort], c.f) : '' })),
    }, `${SPORT.id}-index-${g}-${S.sort}-${D.season}`);
  }

  mount(el, head, panel); sitUI(); ctlUI();
  if (S.situ) { setSit(S.situ); } else draw();
};
