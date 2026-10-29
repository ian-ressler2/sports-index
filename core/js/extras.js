/* extras.js: the watchlist and the shareable player card. */

/* ---------- watchlist: players and teams a visitor follows, kept in this browser per sport ---------- */
const watch = {
  key: () => 'watch:' + SPORT.id,
  all() { const a = store.get(this.key(), []); return Array.isArray(a) ? a : []; },
  has(t, id) { return this.all().some(w => w.t === t && String(w.id) === String(id)); },
  toggle(t, id) {
    const a = this.all(), i = a.findIndex(w => w.t === t && String(w.id) === String(id));
    if (i >= 0) a.splice(i, 1); else a.push({ t, id });
    store.set(this.key(), a); return i < 0;
  },
};
function watchBtn(t, id) {
  const b = h('button', { class: 'btn sm watchbtn', type: 'button' });
  const paint = () => { const on = watch.has(t, id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.innerHTML = (on ? ICON.starOn : ICON.star) + `<span>${on ? 'Watching' : 'Watch'}</span>`; b.title = on ? 'Remove from your watchlist' : 'Add to your watchlist'; };
  b.onclick = () => { const on = watch.toggle(t, id); paint(); toast(on ? 'Added to your watchlist' : 'Removed from your watchlist'); };
  paint(); return b;
}

App.pages.watch = async function ({ D, el }) {
  const P = SPORT.player, items = watch.all();
  const head = pageHead('YOUR LIST', 'Watchlist', `Players and teams you follow in ${SPORT.name || SPORT.first}, with their ${SPORT.seasons.label(D.season)} numbers. Kept in this browser only; use the Watch button on any player or team page.`, h('button', { class: 'btn sm', type: 'button', onclick: () => openSearch(), html: ICON.search.replace('<svg', '<svg width="14" height="14"') + ' <span>Find someone</span>' }), false);
  if (!items.length) { mount(el, head, h('div', { class: 'panel empty', style: { marginTop: '14px' } }, 'Nothing here yet. Open a player or team and press Watch to follow them.')); return; }
  const rm = (t, id) => { watch.toggle(t, id); render(true); };
  const rowsP = [], rowsT = [];
  for (const w of items) {
    if (w.t === 'p') {
      const roles = P.roles(D, +w.id), role = roles[0], r = role && D.maps[role].get(+w.id), name = r?.name || D.players.get(+w.id)?.name || 'Player #' + w.id;
      if (!r) { rowsP.push(h('div', { class: 'panel pad wrow' }, h('div', { class: 'grow' }, h('a', { href: href('/player/' + w.id), style: { fontWeight: 600 } }, name), h('div', { class: 'cap' }, `No ${SPORT.seasons.label(D.season)} line`)), h('button', { class: 'btn sm', type: 'button', 'aria-label': 'Remove ' + name, onclick: () => rm('p', w.id) }, 'Remove'))); continue; }
      const team = D.teams.get(r.tid), tiles = P.tiles[role].slice(0, 4).map(k => tileHTML(D, role, r, k)).join('');
      rowsP.push(h('div', { class: 'panel wrow-p' }, h('div', { class: 'row sb', style: { padding: '14px 16px 4px', gap: '12px' } },
        h('div', { class: 'row', style: { gap: '12px', minWidth: 0 } }, h('div', { html: avatar(+w.id, name, 46, true) }), h('div', { style: { minWidth: 0 } }, h('a', { href: href('/player/' + w.id), style: { fontWeight: 650, fontSize: '16px' } }, name), h('div', { class: 'cap' }, `${team ? team.name + ' · ' : ''}${P.roleLine(role, r)}`))),
        h('button', { class: 'btn sm', type: 'button', 'aria-label': 'Remove ' + name, onclick: () => rm('p', w.id) }, 'Remove')),
        h('div', { class: 'tiles', html: tiles })));
    } else {
      const t = D.teams.get(w.id) || D.teams.get(+w.id); if (!t) continue; const st = D.stand.get(t.id) || {};
      const tl = (SPORT.team.tiles(D, t.id, st) || []).slice(0, 4).map(([k, v]) => `<div class="tile"><div class="k"${teamTip(k)}>${esc(k)}</div><div class="v">${v}</div><div class="p">&nbsp;</div></div>`).join('');
      rowsT.push(h('div', { class: 'panel wrow-p' }, h('div', { class: 'row sb', style: { padding: '14px 16px 4px', gap: '12px' } },
        h('div', { class: 'row', style: { gap: '12px', minWidth: 0 } }, h('div', { html: tbadge(D, t.id, 46) }), h('div', { style: { minWidth: 0 } }, h('a', { href: tLink(t.id), style: { fontWeight: 650, fontSize: '16px' } }, t.name), h('div', { class: 'cap' }, SPORT.team.rankText ? SPORT.team.rankText(D, t, st) : (t.div || '')))),
        h('button', { class: 'btn sm', type: 'button', 'aria-label': 'Remove ' + t.name, onclick: () => rm('t', w.id) }, 'Remove')),
        h('div', { class: 'tiles', html: tl })));
    }
  }
  const sec = (title, rows) => rows.length ? h('div', { style: { marginTop: '18px' } }, h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, title), h('div', { class: 'stack' }, rows)) : null;
  mount(el, head, sec('PLAYERS', rowsP), sec('TEAMS', rowsT));
};

/* ---------- player card: a 1080 x 1250 picture with percentiles and a shot or spray map ---------- */
const CARD_PAL = { '--bg': '#0b1117', '--bg2': '#101a22', '--bg3': '#16222c', '--bg4': '#223240', '--line': '#243340', '--line2': '#34495a', '--fg': '#e9eff3', '--fg2': '#a4b3be', '--fg3': '#7f909d', '--warn': '#e8b04b', '--a': '#5cc8ff' };
function svgToImage(svg, w, hh) {
  const cs = getComputedStyle(document.documentElement), accent = SPORT.accent || cs.getPropertyValue('--acc').trim() || '#ff8a4c';
  svg = svg.replace(/var\((--[\w-]+)\)/g, (m, n) => n === '--acc' ? accent : CARD_PAL[n] || cs.getPropertyValue(n).trim() || '#888');
  /* HTML forgives a repeated attribute (first one wins); a standalone SVG image does not */
  svg = svg.replace(/<([a-zA-Z]+)(\s[^<>]*?)(\/?)>/g, (m, tag, attrs, sl) => { const seen = new Set(); const out = attrs.replace(/\s([\w:-]+)=("[^"]*"|'[^']*')/g, (a, n) => seen.has(n) ? '' : (seen.add(n), a)); return `<${tag}${out}${sl}>`; });
  svg = svg.replace(/<svg\b([^>]*)>/, (m, a) => '<svg' + a.replace(/\sstyle="[^"]*"/, '').replace(/\s(width|height)="[^"]*"/g, '') + (/xmlns=/.test(a) ? '' : ' xmlns="http://www.w3.org/2000/svg"') + ` width="${w}" height="${hh}">`);
  return new Promise(res => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
}
const cardPct = p => {
  if (!isFinite(p)) return '#566673';
  const cs = getComputedStyle(document.documentElement), t = (p - 50) / 50, v = (t >= 0 ? cs.getPropertyValue('--hot') : cs.getPropertyValue('--cold')).trim() || (t >= 0 ? '229,72,77' : '59,130,246');
  return `rgba(${v},${(.55 + Math.abs(t) * .45).toFixed(2)})`;
};
function fitText(x, text, maxW, size, weight, family) { let s = size; do { x.font = `${weight} ${s}px ${family}`; s -= 2; } while (x.measureText(text).width > maxW && s > 20); }
async function playerCardBlob({ D, id, role, r, name, team, map }) {
  const P = SPORT.player, W = 1080, H = 1250, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const accent = SPORT.accent || getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#ff8a4c', SANS = 'Geist, system-ui, sans-serif', MONO = '"Geist Mono", ui-monospace, monospace';
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0b1117'); g.addColorStop(1, '#111d26'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = team ? gTeamColor(D, team.id) : accent; x.fillRect(0, 0, W, 10);
  x.fillStyle = accent; x.font = `600 20px ${MONO}`; x.textAlign = 'left'; x.fillText((SPORT.first + ' ' + SPORT.word).toUpperCase(), 54, 66);
  x.fillStyle = '#7f909d'; x.textAlign = 'right'; x.fillText(`${SPORT.seasons.label(D.season)} · ${D.final ? 'FINAL' : (SPORT.unit || 'GAME').toUpperCase() + ' ' + D.maxG}`, W - 54, 66); x.textAlign = 'left';
  fitText(x, name, W - 108, 72, 700, SANS); x.fillStyle = '#e9eff3'; x.fillText(name, 54, 150);
  x.fillStyle = '#a4b3be'; x.font = `500 26px ${SANS}`; x.fillText(`${team ? team.name : ''}${team ? ' · ' : ''}${P.roleLine(role, r)}`.slice(0, 64), 54, 196);
  /* stat tiles */
  const keys = P.tiles[role].slice(0, 6), tw = 320, th = 120;
  keys.forEach((k, i) => {
    const col = statCol(role, k), tx = 54 + (i % 3) * (tw + 24), ty = 236 + Math.floor(i / 3) * (th + 20), p = col.d !== 0 ? pctile(D, role, k, r[k]) : NaN;
    x.fillStyle = 'rgba(255,255,255,.055)'; x.fillRect(tx, ty, tw, th);
    x.fillStyle = '#7f909d'; x.font = `600 18px ${MONO}`; x.fillText(col.l.toUpperCase().slice(0, 14), tx + 18, ty + 32);
    x.fillStyle = '#e9eff3'; x.font = `700 46px ${MONO}`; x.fillText(String(fmt(r[k], col.f)), tx + 18, ty + 82);
    if (isFinite(p)) { x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(tx + 18, ty + 100, tw - 36, 6); x.fillStyle = cardPct(p); x.fillRect(tx + 18, ty + 100, (tw - 36) * p / 100, 6); x.fillStyle = '#a4b3be'; x.font = `600 17px ${MONO}`; x.textAlign = 'right'; x.fillText(ord(p), tx + tw - 18, ty + 32); x.textAlign = 'left'; }
  });
  /* percentile bars (left) and map (right) */
  const top = 560, rows = pctRows(D, role, r, P.pct[role]).filter(q => q.c.d !== 0).slice(0, 9), bw = map ? 520 : W - 108;
  x.fillStyle = accent; x.font = `600 18px ${MONO}`; x.fillText('PERCENTILE RANKINGS', 54, top);
  rows.forEach((q, i) => {
    const y = top + 28 + i * 66;
    x.fillStyle = '#c3cfd8'; x.font = `500 22px ${SANS}`; x.fillText(q.c.l, 54, y + 26);
    x.fillStyle = '#e9eff3'; x.font = `700 22px ${MONO}`; x.textAlign = 'right'; x.fillText(String(fmt(q.v, q.c.f)), 54 + bw, y + 26); x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(54, y + 36, bw, 12);
    x.fillStyle = cardPct(q.p); x.fillRect(54, y + 36, Math.max(6, bw * q.p / 100), 12);
    x.fillStyle = '#0b1117'; x.font = `700 12px ${MONO}`; if (bw * q.p / 100 > 40) { x.fillText(String(Math.round(q.p)), 60, y + 46); }
  });
  if (map) {
    const bx = 54 + bw + 40, bwid = W - 54 - bx, label = map.title;
    x.fillStyle = accent; x.font = `600 18px ${MONO}`; x.fillText(label.toUpperCase().slice(0, 34), bx, top);
    const ar = map.vb[0] / map.vb[1], mw = bwid, mh = Math.min(mw / ar, 600), img = await svgToImage(map.svg, Math.round(Math.min(mw, mh * ar)), Math.round(mh));
    if (img) x.drawImage(img, bx, top + 22, Math.min(mw, mh * ar), mh);
    x.fillStyle = '#7f909d'; x.font = `500 17px ${MONO}`; x.fillText(map.note || '', bx, top + 22 + mh + 28);
  }
  x.fillStyle = '#566673'; x.font = `500 17px ${MONO}`; x.fillText(SPORT.credit + ' · percentiles among qualified ' + (SPORT.groups[role].plural || 'players').toLowerCase(), 54, H - 34);
  return new Promise(res => c.toBlob(b => res(b), 'image/png'));
}
async function openPlayerCard(ctx) {
  const wrap = h('div', { class: 'cardmodal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Player card' });
  const close = () => { wrap.remove(); document.removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc_);
  const body = h('div', { class: 'cm-body' }, loadingEl('Drawing the card'));
  wrap.append(h('div', { class: 'cm-box' }, h('div', { class: 'row sb', style: { marginBottom: '10px' } }, h('h2', {}, 'Player card'), h('button', { class: 'btn sm', type: 'button', onclick: close }, 'Close')), body));
  wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
  document.body.append(wrap); wrap.querySelector('button').focus();
  let map = null;
  try { map = SPORT.cardMap ? await SPORT.cardMap(ctx.D, ctx.id, ctx.role) : null; } catch (e) { console.warn('card map', e); }
  const blob = await playerCardBlob({ ...ctx, map });
  if (!blob) { mount(body, errorEl(new Error('Could not draw the card'))); return; }
  const url = URL.createObjectURL(blob), file = new File([blob], slugify(ctx.name).replace(/\W+/g, '-') + '-card.png', { type: 'image/png' });
  const save = h('a', { class: 'btn', href: url, download: file.name }, 'Save image');
  const copy = h('button', { class: 'btn', type: 'button', onclick: async () => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast('Image copied'); } catch (e) { toast('Copy not supported here; use Save image'); } } }, 'Copy image');
  const share = navigator.canShare && navigator.canShare({ files: [file] }) ? h('button', { class: 'btn', type: 'button', onclick: () => navigator.share({ files: [file], title: ctx.name }).catch(() => { }) }, 'Share') : null;
  mount(body, h('img', { src: url, alt: `${ctx.name} player card`, class: 'cm-img' }), h('div', { class: 'row', style: { gap: '8px', marginTop: '12px', flexWrap: 'wrap' } }, save, copy, share), map ? null : h('p', { class: 'cap', style: { marginTop: '8px' } }, SPORT.cardMap ? 'No map on this card: not enough tracked shots for this player.' : 'No map on this card; it shows percentiles only.'));
}
