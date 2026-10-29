/* charts.js: SVG chart builders (strings) + tooltip plumbing */
let UID = 0;
const uid = () => 'u' + (++UID);
let TipEl = null;
function tipInit() {
  if (TipEl) return;
  TipEl = h('div', { class: 'tip' }); document.body.append(TipEl);
  /* delegated hover cards for anything carrying data-tip (stat definitions) */
  const go = e => { const t = e.target.closest?.('[data-tip]'); if (!t) return tipHide(); const r = t.getBoundingClientRect(); tipShow(t.dataset.tip, e.type === 'click' ? r.left : e.clientX, e.type === 'click' ? r.bottom : e.clientY); };
  document.addEventListener('mouseover', go); document.addEventListener('mousemove', e => { if (e.target.closest?.('[data-tip]')) go(e); });
  document.addEventListener('mouseout', e => { if (e.target.closest?.('[data-tip]') && !e.relatedTarget?.closest?.('[data-tip]')) tipHide(); });
  document.addEventListener('click', e => { if (e.pointerType === 'touch' || matchMedia('(hover:none)').matches) go(e); });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('[data-tip]'); if (t) { const r = t.getBoundingClientRect(); tipShow(t.dataset.tip, r.left, r.bottom - 8); } });
  document.addEventListener('focusout', tipHide);
  addEventListener('scroll', tipHide, { passive: true, capture: true });
}
function tipShow(html, x, y) {
  tipInit(); TipEl.innerHTML = html; TipEl.classList.add('on');
  const r = TipEl.getBoundingClientRect(); let px = x + 14, py = y + 14;
  if (px + r.width > innerWidth - 8) px = x - r.width - 14; if (py + r.height > innerHeight - 8) py = y - r.height - 14;
  TipEl.style.left = Math.max(8, px) + 'px'; TipEl.style.top = Math.max(8, py) + 'px';
}
function tipHide() { if (TipEl) TipEl.classList.remove('on'); }
function tipBind(root, fn) {
  const go = (e) => { const t = e.target.closest?.('[data-i]'); if (!t || !root.contains(t)) return tipHide(); const html = fn(+t.dataset.i, t); if (!html) return tipHide(); tipShow(html, e.clientX, e.clientY); };
  root.addEventListener('mousemove', go); root.addEventListener('click', e => { if (e.pointerType === 'touch') go(e); });
  root.addEventListener('mouseleave', tipHide);
}
const tr = (k, v) => `<div class="r"><span>${esc(k)}</span><span>${esc(v)}</span></div>`;
const svg = (w, hh, inner, cls = 'chart', label = 'Chart') => `<svg class="${cls}" viewBox="0 0 ${w} ${hh}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
const f1 = v => (Math.round(v * 10) / 10).toString();

/* ---------- percentile bar ---------- */
function pbar(name, valText, p, tag, tip) {
  const has = isFinite(p);
  return `<div class="pb"><div class="nm"${tip || ''}>${esc(name)}${tag ? `<span class="src ${tag.toLowerCase()}">${tag}</span>` : ''}</div>
  <div class="tr">${has ? `<b style="left:${p}%;background:${pctColor(p).replace(/,[.\d]+\)/, ',1)')}">${p}</b>` : ''}</div><div class="vl">${esc(valText)}</div></div>`;
}

/* ---------- radar ---------- */
function radar({ labels, series, size = 360 }) {
  const n = labels.length, cx = size / 2, cy = size / 2, R = size / 2 - 62;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
  let s = '';
  for (const rg of [25, 50, 75, 100]) {
    s += `<polygon points="${labels.map((_, i) => pt(i, rg).map(x => x.toFixed(1)).join(',')).join(' ')}" fill="none" class="gr"/>`;
    s += `<text x="${cx + 3}" y="${cy - R * rg / 100 + 10}" font-size="9">${rg}</text>`;
  }
  labels.forEach((l, i) => { const [x, y] = pt(i, 100); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="gr"/>`; const [lx, ly] = pt(i, 118); s += `<text x="${lx}" y="${ly + 3}" text-anchor="${Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'}" class="t2" font-size="10.5">${esc(l)}</text>`; });
  series.forEach(se => {
    const pts = se.vals.map((v, i) => pt(i, isFinite(v) ? v : 0).map(x => x.toFixed(1)).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="${se.color}" fill-opacity=".18" stroke="${se.color}" stroke-width="2" stroke-linejoin="round"/>`;
    se.vals.forEach((v, i) => { if (isFinite(v)) { const [x, y] = pt(i, v); s += `<circle cx="${x}" cy="${y}" r="3.2" fill="${se.color}"/>`; } });
  });
  return svg(size, size, s, 'chart', 'Radar chart comparing percentile ranks');
}

/* ---------- generic scatter ---------- */
function scatterSVG({ pts, xlab, ylab, xfmt = fmtTick, yfmt = fmtTick, W = 860, H = 540, trend = true, avgLines = true, labelIdx = [], xr, yr }) {
  const L = 64, Rr = 22, T = 16, B = 52, pw = W - L - Rr, ph = H - T - B;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const padx = (x1 - x0) * 0.05 || 1, pady = (y1 - y0) * 0.06 || 1; x0 -= padx; x1 += padx; y0 -= pady; y1 += pady;
  if (xr) [x0, x1] = xr; if (yr) [y0, y1] = yr;
  const X = v => L + (v - x0) / (x1 - x0) * pw, Y = v => T + ph - (v - y0) / (y1 - y0) * ph;
  let s = '';
  for (const t of niceTicks(x0, x1, 7)) { s += `<line x1="${X(t)}" y1="${T}" x2="${X(t)}" y2="${T + ph}" class="gr"/><text x="${X(t)}" y="${T + ph + 17}" text-anchor="middle">${esc(xfmt(t))}</text>`; }
  for (const t of niceTicks(y0, y1, 6)) { s += `<line x1="${L}" y1="${Y(t)}" x2="${L + pw}" y2="${Y(t)}" class="gr"/><text x="${L - 8}" y="${Y(t) + 3}" text-anchor="end">${esc(yfmt(t))}</text>`; }
  s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" class="ax"/><line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" class="ax"/>`;
  s += `<text x="${L + pw / 2}" y="${H - 8}" text-anchor="middle" class="t2" font-size="11.5">${esc(xlab)}</text>`;
  s += `<text transform="translate(15 ${T + ph / 2}) rotate(-90)" text-anchor="middle" class="t2" font-size="11.5">${esc(ylab)}</text>`;
  if (avgLines && pts.length > 3) {
    const mx = mean(xs), my = mean(ys);
    s += `<line x1="${X(mx)}" y1="${T}" x2="${X(mx)}" y2="${T + ph}" stroke="var(--fg3)" stroke-dasharray="3 4" opacity=".6"/><line x1="${L}" y1="${Y(my)}" x2="${L + pw}" y2="${Y(my)}" stroke="var(--fg3)" stroke-dasharray="3 4" opacity=".6"/>`;
  }
  let r = NaN;
  if (trend && pts.length > 5) {
    const { m, b } = linfit(xs, ys); r = corr(xs, ys);
    const xa = Math.max(x0, Math.min(...xs)), xb = Math.min(x1, Math.max(...xs));
    s += `<line x1="${X(xa)}" y1="${Y(m * xa + b)}" x2="${X(xb)}" y2="${Y(m * xb + b)}" stroke="var(--acc)" stroke-width="2" stroke-dasharray="7 5" opacity=".9"/>`;
    s += `<text x="${L + pw - 6}" y="${T + 16}" text-anchor="end" class="t2" font-size="12">r = ${r.toFixed(2)}  ·  R² = ${(r * r).toFixed(2)}  ·  n = ${pts.length}</text>`;
  }
  pts.forEach((p, i) => { s += `<circle data-i="${i}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.r || 5}" fill="${p.color || 'var(--a)'}" fill-opacity=".72" stroke="var(--bg2)" stroke-width="1" style="cursor:pointer"/>`; });
  for (const i of labelIdx) { const p = pts[i]; if (p) s += `<text x="${X(p.x) + (p.r || 5) + 3}" y="${Y(p.y) + 3}" class="t2" font-size="10" style="paint-order:stroke;stroke:var(--bg2);stroke-width:3px;pointer-events:none">${esc(p.label)}</text>`; }
  return { html: svg(W, H, s, 'chart', 'Scatter plot. Hover or tap a dot for the values.'), r };
}

/* ---------- line / area chart ---------- */
function lineSVG({ series, xticks = [], W = 820, H = 280, yfmt = fmtTick, yr, refY, hover = true }) {
  const L = 54, Rr = 16, T = 12, B = 30, pw = W - L - Rr, ph = H - T - B;
  const all = series.flatMap(s => s.pts.filter(p => isFinite(p[1])));
  if (!all.length) return svg(W, H, `<text x="${W / 2}" y="${H / 2}" text-anchor="middle">No data</text>`);
  let x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
  if (refY != null) { y0 = Math.min(y0, refY); y1 = Math.max(y1, refY); }
  const pad = (y1 - y0) * 0.1 || 1; y0 -= pad; y1 += pad; if (yr) [y0, y1] = yr; if (x1 === x0) x1 = x0 + 1;
  const X = v => L + (v - x0) / (x1 - x0) * pw, Y = v => T + ph - (v - y0) / (y1 - y0) * ph;
  let s = '';
  for (const t of niceTicks(y0, y1, 5)) s += `<line x1="${L}" y1="${Y(t)}" x2="${L + pw}" y2="${Y(t)}" class="gr"/><text x="${L - 8}" y="${Y(t) + 3}" text-anchor="end">${esc(yfmt(t))}</text>`;
  for (const t of xticks) s += `<text x="${X(t.v)}" y="${H - 9}" text-anchor="middle">${esc(t.l)}</text>`;
  if (refY != null) s += `<line x1="${L}" y1="${Y(refY)}" x2="${L + pw}" y2="${Y(refY)}" stroke="var(--fg3)" stroke-dasharray="4 4"/>`;
  series.forEach((se, si) => {
    const pts = se.pts.filter(p => isFinite(p[1])); if (!pts.length) return;
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    if (se.area) s += `<path d="${d}L${X(pts[pts.length - 1][0]).toFixed(1)} ${T + ph}L${X(pts[0][0]).toFixed(1)} ${T + ph}Z" fill="${se.color}" opacity=".13"/>`;
    s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const last = pts[pts.length - 1]; s += `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="${se.color}" stroke="var(--bg2)" stroke-width="2"/>`;
    if (se.dots) pts.forEach((p, i) => { s += `<circle data-i="${si * 10000 + i}" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${hover ? 6 : 2.6}" fill="${hover ? 'transparent' : se.color}" stroke="none" style="cursor:default"/>`; });
  });
  return svg(W, H, s, 'chart', 'Line chart. Hover or tap for the values.');
}
function spark(vals, { w = 120, hh = 32, color = 'var(--acc)' } = {}) {
  const v = vals.filter(isFinite); if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v), X = i => 2 + i / (v.length - 1) * (w - 4), Y = x => 2 + (hh - 4) - (x - lo) / ((hi - lo) || 1) * (hh - 4);
  const d = v.map((x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x).toFixed(1)).join('');
  return `<svg viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}"><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="${X(v.length - 1)}" cy="${Y(v[v.length - 1])}" r="2.6" fill="${color}"/></svg>`;
}

function heatColor(t, a = 1) { // t 0..1 ; blue -> grey -> red
  const lerp = (p, q, u) => Math.round(p + (q - p) * u);
  const lo = [58, 122, 224], mid = [110, 124, 138], hi = [236, 78, 78];
  const [A, B, u] = t < .5 ? [lo, mid, t * 2] : [mid, hi, (t - .5) * 2];
  return `rgba(${lerp(A[0], B[0], u)},${lerp(A[1], B[1], u)},${lerp(A[2], B[2], u)},${a})`;
}
function hbars(items, { color = 'var(--a)', max, fmtv = v => v.toFixed(1) } = {}) {
  const m = max || Math.max(...items.map(i => i.v), 1e-9);
  return `<div class="bars">${items.map(i => `<div class="hb"><span>${esc(i.l)}</span><i><b style="width:${clamp(i.v / m * 100, 0, 100)}%;background:${i.color || color}"></b></i><span>${esc(i.t != null ? i.t : fmtv(i.v))}</span></div>`).join('')}</div>`;
}

