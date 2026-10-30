/* data.js: soccer season loader (ESPN feeds). The table comes from the standings; every other number comes from ESPN's per-club season totals
   (one request per club). ESPN publishes no bulk player stats for soccer, so these sites are about clubs. */
const safeDiv = (a, b) => b ? a / b : NaN;
const pctOf = (a, b) => b ? a / b * 100 : NaN;
/* a stable colour per club: ESPN's standings carry none, so spread the ids around the colour wheel */
function socColor(id) { const h = (Math.imul(+id || 1, 2654435761) >>> 0) % 360; return `hsl(${h} 62% 46%)`; }

/* Map clubId -> { category: { stat: value } } */
async function socTeamStats(season, ids) {
  const m = new Map();
  await pool(ids, 6, async id => {
    const j = await getJSON(`https://sports.core.api.espn.com/v2/sports/soccer/leagues/${SOC.lg}/seasons/${season}/types/${SOC.stype || 1}/teams/${id}/statistics`).catch(() => null);
    if (!j) return;
    const v = {}; for (const c of j.splits?.categories || []) { const o = v[c.name] = {}; for (const s of c.stats || []) o[s.name] = s.value; }
    m.set(String(id), v);
  });
  return m;
}

async function loadSeason(season, prog = () => { }) {
  const ttl = ttlFor(season), D = { season, warn: [], pct: {} };
  prog(.1, 'stand');
  let stand;
  try { stand = await cached(`${season}:stand`, ttl, () => espnTypedStandings(season)); } catch (e) { throw new Error(`Could not load the table from ESPN (${e.message || 'network'}).`); }
  if (!stand.length) throw new Error(`ESPN has no ${SOC.label} table for ${SPORT.seasons.label(season)} yet.`);
  prog(.3, 'team');
  let n = 0;
  const ts = await cached(`${season}:team`, ttl, async () => { const m = await socTeamStats(season, stand.map(r => r.id)); return m; });
  prog(1, 'team');
  const rows = stand.filter(r => ts.has(String(r.id)));
  if (rows.length < stand.length) D.warn.push(`${stand.length - rows.length} clubs without stats were left out.`);
  buildTeamsAndStandings(D, rows, new Map(), {
    lgName: r => SOC.label,
    divName: r => r.conf,
    stand: r => {
      const s = r.s, gp = s.gamesplayed || 0, w = s.wins || 0, t = s.ties || 0, l = s.losses || 0, pts = s.points ?? w * 3 + t;
      return { w, l, t, gp, pts, pct: safeDiv(pts, 3 * gp), ppg: safeDiv(pts, gp), gf: s.pointsfor, ga: s.pointsagainst, gd: s.pointdifferential, rs: s.pointsfor, ra: s.pointsagainst, rdiff: s.pointdifferential,
        gfpg: safeDiv(s.pointsfor, gp), gapg: safeDiv(s.pointsagainst, gp), diff: safeDiv(s.pointdifferential, gp), rank: s.rank, pf: s.pointsfor, pa: s.pointsagainst };
    },
  });
  for (const t of D.teams.values()) if (!t.color) t.color = socColor(t.id);
  SPORT.standings.divOrder = [...new Set([...D.teams.values()].map(t => t.div))].sort();
  SPORT.teamFilters = SPORT.standings.divOrder.length > 1 ? SPORT.standings.divOrder.map(c => [c, c]) : [];
  /* a table position within each group */
  const byDiv = new Map(); for (const t of D.teams.values()) { if (!byDiv.has(t.div)) byDiv.set(t.div, []); byDiv.get(t.div).push(t); }
  for (const arr of byDiv.values()) arr.sort((a, b) => D.stand.get(b.id).pts - D.stand.get(a.id).pts || D.stand.get(b.id).gd - D.stand.get(a.id).gd || D.stand.get(b.id).gf - D.stand.get(a.id).gf).forEach((t, i) => D.stand.get(t.id).dr = i + 1);
  D.final = season < SPORT.seasons.current || new Date() >= SOC.seasonEnd(season);
  D.stage = SOC.stage || 'REGULAR SEASON';

  const tk = new Map();
  for (const [sid, v] of ts) {
    const id = +sid, st = D.stand.get(id); if (!st) continue;
    const of = v.offensive || {}, df = v.defensive || {}, ge = v.general || {}, gk = v.goalKeeping || {}, gp = st.gp || ge.appearances;
    const g = x => safeDiv(x, gp);
    tk.set(id, {
      id, gp, w: st.w, l: st.l, t: st.t, pts: st.pts, pct: st.pct, ppg: st.ppg, gd: st.gd, diff: st.diff,
      gf: st.gf, gfg: g(st.gf), xg: of.avgExpectedGoals, xgd: ge.avgExpectedGoalDifferential, shg: g(of.totalShots), sotg: g(of.shotsOnTarget), sotp: pctOf(of.shotsOnTarget, of.totalShots), conv: pctOf(st.gf, of.totalShots), bcg: of.avgBigChanceCreated, ast: of.goalAssists,
      hdg: of.headedGoals, pkg: of.penaltyKickGoals, fkg: of.freeKickGoals, crng: g(ge.wonCorners),
      poss: of.possessionPct, pasg: g(of.totalPasses), passp: pctOf(of.accuratePasses, of.totalPasses), lbg: g(of.totalLongBalls), lbp: pctOf(of.accurateLongBalls, of.totalLongBalls), crsg: g(of.totalCrosses), crsp: pctOf(of.accurateCrosses, of.totalCrosses), offg: g(of.offsides),
      duelp: pctOf(ge.duelsWon, ge.duels), recg: g(df.recoveries), fsg: g(ge.foulsSuffered),
      ga: st.ga, gag: g(st.ga), xga: gk.avgExpectedGoalsConceded, cs: gk.cleanSheet, csp: pctOf(gk.cleanSheet, gp), sfg: g(gk.shotsFaced), svg: g(gk.saves), svp: pctOf(gk.saves, gk.shotsFaced), pks: gk.penaltyKicksSaved, bcs: gk.bigChanceSaves,
      tklg: g(df.totalTackles), tklp: pctOf(df.effectiveTackles, df.totalTackles), intg: g(df.interceptions), clrg: g(df.totalClearance), blkg: g(df.blockedShots), fcg: g(ge.foulsCommitted), ycg: g(ge.yellowCards), red: (ge.redCards || 0) + (ge.secondYellow || 0),
    });
  }
  D.tof = D.tpo = D.tdf = tk; D.tofList = D.tpoList = D.tdfList = [...tk.values()];
  D.players = new Map(); D.pl = new Map(); D.plList = [];
  D.maps = { tof: tk, tpo: tk, tdf: tk }; D.lists = { tof: D.tofList, tpo: D.tpoList, tdf: D.tdfList };
  for (const g of ['tof', 'tpo', 'tdf']) buildPct(D, g);
  return D;
}
