/* field.js: per-pitch Statcast loading and the Field Explorer */
const SWING = new Set(['swinging_strike', 'swinging_strike_blocked', 'foul', 'foul_tip', 'hit_into_play', 'foul_bunt', 'missed_bunt', 'bunt_foul_tip']);
const WHIFF = new Set(['swinging_strike', 'swinging_strike_blocked', 'missed_bunt']);
const HITS = new Set(['single', 'double', 'triple', 'home_run']);
const XBH = new Set(['double', 'triple', 'home_run']);
const AB_EVENTS_NO = new Set(['walk', 'intent_walk', 'hit_by_pitch', 'sac_fly', 'sac_bunt', 'catcher_interf', 'sac_fly_double_play', 'sac_bunt_double_play']);

function savantPitchURL(id, role, season) {
  const who = role === 'pit' ? 'player_type=pitcher&pitchers_lookup%5B%5D=' + id : 'player_type=batter&batters_lookup%5B%5D=' + id;
  return `${SAV}/statcast_search/csv?all=true&hfPT=&hfAB=&hfGT=R%7C&hfPR=&hfZ=&hfStadium=&hfBBL=&hfNewZones=&hfPull=&hfC=&hfSea=${season}%7C&hfSit=&${who}&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfInn=&hfBBT=&hfFlag=&metric_1=&group_by=name&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&type=details`;
}
function compactPitch(o) {
  const les = num(o.launch_speed), type = o.type;
  const p = {
    d: o.game_date, pt: o.pitch_type || '', pn: o.pitch_name || '', v: num(o.release_speed), sp: num(o.release_spin_rate), hb: num(o.pfx_x) * 12, ivb: num(o.pfx_z) * 12,
    px: num(o.plate_x), pz: num(o.plate_z), szt: num(o.sz_top), szb: num(o.sz_bot), zone: num(o.zone), desc: o.description, ev: o.events || '', type,
    bbt: o.bb_type || '', les, la: num(o.launch_angle), dist: num(o.hit_distance_sc), hx: num(o.hc_x), hy: num(o.hc_y), stand: o.stand, thr: o.p_throws,
    b: num(o.balls), s: num(o.strikes), exw: num(o.estimated_woba_using_speedangle), exba: num(o.estimated_ba_using_speedangle), wv: num(o.woba_value), wd: num(o.woba_denom),
    lsa: num(o.launch_speed_angle), nm: o.player_name, des: o.des, home: o.home_team, away: o.away_team, tb: o.inning_topbot, inn: num(o.inning), bs: num(o.bat_speed), sl: num(o.swing_length),
    pit: num(o.pitcher), bat: num(o.batter), gp: num(o.game_pk), ext: num(o.release_extension), rx: num(o.release_pos_x), rz: num(o.release_pos_z), o1: num(o.on_1b), o2: num(o.on_2b), o3: num(o.on_3b), outs: num(o.outs_when_up),
  };
  p.swing = SWING.has(p.desc); p.whiff = WHIFF.has(p.desc); p.called = p.desc === 'called_strike'; p.inplay = type === 'X'; p.inzone = p.zone >= 1 && p.zone <= 9;
  p.bbe = p.inplay && isFinite(les); p.month = +(o.game_date || '0-0').split('-')[1];
  return p;
}
async function loadPitches(id, role, season) {
  const key = `${season}:pitches:${role}:${id}`;
  return cached(key, ttlFor(season), async () => { const t = await getText(savantPitchURL(id, role, season), { timeout: 120000 }); if (t.trimStart().startsWith('<')) throw new Error('Savant returned a page instead of data'); return csvObjects(t).map(compactPitch); });
}
function filterPitches(rows, F) {
  return rows.filter(p => {
    if (F.types && F.types.size && !F.types.has(p.pt)) return false;
    if (F.hand && (F.role === 'pit' ? p.stand : p.thr) !== F.hand) return false;
    if (F.month && p.month !== +F.month) return false;
    if (F.count) {
      const b = p.b, s = p.s;
      if (F.count === 'first' && !(b === 0 && s === 0)) return false;
      if (F.count === 'two' && s !== 2) return false;
      if (F.count === 'three' && b !== 3) return false;
      if (F.count === 'hitter' && !(b > s)) return false;
      if (F.count === 'pitcher' && !(s > b)) return false;
      if (F.count === 'even' && b !== s) return false;
    }
    if (F.res) {
      if (F.res === 'hits' && !HITS.has(p.ev)) return false;
      if (F.res === 'xbh' && !XBH.has(p.ev)) return false;
      if (F.res === 'hr' && p.ev !== 'home_run') return false;
      if (F.res === 'outs' && (HITS.has(p.ev) || !p.inplay)) return false;
      if (F.res === 'barrel' && p.lsa !== 6) return false;
      if (F.res === 'hard' && !(p.les >= 95)) return false;
    }
    return true;
  });
}
function summarize(rows) {
  const n = rows.length, bbe = rows.filter(p => p.bbe), sw = rows.filter(p => p.swing), wh = sw.filter(p => p.whiff);
  const oz = rows.filter(p => isFinite(p.zone) && p.zone >= 11), chase = oz.filter(p => p.swing), zn = rows.filter(p => p.inzone);
  const exw = bbe.map(p => p.exw).filter(isFinite);
  const pa = rows.filter(p => p.ev && p.wd === 1 || (p.ev && isFinite(p.wd) && p.wd > 0));
  const woba = (() => { let a = 0, b = 0; rows.forEach(p => { if (isFinite(p.wd) && p.wd > 0) { a += isFinite(p.wv) ? p.wv : 0; b += p.wd; } }); return b ? a / b : NaN; })();
  return {
    pitches: n, bbe: bbe.length, ev: mean(bbe.map(p => p.les)), maxEV: bbe.length ? Math.max(...bbe.map(p => p.les)) : NaN, la: mean(bbe.map(p => p.la)),
    hh: bbe.length ? bbe.filter(p => p.les >= 95).length / bbe.length * 100 : NaN, brl: bbe.length ? bbe.filter(p => p.lsa === 6).length / bbe.length * 100 : NaN,
    xwobacon: exw.length ? mean(exw) : NaN, whiff: sw.length ? wh.length / sw.length * 100 : NaN, swing: n ? sw.length / n * 100 : NaN, chase: oz.length ? chase.length / oz.length * 100 : NaN,
    zone: n ? zn.length / n * 100 : NaN, woba, velo: mean(rows.map(p => p.v)), spin: mean(rows.map(p => p.sp)), hr: rows.filter(p => p.ev === 'home_run').length,
    avgDist: mean(rows.filter(p => p.ev === 'home_run').map(p => p.dist)), maxDist: Math.max(0, ...rows.filter(p => isFinite(p.dist)).map(p => p.dist)),
  };
}
function sprayAngle(p) { const [x, y] = hcFt(p.hx, p.hy); return Math.atan2(x, y) * 180 / Math.PI; }
function prettyEvent(e) { return (e || 'in play, out').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function tipForPitch(p, role) {
  const typ = PITCH_NAMES[p.pt] || p.pn || p.pt;
  let s = `<b>${esc(prettyEvent(p.ev || (p.type === 'X' ? 'in play' : p.desc?.replace(/_/g, ' '))))}</b>`;
  if (p.des) s += `<div class="dim" style="margin:2px 0 4px;font-size:11.5px">${esc(p.des)}</div>`;
  s += tr('Date', p.d) + tr('Pitch', `${typ}${isFinite(p.v) ? ' · ' + p.v.toFixed(1) + ' mph' : ''}`) + tr('Count', `${p.b}-${p.s}`);
  if (isFinite(p.les)) s += tr('Exit velo', p.les.toFixed(1) + ' mph') + tr('Launch angle', Math.round(p.la) + '°');
  if (isFinite(p.dist)) s += tr('Distance', Math.round(p.dist) + ' ft');
  if (isFinite(p.exw)) s += tr('xwOBA', noLead(p.exw.toFixed(3)));
  return s;
}

/* ---- Field Explorer ---- */
const FX_VIEWS_BAT = [['spray', 'Spray chart'], ['zone', 'Zone map'], ['pitches', 'Pitch locations'], ['evla', 'EV / launch angle']];
const FX_HELP = {
  spray: '<p>A bird’s-eye view of the field with home plate at the bottom. Each dot is a ball put in play, placed where it landed or was fielded: left of center is the third-base side, right of center the first-base side, and farther from the plate means it traveled farther. Home runs are drawn larger.</p><p>Color by <b>Result</b> shows hits versus outs, <b>Exit velo</b> shows how hard it was struck, and <b>xwOBA</b> shows how valuable the contact was expected to be from speed and angle alone.</p>',
  zone: '<p>The box is the strike zone as the catcher sees it, split into nine cells, with the shadow zone around it. Each cell is shaded by the measure you pick (for example how often pitches went there, or how often the batter hit them). Hotter colors mean a higher number in that cell, so you can see where a hitter feasts or a pitcher lives.</p>',
  pitches: '<p>Every pitch plotted where it crossed the plate, seen from the catcher’s view, with the strike zone outlined. Each pitch type has its own color so you can see whether a pitcher repeats locations or a hitter chases away.</p>',
  move: '<p>How much each pitch moves compared with a pitch thrown with no spin: right-left on the horizontal axis and up-down on the vertical, in inches. Clusters show each pitch type’s shape; a tighter cluster means a more repeatable pitch.</p>',
  evla: '<p>Each dot is a batted ball plotted by launch angle (up and down) and exit velocity (left to right). The sweet spot for damage is hard contact between roughly 8 and 32 degrees; grounders sit low and pop-ups sit high.</p>',
  velo: '<p>Pitch speed by start in order across the season. A steady line means consistent velocity; a downward drift can be a sign of fatigue or injury, and an upward one of added velocity.</p>'
};
const FX_VIEWS_PIT = [['zone', 'Zone map'], ['pitches', 'Pitch locations'], ['move', 'Movement'], ['spray', 'Batted balls'], ['evla', 'EV / launch angle'], ['velo', 'Velocity by start']];
const ZONE_METRICS = {
  bat: [['n', 'Pitches seen'], ['swing', 'Swing%'], ['whiff', 'Whiff%'], ['xwobacon', 'xwOBA on contact'], ['woba', 'wOBA (results)'], ['ev', 'Avg exit velo']],
  pit: [['n', 'Pitches thrown'], ['swing', 'Swing%'], ['whiff', 'Whiff%'], ['called', 'Called strike%'], ['xwobacon', 'xwOBA allowed on contact'], ['woba', 'wOBA allowed']],
};
function zoneMetricSpec(m, role) {
  switch (m) {
    case 'swing': return { numFn: p => p.swing ? 1 : 0, denFn: () => 1, dom: [0.2, 0.75], fmtv: v => (v * 100).toFixed(0) + '%', minDen: 4, flip: role === 'bat' ? false : false };
    case 'whiff': return { numFn: p => p.whiff ? 1 : 0, denFn: p => p.swing ? 1 : 0, dom: [0.05, 0.5], fmtv: v => (v * 100).toFixed(0) + '%', minDen: 3 };
    case 'called': return { numFn: p => p.called ? 1 : 0, denFn: p => p.swing ? 0 : 1, dom: [0, 0.8], fmtv: v => (v * 100).toFixed(0) + '%', minDen: 3 };
    case 'xwobacon': return { numFn: p => isFinite(p.exw) && p.bbe ? p.exw : 0, denFn: p => isFinite(p.exw) && p.bbe ? 1 : 0, dom: [0.2, 0.55], fmtv: v => noLead(v.toFixed(3)), minDen: 1.5 };
    case 'woba': return { numFn: p => isFinite(p.wd) && p.wd > 0 && isFinite(p.wv) ? p.wv : 0, denFn: p => isFinite(p.wd) ? p.wd : 0, dom: [0.15, 0.55], fmtv: v => noLead(v.toFixed(3)), minDen: 1.5 };
    case 'ev': return { numFn: p => p.bbe ? p.les : 0, denFn: p => p.bbe ? 1 : 0, dom: [78, 96], fmtv: v => v.toFixed(1) + ' mph', minDen: 1.5 };
    default: return { density: true, numFn: () => 1, denFn: () => 1, dom: [0, 1], fmtv: v => v.toFixed(1), minDen: 0.5, seq: true };
  }
}
async function fieldExplorer(D, id, role, { compact = false, initView } = {}) {
  const box = h('div', { class: 'fx' });
  const holder = h('div', {}, loadingEl('Pulling every pitch from Baseball Savant'));
  let rows;
  try { rows = await loadPitches(id, role, D.season); }
  catch (e) { return h('div', { class: 'panel pad' }, errorEl(e, () => render(true))); }
  if (!rows.length) return h('div', { class: 'panel empty' }, `No tracked pitches for ${D.season}.`);
  const types = [...new Set(rows.map(p => p.pt).filter(Boolean))].map(t => [t, rows.filter(p => p.pt === t).length]).sort((a, b) => b[1] - a[1]);
  const months = [...new Set(rows.map(p => p.month))].sort((a, b) => a - b);
  const F = { role, types: new Set(), hand: '', res: '', count: '', month: '' };
  const V = { view: initView || (role === 'pit' ? 'zone' : 'spray'), color: 'result', zm: 'n', zonePick: role === 'pit' ? 'n' : 'n' };
  const ctl = h('div', { class: 'panel fxc' }), main = h('div', { class: 'stack' });
  const exBox = h('div', {}), chartBox = h('div', { class: 'panel pad' }), sumBox = h('div', { class: 'panel' });
  function ctlUI() {
    const kids = [];
    const views = role === 'pit' ? FX_VIEWS_PIT : FX_VIEWS_BAT;
    kids.push(h('div', {}, h('label', { class: 'l' }, 'VIEW'), h('div', { class: 'chips' }, views.map(([v, l]) => h('button', { class: 'chip' + (V.view === v ? ' on' : ''), type: 'button', onclick: () => { V.view = v; ctlUI(); draw(); } }, l)))));
    if (V.view === 'zone') kids.push(h('div', {}, h('label', { class: 'l' }, 'MEASURE'), h('div', { class: 'chips' }, ZONE_METRICS[role].map(([v, l]) => h('button', { class: 'chip' + (V.zm === v ? ' on' : ''), type: 'button', onclick: () => { V.zm = v; ctlUI(); draw(); } }, l)))));
    if (V.view === 'spray') kids.push(h('div', {}, h('label', { class: 'l' }, 'COLOR BY'), h('div', { class: 'chips' }, [['result', 'Result'], ['ev', 'Exit velo'], ['xwoba', 'xwOBA']].map(([v, l]) => h('button', { class: 'chip' + (V.color === v ? ' on' : ''), type: 'button', onclick: () => { V.color = v; ctlUI(); draw(); } }, l)))));
    kids.push(h('div', {}, h('label', { class: 'l' }, 'PITCH TYPE'), h('div', { class: 'chips' }, types.map(([t, n]) => h('button', { class: 'chip' + (F.types.has(t) ? ' on' : ''), type: 'button', title: n + ' pitches', onclick: () => { F.types.has(t) ? F.types.delete(t) : F.types.add(t); ctlUI(); draw(); } }, h('span', { class: 'ptd', style: { background: PITCH_COLORS[t] || '#888', margin: 0 } }), t)))));
    kids.push(h('div', {}, h('label', { class: 'l' }, role === 'pit' ? 'VS BATTER' : 'VS PITCHER'), segControl([['', 'All'], ['L', 'Left'], ['R', 'Right']], F.hand, v => { F.hand = v; draw(); }, 'sm')));
    kids.push(h('div', {}, h('label', { class: 'l' }, 'COUNT'), h('select', { class: 'sel sm', style: { width: '100%' }, onchange: e => { F.count = e.target.value; draw(); } }, [['', 'All counts'], ['first', 'First pitch'], ['hitter', 'Hitter ahead'], ['pitcher', 'Pitcher ahead'], ['even', 'Even'], ['two', 'Two strikes'], ['three', 'Three balls']].map(([v, l]) => h('option', { value: v, selected: F.count === v ? true : null }, l)))));
    kids.push(h('div', {}, h('label', { class: 'l' }, 'RESULT'), h('select', { class: 'sel sm', style: { width: '100%' }, onchange: e => { F.res = e.target.value; draw(); } }, [['', 'Everything'], ['hits', 'Hits'], ['xbh', 'Extra-base hits'], ['hr', 'Home runs'], ['outs', 'Batted-ball outs'], ['barrel', 'Barrels'], ['hard', 'Hard hit (95+)']].map(([v, l]) => h('option', { value: v, selected: F.res === v ? true : null }, l)))));
    kids.push(h('div', {}, h('label', { class: 'l' }, 'MONTH'), h('select', { class: 'sel sm', style: { width: '100%' }, onchange: e => { F.month = e.target.value; draw(); } }, [h('option', { value: '' }, 'Whole season'), ...months.map(m => h('option', { value: m }, MONTHS[m] || m))])));
    kids.push(h('button', { class: 'btn sm', type: 'button', onclick: () => { F.types.clear(); F.hand = ''; F.res = ''; F.count = ''; F.month = ''; ctlUI(); draw(); } }, 'Reset filters'));
    mount(ctl, kids);
  }
  function draw() {
    const all = filterPitches(rows, F);
    const sm = summarize(all);
    const mode = V.view; let html = '', tips = null, legend = '', tipFn = null, note = '';
    const szt = median(rows.map(p => p.szt)), szb = median(rows.map(p => p.szb));
    if (mode === 'spray') {
      const bb = all.filter(p => p.inplay && isFinite(p.hx) && isFinite(p.hy));
      const pts = bb.map(p => { const [x, y] = hcFt(p.hx, p.hy); const c = V.color === 'result' ? RES_COL[resCat(p.ev)] : V.color === 'ev' ? evColor(p.les) : xwColor(p.exw); return { x, y, color: c, r: p.ev === 'home_run' ? 4.6 : 3.6 }; });
      html = sprayChart(pts); tipFn = i => tipForPitch(bb[i], role);
      legend = V.color === 'result' ? Object.entries({ Single: 'single', Double: 'double', Triple: 'triple', 'Home run': 'home_run', 'Out': 'out', 'Error': 'error' }).map(([l, k]) => `<span><i style="background:${RES_COL[k]}"></i>${l}</span>`).join('') : `<span><i style="background:${evColor(70)}"></i>soft</span><span><i style="background:${evColor(90)}"></i>medium</span><span><i style="background:${evColor(105)}"></i>hard</span><span><i style="background:${evColor(115)}"></i>elite</span>`;
      note = `${bb.length} batted balls`;
      if (role === 'bat' && bb.length > 10) { const ang = bb.map(sprayAngle); const pull = bb.filter((p, i) => (p.stand === 'R' ? ang[i] < -15 : ang[i] > 15)).length, opp = bb.filter((p, i) => (p.stand === 'R' ? ang[i] > 15 : ang[i] < -15)).length; note += ` · Pull ${Math.round(pull / bb.length * 100)}% · Center ${Math.round((bb.length - pull - opp) / bb.length * 100)}% · Oppo ${Math.round(opp / bb.length * 100)}%`; }
    } else if (mode === 'zone') {
      const rowsZ = all.filter(p => isFinite(p.px) && isFinite(p.pz)); const sp = zoneMetricSpec(V.zm, role);
      const res = zoneHeat(rowsZ, { ...sp, szb, szt }); html = res.html; tipFn = i => res.tips[i];
      legend = sp.density ? '<span>Darker means more pitches</span>' : '<span><i style="background:' + heatColor(.05) + '"></i>low</span><span><i style="background:' + heatColor(.5) + '"></i>middle</span><span><i style="background:' + heatColor(.95) + '"></i>high</span>';
      note = `${rowsZ.length} pitches · catcher's view · zone is the median strike zone`;
    } else if (mode === 'pitches') {
      const rz = all.filter(p => isFinite(p.px) && isFinite(p.pz)); const cap = rz.length > 2500 ? rz.slice(0, 2500) : rz;
      const byType = role === 'pit'; const colorFn = p => byType ? (PITCH_COLORS[p.pt] || '#888') : (p.inplay ? '#4fd18b' : p.whiff ? '#ff4d6d' : p.called ? '#f2c14e' : p.swing ? '#5cc8ff' : '#7f8f9b');
      html = zoneDots(cap, { colorFn, szb, szt, r: 4 }); tipFn = i => tipForPitch(cap[i], role);
      legend = byType ? types.filter(([t]) => !F.types.size || F.types.has(t)).map(([t]) => `<span><i style="background:${PITCH_COLORS[t] || '#888'}"></i>${esc(PITCH_NAMES[t] || t)}</span>`).join('') : '<span><i style="background:#4fd18b"></i>In play</span><span><i style="background:#ff4d6d"></i>Whiff</span><span><i style="background:#5cc8ff"></i>Foul</span><span><i style="background:#f2c14e"></i>Called strike</span><span><i style="background:#7f8f9b"></i>Ball</span>';
      note = `${cap.length}${cap.length < rz.length ? ' of ' + rz.length : ''} pitches · catcher's view`;
    } else if (mode === 'evla') {
      const bb = all.filter(p => p.bbe && isFinite(p.la)); html = evlaChart(bb.map(p => ({ ev: p.les, la: p.la, events: p.ev }))); tipFn = i => tipForPitch(bb[i], role);
      legend = Object.entries({ Single: 'single', Double: 'double', Triple: 'triple', 'Home run': 'home_run', Out: 'out' }).map(([l, k]) => `<span><i style="background:${RES_COL[k]}"></i>${l}</span>`).join(''); note = `${bb.length} batted balls`;
    } else if (mode === 'move') {
      const mv = all.filter(p => isFinite(p.hb) && isFinite(p.ivb)); const ts = types.map(t => t[0]).filter(t => !F.types.size || F.types.has(t));
      html = movementChart(mv, ts); tipFn = i => { const p = mv[i]; return `<b>${esc(PITCH_NAMES[p.pt] || p.pt)}</b>${tr('Velo', p.v?.toFixed(1) + ' mph')}${tr('Horizontal', p.hb.toFixed(1) + ' in')}${tr('Induced vertical', p.ivb.toFixed(1) + ' in')}${tr('Date', p.d)}`; };
      legend = ts.map(t => `<span><i style="background:${PITCH_COLORS[t] || '#888'}"></i>${esc(PITCH_NAMES[t] || t)}</span>`).join(''); note = `${mv.length} pitches · large markers are averages`;
    } else if (mode === 'velo') {
      const byDate = new Map(); all.filter(p => isFinite(p.v)).forEach(p => { const k = p.d + '|' + p.pt; (byDate.get(k) || byDate.set(k, []).get(k)).push(p.v); });
      const ts = types.map(t => t[0]).filter(t => (!F.types.size || F.types.has(t))).slice(0, 5); const dates = [...new Set(all.map(p => p.d))].sort(); const di = new Map(dates.map((d, i) => [d, i]));
      const series = ts.map(t => ({ name: t, color: PITCH_COLORS[t] || '#888', dots: true, pts: dates.map(d => { const v = byDate.get(d + '|' + t); return v && v.length >= 3 ? [di.get(d), mean(v)] : [di.get(d), NaN]; }).filter(p => isFinite(p[1])) }));
      const ticks = dates.filter((d, i) => i % Math.max(1, Math.ceil(dates.length / 8)) === 0).map(d => ({ v: di.get(d), l: d.slice(5) }));
      html = lineSVG({ series, xticks: ticks, yfmt: v => v.toFixed(0), H: 340 }); legend = ts.map(t => `<span><i style="background:${PITCH_COLORS[t] || '#888'}"></i>${esc(PITCH_NAMES[t] || t)}</span>`).join('');
      tipFn = i => { const si = Math.floor(i / 10000), k = i % 10000, se = series[si], p = se.pts[k]; return p ? `<b>${esc(PITCH_NAMES[se.name] || se.name)}</b>${tr('Date', dates[p[0]])}${tr('Avg velo', p[1].toFixed(1) + ' mph')}` : ''; }; note = 'Average velocity per outing';
    }
    chartBox.innerHTML = `<div class="row sb" style="margin-bottom:10px"><span class="cap">${esc(note)}</span></div><div id="fxchart" style="max-width:${mode === 'evla' || mode === 'move' ? 720 : mode === 'zone' || mode === 'pitches' ? 560 : 760}px;margin:0 auto">${html}</div><div class="legend" style="justify-content:center">${legend}</div>`;
    mount(exBox, FX_HELP[mode] ? explainer(FX_HELP[mode]) : null);
    const cb = $('#fxchart', chartBox); if (tipFn) tipBind(cb, tipFn);
    const cell = (k, v, f) => `<div class="tile"><div class="k">${k}</div><div class="v">${f === 'int' ? Math.round(v) : fmt(v, f)}</div></div>`;
    const bbeTiles = [['Pitches', sm.pitches, 'int'], ['Batted balls', sm.bbe, 'int'], ['Avg EV', sm.ev, 'f1'], ['Max EV', sm.maxEV, 'f1'], ['Hard-hit%', sm.hh, 'f1'], ['Barrel%', sm.brl, 'f1'], ['xwOBAcon', sm.xwobacon, 'f3'], ['Whiff%', sm.whiff, 'f1'], ['Chase%', sm.chase, 'f1'], ['HR', sm.hr, 'int']];
    sumBox.innerHTML = `<div class="tiles" style="border-top:0">${bbeTiles.map(t => cell(...t)).join('')}</div>`;
  }
  ctlUI(); main.append(chartBox, exBox, sumBox); box.append(ctl, main); draw();
  return box;
}
const median = a => { const b = a.filter(isFinite).sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
