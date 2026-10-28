/* player_tabs.js: MLB player profile tabs (usage, splits, game log, field explorer) */
const BIO = id => cached(`bio:${id}`, 7 * 86400e3, () => getJSON(`${API}/people/${id}?hydrate=currentTeam`).then(j => j.people[0]));
const YBY = (id, grp) => cached(`yby:${id}:${grp}`, 6 * 3600e3, () => getJSON(`${API}/people/${id}/stats?stats=yearByYear&group=${grp}&sportId=1`).then(j => j.stats?.[0]?.splits || []));
const GLOG = (id, grp, s) => cached(`glog:${id}:${grp}:${s}`, 3600e3, () => getJSON(`${API}/people/${id}/stats?stats=gameLog&group=${grp}&season=${s}&sportId=1&gameType=R`).then(j => j.stats?.[0]?.splits || []));
const BYMONTH = (id, grp, s) => cached(`bym:${id}:${grp}:${s}`, 3600e3, () => getJSON(`${API}/people/${id}/stats?stats=byMonth&group=${grp}&season=${s}&sportId=1&gameType=R`).then(j => j.stats?.[0]?.splits || []));
const PSPLITS = (id, grp, s, codes) => cached(`psplit:${id}:${grp}:${s}`, 3600e3, () => getJSON(`${API}/people/${id}/stats?stats=statSplits&sitCodes=${codes}&group=${grp}&season=${s}&sportId=1&gameType=R`));
const ARSENAL_RV = s => cached(`${s}:arsenalrv`, ttlFor(s), () => getCSV(`${SAV}/leaderboard/pitch-arsenal-stats?type=pitcher&pitchType=&year=${s}&team=&min=1&csv=true`));

const BAT_TILES = ['g', 'pa', 'hr', 'avg', 'ops', 'wrcp', 'war', 'xwoba'];
const PIT_TILES = ['g', 'ipn', 'era', 'fip', 'kp', 'bbp', 'war', 'xera'];
const BAT_PCT = ['wrcp', 'xwoba', 'xba', 'xslg', 'ev', 'brl', 'hh', 'kp', 'bbp', 'whiff', 'oswing', 'bs', 'sq', 'spr', 'oaa'];
const PIT_PCT = ['war', 'era', 'fip', 'xera', 'xwoba', 'xba', 'ev', 'brl', 'hh', 'kp', 'bbp', 'whiff', 'oswing', 'fbv', 'gb'];
const BAT_RADAR = [['xwoba', 'xwOBA'], ['brl', 'Barrel%'], ['hh', 'Hard-hit%'], ['ev', 'Avg EV'], ['kp', 'K%'], ['bbp', 'BB%'], ['whiff', 'Whiff%'], ['oswing', 'Chase%'], ['spr', 'Speed']];
const PIT_RADAR = [['fbv', 'FB velo'], ['kp', 'K%'], ['bbp', 'BB%'], ['whiff', 'Whiff%'], ['oswing', 'Chase%'], ['xera', 'xERA'], ['brl', 'Barrel%'], ['hh', 'Hard-hit%'], ['gb', 'GB%']];
const grpOf = role => role === 'bat' ? 'hitting' : 'pitching';

SPORT.player = {
  roles(D, id) {
    const b = D.bat.get(id), p = D.pit.get(id), out = [];
    if (b && (!p || b.pa >= p.bf * 0.6)) { out.push('bat'); if (p) out.push('pit'); } else { if (p) out.push('pit'); if (b) out.push('bat'); }
    return out;
  },
  bio: BIO,
  roleName: { bat: 'BATTER', pit: 'PITCHER' },
  roleLine: (role, r) => role === 'bat' ? (r.pos || 'Batter') : (r.gs && r.gs >= r.g * 0.5 ? 'Starting pitcher' : 'Reliever'),
  bioPills: (bio, r) => [bio && `B ${bio.batSide?.code || '?'} / T ${bio.pitchHand?.code || '?'}`, bio?.height && `${bio.height} · ${bio.weight} lb`, r?.age && `Age ${r.age}`, bio?.mlbDebutDate && `Debut ${bio.mlbDebutDate.slice(0, 4)}`].filter(Boolean),
  tiles: { bat: BAT_TILES, pit: PIT_TILES }, pct: { bat: BAT_PCT, pit: PIT_PCT }, radar: { bat: BAT_RADAR, pit: PIT_RADAR },
  tabs: [['overview', 'Overview'], ['stats', 'Stats'], ['usage', 'Usage'], ['splits', 'Splits'], ['log', 'Game log'], ['field', 'Field Explorer']],
  build: { usage: tabUsage, splits: tabSplits, log: tabLog, field: tabField },
  seasonsPlayed: async id => { const yb = await Promise.all([YBY(id, 'hitting'), YBY(id, 'pitching')]); return [...new Set(yb.flat().map(s => +s.season))]; },
  arc: {
    title: role => role === 'bat' ? 'Season arc' : 'Season arc', note: role => role === 'bat' ? 'OPS by month' : 'ERA by month',
    draw(D, id, role, box) {
      const grp = grpOf(role);
      BYMONTH(id, grp, D.season).then(sp => {
        if (!box.isConnected) return;
        const pts = sp.filter(s => MONTHS[s.month]).map(s => ({ m: s.month, v: num(role === 'bat' ? s.stat.ops : s.stat.era), n: role === 'bat' ? s.stat.plateAppearances : s.stat.inningsPitched })).sort((a, b) => a.m - b.m);
        if (pts.length < 2) { box.innerHTML = '<div class="empty">Not enough months to chart.</div>'; return; }
        box.innerHTML = lineSVG({ series: [{ name: 'm', color: 'var(--acc)', area: true, dots: true, pts: pts.map(p => [p.m, p.v]) }], xticks: pts.map(p => ({ v: p.m, l: MONTHS[p.m] })), yfmt: role === 'bat' ? v => noLead(v.toFixed(3)) : v => v.toFixed(2), H: 230 });
        tipBind(box, i => { const q = pts[i % 10000]; return q ? `<b>${MONTHS[q.m]}</b>${tr(role === 'bat' ? 'OPS' : 'ERA', role === 'bat' ? noLead(q.v.toFixed(3)) : q.v.toFixed(2))}${tr(role === 'bat' ? 'PA' : 'IP', q.n)}` : ''; });
      }).catch(() => { if (box.isConnected) box.innerHTML = '<div class="empty">Monthly splits unavailable.</div>'; });
    },
  },
  async career(D, id, role) {
    const bat = role === 'bat', yb = await YBY(id, grpOf(role));
    const cap = bat ? [['season', 'Year'], ['team', 'Team'], ['gamesPlayed', 'G'], ['plateAppearances', 'PA'], ['homeRuns', 'HR'], ['runs', 'R'], ['rbi', 'RBI'], ['stolenBases', 'SB'], ['avg', 'AVG'], ['obp', 'OBP'], ['slg', 'SLG'], ['ops', 'OPS']] : [['season', 'Year'], ['team', 'Team'], ['wins', 'W'], ['losses', 'L'], ['era', 'ERA'], ['gamesPlayed', 'G'], ['gamesStarted', 'GS'], ['inningsPitched', 'IP'], ['strikeOuts', 'SO'], ['baseOnBalls', 'BB'], ['homeRuns', 'HR'], ['whip', 'WHIP']];
    return { title: 'MLB career by season', note: 'click a season to jump to it', head: cap.map(c => c[1]),
      rows: yb.filter(s => s.stat && (s.sport?.id === 1 || !s.sport)).map(s => ({ season: +s.season, cells: cap.map(([k]) => k === 'season' ? s.season : k === 'team' ? esc(s.team?.name?.replace(/^.* /, '') || '2+ teams') : esc(s.stat[k] ?? '–')) })) };
  },
};

/* ---- Usage ---- */
async function tabUsage({ D, id, role, r }) {
  let rows; try { rows = await loadPitches(id, role, D.season); } catch (e) { return errorEl(e, () => render(true)); }
  const out = h('div', { class: 'stack' });
  const types = [...new Set(rows.map(p => p.pt).filter(Boolean))].map(t => [t, rows.filter(p => p.pt === t)]).sort((a, b) => b[1].length - a[1].length);
  const total = rows.length;
  if (role === 'pit') {
    let rv = new Map(); try { (await ARSENAL_RV(D.season)).filter(o => +o.player_id === id).forEach(o => rv.set(o.pitch_type, o)); } catch (e) { }
    const hasRV = rv.size > 0;
    const trs = types.filter(([t, a]) => a.length >= 5).map(([t, a]) => {
      const s = summarize(a), o = rv.get(t);
      return `<tr><td><span class="ptd" style="background:${PITCH_COLORS[t] || '#888'}"></span>${esc(PITCH_NAMES[t] || t)}</td><td>${a.length}</td><td>${fmt(a.length / total * 100, 'f1')}%</td><td>${fmt(s.velo, 'f1')}</td><td>${fmt(s.spin, 'int')}</td><td>${fmt(mean(a.map(p => p.hb)), 'f1')}</td><td>${fmt(mean(a.map(p => p.ivb)), 'f1')}</td><td>${fmt(s.whiff, 'f1')}</td><td>${fmt(s.zone, 'f1')}</td><td>${fmt(s.chase, 'f1')}</td><td>${fmt(s.ev, 'f1')}</td><td>${fmt(s.xwobacon, 'f3')}</td>${hasRV ? `<td>${o ? fmt(num(o.run_value_per_100), 'sg1') : '–'}</td><td>${o ? fmt(num(o.put_away), 'f1') : '–'}</td>` : ''}</tr>`;
    }).join('');
    out.append(h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'Arsenal'), h('small', {}, `${total.toLocaleString()} pitches tracked`)), h('div', { class: 'sc', style: { padding: '8px 4px 4px' }, html: `<table class="dt"><thead><tr><th>Pitch</th><th>#</th><th>Usage</th><th>Velo</th><th>Spin</th><th>H-brk</th><th>iV-brk</th><th>Whiff%</th><th>Zone%</th><th>Chase%</th><th>EV</th><th>xwOBAcon</th>${hasRV ? '<th>RV/100</th><th>PutAway%</th>' : ''}</tr></thead><tbody>${trs}</tbody></table>` })));
    const ctxs = [['All', () => true], ['vs LHB', p => p.stand === 'L'], ['vs RHB', p => p.stand === 'R'], ['First pitch', p => p.b === 0 && p.s === 0], ['Pitcher ahead', p => p.s > p.b], ['Two strikes', p => p.s === 2], ['Hitter ahead', p => p.b > p.s]];
    const head = ctxs.map(c => `<th>${c[0]}</th>`).join('');
    const body = types.filter(([t, a]) => a.length >= 25).map(([t]) => `<tr><td><span class="ptd" style="background:${PITCH_COLORS[t] || '#888'}"></span>${esc(PITCH_NAMES[t] || t)}</td>${ctxs.map(([l, f]) => { const sub = rows.filter(f); const v = sub.length ? sub.filter(p => p.pt === t).length / sub.length * 100 : NaN; return `<td style="${isFinite(v) ? `background:rgba(255,138,76,${(Math.min(v, 70) / 70 * .55).toFixed(2)})` : ''}">${isFinite(v) ? v.toFixed(1) + '%' : '–'}</td>`; }).join('')}</tr>`).join('');
    out.append(h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'How the mix changes'), h('small', {}, 'share of pitches by situation')), h('div', { class: 'sc', style: { padding: '8px 4px 4px' }, html: `<table class="dt"><thead><tr><th>Pitch</th>${head}</tr></thead><tbody>${body}</tbody></table>` })));
  } else {
    const trs = types.filter(([t, a]) => a.length >= 20).map(([t, a]) => { const s = summarize(a); return `<tr><td><span class="ptd" style="background:${PITCH_COLORS[t] || '#888'}"></span>${esc(PITCH_NAMES[t] || t)}</td><td>${a.length}</td><td>${fmt(a.length / total * 100, 'f1')}%</td><td>${fmt(s.velo, 'f1')}</td><td>${fmt(s.swing, 'f1')}</td><td>${fmt(s.whiff, 'f1')}</td><td>${fmt(s.chase, 'f1')}</td><td>${fmt(s.ev, 'f1')}</td><td>${fmt(s.xwobacon, 'f3')}</td><td>${fmt(s.woba, 'f3')}</td></tr>`; }).join('');
    out.append(h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'What he sees'), h('small', {}, `${total.toLocaleString()} pitches tracked`)), h('div', { class: 'sc', style: { padding: '8px 4px 4px' }, html: `<table class="dt"><thead><tr><th>Pitch</th><th>#</th><th>Seen</th><th>Velo</th><th>Swing%</th><th>Whiff%</th><th>Chase%</th><th>Avg EV</th><th>xwOBAcon</th><th>wOBA</th></tr></thead><tbody>${trs}</tbody></table>` })));
    const hands = [['vs LHP', rows.filter(p => p.thr === 'L')], ['vs RHP', rows.filter(p => p.thr === 'R')]].map(([l, a]) => { const s = summarize(a); return `<tr><td>${l}</td><td>${a.length}</td><td>${fmt(s.woba, 'f3')}</td><td>${fmt(s.xwobacon, 'f3')}</td><td>${fmt(s.whiff, 'f1')}</td><td>${fmt(s.chase, 'f1')}</td><td>${fmt(s.ev, 'f1')}</td><td>${fmt(s.brl, 'f1')}</td></tr>`; }).join('');
    const bbp = [['Ground ball', r.gb, '#8a97a3'], ['Line drive', r.ld, '#4fd18b'], ['Fly ball', r.fb, '#5cc8ff'], ['Pop-up', r.pu, '#f2c14e'], ['Pull', r.pull, '#ff8a4c'], ['Straightaway', r.straight, '#9a66e0'], ['Opposite', r.oppo, '#46b88a']].filter(x => isFinite(x[1]));
    out.append(h('div', { class: 'grid2', style: { alignItems: 'start' } }, h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, 'Platoon')), h('div', { class: 'sc', style: { padding: '8px 4px 4px' }, html: `<table class="dt"><thead><tr><th></th><th>Pitches</th><th>wOBA</th><th>xwOBAcon</th><th>Whiff%</th><th>Chase%</th><th>EV</th><th>Barrel%</th></tr></thead><tbody>${hands}</tbody></table>` })),
      h('div', { class: 'panel pad' }, h('h2', {}, 'Batted-ball profile'), h('div', { style: { marginTop: '12px' }, html: hbars(bbp.map(([l, v, c]) => ({ l, v, color: c, t: v.toFixed(1) + '%' })), { max: 60 }) }))));
  }
  return out;
}

/* ---- Splits ---- */
const SPLIT_SECTIONS = [
  ['PLATOON', [['vl', 'vs left'], ['vr', 'vs right']]], ['HOME & AWAY', [['h', 'Home'], ['a', 'Away']]], ['DAY & NIGHT', [['d', 'Day'], ['n', 'Night']]],
  ['BASES & OUTS', [['r0', 'Bases empty'], ['ron', 'Runners on'], ['risp', 'Scoring position'], ['risp2', 'Scoring position, 2 out'], ['o0', 'No outs'], ['o1', 'One out'], ['o2', 'Two outs']]],
  ['COUNT', [['fp', 'First pitch'], ['ac', 'Ahead in count'], ['bc', 'Behind in count'], ['ec', 'Even count'], ['2s', 'Two strikes']]], ['GAME STATE', [['lc', 'Late & close'], ['sah', 'Team ahead'], ['sbh', 'Team behind'], ['sti', 'Tied']]],
  ['MONTH', [['3', 'March'], ['4', 'April'], ['5', 'May'], ['6', 'June'], ['7', 'July'], ['8', 'August'], ['9', 'September'], ['10', 'October']]], ['HALF', [['h1', 'First half'], ['h2', 'Second half']]], ['SURFACE', [['g', 'Grass'], ['t', 'Turf']]],
];
async function tabSplits({ D, id, role, r }) {
  const grp = grpOf(role);
  const codes = SPLIT_SECTIONS.flatMap(s => s[1].map(x => x[0])).join(',');
  const j = await PSPLITS(id, grp, D.season, codes);
  const by = new Map(); for (const st of (j.stats || [])) for (const sp of (st.splits || [])) { const c = sp.split?.code; if (c) by.set(c, sp.stat); }
  const bat = role === 'bat';
  const heads = bat ? ['PA', 'AVG', 'OBP', 'SLG', 'OPS', 'HR', 'BB%', 'K%', 'BABIP'] : ['IP', 'ERA', 'WHIP', 'AVG', 'OPS', 'HR', 'BB%', 'K%', 'BABIP'];
  const cell = (st) => { if (!st) return ['–'].concat(Array(heads.length - 1).fill('')).map(x => `<td>${x}</td>`).join(''); const pa = bat ? st.plateAppearances : st.battersFaced; const kp = pa ? st.strikeOuts / pa * 100 : NaN, bp = pa ? st.baseOnBalls / pa * 100 : NaN;
    const vals = bat ? [pa, num(st.avg), num(st.obp), num(st.slg), num(st.ops), st.homeRuns, bp, kp, num(st.babip)] : [st.inningsPitched, num(st.era), num(st.whip), num(st.avg), num(st.ops), st.homeRuns, bp, kp, null];
    const fm = bat ? ['int', 'f3', 'f3', 'f3', 'f3', 'int', 'f1', 'f1', 'f3'] : [null, 'f2', 'f2', 'f3', 'f3', 'int', 'f1', 'f1', null];
    return vals.map((v, i) => `<td>${fm[i] ? fmt(typeof v === 'number' ? v : num(v), fm[i]) : (v ?? '–')}</td>`).join(''); };
  const maxOps = Math.max(...[...by.values()].map(s => num(s.ops)).filter(isFinite), 1);
  let html = `<table class="dt"><thead><tr><th>Split</th>${heads.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>`;
  for (const [title, items] of SPLIT_SECTIONS) {
    const present = items.filter(([c]) => by.has(c)); if (!present.length) continue;
    html += `<tr><td colspan="${heads.length + 1}" style="background:var(--bg3);font:600 10.5px var(--f-mono);letter-spacing:.14em;color:var(--fg3);text-align:left">${title}</td></tr>`;
    for (const [c, l] of present) html += `<tr><td>${esc(bat || !['vl', 'vr'].includes(c) ? l : l.replace('vs left', 'vs left-handed batters').replace('vs right', 'vs right-handed batters'))}</td>${cell(by.get(c))}</tr>`;
  }
  html += '</tbody></table>';
  return h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, `${D.season} splits`), h('small', {}, 'MLB Stats API situational splits')), h('div', { class: 'sc', style: { padding: '8px 4px 4px', maxHeight: '75vh' }, html }));
}

/* ---- Game log ---- */
async function tabLog({ D, id, role, r }) {
  const grp = grpOf(role);
  const sp = (await GLOG(id, grp, D.season)).filter(s => s.stat).sort((a, b) => a.date.localeCompare(b.date));
  if (!sp.length) return h('div', { class: 'panel empty' }, 'No games.');
  const bat = role === 'bat'; let chart;
  if (bat) {
    let cum = { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, tb: 0 }; const pts = [], cumPts = [], win = [];
    sp.forEach((s, i) => { const x = s.stat, g = { ab: x.atBats, h: x.hits, bb: x.baseOnBalls, hbp: x.hitByPitch, sf: x.sacFlies, tb: x.totalBases }; for (const k in cum) cum[k] += g[k] || 0; win.push(g); if (win.length > 15) win.shift();
      const ops = c => { const obp = (c.h + c.bb + c.hbp) / Math.max(1, c.ab + c.bb + c.hbp + c.sf), slg = c.tb / Math.max(1, c.ab); return obp + slg; };
      const w = win.reduce((a, g) => { for (const k in a) a[k] += g[k] || 0; return a; }, { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, tb: 0 }); if (i >= 4) { pts.push([i, ops(w)]); } cumPts.push([i, ops(cum)]); });
    chart = { series: [{ name: 'Cumulative OPS', color: 'var(--a)', pts: cumPts, dots: true }, { name: 'Rolling 15-game OPS', color: 'var(--acc)', pts: pts, dots: true }], fmt: v => noLead(v.toFixed(3)) };
  } else {
    let er = 0, ip = 0; const cumPts = [], pts = [], win = [];
    sp.forEach((s, i) => { const x = s.stat, g = { er: x.earnedRuns || 0, ip: ipToNum(x.inningsPitched) || 0 }; er += g.er; ip += g.ip; win.push(g); if (win.length > 5) win.shift(); const wi = win.reduce((a, b) => a + b.ip, 0), we = win.reduce((a, b) => a + b.er, 0); if (ip > 0) cumPts.push([i, er * 9 / ip]); if (wi > 0 && i >= 2) pts.push([i, Math.min(we * 9 / wi, 15)]); });
    chart = { series: [{ name: 'Cumulative ERA', color: 'var(--a)', pts: cumPts, dots: true }, { name: 'Rolling 5-outing ERA', color: 'var(--acc)', pts: pts, dots: true }], fmt: v => v.toFixed(2) };
  }
  const ticks = sp.map((s, i) => ({ v: i, l: s.date.slice(5) })).filter((t, i) => i % Math.max(1, Math.ceil(sp.length / 9)) === 0);
  const cbox = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, bat ? 'Form' : 'Form'), h('div', { class: 'legend', style: { margin: 0 }, html: chart.series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('') })), h('div', { html: lineSVG({ series: chart.series, xticks: ticks, yfmt: chart.fmt, H: 270 }) }));
  tipBind(cbox, i => { const si = Math.floor(i / 10000), k = i % 10000, se = chart.series[si], p = se?.pts[k]; if (!p) return ''; const g = sp[p[0]]; return `<b>${esc(se.name)}</b>${tr('Through', g.date)}${tr('Value', chart.fmt(p[1]))}`; });
  const cols = bat ? [['atBats', 'AB'], ['runs', 'R'], ['hits', 'H'], ['doubles', '2B'], ['homeRuns', 'HR'], ['rbi', 'RBI'], ['baseOnBalls', 'BB'], ['strikeOuts', 'SO'], ['stolenBases', 'SB']] : [['inningsPitched', 'IP'], ['hits', 'H'], ['runs', 'R'], ['earnedRuns', 'ER'], ['homeRuns', 'HR'], ['baseOnBalls', 'BB'], ['strikeOuts', 'SO'], ['numberOfPitches', 'Pitches']];
  const trs = sp.slice().reverse().map(s => { const opp = D.teams.get(s.opponent?.id); const res = s.isWin === true ? '<b style="color:#2fa36b">W</b>' : s.isWin === false ? '<b style="color:#d6455d">L</b>' : ''; return `<tr><td>${s.date}</td><td>${s.isHome ? 'vs' : '@'} ${esc(opp?.abbr || s.opponent?.name || '')}</td><td>${res}</td>${cols.map(([k]) => `<td>${esc(s.stat[k] ?? 0)}</td>`).join('')}</tr>`; }).join('');
  const tbl = h('div', { class: 'panel', style: { marginTop: '14px' } }, h('div', { class: 'hd' }, h('h2', {}, 'Game log'), h('small', {}, sp.length + ' games')), h('div', { class: 'sc', style: { padding: '8px 4px 4px', maxHeight: '60vh' }, html: `<table class="dt"><thead><tr><th>Date</th><th style="text-align:left">Opp</th><th>Team</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${trs}</tbody></table>` }));
  return h('div', {}, cbox, tbl);
}

/* ---- Field Explorer ---- */
async function tabField({ D, id, role }) { return await fieldExplorer(D, id, role); }
