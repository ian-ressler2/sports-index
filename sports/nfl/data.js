/* data.js: NFL season loader (ESPN feeds). Team defense is built from points allowed plus summed defender stats. */
ESPN.sp = 'football'; ESPN.lg = 'nfl';
const NFL_POS = { QB: 'Quarterback', RB: 'Running back', FB: 'Fullback', WR: 'Wide receiver', TE: 'Tight end', T: 'Tackle', OT: 'Offensive tackle', G: 'Guard', C: 'Center', DE: 'Defensive end', DT: 'Defensive tackle', NT: 'Nose tackle', LB: 'Linebacker', ILB: 'Inside linebacker', OLB: 'Outside linebacker', CB: 'Cornerback', S: 'Safety', FS: 'Free safety', SS: 'Strong safety', DB: 'Defensive back', K: 'Kicker', PK: 'Kicker', P: 'Punter', LS: 'Long snapper' };
const safeDiv = (a, b) => b ? a / b : NaN;
const pctOf = (a, b) => b ? a / b * 100 : NaN;
/* "Marvin Harrison Jr." -> "M.Harrison": how play-by-play text writes names */
const nflAbbr = n => { const p = (n || '').replace(/\b(Jr|Sr|II|III|IV|V)\.?$/i, '').trim().split(/\s+/); return p.length < 2 ? n : `${p[0][0]}.${p.slice(1).join(' ')}`; };

function mapRows(res, maxG) {
  const out = { qb: [], rb: [], rec: [], def: [], k: [], p: [] };
  for (const r of res.rows) {
    const v = r.v, g = v.general || {}, ps = v.passing || {}, ru = v.rushing || {}, rc = v.receiving || {}, df = v.defensive || {}, di = v.defensiveinterceptions || {}, kk = v.kicking || {}, pu = v.punting || {};
    const base = { id: +r.id, name: r.name, tid: +r.tid, pos: r.pos, age: r.age, gp: g.gamesPlayed, nt: r.nt }, gp = g.gamesPlayed || 0;
    if (ps.passingAttempts > 0) out.qb.push({ ...base, att: ps.passingAttempts, cmp: ps.completions, yds: ps.passingYards, ypg: ps.passingYardsPerGame, attg: safeDiv(ps.passingAttempts, gp), cmpp: ps.completionPct, ypa: ps.yardsPerPassAttempt,
      anya: safeDiv(ps.passingYards + 20 * ps.passingTouchdowns - 45 * ps.interceptions - ps.sackYardsLost, ps.passingAttempts + ps.sacks), ypc: safeDiv(ps.passingYards, ps.completions), lng: ps.longPassing,
      td: ps.passingTouchdowns, int: ps.interceptions, tdp: pctOf(ps.passingTouchdowns, ps.passingAttempts), intp: pctOf(ps.interceptions, ps.passingAttempts), sck: ps.sacks, sckp: pctOf(ps.sacks, ps.passingAttempts + ps.sacks), sckyds: ps.sackYardsLost,
      rtg: ps.QBRating, qbr: ps.QBR, aqbr: ps.adjQBR });
    if (ru.rushingAttempts > 0) out.rb.push({ ...base, att: ru.rushingAttempts, yds: ru.rushingYards, ypg: ru.rushingYardsPerGame, attg: safeDiv(ru.rushingAttempts, gp), ypc: ru.yardsPerRushAttempt, lng: ru.longRushing, fd: ru.rushingFirstDowns, fdp: pctOf(ru.rushingFirstDowns, ru.rushingAttempts),
      big: ru.rushingBigPlays, bigp: pctOf(ru.rushingBigPlays, ru.rushingAttempts), td: ru.rushingTouchdowns, tdp: pctOf(ru.rushingTouchdowns, ru.rushingAttempts), fum: ru.rushingFumbles, fuml: ru.rushingFumblesLost, fumr: safeDiv(ru.rushingFumbles, ru.rushingAttempts) * 100 });
    if (rc.receivingTargets > 0 || rc.receptions > 0) out.rec.push({ ...base, tgt: rc.receivingTargets, rec: rc.receptions, yds: rc.receivingYards, ypg: rc.receivingYardsPerGame, tgtg: safeDiv(rc.receivingTargets, gp), recg: safeDiv(rc.receptions, gp),
      catch: pctOf(rc.receptions, rc.receivingTargets), ypr: rc.yardsPerReception, ypt: safeDiv(rc.receivingYards, rc.receivingTargets), yac: rc.receivingYardsAfterCatch, yacr: safeDiv(rc.receivingYardsAfterCatch, rc.receptions), fd: rc.receivingFirstDowns,
      td: rc.receivingTouchdowns, tdt: pctOf(rc.receivingTouchdowns, rc.receivingTargets), lng: rc.longReception, big: rc.receivingBigPlays, fum: rc.receivingFumbles });
    if (df.totalTackles > 0 || df.sacks > 0 || di.interceptions > 0 || df.passesDefended > 0) {
      const itd = di.interceptionTouchdowns || 0, ftd = g.fumblesTouchdowns || 0;
      out.def.push({ ...base, tkl: df.totalTackles, solo: df.soloTackles, ast: df.assistTackles, tklg: safeDiv(df.totalTackles, gp), tfl: df.tacklesForLoss, tflg: safeDiv(df.tacklesForLoss, gp), sck: df.sacks, sckg: safeDiv(df.sacks, gp), sckyds: df.sackYards, ff: g.fumblesForced,
        pd: df.passesDefended, pdg: safeDiv(df.passesDefended, gp), int: di.interceptions || 0, intyds: di.interceptionYards || 0, fr: g.fumblesRecovered || 0, tk: (di.interceptions || 0) + (g.fumblesRecovered || 0), dtd: itd + ftd });
    }
    if (kk.fieldGoalAttempts > 0 || kk.extraPointAttempts > 0) out.k.push({ ...base, fgm: kk.fieldGoalsMade, fga: kk.fieldGoalAttempts, fgp: kk.fieldGoalPct, lng: kk.longFieldGoalMade,
      f40: pctOf(kk.fieldGoalsMade40_49, kk.fieldGoalAttempts40_49), f50: pctOf(kk.fieldGoalsMade50, kk.fieldGoalAttempts50), m50: kk.fieldGoalsMade50, a50: kk.fieldGoalAttempts50, m40: kk.fieldGoalsMade40_49, m30: kk.fieldGoalsMade30_39, m20: kk.fieldGoalsMade20_29,
      xpm: kk.extraPointsMade, xpa: kk.extraPointAttempts, xpp: kk.extraPointPct, pts: 3 * (kk.fieldGoalsMade || 0) + (kk.extraPointsMade || 0), ptsg: safeDiv(3 * (kk.fieldGoalsMade || 0) + (kk.extraPointsMade || 0), gp) });
    if (pu.punts > 0) out.p.push({ ...base, punts: pu.punts, yds: pu.puntYards, avg: pu.grossAvgPuntYards, net: pu.netAvgPuntYards, lng: pu.longPunt, in20: pu.puntsInside20, in20p: pctOf(pu.puntsInside20, pu.punts), tb: pu.touchbacks, tbp: pctOf(pu.touchbacks, pu.punts), blk: pu.puntsBlocked, fc: pu.fairCatches, ret: safeDiv(pu.avgPuntReturnYards * pu.puntReturns, pu.punts) });
  }
  return out;
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
  if (!res.ath.rows.length) throw new Error(`ESPN has no NFL player stats for ${SPORT.seasons.label(season)} yet.`);

  buildTeamsAndStandings(D, res.stand, res.ath.teams, {
    lgName: r => /american/i.test(r.conf) ? 'AFC' : 'NFC',
    divName: r => (r.div || '').trim(),
    stand: r => {
      const s = r.s, d = r.d, w = s.wins || 0, l = s.losses || 0, t = s.ties || 0, gp = w + l + t, cl = d.clincher;
      return { w, l, t, gp, pct: safeDiv(w + t / 2, gp), pf: s.pointsFor, pa: s.pointsAgainst, rs: s.pointsFor, ra: s.pointsAgainst, rdiff: s.pointsFor - s.pointsAgainst, diff: safeDiv(s.pointsFor - s.pointsAgainst, gp), ppg: safeDiv(s.pointsFor, gp), oppg: safeDiv(s.pointsAgainst, gp),
        streak: d.streak || '', home: d.Home || '', road: d.Road || '', divrec: d['vs. Div.'] || '', conf: d['vs. Conf.'] || '', seed: s.playoffSeed, divChamp: ['y', 'z'].includes(cl), clinched: ['x', 'y', 'z', '*'].includes(cl) };
    },
  });
  const byDiv = new Map(); for (const t of D.teams.values()) { if (!byDiv.has(t.div)) byDiv.set(t.div, []); byDiv.get(t.div).push(t); }
  for (const arr of byDiv.values()) arr.sort((a, b) => D.stand.get(b.id).pct - D.stand.get(a.id).pct || D.stand.get(b.id).diff - D.stand.get(a.id).diff).forEach((t, i) => D.stand.get(t.id).dr = i + 1);
  D.final = season < SPORT.seasons.current || [...D.stand.values()].every(s => s.gp >= 17);
  const G = D.maxG;
  D.q = { qb: Math.max(1, Math.ceil(10 * G)), rb: Math.max(1, Math.ceil(5 * G)), rec: Math.max(1, Math.ceil(3 * G)), def: Math.max(1, Math.ceil(0.5 * G)), k: Math.max(1, Math.ceil(0.6 * G)), p: Math.max(1, Math.ceil(2 * G)) };

  /* players */
  const rows = mapRows(res.ath, G); D.maps = {}; D.lists = {}; D.players = new Map();
  for (const g of ['qb', 'rb', 'rec', 'def', 'k', 'p']) {
    const m = new Map(); for (const r of rows[g]) if (D.teams.has(r.tid) && !m.has(r.id)) m.set(r.id, r);
    D[g] = m; D.maps[g] = m; D[g + 'List'] = D.lists[g] = [...m.values()];
  }
  const weight = r => (r.att || 0) + (r.tgt || 0) * 2 + (r.tkl || 0) + (r.fga || 0) * 4 + (r.punts || 0) * 3;
  for (const g of ['qb', 'rb', 'rec', 'def', 'k', 'p']) for (const r of D[g].values()) {
    const cur = D.players.get(r.id); if (cur) { cur.w += weight(r); continue; }
    D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: r.pos, w: weight(r), key: slugify(r.name), ab: nflAbbr(r.name) });
  }

  /* teams: offense from team totals + standings; defense from points allowed + summed defender stats */
  const agg = new Map(); for (const r of D.defList) { const a = agg.get(r.tid) || { sck: 0, tfl: 0, pd: 0, ff: 0, fr: 0, dtd: 0, int: 0 }; a.sck += r.sck || 0; a.tfl += r.tfl || 0; a.pd += r.pd || 0; a.ff += r.ff || 0; a.fr += r.fr || 0; a.dtd += r.dtd || 0; a.int += r.int || 0; agg.set(r.tid, a); }
  const tof = new Map(), tdf = new Map();
  for (const [sid, t] of res.team) {
    const id = +sid, st = D.stand.get(id); if (!st) continue;
    const g = t.v.general || {}, ps = t.v.passing || {}, ru = t.v.rushing || {}, ms = t.v.miscellaneous || {}, gp = st.gp || g.gamesPlayed || 1;
    const plays = (ps.passingAttempts || 0) + (ps.sacks || 0) + (ru.rushingAttempts || 0), ty = ps.totalYards || ((ps.passingYards || 0) + (ru.rushingYards || 0));
    const base = { id, gp, w: st.w, l: st.l, t: st.t, pct: st.pct, diff: st.diff };
    tof.set(id, { ...base, ppg: st.ppg, ypg: safeDiv(ty, gp), ypp: safeDiv(ty, plays), plays: safeDiv(plays, gp), prate: pctOf(ps.passingAttempts, (ps.passingAttempts || 0) + (ru.rushingAttempts || 0)),
      pyg: safeDiv(ps.passingYards, gp), cmpp: ps.completionPct, ypa: ps.yardsPerPassAttempt, ptd: ps.passingTouchdowns, pint: ps.interceptions, sck: ps.sacks, rtg: ps.QBRating,
      ryg: safeDiv(ru.rushingYards, gp), ratt: safeDiv(ru.rushingAttempts, gp), ypc: ru.yardsPerRushAttempt, rtd: ru.rushingTouchdowns,
      fdg: safeDiv(ms.firstDowns, gp), thp: ms.thirdDownConvPct, fop: ms.fourthDownConvPct, peng: safeDiv(ms.totalPenalties, gp), penyg: safeDiv(ms.totalPenaltyYards, gp), give: ms.totalGiveaways, fuml: g.fumblesLost });
    const a = agg.get(id) || {}, take = ms.totalTakeaways != null ? ms.totalTakeaways : (a.int || 0) + (a.fr || 0);
    tdf.set(id, { ...base, pag: st.oppg, pa: st.pa, sck: a.sck, sckg: safeDiv(a.sck, gp), tfl: a.tfl, pd: a.pd, ff: a.ff, int: a.int, fr: a.fr, take, takeg: safeDiv(take, gp), dtd: a.dtd, tod: take - (ms.totalGiveaways || 0) });
  }
  D.tof = D.maps.tof = tof; D.tdf = D.maps.tdf = tdf; D.lists.tof = D.tofList = [...tof.values()]; D.lists.tdf = D.tdfList = [...tdf.values()];
  for (const g of ['qb', 'rb', 'rec', 'def', 'k', 'p', 'tof', 'tdf']) buildPct(D, g);
  return D;
}
