/* compare.js: two players or two teams side by side */
function parseEnt(s) { if (!s) return null; if (/^t\d+$/.test(s)) return { kind: 't', id: +s.slice(1) }; if (/^\d+$/.test(s)) return { kind: 'p', id: +s }; return null; }
const entTok = e => e ? (e.kind === 't' ? 't' : '') + e.id : '';

App.pages.compare = async function ({ path, q, D, el }) {
  let A = parseEnt(path[1]), B = parseEnt(path[2]);
  if (A && B && A.kind !== B.kind) B = null;
  const kind = A?.kind || B?.kind || 'p';
  const dataFor = (e, g) => e ? D.maps[g]?.get(e.id) : null;
  const CM = SPORT.compare, tG = SPORT.groupOrder.filter(x => SPORT.groups[x].kind === 'team'), pG = SPORT.groupOrder.filter(x => SPORT.groups[x].kind === 'player');
  let g;
  if (kind === 't') g = tG.includes(q.g) ? q.g : tG[0];
  else { const guess = e => e && SPORT.player.roles(D, e.id)[0]; g = pG.includes(q.g) ? q.g : (guess(A) || guess(B) || pG[0]); }
  const go = (a, b, extra = {}) => navTo('/compare' + (a ? '/' + entTok(a) : '') + (b ? '/' + entTok(b) : ''), { g: extra.g ?? q.g, ...extra });
  const nameOf = e => e.kind === 't' ? D.teams.get(e.id)?.name : D.players.get(e.id)?.name || BIOFALLBACK;
  const BIOFALLBACK = 'Player';
  const slotColor = i => i === 0 ? 'var(--a)' : 'var(--b)';
  const colorHex = i => i === 0 ? (isDark() ? '#5cc8ff' : '#0a7fc2') : (isDark() ? '#ff8a4c' : '#cf5418');

  const slot = (e, i) => {
    const wrap = h('div', { class: 'panel pad cmpslot', style: { borderTop: `3px solid ${slotColor(i)}` } });
    const picker = pickerEl(D, i ? 'Add a second ' + (kind === 't' ? 'team' : 'player') : 'Search ' + (kind === 't' ? 'a team' : 'a player'), it => {
      const ne = it.type === 't' ? { kind: 't', id: it.t.id } : { kind: 'p', id: it.p.id }; const arr = [A, B]; arr[i] = ne; if (arr[0] && arr[1] && arr[0].kind !== arr[1].kind) arr[1 - i] = null; go(arr[0], arr[1]);
    }, it => !(A || B) || (it.type === 't') === (kind === 't'));
    if (!e) { mount(wrap, h('div', { class: 'cap', style: { marginBottom: '8px', color: slotColor(i) } }, i ? 'PLAYER / TEAM B' : 'PLAYER / TEAM A'), picker); return wrap; }
    const d = dataFor(e, g), nm = nameOf(e), tid = e.kind === 't' ? e.id : d?.tid;
    mount(wrap, h('div', { class: 'row sb' }, h('div', { class: 'row', style: { gap: '12px', flexWrap: 'nowrap' } }, h('div', { html: e.kind === 't' ? tbadge(D, e.id, 52) : avatar(e.id, nm, 52, true) }), h('div', {}, h('div', { class: 'cap', style: { color: slotColor(i) } }, i ? 'B' : 'A'), h('a', { href: e.kind === 't' ? tLink(e.id) : pLink(e.id), style: { fontSize: '19px', fontWeight: 650 } }, nm), h('div', { class: 'dim', style: { fontSize: '12.5px' } }, e.kind === 't' ? (D.teams.get(e.id)?.div || '') : `${D.teams.get(tid)?.name || ''} · ${d?.pos || ''}`))), h('button', { class: 'xbtn', type: 'button', 'aria-label': 'Remove', onclick: () => { const arr = [A, B]; arr[i] = null; go(arr[0], arr[1]); } }, '×')),
      d ? null : h('p', { class: 'warnb', style: { marginTop: '10px' } }, `No ${SPORT.seasons.label(D.season)} ${SPORT.groups[g].label.toLowerCase()} line.`), h('div', { style: { marginTop: '10px' } }, picker));
    return wrap;
  };

  const rg = kind === 't' ? tG : pG, roleSeg = rg.length > 1 ? segControl(rg.map(x => [x, SPORT.groups[x].tab || SPORT.groups[x].label]), g, v => go(A, B, { g: v }), 'sm') : h('span');
  const dA = dataFor(A, g), dB = dataFor(B, g);
  const head = h('div', { class: 'row sb', style: { marginBottom: '14px', gap: '12px' } }, h('div', {}), roleSeg);
  const slots = h('div', { class: 'cmpgrid' }, slot(A, 0), slot(B, 1));
  if (!A && !B) {
    const g0 = pG[0], m0 = SPORT.groups[g0], top = qualRows(D, g0).sort((x, y) => (y[m0.sort] - x[m0.sort]) * (m0.dir < 0 ? 1 : -1)).slice(0, 8);
    const pairs = []; for (let k = 0; k + 1 < top.length; k += 2) pairs.push([top[k], top[k + 1]]);
    const ts = [...D.stand.values()].sort((x, y) => y.pct - x.pct);
    mount(el, pageHead('HEAD TO HEAD', 'Compare', 'Two players or two teams side by side: score, radar and a tale of the tape.', null, false), head, slots,
      h('div', { class: 'panel pad', style: { marginTop: '14px' } }, h('h2', {}, 'Quick matchups'), h('div', { class: 'chips', style: { marginTop: '10px' } }, pairs.map(([x, y]) => h('a', { class: 'chip', href: href(`/compare/${x.id}/${y.id}`) }, `${x.name} vs ${y.name}`)),
        ts.length > 1 ? h('a', { class: 'chip', href: href('/compare/t' + ts[0].id + '/t' + ts[1].id) }, 'Top two teams') : null)));
    return;
  }
  const out = h('div', { style: { marginTop: '14px' } });
  mount(el, pageHead('HEAD TO HEAD', 'Compare', seasonLabel(D), null, false), head, slots, out);
  if (!(dA && dB)) { mount(out, h('div', { class: 'empty' }, 'Pick two entries that both have a line this season to compare them.')); return; }

  const keys = CM.tape[g].filter(k => COLMAP[g][k] && (isFinite(dA[k]) || isFinite(dB[k])));
  let aw = 0, bw = 0, as_ = [], bs_ = [];
  const rowsT = keys.map(k => {
    const c = COLMAP[g][k], va = dA[k], vb = dB[k]; let pa = pctile(D, g, k, va), pb = pctile(D, g, k, vb); const vmax = Math.max(Math.abs(va) || 0, Math.abs(vb) || 0) || 1; if (c.d === 0) { pa = NaN; pb = NaN; }
    let win = 0; if (c.d !== 0 && isFinite(va) && isFinite(vb) && va !== vb) { win = (va > vb ? 1 : -1) * (c.d > 0 ? 1 : -1); if (win > 0) aw++; else bw++; }
    if (c.d !== 0 && isFinite(pa)) as_.push(pa); if (c.d !== 0 && isFinite(pb)) bs_.push(pb);
    const wa = isFinite(pa) ? pa : c.d === 0 && isFinite(va) ? Math.abs(va) / vmax * 100 : 0, wb = isFinite(pb) ? pb : c.d === 0 && isFinite(vb) ? Math.abs(vb) / vmax * 100 : 0;
    return `<div class="tape-row"><div class="tv ${win > 0 ? 'win' : ''}">${fmt(va, c.f)}${isFinite(pa) ? `<small>${pa}</small>` : ''}</div><div class="tbars"><i class="l"><b style="width:${wa}%;background:${colorHex(0)}"></b></i><span class="tl"${statTip(c)}>${esc(c.l)}</span><i class="r"><b style="width:${wb}%;background:${colorHex(1)}"></b></i></div><div class="tv r ${win < 0 ? 'win' : ''}">${fmt(vb, c.f)}${isFinite(pb) ? `<small>${pb}</small>` : ''}</div></div>`;
  }).join('');
  const sa = mean(as_), sb = mean(bs_), tot = aw + bw || 1;
  const score = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, 'Scoreboard'), h('span', { class: 'cap' }, 'average percentile · categories won')),
    h('div', { class: 'scorebar' }, h('div', { class: 'sbl', style: { color: colorHex(0) } }, h('b', {}, isFinite(sa) ? sa.toFixed(0) : '–'), h('span', {}, `${aw} won`)), h('div', { class: 'sbm' }, h('i', { style: { width: (aw / tot * 100) + '%', background: colorHex(0) } }), h('i', { style: { width: (bw / tot * 100) + '%', background: colorHex(1) } })), h('div', { class: 'sbl r', style: { color: colorHex(1) } }, h('b', {}, isFinite(sb) ? sb.toFixed(0) : '–'), h('span', {}, `${bw} won`))));
  const rad = CM.radar[g].filter(([k]) => COLMAP[g][k]);
  const radEl = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, 'Shape'), h('div', { class: 'legend', style: { margin: 0 }, html: [A, B].map((e, i) => `<span><i style="background:${colorHex(i)}"></i>${esc(nameOf(e))}</span>`).join('') })),
    h('div', { style: { maxWidth: '420px', margin: '0 auto' }, html: radar({ labels: rad.map(x => x[1]), series: [{ name: 'A', color: colorHex(0), vals: rad.map(([k]) => pctile(D, g, k, dA[k])) }, { name: 'B', color: colorHex(1), vals: rad.map(([k]) => pctile(D, g, k, dB[k])) }] }) }), h('p', { class: 'cap', style: { textAlign: 'center' } }, 'Percentiles among ' + (g[0] === 't' ? 'teams' : 'qualified players') + '. Farther out is better.'));
  const tape = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, 'Tale of the tape'), h('span', { class: 'cap' }, 'bold number wins · small number is percentile')), h('div', { class: 'tapewrap', style: { marginTop: '10px' }, html: rowsT }));
  const share = h('button', { class: 'btn', type: 'button', html: ICON.share + ' Copy link', onclick: () => { copyText(location.href); toast('Link copied'); } });
  mount(out, h('div', { class: 'grid2', style: { alignItems: 'start' } }, h('div', { class: 'stack' }, score, tape), h('div', { class: 'stack' }, radEl, kind === 'p' && CM.maps ? h('div', { id: 'cmpmaps' }, loadingEl('Loading charts')) : null)), h('div', { style: { marginTop: '12px', display: 'flex', justifyContent: 'flex-end' } }, share));

  if (kind === 'p' && CM.maps) CM.maps({ D, A, B, g, q, nameOf, colorHex });
};
