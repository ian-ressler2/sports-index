/* data.js: generic access to season data and percentile helpers.
   A season object D has: season, warn[], teams Map, stand Map, lists{g:[rows]}, maps{g:Map}, players Map, pct{g:{k:sorted[]}}. */
const listOf = (D, g) => D.lists[g] || [];
const mapOf = (D, g) => D.maps[g] || new Map();
const isQual = (D, g, r) => { const q = SPORT.groups[g]?.qual; return q ? q(D, r) : true; };
const qualRows = (D, g) => listOf(D, g).filter(r => isQual(D, g, r));
function buildPct(D, g) {
  const rows = qualRows(D, g), P = {};
  for (const c of COLS[g] || []) P[c.k] = rows.map(r => r[c.k]).filter(v => typeof v === 'number' && isFinite(v)).sort((a, b) => a - b);
  D.pct[g] = P;
}
function bounds(a, v) { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < v) lo = m + 1; else hi = m; } const L = lo; hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m + 1; else hi = m; } return [L, lo]; }
function pctile(D, g, k, v) {
  const a = D.pct[g]?.[k]; if (!a || a.length < 5 || typeof v !== 'number' || !isFinite(v)) return NaN;
  const [lo, hi] = bounds(a, v); let p = (lo + 0.5 * (hi - lo)) / a.length * 100;
  const d = COLMAP[g][k]?.d; if (d < 0) p = 100 - p;
  return clamp(Math.round(p), 1, 99);
}
function rankOf(D, g, k, v) {
  const a = D.pct[g]?.[k]; if (!a || typeof v !== 'number' || !isFinite(v)) return NaN;
  const d = COLMAP[g][k]?.d; const [lo, hi] = bounds(a, v);
  return d < 0 ? lo + 1 : a.length - hi + 1;
}
function leagueAvg(D, g, k) { const a = D.pct[g]?.[k]; return a && a.length ? mean(a) : NaN; }
const teamOf = (D, r) => D.teams.get(r.tid);
const abbrOf = (D, r) => D.teams.get(r.tid)?.abbr || '';
