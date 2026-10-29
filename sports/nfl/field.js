/* field.js: football field drawing shared by the game replay and the play map.
   Field x is yards from the left goal line (0 to 100, end zones at -10 and 110). Screen: 10px per yard, origin at x=100. */
const NF = { W: 1200, H: 560, CY: 280, X: x => 100 + x * 10, LANE: 112 };
const NF_C = { pass: '#2fbf71', inc: '#e5484d', int: '#ff2d55', run: '#4c8dff', td: '#f5b301', sack: '#b266ff', fgY: '#2fbf71', fgN: '#e5484d', punt: '#9aa7b5', ko: '#9aa7b5', pen: '#f5b301' };

/* L and R describe the end zones: { abbr, color } */
function nflFieldBg(L, R) {
  let s = `<rect x="0" y="0" width="${NF.W}" height="${NF.H}" fill="#2c6a3b"/>`;
  for (let k = 0; k < 20; k++) s += `<rect x="${NF.X(k * 5)}" y="14" width="50" height="532" fill="${k % 2 ? '#2a6538' : '#2f6f3f'}"/>`;
  s += `<rect x="0" y="14" width="100" height="532" fill="${L?.color || '#1d3f28'}" opacity=".85"/><rect x="1100" y="14" width="100" height="532" fill="${R?.color || '#1d3f28'}" opacity=".85"/>`;
  for (let y = 0; y <= 100; y += 5) s += `<line x1="${NF.X(y)}" x2="${NF.X(y)}" y1="14" y2="546" stroke="#fff" stroke-opacity="${y % 10 ? .35 : .7}" stroke-width="${y % 50 === 0 ? 3 : 2}"/>`;
  for (let y = 1; y < 100; y++) if (y % 5) for (const yy of [14 + 150, 14 + 532 - 150]) s += `<line x1="${NF.X(y)}" x2="${NF.X(y)}" y1="${yy - 5}" y2="${yy + 5}" stroke="#fff" stroke-opacity=".3"/>`;
  for (let y = 10; y <= 90; y += 10) { const n = y <= 50 ? y : 100 - y; s += `<text x="${NF.X(y)}" y="82" text-anchor="middle" font-size="30" font-weight="700" fill="#fff" fill-opacity=".55" font-family="var(--f-mono)">${n}</text><text x="${NF.X(y)}" y="518" text-anchor="middle" font-size="30" font-weight="700" fill="#fff" fill-opacity=".55" font-family="var(--f-mono)" transform="rotate(180 ${NF.X(y)} 508)">${n}</text>`; }
  s += `<g font-size="44" font-weight="800" fill="#fff" fill-opacity=".8" letter-spacing="6" text-anchor="middle"><text transform="translate(58,${NF.CY}) rotate(-90)">${esc(L?.abbr || '')}</text><text transform="translate(1142,${NF.CY}) rotate(90)">${esc(R?.abbr || '')}</text></g>`;
  s += `<rect x="1" y="14" width="1198" height="532" fill="none" stroke="#fff" stroke-width="3"/>`;
  s += [-10, 110].map(x => `<g stroke="#f5d142" stroke-width="5" fill="none" stroke-linecap="round"><line x1="${NF.X(x)}" x2="${NF.X(x)}" y1="${NF.CY - 28}" y2="${NF.CY + 28}"/><line x1="${NF.X(x)}" x2="${NF.X(x) + (x < 0 ? 10 : -10)}" y1="${NF.CY}" y2="${NF.CY}"/></g>`).join('');
  return s;
}
const NF_RUN_LANE = { LE: -2, LT: -1.2, LG: -.5, M: 0, RG: .5, RT: 1.2, RE: 2 }, NF_PASS_LANE = { l: -1, m: 0, r: 1 };
/* geometry of one play. e: { k: r|p|s|f|u|o, x0 (spot, yards from left), dir (+1 attacking right, -1 left), y (yards), lane, inc, to, td, dep, made }
   returns { d (path), x, y (end point), cls, dash } */
function nflGeom(e) {
  const dir = e.dir || 1, X = NF.X, y0 = NF.CY + (e.lane || 0) * dir * NF.LANE * (e.k === 'r' ? .5 : 1), sx = X(e.x0);
  if (e.k === 'f') { const gx = X(dir > 0 ? 110 : -10), yEnd = NF.CY + (e.made ? 0 : (e.wide || 1) * 34); return { d: `M${sx} ${NF.CY} Q${(sx + gx) / 2} ${NF.CY - 70} ${gx} ${yEnd}`, x: gx, y: yEnd, cls: e.made ? 'fgY' : 'fgN', dash: !e.made }; }
  if (e.k === 'u' || e.k === 'o') { const ex = X(clamp(e.x1 ?? e.x0 + dir * (e.y || 40), -10, 110)); return { d: `M${sx} ${NF.CY} Q${(sx + ex) / 2} ${NF.CY - 150} ${ex} ${NF.CY}`, x: ex, y: NF.CY, cls: e.k === 'u' ? 'punt' : 'ko', dash: true }; }
  if (e.k === 's') { const ex = sx + dir * (e.y || -6) * 10; return { d: `M${sx} ${y0} L${ex} ${y0}`, x: ex, y: y0, cls: 'sack' }; }
  if (e.k === 'r') { const ex = e.x1 != null ? X(e.x1) : sx + dir * (e.y || 0) * 10, ey = y0 + (e.drift || 0); return { d: `M${sx} ${y0} L${ex} ${ey}`, x: ex, y: ey, cls: e.td ? 'td' : 'run' }; }
  /* pass: the QB drops back a few yards, the ball flies to the catch spot (or where it fell) */
  const air = e.inc ? (e.dep === 'd' ? 22 : 8) : e.x1 != null ? Math.abs(e.x1 - e.x0) : Math.max(1, e.y || 1), ex = e.x1 != null && !e.inc ? X(e.x1) : sx + dir * air * 10;
  const qx = sx - dir * 50, ey = y0 + (e.drift || 0) * .5, my = (NF.CY + ey) / 2 - 60 - Math.min(80, air * 2);
  return { d: `M${qx} ${NF.CY} Q${(qx + ex) / 2} ${my} ${ex} ${ey}`, x: ex, y: ey, cls: e.td ? 'td' : e.to ? 'int' : e.inc ? 'inc' : 'pass', dash: !!e.inc };
}
const nflStroke = (g, w = 4) => `<path d="${g.d}" fill="none" stroke="${NF_C[g.cls]}" stroke-width="${w}" stroke-linecap="round"${g.dash ? ' stroke-dasharray="9 8"' : ''}/>`;
const nflEnd = g => g.cls === 'int' || g.cls === 'inc' || g.cls === 'fgN' ? `<g stroke="${NF_C[g.cls]}" stroke-width="4" stroke-linecap="round"><line x1="${g.x - 7}" y1="${g.y - 7}" x2="${g.x + 7}" y2="${g.y + 7}"/><line x1="${g.x - 7}" y1="${g.y + 7}" x2="${g.x + 7}" y2="${g.y - 7}"/></g>` : `<circle cx="${g.x}" cy="${g.y}" r="${g.cls === 'td' ? 9 : 6}" fill="${NF_C[g.cls]}" stroke="#fff" stroke-width="2"/>`;
