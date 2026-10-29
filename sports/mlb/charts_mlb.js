/* charts_mlb.js: baseball field, spray and strike-zone drawings */
/* ---------- field / spray ---------- */
const FENCE = a => 400 - 70 * Math.pow(Math.abs(a) / 45, 2);
const hcFt = (hx, hy) => [(hx - 125.42) * 2.5, (198.27 - hy) * 2.5];
function fieldMarkup(id, { rings = true } = {}) {
  const pts = []; for (let a = -45; a <= 45; a += 2.5) { const r = FENCE(a), t = a * Math.PI / 180; pts.push([r * Math.sin(t), r * Math.cos(t)]); }
  const fence = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const arc = r => { const q = []; for (let a = -45; a <= 45; a += 5) { const t = a * Math.PI / 180; q.push((r * Math.sin(t)).toFixed(1) + ',' + (r * Math.cos(t)).toFixed(1)); } return q.join(' '); };
  let g = `<defs><clipPath id="${id}"><polygon points="-14,-14 -330,316 330,316 14,-14"/></clipPath></defs>`;
  g += `<g transform="scale(1,-1)">`;
  g += `<polygon points="0,0 ${fence}" fill="var(--field)"/><polygon points="0,0 ${fence}" fill="var(--grass)" opacity=".5"/>`;
  g += `<g clip-path="url(#${id})"><circle cx="0" cy="60.5" r="97" fill="var(--dirt)" opacity=".85"/></g>`;
  g += `<polygon points="0,16 49,63.6 0,111 -49,63.6" fill="var(--grass)" opacity=".95"/><polygon points="0,16 49,63.6 0,111 -49,63.6" fill="var(--field)" opacity=".35"/>`;
  g += `<circle cx="0" cy="0" r="14" fill="var(--dirt)" opacity=".9"/>`;
  g += `<polyline points="0,0 63.6,63.6 0,127.3 -63.6,63.6 0,0" fill="none" stroke="var(--chalk)" stroke-opacity=".55" stroke-width="1.4"/>`;
  g += `<line x1="0" y1="0" x2="${(FENCE(45) * Math.SQRT1_2).toFixed(1)}" y2="${(FENCE(45) * Math.SQRT1_2).toFixed(1)}" stroke="var(--chalk)" stroke-opacity=".7" stroke-width="1.6"/><line x1="0" y1="0" x2="${(-FENCE(45) * Math.SQRT1_2).toFixed(1)}" y2="${(FENCE(45) * Math.SQRT1_2).toFixed(1)}" stroke="var(--chalk)" stroke-opacity=".7" stroke-width="1.6"/>`;
  if (rings) for (const r of [200, 300]) g += `<polyline points="${arc(r)}" fill="none" stroke="var(--chalk)" stroke-opacity=".16" stroke-dasharray="4 5"/>`;
  g += `<polyline points="${fence}" fill="none" stroke="var(--wall)" stroke-width="3.5" stroke-linejoin="round"/>`;
  for (const [x, y] of [[63.6, 63.6], [0, 127.3], [-63.6, 63.6]]) g += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" transform="rotate(45 ${x} ${y})" fill="var(--chalk)"/>`;
  g += `<circle cx="0" cy="60.5" r="8" fill="var(--dirt2)"/><polygon points="-5,-1 5,-1 5,4 0,8 -5,4" fill="var(--chalk)"/></g>`;
  if (rings) for (const r of [200, 300, 400]) g += `<text x="6" y="${-(r - (r === 400 ? 0 : 0)) + 14}" font-size="9.5" opacity=".7">${r} ft</text>`;
  return g;
}
const FIELD_VB = '-290 -440 580 468';
function sprayChart(pts, { r = 3.6, label } = {}) {
  const id = uid();
  let s = fieldMarkup(id);
  s += `<g transform="scale(1,-1)">`;
  pts.forEach((p, i) => { s += `<circle data-i="${i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r || r}" fill="${p.color}" fill-opacity="${p.op || .85}" stroke="var(--bg)" stroke-width=".7" style="cursor:pointer"/>`; });
  s += `</g>`;
  return `<svg class="chart" viewBox="${FIELD_VB}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Spray chart: where each ball in play landed">${s}</svg>`;
}
const RES_COL = { single: '#4fd18b', double: '#f2c14e', triple: '#ff8a4c', home_run: '#ff4d6d', out: '#7f8f9b', error: '#9a66e0' };
function resCat(ev) {
  if (!ev) return 'out'; if (ev === 'single') return 'single'; if (ev === 'double') return 'double'; if (ev === 'triple') return 'triple'; if (ev === 'home_run') return 'home_run';
  if (/error/.test(ev)) return 'error'; return 'out';
}
function evColor(v) { if (!isFinite(v)) return '#7f8f9b'; const t = clamp((v - 65) / 50, 0, 1); const lerp = (a, b, t) => Math.round(a + (b - a) * t); const stops = [[58, 122, 224], [120, 140, 160], [242, 193, 78], [255, 77, 109]]; const k = t * 3, i = Math.min(2, Math.floor(k)), u = k - i; return `rgb(${[0, 1, 2].map(c => lerp(stops[i][c], stops[i + 1][c], u)).join(',')})`; }
function xwColor(v) { if (!isFinite(v)) return '#7f8f9b'; const t = clamp((v - 0.05) / 1.9, 0, 1); return evColor(65 + t * 50); }

/* Field region selector (Zone Lab): 3 wedges x (ground | air) */
function regionField(sel) {
  const id = uid(); let s = fieldMarkup(id, { rings: false });
  const wedge = (a0, a1, r0, r1) => { const q = []; for (let a = a0; a <= a1 + 0.01; a += 3) { const t = a * Math.PI / 180; q.push([r1 * Math.sin(t), r1 * Math.cos(t)]); } for (let a = a1; a >= a0 - 0.01; a -= 3) { const t = a * Math.PI / 180; q.push([r0 * Math.sin(t), r0 * Math.cos(t)]); } return q.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '); };
  const fenceAt = a => FENCE(a) - 3;
  const regs = [['pull', -45, -15], ['straight', -15, 15], ['oppo', 15, 45]];
  let parts = '', labels = '';
  for (const [name, a0, a1] of regs) {
    for (const kind of ['gb', 'air']) {
      const r0 = kind === 'gb' ? 18 : 140, r1 = kind === 'gb' ? 138 : Math.min(fenceAt(a0), fenceAt(a1), fenceAt((a0 + a1) / 2)) + 4;
      const key = name + '_' + kind, on = sel.has(key);
      const poly = kind === 'gb' ? wedge(a0, a1, r0, r1) : (() => { const q = []; for (let a = a0; a <= a1 + .01; a += 3) { const t = a * Math.PI / 180; q.push([FENCE(a) * Math.sin(t), FENCE(a) * Math.cos(t)]); } for (let a = a1; a >= a0 - .01; a -= 3) { const t = a * Math.PI / 180; q.push([r0 * Math.sin(t), r0 * Math.cos(t)]); } return q.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '); })();
      parts += `<polygon data-k="${key}" points="${poly}" fill="${on ? 'var(--acc)' : 'transparent'}" fill-opacity="${on ? .5 : 0}" stroke="${on ? 'var(--acc)' : 'var(--chalk)'}" stroke-opacity="${on ? 1 : .4}" stroke-width="${on ? 2.5 : 1.2}" style="cursor:pointer"/>`;
      const mid = (a0 + a1) / 2, rr = (r0 + (kind === 'gb' ? r1 : (FENCE(mid)))) / 2, t = mid * Math.PI / 180;
      labels += `<text x="${(rr * Math.sin(t)).toFixed(1)}" y="${(-rr * Math.cos(t)).toFixed(1)}" text-anchor="middle" class="t2" font-size="11" style="pointer-events:none;font-weight:600">${name === 'straight' ? 'Center' : name[0].toUpperCase() + name.slice(1)}</text><text x="${(rr * Math.sin(t)).toFixed(1)}" y="${(-rr * Math.cos(t) + 12).toFixed(1)}" text-anchor="middle" font-size="9.5" style="pointer-events:none">${kind === 'gb' ? 'ground' : 'air'}</text>`;
    }
  }
  s += `<g transform="scale(1,-1)">${parts}</g>${labels}`;
  return `<svg class="chart" viewBox="${FIELD_VB}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Field zones: how balls in play are spread across the field">${s}</svg>`;
}

/* ---------- strike zone (catcher view) ---------- */
const ZW = 0.708;
function zoneFrame(szb = 1.6, szt = 3.5, inner = '') {
  const X = x => (x + 2.4) * 100, Y = z => (4.9 - z) * 100;
  let s = `<rect x="0" y="0" width="480" height="460" fill="var(--bg3)" rx="10"/>`;
  for (const x of [-2, -1, 0, 1, 2]) s += `<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="460" class="gr"/><text x="${X(x)}" y="453" text-anchor="middle" font-size="9.5">${x}</text>`;
  for (const z of [1, 2, 3, 4]) s += `<line x1="0" y1="${Y(z)}" x2="480" y2="${Y(z)}" class="gr"/><text x="6" y="${Y(z) - 3}" font-size="9.5">${z} ft</text>`;
  s += inner;
  const zx0 = X(-ZW), zx1 = X(ZW), zy0 = Y(szt), zy1 = Y(szb), cw = (zx1 - zx0) / 3, chh = (zy1 - zy0) / 3;
  s += `<rect x="${zx0 - 20}" y="${zy0 - 20}" width="${zx1 - zx0 + 40}" height="${zy1 - zy0 + 40}" fill="none" stroke="var(--chalk)" stroke-opacity=".25" stroke-dasharray="3 5"/>`;
  for (let i = 1; i < 3; i++) s += `<line x1="${zx0 + cw * i}" y1="${zy0}" x2="${zx0 + cw * i}" y2="${zy1}" stroke="var(--chalk)" stroke-opacity=".28"/><line x1="${zx0}" y1="${zy0 + chh * i}" x2="${zx1}" y2="${zy0 + chh * i}" stroke="var(--chalk)" stroke-opacity=".28"/>`;
  s += `<rect x="${zx0}" y="${zy0}" width="${zx1 - zx0}" height="${zy1 - zy0}" fill="none" stroke="var(--chalk)" stroke-opacity=".85" stroke-width="2"/>`;
  s += `<polygon points="${X(-.71)},${Y(.32)} ${X(.71)},${Y(.32)} ${X(.71)},${Y(.2)} ${X(0)},${Y(.08)} ${X(-.71)},${Y(.2)}" fill="var(--chalk)" fill-opacity=".8"/>`;
  return s;
}
const zoneX = x => (x + 2.4) * 100, zoneY = z => (4.9 - z) * 100;
/* rows: pitch objects with px,pz; numFn,denFn give per-pitch contributions; returns svg */
function zoneHeat(rows, { numFn, denFn, dom = [0, 1], minDen = 3, szb = 1.6, szt = 3.5, seq = false, density = false, fmtv = v => v.toFixed(2) }) {
  const step = 0.2, nx = 20, nz = 20, x0 = -2, z0 = 0.5;
  const N = new Float64Array(nx * nz), Dn = new Float64Array(nx * nz);
  for (const p of rows) {
    if (!isFinite(p.px) || !isFinite(p.pz)) continue;
    const ix = Math.floor((p.px - x0) / step), iz = Math.floor((p.pz - z0) / step); if (ix < 0 || ix >= nx || iz < 0 || iz >= nz) continue;
    const n = numFn(p), d = denFn(p); if (d) { N[iz * nx + ix] += n; Dn[iz * nx + ix] += d; }
  }
  const K = [[1, 2, 1], [2, 4, 2], [1, 2, 1]]; let rects = '', i = 0; const tips = [];
  const SN = new Float64Array(nx * nz), SD = new Float64Array(nx * nz); let maxDensity = 0;
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    let sn = 0, sd = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const jx = ix + dx, jz = iz + dz; if (jx < 0 || jx >= nx || jz < 0 || jz >= nz) continue; const w = K[dz + 1][dx + 1]; sn += N[jz * nx + jx] * w; sd += Dn[jz * nx + jx] * w; }
    SN[iz * nx + ix] = sn; SD[iz * nx + ix] = sd; if (sn / 16 > maxDensity) maxDensity = sn / 16;
  }
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const sn = SN[iz * nx + ix], sd = SD[iz * nx + ix], raw = Dn[iz * nx + ix];
    if (sd === 0 || sd / 16 < minDen / 4) continue;
    const v = density ? sn / 16 : sn / sd, lo = density ? 0 : dom[0], hi = density ? (maxDensity || 1) : dom[1];
    const t = clamp((v - lo) / (hi - lo), 0, 1), alpha = density ? 1 : clamp(sd / 16 / (minDen * 1.6), .35, .95);
    const x = zoneX(x0 + ix * step), y = zoneY(z0 + (iz + 1) * step);
    rects += `<rect data-i="${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${step * 100 + .6}" height="${step * 100 + .6}" fill="${seq || density ? `rgba(255,138,76,${(0.06 + t * 0.88).toFixed(2)})` : heatColor(t, alpha)}"/>`;
    tips.push(`<b>${density ? Math.round(v) + ' pitches nearby' : fmtv(v)}</b>${density ? '' : tr('Sample', Math.round(raw) + ' in cell · ' + Math.round(sd / 16) + ' smoothed')}`); i++;
  }
  return { html: `<svg class="chart" viewBox="0 0 480 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Strike zone heat map from the catcher's view">${zoneFrame(szb, szt, rects)}</svg>`, tips };
}
function zoneDots(rows, { colorFn, szb = 1.6, szt = 3.5, r = 4.2, opacity = .7 }) {
  let s = ''; const used = [];
  rows.forEach((p, i) => { if (!isFinite(p.px) || !isFinite(p.pz)) return; s += `<circle data-i="${i}" cx="${zoneX(p.px).toFixed(1)}" cy="${zoneY(p.pz).toFixed(1)}" r="${r}" fill="${colorFn(p)}" fill-opacity="${opacity}" stroke="var(--bg)" stroke-width=".5"/>`; });
  return `<svg class="chart" viewBox="0 0 480 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Strike zone plot: each pitch as it crossed the plate">${zoneFrame(szb, szt, s)}</svg>`;
}

/* ---------- pitch movement (catcher view, inches) ---------- */
function movementChart(rows, types) {
  const W = 520, H = 480, L = 40, T = 14, R = 14, B = 36, pw = W - L - R, ph = H - T - B, lim = 26;
  const X = v => L + (v + lim) / (2 * lim) * pw, Y = v => T + (lim - v) / (2 * lim) * ph;
  let s = '';
  for (const t of [-20, -10, 0, 10, 20]) { s += `<line x1="${X(t)}" y1="${T}" x2="${X(t)}" y2="${T + ph}" class="${t === 0 ? 'ax' : 'gr'}"/><line x1="${L}" y1="${Y(t)}" x2="${L + pw}" y2="${Y(t)}" class="${t === 0 ? 'ax' : 'gr'}"/><text x="${X(t)}" y="${H - 20}" text-anchor="middle">${t}</text><text x="${L - 6}" y="${Y(t) + 3}" text-anchor="end">${t}</text>`; }
  s += `<text x="${L + pw / 2}" y="${H - 5}" text-anchor="middle" class="t2" font-size="11">Horizontal break (in), catcher's view</text><text transform="translate(11 ${T + ph / 2}) rotate(-90)" text-anchor="middle" class="t2" font-size="11">Induced vertical break (in)</text>`;
  rows.forEach((p, i) => { if (isFinite(p.hb) && isFinite(p.ivb)) s += `<circle data-i="${i}" cx="${X(p.hb).toFixed(1)}" cy="${Y(p.ivb).toFixed(1)}" r="3.2" fill="${PITCH_COLORS[p.pt] || '#888'}" fill-opacity=".38"/>`; });
  for (const t of types) { const rs = rows.filter(p => p.pt === t && isFinite(p.hb) && isFinite(p.ivb)); if (rs.length < 5) continue; const mx = mean(rs.map(p => p.hb)), my = mean(rs.map(p => p.ivb)); s += `<circle cx="${X(mx)}" cy="${Y(my)}" r="9" fill="${PITCH_COLORS[t] || '#888'}" stroke="var(--bg2)" stroke-width="2.5"/><text x="${X(mx)}" y="${Y(my) + 3.4}" text-anchor="middle" font-size="9" style="fill:#fff;font-weight:700">${t}</text>`; }
  return svg(W, H, s, 'chart', 'Pitch movement chart: horizontal and vertical break of each pitch');
}

/* ---------- EV vs LA ---------- */
function evlaChart(rows) {
  const W = 620, H = 400, L = 46, T = 12, R = 14, B = 38, pw = W - L - R, ph = H - T - B, ex0 = 40, ex1 = 120, ly0 = -70, ly1 = 80;
  const X = v => L + (v - ex0) / (ex1 - ex0) * pw, Y = v => T + (ly1 - v) / (ly1 - ly0) * ph;
  let s = '';
  for (const t of [40, 60, 80, 100, 120]) s += `<line x1="${X(t)}" y1="${T}" x2="${X(t)}" y2="${T + ph}" class="gr"/><text x="${X(t)}" y="${H - 22}" text-anchor="middle">${t}</text>`;
  for (const t of [-60, -30, 0, 30, 60]) s += `<line x1="${L}" y1="${Y(t)}" x2="${L + pw}" y2="${Y(t)}" class="${t === 0 ? 'ax' : 'gr'}"/><text x="${L - 6}" y="${Y(t) + 3}" text-anchor="end">${t}°</text>`;
  const up = [], lo = []; for (let ev = 98; ev <= 120; ev += 1) { up.push([ev, Math.min(50, 30 + (ev - 98) * 1.5)]); lo.push([ev, Math.max(8, 26 - (ev - 98))]); }
  const poly = [...up, ...lo.reverse()].map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
  s += `<polygon points="${poly}" fill="var(--acc)" fill-opacity=".16" stroke="var(--acc)" stroke-opacity=".6" stroke-dasharray="4 4"/><text x="${X(109)}" y="${Y(52)}" text-anchor="middle" style="fill:var(--acc)" font-size="10.5">barrel zone</text>`;
  s += `<text x="${L + pw / 2}" y="${H - 5}" text-anchor="middle" class="t2" font-size="11">Exit velocity (mph)</text><text transform="translate(11 ${T + ph / 2}) rotate(-90)" text-anchor="middle" class="t2" font-size="11">Launch angle</text>`;
  rows.forEach((p, i) => { if (isFinite(p.ev) && isFinite(p.la)) s += `<circle data-i="${i}" cx="${X(p.ev).toFixed(1)}" cy="${Y(p.la).toFixed(1)}" r="3.5" fill="${RES_COL[resCat(p.events)]}" fill-opacity=".72" stroke="var(--bg)" stroke-width=".5"/>`; });
  return svg(W, H, s, 'chart', 'Exit velocity against launch angle for each ball in play');
}

/* horizontal bars (html) */
