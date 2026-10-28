/* data.js: NHL season loader (ESPN feeds) */
ESPN.sp = 'hockey'; ESPN.lg = 'nhl';
const NHL_POS = { C: 'Center', LW: 'Left wing', RW: 'Right wing', L: 'Left wing', R: 'Right wing', D: 'Defenseman', G: 'Goalie' };
const safeDiv = (a, b) => b ? a / b : NaN;

function mapSkater(r) {
  const g = r.v.general || {}, o = r.v.offensive || {}, p = r.v.penalties || {};
  const gp = g.games, toi = sec2min(g.timeOnIce), s = o.shotsTotal, pts = o.points, ppp = (o.powerPlayGoals || 0) + (o.powerPlayAssists || 0);
  const fow = o.faceoffsWon || 0, fol = o.faceoffsLost || 0;
  return {
    id: +r.id, name: r.name, tid: +r.tid, pos: r.pos, age: r.age, gp, toig: sec2min(g.timeOnIcePerGame), toi, shft: g.shifts,
    g: o.goals, a: o.assists, pts, ptsgp: safeDiv(pts, gp), ggp: safeDiv(o.goals, gp), agp: safeDiv(o.assists, gp), gwg: o.gameWinningGoals,
    g60: safeDiv(o.goals, toi) * 60, a60: safeDiv(o.assists, toi) * 60, p60: safeDiv(pts, toi) * 60, s60: safeDiv(s, toi) * 60,
    s, sgp: safeDiv(s, gp), shp: s ? o.goals / s * 100 : NaN,
    ppg: o.powerPlayGoals, ppa: o.powerPlayAssists, ppp, npp: pts - ppp, ppsh: pts ? ppp / pts * 100 : NaN,
    pm: g.plusMinus, pim: p.penaltyMinutes, fow, fol, fop: fow + fol >= 20 ? fow / (fow + fol) * 100 : NaN,
  };
}
function mapGoalie(r, lgSv) {
  const g = r.v.general || {}, d = r.v.defensive || {};
  const toi = sec2min(g.timeOnIce), sa = d.shotsAgainst, sv = d.saves, gsaa = sa ? sv - sa * lgSv : NaN, w = g.wins, l = g.losses, otl = d.overtimeLosses;
  return {
    id: +r.id, name: r.name, tid: +r.tid, pos: 'G', age: r.age, gp: g.games, toi, sa, sv, sa60: safeDiv(sa, toi) * 60,
    w, l, otl, wp: safeDiv(w, w + l + otl), ga: d.goalsAgainst, gaa: sa ? d.avgGoalsAgainst : NaN, so: d.shutouts,
    svp: sa ? sv / sa : NaN, gsaa, gsaa60: safeDiv(gsaa, toi) * 60, svgp: safeDiv(sv, g.games),
  };
}

async function loadSeason(season, prog = () => { }) {
  const ttl = ttlFor(season), D = { season, warn: [], pct: {} };
  const T = {
    ath: [true, () => espnAthletes(season)],
    team: [true, () => espnTeamStats(season)],
    stand: [true, () => espnStandings(season)],
  };
  const names = Object.keys(T), res = {}; let done = 0;
  await Promise.all(names.map(async n => {
    try { res[n] = await cached(`${season}:${n}`, ttl, T[n][1]); } catch (e) { res[n] = null; res[n + '_err'] = e; }
    prog(++done / names.length, n);
  }));
  for (const n of names) if (T[n][0] && !res[n]) throw new Error(`Could not load ${n} from ESPN (${res[n + '_err']?.message || 'network'}).`);
  if (!res.ath.rows.length) throw new Error(`ESPN has no NHL player stats for ${SPORT.seasons.label(season)} yet.`);

  /* teams + standings */
  buildTeamsAndStandings(D, res.stand, res.ath.teams, {
    lgName: r => (r.conf || '').replace(' Conference', '').slice(0, 4) === 'East' ? 'East' : 'West',
    divName: r => (r.div || '').replace(' Division', ''),
    stand: r => {
      const s = r.s, d = r.d, gp = s.gamesPlayed, pts = s.points, cl = d.clincher;
      return { w: s.wins, l: s.losses, otl: s.otLosses, pts, gp, pct: safeDiv(pts, gp * 2), ptp: safeDiv(pts, gp * 2), rw: s.regWins, row: s.rotWins, gf: s.pointsFor, ga: s.pointsAgainst, diff: s.pointDifferential, rs: s.pointsFor, ra: s.pointsAgainst, rdiff: s.pointDifferential,
        streak: d.streak || '', home: d.Home || '', road: d.Road || '', l10: d['Last Ten Games'] ? d['Last Ten Games'].replace(/, \d+ PTS/, '') : '', seed: s.playoffSeed, divChamp: ['y', 'z', 'p'].includes(cl), clinched: ['x', 'y', 'z', 'p'].includes(cl) };
    },
  });
  /* division rank by points */
  const byDiv = new Map(); for (const t of D.teams.values()) { if (!byDiv.has(t.div)) byDiv.set(t.div, []); byDiv.get(t.div).push(t); }
  for (const arr of byDiv.values()) arr.sort((a, b) => D.stand.get(b.id).pts - D.stand.get(a.id).pts || D.stand.get(b.id).rw - D.stand.get(a.id).rw).forEach((t, i) => D.stand.get(t.id).dr = i + 1);
  D.final = season < SPORT.seasons.current || [...D.stand.values()].every(s => s.gp >= 82);
  D.q = { sk: Math.max(1, Math.ceil(0.3 * D.maxG)), gk: Math.max(1, Math.ceil(0.25 * D.maxG)) };

  /* players */
  const gRows = res.ath.rows.filter(r => r.pos === 'G'), sRows = res.ath.rows.filter(r => r.pos !== 'G');
  let tsa = 0, tsv = 0; for (const r of gRows) { tsa += r.v.defensive?.shotsAgainst || 0; tsv += r.v.defensive?.saves || 0; }
  D.lgSv = tsa ? tsv / tsa : 0.9;
  const sk = new Map(), gk = new Map();
  for (const r of sRows) { const m = mapSkater(r); if (m.gp > 0 && D.teams.has(m.tid)) sk.set(m.id, m); }
  for (const r of gRows) { const m = mapGoalie(r, D.lgSv); if (m.gp > 0 && D.teams.has(m.tid)) gk.set(m.id, m); }
  D.sk = sk; D.gk = gk; D.skList = [...sk.values()]; D.gkList = [...gk.values()];
  D.players = new Map();
  for (const r of D.skList) D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: r.pos, w: r.toi || 0 });
  for (const r of D.gkList) D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: 'G', w: r.toi || 0 });
  for (const p of D.players.values()) p.key = slugify(p.name);

  /* teams */
  const tk = new Map();
  for (const [sid, t] of res.team) {
    const id = +sid, st = D.stand.get(id); if (!st) continue;
    const g = t.v.general || {}, o = t.v.offensive || {}, d = t.v.defensive || {}, p = t.v.penalties || {}, gp = g.games || st.gp;
    tk.set(id, {
      id, gp, w: st.w, l: st.l, otl: st.otl, pts: st.pts, ptp: st.ptp, rw: st.rw,
      gf: o.goals, gfgp: safeDiv(o.goals, gp), ga: d.goalsAgainst, gagp: safeDiv(d.goalsAgainst, gp), diff: o.goals - d.goalsAgainst, diffgp: safeDiv(o.goals - d.goalsAgainst, gp),
      s: o.shotsTotal, sgp: safeDiv(o.shotsTotal, gp), shp: o.shootingPct, sa: d.shotsAgainst, sagp: safeDiv(d.shotsAgainst, gp), svp: d.savePct, so: d.shutouts,
      sdiff: safeDiv(o.shotsTotal - d.shotsAgainst, gp), sshare: safeDiv(o.shotsTotal, o.shotsTotal + d.shotsAgainst) * 100,
      ppp: o.powerPlayPct, ppo: o.powerPlayOpportunities, ppopg: safeDiv(o.powerPlayOpportunities, gp), ppgf: o.powerPlayGoals, shg: o.shortHandedGoals, pkp: d.penaltyKillPct,
      pdo: o.shootingPct + d.savePct * 100, pim: p.penaltyMinutes, pimgp: safeDiv(p.penaltyMinutes, gp),
    });
  }
  D.tsk = tk; D.tgk = tk; D.tskList = D.tgkList = [...tk.values()];
  D.maps = { sk, gk, tsk: tk, tgk: tk }; D.lists = { sk: D.skList, gk: D.gkList, tsk: D.tskList, tgk: D.tgkList };
  for (const g of ['sk', 'gk', 'tsk', 'tgk']) buildPct(D, g);
  return D;
}
