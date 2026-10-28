/* shots.js: NHL shot map. Events come from ESPN play-by-play coordinates (x -100..100 down the ice, y -42.5..42.5 across). */
/* goalies who played for each team, so goals (which ESPN lists without the goalie) can be credited when only one played */
SPORT.leanGame = j => { const g = {}; for (const t of j.boxscore?.players || []) { const grp = (t.statistics || []).find(s => s.name === 'goalies'); g[t.team.id] = (grp?.athletes || []).map(a => +a.athlete.id); } return g; };
SPORT.leanPlay = (p, teams, ctx) => {
  const ty = p.type?.text; if (!['Shot', 'Goal', 'Missed', 'Blocked'].includes(ty)) return null;
  const c = p.coordinate; if (!c || !isFinite(c.x) || !isFinite(c.y) || Math.abs(c.x) > 110 || Math.abs(c.y) > 50) return null;
  const opp = (teams.find(t => t.id !== +p.team?.id) || {}).id, gs = (ctx && ctx[opp]) || [];
  const pl = p.participants || [], by = t => pl.find(q => t.includes(q.type))?.athlete;
  const sh = by(['shooter', 'scorer']), gl = by(['saver', 'goalie']), bl = by(['blocker']);
  const m = (p.text || '').match(/(wrist|slap|snap|backhand|tip-in|deflect\w*|wrap-around|poke|bat|cradle)/i);
  return { k: ty === 'Goal' ? 'G' : ty === 'Shot' ? 'S' : ty === 'Missed' ? 'M' : 'B', x: c.x, y: c.y, per: p.period?.number, clk: p.clock?.displayValue, t: +p.team?.id, sh: sh?.id ? +sh.id : 0, shn: sh?.shortName || sh?.displayName || '', gk: gl?.id ? +gl.id : (ty === 'Goal' && gs.length === 1 ? gs[0] : 0), bl: bl?.id ? +bl.id : 0, st: m ? m[1].toLowerCase().replace('tip-in', 'tip').replace(/^deflect\w*/, 'deflection') : '' };
};
const SHOT_LBL = { G: 'Goal', S: 'Shot on goal', M: 'Missed', B: 'Blocked' };
const SHOT_CLR = { G: 'var(--acc)', S: 'var(--a)', M: 'var(--fg3)', B: 'var(--warn)' };
const GOAL_X = 89;
const shotDist = e => Math.hypot(GOAL_X - Math.abs(e.x), e.y);
function nhlRink(inner) {
  const L = 'stroke="var(--line2)" fill="none" stroke-width=".35"';
  return `<svg viewBox="0 0 85 78" class="rink" style="width:100%;max-width:560px;display:block;margin:0 auto" role="img" aria-label="Offensive-zone shot map">
<path d="M0 78V28A28 28 0 0 1 28 0H57A28 28 0 0 1 85 28V78Z" fill="var(--bg3)" stroke="var(--line2)" stroke-width=".6"/>
<line x1="5.7" y1="11" x2="79.3" y2="11" stroke="#d6455d" stroke-width=".35" opacity=".8"/>
<line x1="0" y1="75" x2="85" y2="75" stroke="#3a7ae0" stroke-width="1.1" opacity=".55"/>
<path d="M36.5 11A6 6 0 0 0 48.5 11Z" fill="rgba(92,200,255,.18)" stroke="#d6455d" stroke-width=".3"/>
<rect x="39.5" y="7.7" width="6" height="3.3" fill="none" stroke="#d6455d" stroke-width=".35"/>
<g ${L}><circle cx="20.5" cy="31" r="15"/><circle cx="64.5" cy="31" r="15"/></g>
<g fill="#d6455d" opacity=".7"><circle cx="20.5" cy="31" r="1"/><circle cx="64.5" cy="31" r="1"/></g>${inner}</svg>`;
}
const shotXY = e => [clamp(e.y + 42.5, 0, 85), clamp(100 - Math.abs(e.x), 0, 78)];

/* the explorer. scope: { kind:'player'|'team', id, role, side:'for'|'against' } */
async function shotExplorer(D, scope, host) {
  let n = scope.n ?? 10, view = scope.view || 'dots', side = scope.side || 'for', kinds = new Set(['G', 'S', 'M', 'B']);
  const box = h('div', { class: 'stack' }); mount(host, box);
  const status = h('div', { class: 'cap' }, 'Loading games'); mount(box, h('div', { class: 'panel pad' }, h('div', { class: 'skel', style: { height: '320px' } }), status));
  let ids; try { ids = await gameIdsFor(scope.kind, scope.id, D.season); } catch (e) { mount(host, errorEl(e, () => render(true))); return; }
  if (!ids.length) { mount(host, h('div', { class: 'panel empty' }, 'No finished games yet this season.')); return; }
  const cache = new Map();
  async function ensure(list) { const need = list.filter(i => !cache.has(i)); if (need.length) { const got = await loadEvents(need, (a, b) => status.textContent = `Loading games ${a}/${b}`); for (const g of got) cache.set(g.id, g); } return list.map(i => cache.get(i)).filter(Boolean); }
  const pick = ev => {
    if (scope.kind === 'player') {
      if (scope.role === 'gk') return ev.filter(e => e.gk === scope.id && e.k !== 'M' && e.k !== 'B');
      return ev.filter(e => e.sh === scope.id);
    }
    return ev.filter(e => side === 'for' ? e.t === scope.id : e.t !== scope.id);
  };
  async function draw() {
    const list = n ? ids.slice(-n) : ids; let games;
    try { games = await ensure(list); } catch (e) { mount(box, errorEl(e, () => render(true))); return; }
    const all = games.flatMap(g => pick(g.ev).map(e => ({ ...e, date: g.date, opp: g.teams.find(t => t.id !== (scope.kind === 'team' ? scope.id : e.t))?.abbr })));
    const shown = all.filter(e => kinds.has(e.k));
    const att = all.length, sog = all.filter(e => e.k === 'G' || e.k === 'S').length, goals = all.filter(e => e.k === 'G').length;
    const gkMode = scope.kind === 'player' && scope.role === 'gk';
    let inner = '';
    if (view === 'heat') {
      const cell = 5, cols = Math.ceil(85 / cell), rows = Math.ceil(78 / cell), cnt = new Map(); let mx = 1;
      for (const e of shown) { const [X, Y] = shotXY(e), k = Math.floor(Y / cell) * cols + Math.floor(X / cell); const v = (cnt.get(k) || 0) + 1; cnt.set(k, v); mx = Math.max(mx, v); }
      for (const [k, v] of cnt) { const r = Math.floor(k / cols), c = k % cols; inner += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="var(--acc)" opacity="${(.12 + .8 * v / mx).toFixed(2)}"/>`; }
    } else {
      shown.forEach((e, i) => { const [X, Y] = shotXY(e); inner += `<circle cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r="${e.k === 'G' ? 1.7 : 1.15}" fill="${SHOT_CLR[e.k]}" fill-opacity="${e.k === 'G' ? 1 : .72}" stroke="${e.k === 'G' ? 'var(--bg)' : 'none'}" stroke-width=".3" data-i="${i}"/>`; });
    }
    const typeRows = [...new Map([...all.reduce((m, e) => { if (e.st && (e.k === 'G' || e.k === 'S')) { const a = m.get(e.st) || { n: 0, g: 0 }; a.n++; if (e.k === 'G') a.g++; m.set(e.st, a); } return m; }, new Map())].sort((a, b) => b[1].n - a[1].n)).entries()];
    const bands = [[0, 10, 'Within 10 ft'], [10, 20, '10 to 20 ft'], [20, 35, '20 to 35 ft'], [35, 200, '35 ft and out']].map(([a, b, l]) => { const s = all.filter(e => (e.k === 'G' || e.k === 'S') && shotDist(e) >= a && shotDist(e) < b); const g = s.filter(e => e.k === 'G').length; return [l, s.length, g]; });
    const sel = (opts, val, fn) => h('select', { class: 'sel sm', onchange: e => fn(e.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(val) }, l)));
    const chips = ['G', 'S', 'M', 'B'].map(k => h('button', { class: 'chip' + (kinds.has(k) ? ' on' : ''), type: 'button', onclick: () => { kinds.has(k) ? kinds.delete(k) : kinds.add(k); if (!kinds.size) kinds.add(k); draw(); }, html: `<i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${SHOT_CLR[k]};margin-right:5px"></i>${SHOT_LBL[k]}` }));
    const ctl = h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } }, sel(GAMES_OPTS, n, v => { n = +v; draw(); }), segControl([['dots', 'Shots'], ['heat', 'Heat']], view, v => { view = v; draw(); }, 'sm'),
      scope.kind === 'team' ? segControl([['for', 'For'], ['against', 'Against']], side, v => { side = v; draw(); }, 'sm') : null, h('div', { class: 'chips' }, chips));
    const tiles = [['Attempts', att], ['On goal', sog], ['Goals', goals], [gkMode ? 'Save %' : 'Shooting %', gkMode ? (sog ? fmt(1 - goals / sog, 'f3') : '–') : (sog ? fmt(goals / sog * 100, 'f1') + '%' : '–')], ['Avg. distance', all.length ? fmt(mean(all.map(shotDist)), 'f1') + ' ft' : '–']];
    const map = h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { marginBottom: '8px', flexWrap: 'wrap', gap: '8px' } }, h('h2', {}, gkMode ? 'Shots faced' : scope.kind === 'team' ? (side === 'for' ? 'Shots taken' : 'Shots allowed') : 'Shot map'), h('span', { class: 'cap' }, `${games.length} games · all events shown from one end of the rink`)), ctl, h('div', { style: { marginTop: '10px' }, html: nhlRink(inner) }));
    tipBind(map, i => { if (typeof i === 'string' && i[0] === 'h') return ''; const e = shown[i]; if (!e) return ''; return `<b>${esc(SHOT_LBL[e.k])}${e.st ? ' · ' + esc(e.st) : ''}</b>${e.shn ? tr('Shooter', esc(e.shn)) : ''}${tr('Distance', shotDist(e).toFixed(0) + ' ft')}${tr('When', `P${e.per} ${e.clk || ''}`)}${tr('Game', `${e.date} vs ${e.opp || ''}`)}`; });
    const tbl = h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'By distance')), h('div', { class: 'sc', style: { padding: '4px 4px 6px' }, html: `<table class="dt"><thead><tr><th style="text-align:left">Range</th><th>SOG</th><th>Goals</th><th>${gkMode ? 'Sv%' : 'S%'}</th></tr></thead><tbody>${bands.map(([l, a, g]) => `<tr><td style="text-align:left">${l}</td><td>${a}</td><td>${g}</td><td>${a ? (gkMode ? fmt(1 - g / a, 'f3') : fmt(g / a * 100, 'f1') + '%') : '–'}</td></tr>`).join('')}</tbody></table>` }));
    const tbl2 = typeRows.length ? h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'By shot type')), h('div', { class: 'sc', style: { padding: '4px 4px 6px' }, html: `<table class="dt"><thead><tr><th style="text-align:left">Type</th><th>SOG</th><th>Goals</th><th>${gkMode ? 'Sv%' : 'S%'}</th></tr></thead><tbody>${typeRows.map(([l, v]) => `<tr><td style="text-align:left">${esc(l)}</td><td>${v.n}</td><td>${v.g}</td><td>${gkMode ? fmt(1 - v.g / v.n, 'f3') : fmt(v.g / v.n * 100, 'f1') + '%'}</td></tr>`).join('')}</tbody></table>` })) : null;
    mount(box, h('div', { class: 'tiles', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' }, html: tiles.map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="p">&nbsp;</div></div>`).join('') }), h('div', { class: 'grid2', style: { alignItems: 'start' } }, map, h('div', { class: 'stack' }, tbl, tbl2)));
  }
  draw();
}
/* Charts page: pick a team (and optionally a player on it) */
App.pages.charts = async function ({ q, D, el }) {
  const tid = +q.t || 0, pid = +q.p || 0;
  const teams = [...D.teams.values()].sort((a, b) => a.name.localeCompare(b.name));
  const roster = tid ? D.players && [...D.players.values()].filter(p => p.tid === tid).sort((a, b) => b.w - a.w) : [];
  const sel = (id, opts, val, fn, ph) => h('select', { class: 'sel', id, onchange: e => fn(e.target.value) }, h('option', { value: '' }, ph), opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(val) }, l)));
  const bar = h('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap', margin: '14px 0' } },
    sel('ct', teams.map(t => [t.id, t.name]), tid, v => navTo('/charts', { t: v || undefined }), 'Choose a team'),
    tid ? sel('cp', roster.map(p => [p.id, `${p.name} (${p.pos})`]), pid, v => navTo('/charts', { t: tid, p: v || undefined }), 'Whole team') : null);
  const out = h('div', {});
  mount(el, pageHead('CHART EXPLORER', 'Shot maps', 'Every shot attempt with ice coordinates, straight from play-by-play. Pick a team, or a single player on it.'), bar, out);
  if (!tid) { mount(out, h('div', { class: 'panel pad' }, h('p', { class: 'muted', style: { margin: 0 } }, 'Choose a team to see where it shoots from and where it gives shots up. Or open any player and use the Shots tab.'))); return; }
  const pl = pid && D.players.get(pid);
  shotExplorer(D, pl ? { kind: 'player', id: pid, role: pl.pos === 'G' ? 'gk' : 'sk' } : { kind: 'team', id: tid }, out);
};
