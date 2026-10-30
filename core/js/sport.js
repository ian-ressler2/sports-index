/* sport.js: the contract between the shared core and a sport package.
   A sport file (sports/<id>/*.js) fills in SPORT, COLS, GROUPS and GROUP_META, then calls boot(). */
const SPORT = {
  id: '', name: '', first: '', word: 'INDEX', short: '', credit: '', blurb: '',
  seasons: { first: 2015, current: new Date().getFullYear(), label: s => String(s) },
  groups: {},        // id -> { kind:'player'|'team', label, singular, plural, sort, dir, qual(D,r), qualText(D), minLabel, ... }
  nav: [['stats', 'Stats'], ['lab', 'Lab'], ['compare', 'Compare'], ['teams', 'Teams']],
  siblings: [['mlb', 'MLB'], ['nhl', 'NHL'], ['nba', 'NBA'], ['wnba', 'WNBA'], ['nfl', 'NFL'], ['cbb', 'CBB'], ['cfb', 'CFB'], ['epl', 'EPL'], ['mls', 'MLS'], ['ucl', 'UCL']],
  teamColor: () => '#667788',
  headshot: () => '',
};
/* column catalogue. Filled by the sport; COLMAP is derived in finalizeSport(). */
const COLS = {}, GROUPS = {}, GROUP_META = {}, COLMAP = {};
/* k = key, l = label, g = column group, d = direction (1 higher is better, -1 lower, 0 none), f = format */
const C = (k, l, g, d, f, src, desc) => ({ k, l, g, d, f, src, desc });
/* stat glossary: addGloss(`[groups:]LABEL|Full name|Description` per line); statTip(col) gives a data-tip attribute for hover cards */
const GLOSS = {};
function addGloss(txt) {
  for (const line of txt.split('\n')) {
    const p = line.split('|'); if (p.length < 3) continue;
    const i = p[0].indexOf(':'), gs = i < 0 ? [''] : p[0].slice(0, i).split(','), lab = i < 0 ? p[0] : p[0].slice(i + 1);
    gs.forEach(g => { GLOSS[g + ':' + lab] = [p[1], p.slice(2).join('|')]; });
  }
}
function glossFor(c) { return GLOSS[c.g + ':' + c.l] || GLOSS[':' + c.l] || (c.desc ? [c.l, c.desc] : null); }
function statTipHtml(c) { const g = glossFor(c); return g ? `<b>${esc(g[0])}</b><span class="td">${esc(g[1])}</span>` : ''; }
function statTip(c) { const t = c && statTipHtml(c); return t ? ` data-tip="${esc(t)}"` : ''; }
function teamTip(label) {
  for (const g in COLS) if (isTeamG(g)) { const c = COLS[g].find(x => x.l === label); if (c) return statTip(c); }
  return '';
}
const tcol = id => SPORT.teamColor(id);
const seasonList = () => { const a = []; for (let y = SPORT.seasons.current; y >= SPORT.seasons.first; y--) a.push(y); return a; };
const ttlFor = s => s >= SPORT.seasons.current ? 2 * 3600e3 : 14 * 86400e3;
const App = { D: null, season: 0, defSeason: 0, q: {}, path: [], rid: 0, pages: {} };
function finalizeSport() {
  for (const g in COLS) { COLMAP[g] = {}; COLS[g].forEach(c => COLMAP[g][c.k] = c); }
  App.defSeason = App.season = SPORT.seasons.default || SPORT.seasons.current;
  document.documentElement.setAttribute('data-sport', SPORT.id);
  document.title = `${SPORT.name} · ${SPORT.short} stats`;
}
const isTeamG = g => SPORT.groups[g]?.kind === 'team';
