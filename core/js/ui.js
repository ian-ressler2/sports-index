/* ui.js: app shell, router, search palette, shared widgets */
const view = () => $('#view');

function parseHash() {
  const raw = location.hash.slice(1) || '/'; const i = raw.indexOf('?');
  const p = i < 0 ? raw : raw.slice(0, i), qs = i < 0 ? '' : raw.slice(i + 1);
  return { path: p.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs)) };
}
function href(path, q = {}) {
  const qq = { ...q }; if (App.season !== App.defSeason) qq.s = App.season;
  for (const k in qq) if (qq[k] == null || qq[k] === '') delete qq[k];
  const qs = new URLSearchParams(qq).toString(); return '#' + path + (qs ? '?' + qs : '');
}
function setQ(upd) { // update query in place without re-render
  const cur = parseHash(); const q = { ...cur.q, ...upd }; for (const k in q) if (q[k] == null || q[k] === '') delete q[k];
  const qs = new URLSearchParams(q).toString(); history.replaceState(null, '', '#/' + cur.path.map(encodeURIComponent).join('/') + (qs ? '?' + qs : '')); App.q = q;
}
const navTo = (path, q) => { location.hash = href(path, q); };

/* ---- shared widgets ---- */
const avatar = (id, name, size = 34, sq = false) => `<span class="av${sq ? ' sq' : ''}" style="width:${size}px;height:${size}px;font-size:${Math.max(9, size / 3.2)}px">${esc(initials(name || '?'))}<img loading="lazy" alt="" src="${SPORT.headshot(id)}" onerror="this.remove()" style="position:absolute;inset:0"></span>`;
const tbadge = (D, tid, size = 22) => { const t = D.teams.get(tid); const c = tcol(tid); return `<span class="tb" style="width:${size}px;height:${size}px;background:${c};font-size:${Math.round(size * .36)}px" title="${esc(t?.name || '')}">${esc(t?.abbr || '?')}${SPORT.teamLogo ? `<img alt="" loading="lazy" src="${SPORT.teamLogo(tid)}" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--bg2);border-radius:inherit;padding:12%">` : ''}</span>`; };
const pLink = (id) => href('/player/' + id);
const tLink = (id) => href('/team/' + id);
function segControl(opts, cur, onPick, cls = '') {
  const el = h('div', { class: 'seg ' + cls }, opts.map(([v, l]) => h('button', { class: v === cur ? 'on' : '', type: 'button', onclick: () => { $$('button', el).forEach(b => b.classList.remove('on')); $$('button', el).find(b => b.dataset.v === String(v)).classList.add('on'); onPick(v); }, 'data-v': v }, l)));
  return el;
}
function toggle(label, on, onChange) { const inp = h('input', { type: 'checkbox', checked: on ? true : null, onchange: e => onChange(e.target.checked) }); if (on) inp.checked = true; return h('label', { class: 'sw' }, inp, h('i'), label); }
function loadingEl(msg = 'Loading', pct) { return h('div', { class: 'load' }, h('div', {}, h('div', { class: 'spin' }), h('div', { id: 'lmsg' }, msg), h('div', { class: 'bar2' }, h('b', { id: 'lbar', style: { width: ((pct || 0) * 100) + '%' } })))); }
function errorEl(e, retry) {
  return h('div', { class: 'err' }, h('b', {}, 'Could not load the data'), h('p', { class: 'muted', style: { margin: '6px 0 12px' } }, String(e.message || e)),
    h('p', { class: 'dim', style: { margin: '0 0 12px', fontSize: '12.5px' } }, `This site reads live data from ${SPORT.dataSrc || 'statsapi.mlb.com and baseballsavant.mlb.com'} in your browser. If it is running inside a sandboxed preview that blocks outside requests, open index.html in a normal browser tab.`),
    h('button', { class: 'btn', onclick: retry }, 'Try again'));
}
function srcTag(s) { return s ? `<span class="src ${s.toLowerCase()}">${s}</span>` : ''; }
function pageHead(eyebrow, title, sub, right) {
  return h('div', { class: 'pagehead' }, h('div', {}, h('div', { class: 'eyebrow' }, eyebrow), h('h1', {}, title), sub ? h('p', { class: 'sub', style: { margin: '10px 0 0' } }, sub) : null), right || null);
}
const seasonLabel = D => (D.final ? `${SPORT.seasons.label(D.season)} ${D.stage || 'REGULAR SEASON'}` : `${SPORT.seasons.label(D.season)} · THROUGH ${SPORT.unit || 'GAME'} ${D.maxG}`).toUpperCase();
const sourceNote = () => SPORT.sourceNote || '';

/* ---- share a top-10 card as an image ---- */
function shareCard({ title, sub, rows, accent = SPORT.accent || '#ff8a4c' }) {
  const W = 1080, Hh = 150 + rows.length * 78 + 70, c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
  const grd = x.createLinearGradient(0, 0, W, Hh); grd.addColorStop(0, '#0b1117'); grd.addColorStop(1, '#101a22'); x.fillStyle = grd; x.fillRect(0, 0, W, Hh);
  x.strokeStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < W; i += 54) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, Hh); x.stroke(); }
  x.fillStyle = accent; x.font = '600 20px "Geist Mono", ui-monospace, monospace'; x.fillText((SPORT.first + ' ' + SPORT.word).toUpperCase(), 54, 62);
  x.fillStyle = '#e9eff3'; x.font = '650 46px Geist, system-ui, sans-serif'; x.fillText(title, 54, 118);
  x.fillStyle = '#7f909d'; x.font = '500 20px "Geist Mono", monospace'; x.textAlign = 'right'; x.fillText(sub, W - 54, 118); x.textAlign = 'left';
  rows.forEach((r, i) => {
    const y = 150 + i * 78; x.fillStyle = i % 2 ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.055)'; x.fillRect(40, y, W - 80, 70);
    x.fillStyle = '#6b7c89'; x.font = '500 24px "Geist Mono", monospace'; x.fillText(String(i + 1), 62, y + 44);
    x.fillStyle = r.color || '#667788'; x.beginPath(); x.arc(136, y + 35, 20, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = '700 12px "Geist Mono", monospace'; x.textAlign = 'center'; x.fillText(r.team || '', 136, y + 39); x.textAlign = 'left';
    x.fillStyle = '#e9eff3'; x.font = '600 30px Geist, system-ui, sans-serif'; x.fillText(r.name, 176, y + 45);
    x.fillStyle = accent; x.font = '700 32px "Geist Mono", monospace'; x.textAlign = 'right'; x.fillText(r.value, W - 70, y + 46); x.textAlign = 'left';
  });
  x.fillStyle = '#566673'; x.font = '500 17px "Geist Mono", monospace'; x.fillText(SPORT.credit, 54, Hh - 28);
  return new Promise(res => c.toBlob(b => res(b), 'image/png'));
}
async function shareImage(opts, filename) {
  const blob = await shareCard(opts); if (!blob) return toast('Could not make the image');
  try { if (navigator.clipboard?.write && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast('Image copied to clipboard'); return; } } catch (e) { }
  const url = URL.createObjectURL(blob), a = h('a', { href: url, download: filename + '.png' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast('Image saved');
}

/* ---- header / theme ---- */
const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/></svg>',
  nav: {
    stats: '<path d="M5 20V11M12 20V4M19 20v-6"/>', lab: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/>', compare: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    charts: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>', games: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>', sim: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
    odds: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>', teams: '<path d="M12 3 4 6v6c0 4.5 3.4 7.6 8 9 4.6-1.4 8-4.5 8-9V6z"/>', more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', dot: '<circle cx="12" cy="12" r="3"/>',
  },
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
};
const DEFAULT_LOGO = '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="var(--bg3)" stroke="var(--line2)"/><path d="M16 6.5 25.5 16 16 25.5 6.5 16Z" fill="none" stroke="var(--fg)" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 21.5c4-1 8.5-5 12-11.5" stroke="var(--acc)" stroke-width="1.9" fill="none" stroke-linecap="round"/><circle cx="22.2" cy="9.4" r="2.5" fill="var(--acc)"/></svg>';
function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
function buildShell() {
  applyTheme(store.get('theme', null));
  const LOGO = SPORT.logo || DEFAULT_LOGO;
  const links = (cls) => SPORT.nav.map(([k, l]) => `<a href="${href('/' + k)}" data-nav="${k}">${l}</a>`).join('');
  const ti = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON.nav[k] || ICON.nav.dot}</svg>`;
  const prim = SPORT.navPrimary || ['stats', 'games', 'odds', 'teams'], hasMore = SPORT.nav.some(([k]) => !prim.includes(k));
  const tabbar = SPORT.nav.filter(([k]) => prim.includes(k)).map(([k, l]) => `<a href="${href('/' + k)}" data-nav="${k}">${ti(k)}<span>${l}</span></a>`).join('') + (hasMore ? `<button type="button" id="morebtn" aria-haspopup="dialog" aria-expanded="false">${ti('more')}<span>More</span></button>` : '');
  const moreLinks = SPORT.nav.filter(([k]) => !prim.includes(k)).map(([k, l]) => `<a href="${href('/' + k)}" data-nav="${k}">${ti(k)}<span>${l}</span></a>`).join('');
  document.body.innerHTML = `<header class="top"><div class="wrap">
    <a class="brand" href="#/">${LOGO}<span>${esc(SPORT.first)}</span><b>${esc(SPORT.word)}</b></a>
    <select class="sel sportsel" id="sportsel" aria-label="Switch sport">${SPORT.siblings.map(([id, nm]) => `<option value="${id}"${id === SPORT.id ? ' selected' : ''}>${nm}</option>`).join('')}</select>
    <nav class="nav">${links()}</nav><span class="sp"></span>
    <button class="sbtn" id="sbtn" aria-label="Search players and teams">${ICON.search}<span>Search players and teams</span><kbd>⌘</kbd><kbd>K</kbd></button>
    <select class="sel" id="season" aria-label="Season"></select>
    <button class="ibtn" id="theme" aria-label="Toggle light and dark theme">${ICON.sun}</button></div>
    <nav class="navm">${links()}</nav></header>
    <nav class="tabbar" aria-label="Main navigation">${tabbar}</nav>
    <div class="moresheet" id="moresheet" role="dialog" aria-label="More pages" hidden><div class="mshd"><b>More</b><button class="ibtn" id="moreclose" type="button" aria-label="Close">×</button></div>${moreLinks}</div>
    <div class="wrap"><main id="view"></main></div>
    <footer><div class="wrap">${SPORT.footer}<br><a href="../">All sports</a> · Open source on GitHub.</div></footer>`;
  const sel = $('#season'); seasonList().forEach(y => sel.append(h('option', { value: y }, SPORT.seasons.label(y))));
  $('#sportsel').onchange = e => { location.href = '../' + e.target.value + '/'; };
  sel.onchange = () => { const q = { ...parseHash().q, s: sel.value }; if (+sel.value === App.defSeason) delete q.s; const p = parseHash().path; location.hash = '#/' + p.join('/') + (Object.keys(q).length ? '?' + new URLSearchParams(q) : ''); };
  $('#theme').onclick = () => { const cur = document.documentElement.getAttribute('data-theme'); const next = (cur || (isDark() ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark'; store.set('theme', next); applyTheme(next); render(true); };
  const sheet = $('#moresheet'), mb = $('#morebtn'), closeMore = () => { sheet.hidden = true; if (mb) mb.setAttribute('aria-expanded', 'false'); };
  if (mb) { mb.onclick = () => { const open = sheet.hidden; sheet.hidden = !open; mb.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) sheet.querySelector('a')?.focus(); }; $('#moreclose').onclick = () => { closeMore(); mb.focus(); }; sheet.addEventListener('click', e => { if (e.target.closest('a')) closeMore(); }); addEventListener('hashchange', closeMore); addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeMore(); mb.focus(); } }); document.addEventListener('click', e => { if (!sheet.hidden && !e.target.closest('#moresheet, #morebtn')) closeMore(); }); }
  $('#sbtn').onclick = openSearch;
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); openSearch(); }
  });
  tipInit();
}
function markNav(first) { $$('[data-nav]').forEach(a => { const on = a.dataset.nav === first; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); $('#morebtn')?.classList.toggle('on', !!$('#moresheet [data-nav].on')); const s = $('#season'); if (s) s.value = App.season; }

/* ---- search palette ---- */
function searchIndex(D, qs) {
  const q = slugify(qs.trim()); if (!q) return [];
  const out = [];
  for (const p of D.players.values()) {
    const k = p.key; let sc = -1;
    if (k.startsWith(q)) sc = 100; else if (k.split(' ').some(w => w.startsWith(q))) sc = 80; else if (q.length > 2 && k.includes(q)) sc = 50;
    else if (q.includes(' ') && q.split(' ').every(w => k.includes(w))) sc = 60;
    if (sc > 0) out.push({ type: 'p', p, sc: sc + Math.min(20, Math.log10((p.w || 0) + 1) * 5) });
  }
  for (const t of D.teams.values()) { const k = slugify(t.name + ' ' + t.abbr + ' ' + t.loc); if (k.includes(q)) out.push({ type: 't', t, sc: t.abbr.toLowerCase() === q ? 120 : k.startsWith(q) ? 95 : 70 }); }
  return out.sort((a, b) => b.sc - a.sc).slice(0, 12);
}
function openSearch() {
  if ($('.ov')) return;
  const D = App.D; let items = [], idx = 0;
  const inp = h('input', { placeholder: D ? `Search every player and team, ${D.season}` : 'Loading players…', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Search' });
  const ul = h('ul'), ov = h('div', { class: 'ov', onclick: e => { if (e.target === ov) close(); } }, h('div', { class: 'pal' }, inp, ul, h('div', { class: 'ft' }, h('span', {}, '↑↓ move'), h('span', {}, '↵ open'), h('span', {}, 'esc close'))));
  const close = () => ov.remove();
  const paint = () => {
    mount(ul, items.length ? items.map((it, i) => {
      const row = it.type === 'p' ? h('li', { class: i === idx ? 'on' : '', html: `${avatar(it.p.id, it.p.name, 34)}<div class="pc"><div><b>${esc(it.p.name)}</b><small>${esc(D.teams.get(it.p.tid)?.abbr || '')} · ${esc(it.p.pos || '')}</small></div></div><small>${esc(SPORT.playerTag ? SPORT.playerTag(it.p) : '')}</small>` })
        : h('li', { class: i === idx ? 'on' : '', html: `${tbadge(D, it.t.id, 34)}<div class="pc"><div><b>${esc(it.t.name)}</b><small>${esc(it.t.div || '')}</small></div></div><small>Team</small>` });
      row.onmousemove = () => { if (idx !== i) { idx = i; $$('li', ul).forEach((x, j) => x.classList.toggle('on', j === i)); } };
      row.onclick = () => pick(it); return row;
    }) : (inp.value ? h('div', { class: 'em' }, 'No matches') : h('div', { class: 'em' }, SPORT.searchHint || 'Type a name')));
  };
  const pick = it => { close(); navTo(it.type === 'p' ? '/player/' + it.p.id : '/team/' + it.t.id); };
  inp.oninput = () => { items = D ? searchIndex(D, inp.value) : []; idx = 0; paint(); };
  inp.onkeydown = e => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(items.length - 1, idx + 1); paint(); $('li.on', ul)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); paint(); $('li.on', ul)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && items[idx]) pick(items[idx]);
  };
  document.body.append(ov); paint(); inp.focus();
}
/* an inline picker used by Compare / Lab. returns element; onPick(item) */
function pickerEl(D, placeholder, onPick, filter) {
  const inp = h('input', { class: 'fld', placeholder, autocomplete: 'off', style: { width: '100%' }, 'aria-label': placeholder });
  const menu = h('div', { class: 'menu', style: { display: 'none', width: '100%' } }), wrap = h('div', { class: 'pop', style: { width: '100%' } }, inp, menu);
  inp.oninput = () => {
    const res = searchIndex(D, inp.value).filter(it => !filter || filter(it)).slice(0, 8);
    menu.style.display = res.length ? '' : 'none';
    mount(menu, res.map(it => h('button', { type: 'button', onclick: () => { menu.style.display = 'none'; inp.value = ''; onPick(it); }, html: it.type === 'p' ? `<span class="row" style="gap:8px">${avatar(it.p.id, it.p.name, 24)}<span>${esc(it.p.name)}</span></span><span class="dim mono">${esc(D.teams.get(it.p.tid)?.abbr || '')} · ${esc(it.p.pos)}</span>` : `<span class="row" style="gap:8px">${tbadge(D, it.t.id, 24)}<span>${esc(it.t.name)}</span></span><span class="dim mono">Team</span>` })));
  };
  inp.onblur = () => setTimeout(() => menu.style.display = 'none', 150);
  return wrap;
}

/* ---- router ---- */
async function render(force) {
  const rid = ++App.rid, loc = parseHash(); App.q = loc.q; const first = loc.path[0] || 'home';
  const season = +loc.q.s || App.defSeason; App.season = season; App.path = loc.path;
  markNav(first);
  const v = view(); if (!v) return;
  if (!App.D || App.D.season !== season) {
    mount(v, loadingEl(`Loading ${season} season data`, 0.02));
    try {
      App.D = await SPORT.loadSeason(season, (p, n) => { if (rid !== App.rid) return; const b = $('#lbar'); if (b) b.style.width = Math.round(p * 100) + '%'; const m = $('#lmsg'); if (m) m.textContent = `Loading ${season} season data`; });
    } catch (e) { if (rid === App.rid) mount(v, errorEl(e, () => render(true))); return; }
    if (rid !== App.rid) return;
  }
  const page = App.pages[first] || pageNotFound;
  try { v.className = ''; const out = await page({ path: loc.path, q: loc.q, D: App.D, el: v, rid }); } catch (e) { console.error(e); if (rid === App.rid) mount(v, errorEl(e, () => render(true))); return; }
  if (App.D.warn.length && !$('.warnb', v) && first !== 'home') v.prepend(h('div', { class: 'warnb', style: { marginBottom: '14px' } }, `Some Statcast sources did not load (${App.D.warn.join(', ')}). The related columns will be blank.`));
  if (!force && App.lastKey !== first + '/' + (loc.path[1] || '')) window.scrollTo(0, 0);
  App.lastKey = first + '/' + (loc.path[1] || '');
  const base = `${SPORT.name} · ${SPORT.short} stats`, setTitle = () => { const t = $('h1', v)?.textContent.trim(); document.title = t && first !== 'home' ? `${t} · ${base}` : base; };
  setTitle(); setTimeout(() => { if (rid === App.rid) setTitle(); }, 700);
}
function pageNotFound({ el }) { mount(el, h('div', { class: 'empty' }, h('h2', {}, 'Page not found'), h('p', {}, 'That page does not exist. '), h('a', { class: 'btn', href: '#/' }, 'Back home'))); }
