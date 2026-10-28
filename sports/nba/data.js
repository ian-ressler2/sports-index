/* data.js: NBA season loader (ESPN feeds). Advanced rates are derived from totals. */
ESPN.sp = 'basketball'; ESPN.lg = 'nba';
const NBA_POS = { G: 'Guard', F: 'Forward', C: 'Center', PG: 'Point guard', SG: 'Shooting guard', SF: 'Small forward', PF: 'Power forward', 'G-F': 'Guard / forward', 'F-C': 'Forward / center' };
const safeDiv = (a, b) => b ? a / b : NaN;
const per = (x, min, n = 36) => safeDiv(x, min) * n;

function mapPlayer(r, tm) {
  const g = r.v.general || {}, o = r.v.offensive || {}, d = r.v.defensive || {};
  const gp = g.gamesPlayed, min = g.minutes, fga = o.fieldGoalsAttempted, fgm = o.fieldGoalsMade, fta = o.freeThrowsAttempted, ftm = o.freeThrowsMade, tpm = o.threePointFieldGoalsMade, tpa = o.threePointFieldGoalsAttempted;
  const pts = o.points, reb = g.rebounds, ast = o.assists, stl = d.steals, blk = d.blocks, tov = o.turnovers;
  const row = {
    id: +r.id, name: r.name, tid: +r.tid, pos: r.pos, age: r.age, nt: r.nt, gp, mpg: g.avgMinutes, min,
    ppg: o.avgPoints, pts, fgapg: o.avgFieldGoalsAttempted, tpmpg: o.avgThreePointFieldGoalsMade, tpapg: o.avgThreePointFieldGoalsAttempted, ftapg: o.avgFreeThrowsAttempted,
    eff: safeDiv(pts + reb + ast + stl + blk - (fga - fgm) - (fta - ftm) - tov, gp),
    fgp: o.fieldGoalPct, tpp: o.threePointFieldGoalPct, ftp: o.freeThrowPct, fgm, fga, tpm, tpa, ftm, fta,
    ts: safeDiv(pts, 2 * (fga + 0.44 * fta)) * 100, efg: safeDiv(fgm + 0.5 * tpm, fga) * 100, tpar: safeDiv(tpa, fga) * 100, ftr: safeDiv(fta, fga) * 100,
    apg: o.avgAssists, ast, topg: o.avgTurnovers, tov, astto: safeDiv(ast, tov),
    rpg: g.avgRebounds, reb, spg: d.avgSteals, bpg: d.avgBlocks, stl, blk, stocks: (d.avgSteals || 0) + (d.avgBlocks || 0),
    pts36: per(pts, min), reb36: per(reb, min), ast36: per(ast, min), stl36: per(stl, min), blk36: per(blk, min), tov36: per(tov, min),
    pfg: g.avgFouls, dd2: g.doubleDouble, td3: g.tripleDouble, tech: g.technicalFouls,
    usg: NaN, astp: NaN, rebp: NaN,
  };
  if (tm && r.nt <= 1 && min > 0) {
    const t5 = tm.min / 5;
    row.usg = (fga + 0.44 * fta + tov) * t5 / (min * (tm.fga + 0.44 * tm.fta + tm.tov)) * 100;
    row.astp = ast / ((min / t5) * tm.fgm - fgm) * 100;
    row.rebp = reb * t5 / (min * (tm.reb + tm.oppReb)) * 100;
  }
  return row;
}

async function loadSeason(season, prog = () => { }) {
  const ttl = ttlFor(season), D = { season, warn: [], pct: {} };
  const T = { ath: [true, () => espnAthletes(season)], team: [true, () => espnTeamStats(season)], stand: [true, () => espnStandings(season)] };
  const names = Object.keys(T), res = {}; let done = 0;
  await Promise.all(names.map(async n => {
    try { res[n] = await cached(`${season}:${n}`, ttl, T[n][1]); } catch (e) { res[n] = null; res[n + '_err'] = e; }
    prog(++done / names.length, n);
  }));
  for (const n of names) if (T[n][0] && !res[n]) throw new Error(`Could not load ${n} from ESPN (${res[n + '_err']?.message || 'network'}).`);
  if (!res.ath.rows.length) throw new Error(`ESPN has no NBA player stats for ${SPORT.seasons.label(season)} yet.`);

  buildTeamsAndStandings(D, res.stand, res.ath.teams, {
    lgName: r => /east/i.test(r.conf) ? 'East' : 'West',
    divName: r => (r.div || '').replace(' Division', ''),
    stand: r => {
      const s = r.s, d = r.d, w = s.wins, l = s.losses, cl = d.clincher;
      return { w, l, gp: w + l, pct: safeDiv(w, w + l), gb: d.gamesBehind, rs: s.pointsFor, ra: s.pointsAgainst, rdiff: s.pointsFor - s.pointsAgainst, ppg: s.avgPointsFor, oppg: s.avgPointsAgainst, diff: safeDiv(s.pointsFor - s.pointsAgainst, w + l),
        streak: d.streak || '', home: d.Home || '', road: d.Road || '', l10: d['Last Ten Games'] || '', conf: d['vs. Conf.'] || '', seed: s.playoffSeed, divChamp: ['y', 'z', 'p'].includes(cl), clinched: ['x', 'y', 'z', 'p'].includes(cl) };
    },
  });
  const byDiv = new Map(); for (const t of D.teams.values()) { if (!byDiv.has(t.div)) byDiv.set(t.div, []); byDiv.get(t.div).push(t); }
  for (const arr of byDiv.values()) arr.sort((a, b) => D.stand.get(b.id).pct - D.stand.get(a.id).pct).forEach((t, i) => D.stand.get(t.id).dr = i + 1);
  D.final = season < SPORT.seasons.current || [...D.stand.values()].every(s => s.gp >= 82);
  D.q = { pl: Math.max(1, Math.ceil(0.5 * D.maxG)) };

  /* teams (also the context for usage, assist and rebound rates) */
  const tk = new Map(), ctx = new Map();
  for (const [sid, t] of res.team) {
    const id = +sid, st = D.stand.get(id); if (!st) continue;
    const g = t.v.general || {}, o = t.v.offensive || {}, d = t.v.defensive || {}, g2 = t.v['general#2'] || {}, o2 = t.v['offensive#2'] || {}, d2 = t.v['defensive#2'] || {}, df = t.v.differential || {};
    const gp = g.gamesPlayed || st.gp;
    const poss = o.fieldGoalsAttempted + 0.44 * o.freeThrowsAttempted - o.offensiveRebounds + o.turnovers, oposs = o2.fieldGoalsAttempted + 0.44 * o2.freeThrowsAttempted - o2.offensiveRebounds + o2.turnovers;
    const ortg = safeDiv(o.points, poss) * 100, drtg = safeDiv(o2.points, oposs) * 100;
    ctx.set(id, { min: gp * 240, fga: o.fieldGoalsAttempted, fta: o.freeThrowsAttempted, tov: o.turnovers, fgm: o.fieldGoalsMade, reb: g.rebounds, oppReb: g2.rebounds });
    tk.set(id, {
      id, gp, w: st.w, l: st.l, pct: st.pct, diff: isFinite(df.avgPointsDifferential) ? df.avgPointsDifferential : st.diff,
      ppg: o.avgPoints, ortg, pace: safeDiv(poss + oposs, 2 * gp), fgp: o.fieldGoalPct, tpp: o.threePointFieldGoalPct, ftp: o.freeThrowPct, tpmpg: o.avgThreePointFieldGoalsMade, tpapg: o.avgThreePointFieldGoalsAttempted, ftapg: o.avgFreeThrowsAttempted,
      efg: safeDiv(o.fieldGoalsMade + 0.5 * o.threePointFieldGoalsMade, o.fieldGoalsAttempted) * 100, tovp: safeDiv(o.turnovers, poss) * 100, orebp: safeDiv(o.offensiveRebounds, o.offensiveRebounds + d2.defensiveRebounds) * 100,
      ftr: safeDiv(o.freeThrowsAttempted, o.fieldGoalsAttempted) * 100, ts: safeDiv(o.points, 2 * (o.fieldGoalsAttempted + 0.44 * o.freeThrowsAttempted)) * 100, tpar: safeDiv(o.threePointFieldGoalsAttempted, o.fieldGoalsAttempted) * 100,
      apg: o.avgAssists, topg: o.avgTurnovers, rpg: g.avgRebounds, orpg: o.avgOffensiveRebounds, astrate: safeDiv(o.assists, o.fieldGoalsMade) * 100,
      oppg: o2.avgPoints, drtg, net: ortg - drtg, ofgp: o2.fieldGoalPct, otpp: o2.threePointFieldGoalPct, oftp: o2.freeThrowPct, otpapg: o2.avgThreePointFieldGoalsAttempted,
      oefg: safeDiv(o2.fieldGoalsMade + 0.5 * o2.threePointFieldGoalsMade, o2.fieldGoalsAttempted) * 100, otovp: safeDiv(o2.turnovers, oposs) * 100,
      drebp: safeDiv(d.defensiveRebounds, d.defensiveRebounds + o2.offensiveRebounds) * 100, oftr: safeDiv(o2.freeThrowsAttempted, o2.fieldGoalsAttempted) * 100,
      spg: d.avgSteals, bpg: d.avgBlocks, pfg: g.avgFouls, drpg: d.avgDefensiveRebounds, rdiff: df.avgReboundsDifferential,
    });
  }
  D.tof = D.tdf = tk; D.tofList = D.tdfList = [...tk.values()];

  /* players */
  const pl = new Map();
  for (const r of res.ath.rows) { const m = mapPlayer(r, ctx.get(+r.tid)); if (m.gp > 0 && D.teams.has(m.tid)) pl.set(m.id, m); }
  D.pl = pl; D.plList = [...pl.values()];
  D.players = new Map();
  for (const r of D.plList) D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: r.pos, w: r.min || 0, key: slugify(r.name) });
  D.maps = { pl, tof: tk, tdf: tk }; D.lists = { pl: D.plList, tof: D.tofList, tdf: D.tdfList };
  for (const g of ['pl', 'tof', 'tdf']) buildPct(D, g);
  return D;
}
