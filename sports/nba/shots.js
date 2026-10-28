/* shots.js: NBA shot chart from ESPN play-by-play coordinates (x 0..50 across, y 0..47 up from the baseline, feet; free throws carry no location). */
SPORT.leanPlay = p => {
  if (!p.shootingPlay) return null; const c = p.coordinate;
  if (!c || !(c.x >= -5 && c.x <= 55 && c.y >= -8 && c.y <= 50)) return null;
  if (/free throw/i.test(p.text || '')) return null;
  const ps = p.participants || [], sh = ps[0]?.athlete?.id;
  const made = p.scoringPlay ? 1 : 0, v = made ? (p.scoreValue || 2) : 0;
  const three = v === 3 || (!made && isThree(c.x, c.y)) || /three point/i.test(p.text || '');
  return { m: made, v, th: three ? 1 : 0, x: c.x, y: c.y, t: +p.team?.id, sh: sh ? +sh : 0, ty: p.type?.text || '', per: p.period?.number, clk: p.clock?.displayValue, as: made && ps[1]?.athlete?.id ? +ps[1].athlete.id : 0 };
};
const HOOP = [25, 5.25];
const isThree = (x, y) => (y <= 14.2 && (x <= 3.1 || x >= 46.9)) || Math.hypot(x - HOOP[0], y - HOOP[1]) >= 23.6;
const shotDistNBA = e => Math.hypot(e.x - HOOP[0], e.y - HOOP[1]);
const SHOT_ZONES = [['ra', 'Restricted area'], ['paint', 'In the paint'], ['mid', 'Mid-range'], ['c3', 'Corner 3'], ['a3', 'Above-break 3']];
function zoneOf(e) {
  if (e.th) return e.y <= 14.2 && (e.x <= 3.5 || e.x >= 46.5) ? 'c3' : 'a3';
  if (shotDistNBA(e) < 4.2) return 'ra';
  if (e.x >= 17 && e.x <= 33 && e.y <= 19) return 'paint';
  return 'mid';
}
function shotKind(t) { t = (t || '').toLowerCase(); return /dunk/.test(t) ? 'Dunk' : /layup|finger roll/.test(t) ? 'Layup' : /hook/.test(t) ? 'Hook shot' : /tip/.test(t) ? 'Tip-in' : /pullup|pull-up/.test(t) ? 'Pull-up jumper' : /step back|stepback/.test(t) ? 'Step-back jumper' : /fade|turnaround/.test(t) ? 'Fadeaway' : /jump/.test(t) ? 'Jump shot' : 'Other'; }
const courtXY = e => [clamp(e.x, 0, 50), 47 - clamp(e.y, -2, 47)];
function nbaCourt(inner) {
  const L = 'fill="none" stroke="var(--line2)" stroke-width=".3"';
  return `<svg viewBox="-1.5 -1 53 49.5" class="court" style="width:100%;max-width:560px;display:block;margin:0 auto" role="img" aria-label="Half-court shot chart">
<rect x="0" y="0" width="50" height="47" fill="var(--bg3)" ${L}/>
<g ${L}><rect x="17" y="28" width="16" height="19"/><path d="M19 28A6 6 0 0 1 31 28"/><path d="M19 28A6 6 0 0 0 31 28" stroke-dasharray="1 1"/><path d="M21 41.75A4 4 0 0 1 29 41.75"/><path d="M3 47V32.8A23.75 23.75 0 0 1 47 32.8V47"/><path d="M19 0A6 6 0 0 0 31 0"/><line x1="22" y1="43" x2="28" y2="43" stroke-width=".5"/></g>
<circle cx="25" cy="41.75" r=".75" fill="none" stroke="#e07a2f" stroke-width=".35"/>${inner}</svg>`;
}

async function shotExplorer(D, scope, host) {
  let n = scope.n ?? 10, view = scope.view || (scope.kind === 'teams' && scope.tids.length > 1 ? 'heat' : 'dots'), side = scope.side || 'for', res = 'all';
  const box = h('div', { class: 'stack' }); mount(host, box);
  const status = h('div', { class: 'cap' }, 'Loading games'); mount(box, h('div', { class: 'panel pad' }, h('div', { class: 'skel', style: { height: '320px' } }), status));
  const multi = scope.kind === 'teams'; let ids, idsBy;
  try { if (multi) { idsBy = await gameIdsByTeam(scope.tids, D.season); ids = [...new Set([...idsBy.values()].flat())]; } else ids = await gameIdsFor(scope.kind, scope.id, D.season); } catch (e) { mount(host, errorEl(e, () => render(true))); return; }
  if (!ids.length) { mount(host, h('div', { class: 'panel empty' }, 'No finished games yet this season.')); return; }
  const cache = new Map();
  async function ensure(list) { const need = list.filter(i => !cache.has(i)); if (need.length) { const got = await loadEvents(need, (a, b) => status.textContent = `Loading games ${a}/${b}`); for (const g of got) cache.set(g.id, g); } return list.map(i => cache.get(i)).filter(Boolean); }
  const pick = (ev, tid) => scope.kind === 'player' ? ev.filter(e => e.sh === scope.id) : ev.filter(e => side === 'for' ? e.t === tid : e.t !== tid);
  async function draw() {
    const lists = multi ? scope.tids.map(t => [t, n ? idsBy.get(t).slice(-n) : idsBy.get(t)]) : [[scope.id, n ? ids.slice(-n) : ids]];
    let games;
    try { games = await ensure([...new Set(lists.flatMap(l => l[1]))]); } catch (e) { mount(box, errorEl(e, () => render(true))); return; }
    const all = [];
    for (const [tid, l] of lists) for (const gid of l) { const g = cache.get(gid); if (!g) continue; for (const e of pick(g.ev, tid)) all.push({ ...e, date: g.date, opp: g.teams.find(t => t.id !== (multi ? tid : e.t))?.abbr, z: zoneOf(e) }); }
    const shown = all.filter(e => res === 'all' || (res === 'made') === !!e.m);
    const CAP = 6000, dots = shown.length > CAP ? shown.filter((_, i) => i % Math.ceil(shown.length / CAP) === 0) : shown;
    const fga = all.length, fgm = all.filter(e => e.m).length, pts = all.reduce((a, e) => a + e.v, 0), t3 = all.filter(e => e.th), efg = fga ? (fgm + .5 * t3.filter(e => e.m).length) / fga * 100 : NaN;
    let inner = '';
    if (view === 'heat') {
      const cell = 2.5, cols = Math.ceil(50 / cell), cnt = new Map(); let mx = 1;
      for (const e of shown) { const [X, Y] = courtXY(e), k = Math.floor(Y / cell) * cols + Math.floor(X / cell); const v = (cnt.get(k) || 0) + 1; cnt.set(k, v); mx = Math.max(mx, v); }
      for (const [k, v] of cnt) { const r = Math.floor(k / cols), c = k % cols; inner += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="var(--acc)" opacity="${(.1 + .85 * Math.sqrt(v / mx)).toFixed(2)}"/>`; }
    } else {
      dots.forEach((e, i) => { const [X, Y] = courtXY(e); inner += e.m ? `<circle cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r=".95" fill="var(--acc)" fill-opacity=".85" stroke="var(--bg)" stroke-width=".2" data-i="${i}"/>` : `<path d="M${(X - .7).toFixed(1)} ${(Y - .7).toFixed(1)}l1.4 1.4m0-1.4l-1.4 1.4" stroke="var(--fg3)" stroke-width=".35" stroke-linecap="round" opacity=".8" data-i="${i}"/><circle cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r="1" fill="transparent" data-i="${i}"/>`; });
    }
    const zrows = SHOT_ZONES.map(([k, l]) => { const a = all.filter(e => e.z === k), m = a.filter(e => e.m).length; return `<tr><td style="text-align:left">${l}</td><td>${a.length}</td><td>${fga ? fmt(a.length / fga * 100, 'f1') + '%' : '–'}</td><td>${a.length ? fmt(m / a.length * 100, 'f1') + '%' : '–'}</td><td>${a.length ? fmt(a.reduce((s, e) => s + e.v, 0) / a.length, 'f2') : '–'}</td></tr>`; }).join('');
    const kinds = [...all.reduce((m, e) => { const k = shotKind(e.ty), a = m.get(k) || { n: 0, m: 0 }; a.n++; a.m += e.m; m.set(k, a); return m; }, new Map())].sort((a, b) => b[1].n - a[1].n);
    const sel = (opts, val, fn) => h('select', { class: 'sel sm', onchange: e => fn(e.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(val) }, l)));
    const ctl = h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } }, sel(GAMES_OPTS, n, v => { n = +v; draw(); }), segControl([['dots', 'Shots'], ['heat', 'Heat']], view, v => { view = v; draw(); }, 'sm'), segControl([['all', 'All'], ['made', 'Makes'], ['missed', 'Misses']], res, v => { res = v; draw(); }, 'sm'),
      multi ? segControl([['for', 'For'], ['against', 'Against']], side, v => { side = v; draw(); }, 'sm') : null);
    const tiles = [['FGA', fga], ['FGM', fgm], ['FG%', fga ? fmt(fgm / fga * 100, 'f1') + '%' : '–'], ['eFG%', fmt(efg, 'f1') + (fga ? '%' : '')], ['3P', t3.length ? `${t3.filter(e => e.m).length}/${t3.length}` : '–'], ['Pts/shot', fga ? fmt(pts / fga, 'f2') : '–']];
    const map = h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { marginBottom: '8px', flexWrap: 'wrap', gap: '8px' } }, h('h2', {}, multi ? (side === 'for' ? 'Shot chart' : 'Opponent shot chart') : 'Shot chart'), h('span', { class: 'cap' }, `${games.length} games${multi && scope.tids.length > 1 ? ' · ' + scope.tids.length + ' teams' : ''} · field goals only · free throws have no location${dots.length < shown.length ? ' · dots are a ' + dots.length.toLocaleString() + '-shot sample, heat uses all' : ''}`)), ctl, h('div', { style: { marginTop: '10px' }, html: nbaCourt(inner) }));
    tipBind(map, i => { const e = dots[i]; if (!e) return ''; return `<b>${e.m ? 'Made ' + (e.th ? '3' : '2') : 'Missed ' + (e.th ? '3' : '2')} · ${esc(e.ty)}</b>${multi ? tr('Team', esc(D.teams.get(e.t)?.abbr || '')) : ''}${tr('Distance', shotDistNBA(e).toFixed(0) + ' ft')}${tr('Zone', SHOT_ZONES.find(z => z[0] === e.z)?.[1] || '')}${tr('When', `Q${e.per} ${e.clk || ''}`)}${tr('Game', `${e.date} vs ${e.opp || ''}`)}`; });
    const t1 = h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'By zone')), h('div', { class: 'sc', style: { padding: '4px 4px 6px' }, html: `<table class="dt"><thead><tr><th style="text-align:left">Zone</th><th>FGA</th><th>Share</th><th>FG%</th><th>Pts/shot</th></tr></thead><tbody>${zrows}</tbody></table>` }));
    const t2 = h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'By shot type')), h('div', { class: 'sc', style: { padding: '4px 4px 6px' }, html: `<table class="dt"><thead><tr><th style="text-align:left">Type</th><th>FGA</th><th>FGM</th><th>FG%</th></tr></thead><tbody>${kinds.map(([l, v]) => `<tr><td style="text-align:left">${esc(l)}</td><td>${v.n}</td><td>${v.m}</td><td>${fmt(v.m / v.n * 100, 'f1')}%</td></tr>`).join('')}</tbody></table>` }));
    mount(box, h('div', { class: 'tiles', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))' }, html: tiles.map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="p">&nbsp;</div></div>`).join('') }), h('div', { class: 'grid2', style: { alignItems: 'start' } }, map, h('div', { class: 'stack' }, t1, t2)));
  }
  draw();
}
/* Charts page: every team by default; tick any number of teams to narrow it. One team also unlocks a player picker. */
App.pages.charts = async function ({ q, D, el }) {
  const tids = teamsFromQ(q, D), pid = +q.p || 0, all = tids.length ? tids : [...D.teams.keys()];
  const one = tids.length === 1 ? tids[0] : 0;
  const roster = one ? [...D.players.values()].filter(p => p.tid === one).sort((a, b) => b.w - a.w) : [];
  const go = ids => navTo('/charts', { t: ids.length ? ids.join(',') : undefined });
  const bar = h('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap', margin: '14px 0 6px' } }, teamMultiPicker(D, tids, go),
    one ? h('select', { class: 'sel', id: 'cp', onchange: e => navTo('/charts', { t: one, p: e.target.value || undefined }) }, h('option', { value: '' }, 'Whole team'), roster.map(p => h('option', { value: p.id, selected: p.id === pid }, `${p.name} (${p.pos})`))) : null);
  const out = h('div', {});
  mount(el, pageHead('CHART EXPLORER', 'Shot charts', 'Every field-goal attempt with court coordinates, straight from play-by-play. Starts with the whole league; pick one team, several, or a single player on one team.'), bar, tids.length ? h('div', { style: { marginBottom: '10px' } }, teamChips(D, tids, go)) : null, out);
  const pl = one && pid && D.players.get(pid);
  shotExplorer(D, pl ? { kind: 'player', id: pid } : { kind: 'teams', tids: all, n: tids.length === 0 || tids.length > 6 ? 5 : 10 }, out);
};
