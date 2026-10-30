/* data.js: soccer season loader (ESPN feeds). The table comes from the standings, club numbers from ESPN's per-club season totals, and player numbers
   from each club's roster feed, which carries every player's season totals (one request per club). ESPN publishes no bulk player table for soccer. */
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


const SOC_POS = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Forward' };

/* every player a club lists, with the season totals the roster feed carries (appearances, goals, assists, shots, cards, saves) */
async function socRoster(season, id) {
  const j = await getJSON(`${espnSite()}/teams/${id}/roster?season=${season}`).catch(() => null);
  const out = [];
  for (const a of j?.athletes || []) {
    const cats = a.statistics?.splits?.categories; if (!cats) continue;
    const v = {}; for (const c of cats) { const o = v[c.name] = {}; for (const s of c.stats || []) o[s.name] = s.value; }
    if (!(v.general?.appearances > 0)) continue;
    out.push({ id: +a.id, name: a.displayName || a.fullName, tid: +id, pos: a.position?.abbreviation || '', age: a.age, jersey: a.jersey || '', h: a.displayHeight || '', nat: a.citizenship || '', v });
  }
  return out;
}
async function socPlayers(season, ids) {
  const by = new Map();
  await pool(ids, 6, async id => { for (const r of await socRoster(season, id)) { const o = by.get(r.id); if (!o || r.v.general.appearances > o.v.general.appearances) by.set(r.id, r); } });
  return [...by.values()];
}
function socPlayerRow(r) {
  const g = r.v.general || {}, o = r.v.offensive || {}, k = r.v.goalKeeping || {};
  const app = g.appearances, subs = g.subIns || 0, st = app - subs, goals = o.totalGoals || 0, ast = o.goalAssists || 0, sh = o.totalShots, sot = o.shotsOnTarget;
  const row = { id: r.id, name: r.name, tid: r.tid, pos: r.pos, age: r.age, jersey: r.jersey, h: r.h, nat: r.nat, nt: 1, app, st, sub: subs };
  if (r.pos === 'G') {
    Object.assign(row, { sv: k.saves, sf: k.shotsFaced, gc: k.goalsConceded, svp: pctOf(k.saves, k.shotsFaced), svpa: safeDiv(k.saves, app), sfpa: safeDiv(k.shotsFaced, app), gcpa: safeDiv(k.goalsConceded, app), yc: g.yellowCards || 0, rc: g.redCards || 0 });
    return row;
  }
  Object.assign(row, {
    g: goals, a: ast, ga: goals + ast, gpa: safeDiv(goals, app), apa: safeDiv(ast, app), gapa: safeDiv(goals + ast, app),
    sh, sot, shpa: safeDiv(sh, app), sotpa: safeDiv(sot, app), sotp: pctOf(sot, sh), conv: pctOf(goals, sh),
    fc: g.foulsCommitted, fs: g.foulsSuffered, fcpa: safeDiv(g.foulsCommitted, app), fspa: safeDiv(g.foulsSuffered, app), yc: g.yellowCards || 0, rc: g.redCards || 0, ofs: o.offsides, og: g.ownGoals || 0,
  });
  return row;
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

  /* players: every club's roster totals; a failure leaves the club pages working */
  let raw = [];
  try { raw = await cached(`${season}:pl`, ttl, () => socPlayers(season, stand.map(r => r.id))); } catch (e) { D.warn.push('Player stats did not load; only club pages are available.'); }
  const pl = new Map(), gk = new Map();
  for (const r of raw) { if (!D.teams.has(r.tid)) continue; const m = socPlayerRow(r); (r.pos === 'G' ? gk : pl).set(m.id, m); }
  D.pl = pl; D.plList = [...pl.values()]; D.gk = gk; D.gkList = [...gk.values()];
  D.q = { pl: Math.max(1, Math.ceil(0.35 * D.maxG)), gk: Math.max(1, Math.ceil(0.35 * D.maxG)) };
  D.players = new Map();
  for (const r of [...D.plList, ...D.gkList]) D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: r.pos, w: r.app || 0, key: slugify(r.name) });
  D.maps = { pl, gk, tof: tk, tpo: tk, tdf: tk }; D.lists = { pl: D.plList, gk: D.gkList, tof: D.tofList, tpo: D.tpoList, tdf: D.tdfList };
  for (const g of ['pl', 'gk', 'tof', 'tpo', 'tdf']) buildPct(D, g);
  return D;
}
