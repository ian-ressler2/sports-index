/* plays.js: NFL play explorer built from drive-by-drive play text (ESPN has no tracking coordinates for football) */
SPORT.evVer = 2;
SPORT.playsOf = j => (j.drives?.previous || []).concat(j.drives?.current ? [j.drives.current] : []).flatMap(d => d.plays || []);
const RUN_GAPS = [['left end', 'LE', 'Left end'], ['left tackle', 'LT', 'Left tackle'], ['left guard', 'LG', 'Left guard'], ['up the middle', 'M', 'Middle'], ['right guard', 'RG', 'Right guard'], ['right tackle', 'RT', 'Right tackle'], ['right end', 'RE', 'Right end']];
SPORT.leanPlay = p => {
  const ty = p.type?.text || '', tx = p.text || ''; if (p.isPenalty || /two-point|2-pt|kneel|spike|no play/i.test(tx)) return null;
  const k = /^Rush|Rushing Touchdown/.test(ty) ? 'r' : /^Sack/.test(ty) ? 's' : /Pass (Reception|Incompletion)|Passing Touchdown|Pass Interception|Interception/.test(ty) ? 'p' : /^Field Goal/.test(ty) ? 'f' : '';
  if (!k) return null;
  const o = (p.teamParticipants || []).find(t => t.type === 'offense')?.id || p.start?.team?.id; if (!o || !p.start?.down) return null;
  const a = tx.replace(/^(\([^)]*\)\s*)+/, ''), y = k === 's' ? (p.statYardage ?? 0) : (p.statYardage || 0), st = p.start, td = !!p.scoringPlay && /Touchdown/.test(ty);
  const e = { o: +o, k, y: /Incompletion/.test(ty) ? 0 : y, d: st.down, dist: st.distance || 0, yte: st.yardsToEndzone, td: td ? 1 : 0, to: p.isTurnover || /Interception/.test(ty) ? 1 : 0, inc: /Incompletion/.test(ty) ? 1 : 0, per: p.period?.number, clk: p.clock?.displayValue, a: a.slice(0, 34), t: tx.replace(/\s+/g, ' ').trim().slice(0, 140) };
  if (k === 'f') { e.mk = /Good/.test(ty) ? 1 : 0; e.wide = /left/i.test(tx) ? -1 : 1; }
  if (k === 'r') { const g = RUN_GAPS.find(x => tx.includes(x[0])); if (g) e.gap = g[1]; }
  if (k === 'p') {
    const m = tx.match(/pass (?:incomplete )?(short|deep)?\s?(left|middle|right)?/i); if (m) { e.dep = (m[1] || '').toLowerCase()[0] || ''; e.dir = (m[2] || '').toLowerCase()[0] || ''; }
    const r = tx.match(/ to ([A-Z]\.\s?[A-Z][A-Za-z'’-]+)/); if (r) e.tg = r[1].replace(/\s/g, '');
    if (!e.dep && /Passing Touchdown|Reception/.test(ty)) e.dep = (p.statYardage || 0) >= 15 ? 'd' : 's';
    if (e.dep === 's' || e.dep === 'd') { } else if (e.dep) e.dep = e.dep === 'd' ? 'd' : 's';
  }
  return e;
};
const nflSuccess = e => e.k === 's' || e.to ? false : e.td ? true : e.d === 1 ? e.y >= .4 * e.dist : e.d === 2 ? e.y >= .6 * e.dist : e.y >= e.dist;
const nflFirst = e => !!e.td || (e.k !== 's' && !e.to && e.y >= e.dist);
const DIST_B = [['1-3', 1, 3], ['4-6', 4, 6], ['7-10', 7, 10], ['11+', 11, 99]];
const FIELD_B = [['Own 1-20', 80, 99], ['Own 21-40', 60, 79], ['Midfield', 40, 59], ['Opp 21-39', 20, 39], ['Red zone', 0, 19]];
const sumY = a => a.reduce((s, e) => s + e.y, 0);

async function playExplorer(D, scope, host) {
  const multi = scope.kind === 'teams';
  let n = scope.n ?? 10, kind = 'all', mapLayer = 'all', side = scope.side || 'for';
  const box = h('div', { class: 'stack' }); mount(host, box);
  const status = h('div', { class: 'cap' }, 'Loading games'); mount(box, h('div', { class: 'panel pad' }, h('div', { class: 'skel', style: { height: '240px' } }), status));
  let ids, idsBy; try { if (multi) { idsBy = await gameIdsByTeam(scope.tids, D.season); ids = [...new Set([...idsBy.values()].flat())]; } else ids = await gameIdsFor(scope.kind, scope.id, D.season); } catch (e) { mount(host, errorEl(e, () => render(true))); return; }
  if (!ids.length) { mount(host, h('div', { class: 'panel empty' }, 'No finished games yet this season.')); return; }
  const cache = new Map();
  async function ensure(list) { const need = list.filter(i => !cache.has(i)); if (need.length) { const got = await loadEvents(need, (a, b) => status.textContent = `Loading games ${a}/${b}`); for (const g of got) cache.set(g.id, g); } return list.map(i => cache.get(i)).filter(Boolean); }
  const P = scope.kind === 'player' ? D.players.get(scope.id) : null, ab = P ? (P.ab || nflAbbr(P.name)).replace(/\s/g, '') : '';
  const mine = (e, tid) => {
    if (multi) return side === 'for' ? e.o === tid : e.o !== tid;
    if (scope.kind === 'team') return side === 'for' ? e.o === scope.id : e.o !== scope.id;
    const a = (e.a || '').replace(/\s/g, '');
    if (scope.role === 'rec') return e.k === 'p' && e.tg === ab;
    if (scope.role === 'qb') return (e.k === 'p' || e.k === 's') && a.startsWith(ab);
    return e.k === 'r' && a.startsWith(ab);
  };
  async function draw() {
    const lists = multi ? scope.tids.map(t => [t, n ? idsBy.get(t).slice(-n) : idsBy.get(t)]) : [[scope.id, n ? ids.slice(-n) : ids]]; let games;
    try { games = await ensure([...new Set(lists.flatMap(l => l[1]))]); } catch (e) { mount(box, errorEl(e, () => render(true))); return; }
    const raw = lists.flatMap(([tid, l]) => l.flatMap(gid => cache.get(gid)?.ev.filter(e => mine(e, tid)) || [])), all = raw.filter(e => e.k !== 'f'); const A = kind === 'all' ? all : all.filter(e => kind === 'pass' ? e.k !== 'r' : e.k === 'r');
    const N = A.length, ypp = N ? sumY(A) / N : NaN, sr = N ? A.filter(nflSuccess).length / N * 100 : NaN, fdp = N ? A.filter(nflFirst).length / N * 100 : NaN, pr = N ? A.filter(e => e.k !== 'r').length / N * 100 : NaN;
    const tiles = [['Plays', N], ['Yds/play', fmt(ypp, 'f2')], ['Success %', fmt(sr, 'f1')], ['1st-down %', fmt(fdp, 'f1')], ['Pass %', fmt(pr, 'f1')], ['TD', A.filter(e => e.td).length], ['Turnovers', A.filter(e => e.to).length]];
    const sel = (opts, val, fn) => h('select', { class: 'sel sm', onchange: e => fn(e.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(val) }, l)));
    const ctl = h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } }, sel(GAMES_OPTS, n, v => { n = +v; draw(); }), scope.kind !== 'player' || scope.role === 'qb' ? segControl([['all', 'All plays'], ['pass', 'Passes'], ['run', 'Runs']], kind, v => { kind = v; draw(); }, 'sm') : null,
      scope.kind !== 'player' ? segControl([['for', 'Offense'], ['against', 'Defense']], side, v => { side = v; draw(); }, 'sm') : null);
    /* down and distance grid */
    let grid = '<table class="dt"><thead><tr><th style="text-align:left">Down</th>' + DIST_B.map(b => `<th>${b[0]} yds</th>`).join('') + '<th>All</th></tr></thead><tbody>';
    for (const dn of [1, 2, 3, 4]) {
      grid += `<tr><td style="text-align:left">${ord(dn)}</td>`;
      for (const [, lo, hi] of [...DIST_B, ['', 0, 99]]) {
        const c = A.filter(e => e.d === dn && e.dist >= lo && e.dist <= hi), pp = c.length ? c.filter(e => e.k !== 'r').length / c.length : NaN;
        grid += c.length ? `<td style="background:color-mix(in srgb,var(--acc) ${Math.round(pp * 38)}%,transparent)" title="${c.length} plays · ${fmt(sumY(c) / c.length, 'f1')} yds/play">${Math.round(pp * 100)}%<div class="cap" style="font-size:10px">${c.length} · ${fmt(sumY(c) / c.length, 'f1')}</div></td>` : '<td>–</td>';
      }
      grid += '</tr>';
    }
    grid += '</tbody></table>';
    /* run gaps */
    const runs = A.filter(e => e.k === 'r' && e.gap), gmax = Math.max(1, ...RUN_GAPS.map(g => runs.filter(e => e.gap === g[1]).length));
    const gapBars = RUN_GAPS.map(([, c, l], i) => { const r = runs.filter(e => e.gap === c), yc = r.length ? sumY(r) / r.length : NaN, hh = r.length / gmax * 80;
      return `<g transform="translate(${i * 56 + 6},0)"><rect x="0" y="${96 - hh}" width="46" height="${hh}" rx="3" fill="var(--acc)" opacity=".8" data-i="${i}"/><text x="23" y="${90 - hh}" text-anchor="middle" font-size="10" fill="var(--fg)" font-family="var(--f-mono)">${r.length}</text><text x="23" y="110" text-anchor="middle" font-size="10" fill="var(--fg2)">${c}</text><text x="23" y="123" text-anchor="middle" font-size="10" fill="var(--fg3)" font-family="var(--f-mono)">${r.length ? yc.toFixed(1) : '–'}</text></g>`; }).join('');
    const gapSvg = `<svg viewBox="0 0 400 130" style="width:100%;max-width:520px;display:block" role="img" aria-label="Runs by gap: how many carries went through each hole and the average yards">${gapBars}</svg>`;
    /* pass map */
    const passes = A.filter(e => e.k === 'p' && e.dir && e.dep);
    const pcell = (dp, dr) => { const c = passes.filter(e => e.dep === dp && e.dir === dr), cm = c.filter(e => !e.inc && !e.to).length; return c.length ? `<div class="v" style="font-size:20px">${c.length}</div><div class="cap">${Math.round(cm / c.length * 100)}% · ${fmt(sumY(c) / c.length, 'f1')} Y/A</div>` : '<div class="cap">–</div>'; };
    const pmap = `<div style="display:grid;grid-template-columns:auto repeat(3,1fr);gap:6px;align-items:stretch"><div></div>${['Left', 'Middle', 'Right'].map(x => `<div class="cap" style="text-align:center">${x}</div>`).join('')}${[['d', 'Deep'], ['s', 'Short']].map(([dp, l]) => `<div class="cap" style="align-self:center">${l}</div>${['l', 'm', 'r'].map(dr => `<div style="background:var(--bg3);border-radius:8px;padding:12px 6px;text-align:center">${pcell(dp, dr)}</div>`).join('')}`).join('')}</div>`;
    /* field position */
    let ft = '<table class="dt"><thead><tr><th style="text-align:left">Field position</th><th>Plays</th><th>Pass %</th><th>Y/play</th><th>Success</th><th>TD</th></tr></thead><tbody>';
    for (const [l, lo, hi] of FIELD_B) { const c = A.filter(e => e.yte >= lo && e.yte <= hi); ft += `<tr><td style="text-align:left">${l}</td><td>${c.length}</td><td>${c.length ? Math.round(c.filter(e => e.k !== 'r').length / c.length * 100) + '%' : '–'}</td><td>${c.length ? fmt(sumY(c) / c.length, 'f2') : '–'}</td><td>${c.length ? Math.round(c.filter(nflSuccess).length / c.length * 100) + '%' : '–'}</td><td>${c.filter(e => e.td).length}</td></tr>`; }
    ft += '</tbody></table>';
    const mapPanel = h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'Field map'), h('small', {}, 'every play from the line of scrimmage, offense moving left to right')), nflPlayMap(raw, mapLayer, v => { mapLayer = v; draw(); }));
    const panel = (title, sub, body) => h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, title), sub ? h('small', {}, sub) : null), h('div', { class: 'sc', style: { padding: '10px 12px 12px' }, html: body }));
    mount(box, h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { marginBottom: '8px', flexWrap: 'wrap', gap: '8px' } }, h('h2', {}, scope.kind !== 'player' ? (side === 'for' ? 'Offensive tendencies' : 'What opponents do against them') : 'Play log'), h('span', { class: 'cap' }, `${games.length} games${multi && scope.tids.length > 1 ? ' · ' + scope.tids.length + ' teams' : ''} · scrimmage plays from play-by-play · success = 40/60/100% of yards to go`)), ctl),
      h('div', { class: 'tiles', style: { gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))' }, html: tiles.map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="p">&nbsp;</div></div>`).join('') }),
      mapPanel,
      h('div', { class: 'grid2', style: { alignItems: 'start' } }, panel('Down and distance', 'pass rate shaded · plays · yards per play', grid), panel('Field position', '', ft)),
      h('div', { class: 'grid2', style: { alignItems: 'start' } }, panel('Run direction', 'carries by gap · yards per carry', gapSvg), panel('Pass map', 'attempts · completion % · yards per attempt', pmap)));
  }
  draw();
}
App.pages.charts = async function ({ q, D, el }) {
  const tids = teamsFromQ(q, D), pid = +q.p || 0, all = tids.length ? tids : [...D.teams.keys()];
  const one = tids.length === 1 ? tids[0] : 0;
  const roster = one ? [...D.players.values()].filter(p => p.tid === one && (D.qb.has(p.id) || D.rb.has(p.id) || D.rec.has(p.id))).sort((a, b) => b.w - a.w) : [];
  const go = ids => navTo('/charts', { t: ids.length ? ids.join(',') : undefined });
  const bar = h('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap', margin: '14px 0 6px' } }, teamMultiPicker(D, tids, go),
    one ? h('select', { class: 'sel', id: 'cp', onchange: e => navTo('/charts', { t: one, p: e.target.value || undefined }) }, h('option', { value: '' }, 'Whole team'), roster.map(p => h('option', { value: p.id, selected: p.id === pid }, `${p.name} (${p.pos})`))) : null);
  const out = h('div', {});
  mount(el, pageHead('PLAY EXPLORER', 'Play tendencies', 'Run and pass tendencies by down, distance, field position and direction, built from every scrimmage play. Starts with the whole league; pick one team, several, or a single player on one team.'), bar, tids.length ? h('div', { style: { marginBottom: '10px' } }, teamChips(D, tids, go)) : null, out, explainer('<p>The field is drawn with the offense always moving left to right, so every play lines up regardless of which way the teams were actually facing. Each mark is one scrimmage play, placed by where the ball was snapped and how far it went. Passes and runs use different colors, and the pass map separates the short, middle and deep areas.</p><p>The down-and-distance grid shows how often a team runs versus passes on each situation: darker cells mean more plays, and the split inside tells you whether they lean on the run or the pass. <b>Offense / Defense</b> flips between what a team does and what it faces.</p>'));
  const pl = one && pid && D.players.get(pid); const role = pl ? (D.qb.has(pid) ? 'qb' : D.rb.has(pid) && !D.rec.has(pid) ? 'rb' : D.rec.has(pid) && !D.rb.has(pid) ? 'rec' : (D.rec.get(pid)?.tgt || 0) > (D.rb.get(pid)?.att || 0) ? 'rec' : 'rb') : '';
  playExplorer(D, pl ? { kind: 'player', id: pid, role } : { kind: 'teams', tids: all, n: tids.length === 0 || tids.length > 6 ? 5 : 10 }, out);
};

/* ---------- field map: every play drawn on a field, offense always moving left to right ---------- */
function nflPlayMap(plays, layer, setLayer) {
  const want = e => layer === 'all' ? true : layer === 'pass' ? e.k === 'p' || e.k === 's' : layer === 'run' ? e.k === 'r' : e.k === 'f';
  let list = plays.filter(want), note = '';
  const CAP = layer === 'all' ? 1200 : 2000;
  if (list.length > CAP) { const step = list.length / CAP; list = Array.from({ length: CAP }, (_, i) => list[Math.floor(i * step)]); note = `Showing an even sample of ${CAP.toLocaleString()} of ${plays.filter(want).length.toLocaleString()} plays.`; }
  const geo = list.map((e, i) => {
    const jit = ((i * 37) % 21 - 10) * 2.6, k = e.k === 'f' ? 'f' : e.k === 'p' ? 'p' : e.k;
    const lane = e.k === 'r' ? NF_RUN_LANE[e.gap] ?? 0 : e.k === 'p' ? NF_PASS_LANE[e.dir] ?? 0 : 0;
    const g = nflGeom({ k, x0: e.k === 'f' ? 100 - e.yte - 7 : 100 - e.yte, dir: 1, y: e.y, lane, inc: !!e.inc, to: !!e.to, td: !!e.td, dep: e.dep, made: !!e.mk, wide: e.wide, drift: e.k === 'f' ? 0 : jit, x1: e.td && e.k !== 'f' ? 100 : null });
    return { e, g };
  });
  const dens = Math.max(.14, Math.min(1, 260 / Math.max(1, list.length))), order = ['inc', 'run', 'pass', 'sack', 'int', 'td', 'fgN', 'fgY'], by = {}; for (const o of geo) (by[o.g.cls] || (by[o.g.cls] = [])).push(o);
  let body = nflFieldBg({ abbr: 'OWN', color: '#26402f' }, { abbr: 'OPP', color: '#26402f' });
  for (const c of order) if (by[c]) {
    body += `<path d="${by[c].map(o => o.g.d).join(' ')}" fill="none" stroke="${NF_C[c]}" stroke-width="${c === 'fgY' || c === 'fgN' ? 3 : 2.4}" stroke-opacity="${((c === 'inc' ? .38 : .6) * dens).toFixed(2)}" stroke-linecap="round"${c === 'inc' || c === 'fgN' ? ' stroke-dasharray="7 7"' : ''}/>`;
    body += `<path d="${by[c].map(o => `M${(o.g.x - 3.4).toFixed(1)} ${o.g.y.toFixed(1)}a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0`).join('')}" fill="${NF_C[c]}" fill-opacity="${Math.min(.9, (c === 'inc' ? .45 : .85) * Math.max(.5, dens * 1.6)).toFixed(2)}"/>`;
  }
  const svgEl = h('div', {}); svgEl.innerHTML = `<svg class="gstage" viewBox="0 0 ${NF.W} ${NF.H}" role="img" aria-label="Field map of plays">${body}</svg>`;
  const svg = svgEl.firstChild;
  svg.addEventListener('mousemove', ev => {
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * NF.W, y = (ev.clientY - r.top) / r.height * NF.H; let best = null, bd = 26 * 26;
    for (const o of geo) { const d = (o.g.x - x) ** 2 + (o.g.y - y) ** 2; if (d < bd) { bd = d; best = o; } }
    if (!best) return tipHide(); const e = best.e;
    tipShow(`<b>${esc(e.k === 'f' ? `${e.y}-yard field goal ${e.mk ? 'good' : 'no good'}` : e.k === 'p' ? (e.inc ? 'Incomplete pass' : e.to ? 'Interception' : `Pass for ${e.y} yards`) : e.k === 's' ? 'Sack' : `Run for ${e.y} yards`)}</b>${e.t ? `<span class="td">${esc(e.t)}</span>` : ''}${tr('Down and distance', e.k === 'f' ? '–' : `${ord(e.d)} & ${e.dist}`)}${tr('Yards to end zone', e.yte)}`, ev.clientX, ev.clientY);
  });
  svg.addEventListener('mouseleave', tipHide);
  const cnt = c => (by[c] || []).length, leg = (c, l) => cnt(c) ? `<span class="lg"><i style="background:${NF_C[c]}"></i>${l} <b>${cnt(c)}</b></span>` : '';
  return h('div', {}, h('div', { class: 'row sb', style: { padding: '10px 14px', gap: '8px', flexWrap: 'wrap' } }, segControl([['all', 'Everything'], ['pass', 'Passes'], ['run', 'Runs'], ['fg', 'Field goals']], layer, setLayer, 'sm'), h('div', { class: 'row maplg', style: { gap: '12px', flexWrap: 'wrap' }, html: leg('pass', 'Complete') + leg('inc', 'Incomplete') + leg('int', 'Interception') + leg('run', 'Run') + leg('sack', 'Sack') + leg('td', 'Touchdown') + leg('fgY', 'FG good') + leg('fgN', 'FG missed') })),
    svgEl, h('div', { class: 'cap', style: { padding: '8px 14px 12px' } }, `Pass and run lanes come from the play description (left, middle, right and the gap), so the sideways spread is approximate. ESPN does not publish tracking coordinates for football. ${note}`));
}
