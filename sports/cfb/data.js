/* data.js: college football season loader (ESPN feeds). ESPN's bulk athlete table is empty for college football (every column but games played),
   so players come from the core API: the top 100 in each leaderboard category, then each player's own season line. Each team's feed lists every category twice: the team, then its opponents. */
ESPN.sp = 'football'; ESPN.lg = 'college-football';
const safeDiv = (a, b) => b ? a / b : NaN;
const pctOf = (a, b) => b ? a / b * 100 : NaN;
const cfbRec = x => { const m = /^(\d+)-(\d+)(?:-(\d+))?/.exec(x || ''); return m ? [+m[1], +m[2], +(m[3] || 0)] : [0, 0, 0]; };
const CFB_POWER = ['Southeastern', 'Big Ten', 'Big 12', 'Atlantic Coast', 'Pac-12'];

/* every FBS team's season totals: Map tid -> { cat: { stat: value }, 'cat#2': opponents } */
async function cfbTeamStats(season) {
  const j = await getJSON(`${espnWeb()}/statistics/byteam?${ESPN_Q}&season=${season}&seasontype=2&limit=400`);
  const m = new Map();
  for (const t of j.teams || []) m.set(t.team.id, { id: t.team.id, v: espnNamedCats(j.categories, t.categories) });
  return m;
}

/* ---- players: leaderboard members plus each one's own season line from ESPN's core API ---- */
const CFB_CORE = 'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football';
const CFB_LEAD = { passingYards: 'qb', rushingYards: 'rb', receivingYards: 'wr', totalTackles: 'df', sacks: 'df', interceptions: 'df' };
const CFB_KEEP = {
  general: 'gamesPlayed', passing: 'completions passingAttempts completionPct passingYards passingYardsPerGame yardsPerPassAttempt yardsPerCompletion passingTouchdowns interceptions passingTouchdownPct interceptionPct QBRating sacks sackYardsLost longPassing passingFirstDowns passingBigPlays totalYardsFromScrimmage',
  rushing: 'rushingAttempts rushingYards rushingYardsPerGame yardsPerRushAttempt rushingTouchdowns longRushing rushingFirstDowns rushingBigPlays rushingFumbles rushingFumblesLost yardsFromScrimmagePerGame totalYardsFromScrimmage',
  receiving: 'receptions receivingTargets receivingYards receivingYardsPerGame yardsPerReception receivingTouchdowns longReception receivingYardsAfterCatch receivingFirstDowns receivingBigPlays receivingFumbles yardsFromScrimmagePerGame totalYardsFromScrimmage',
  defensive: 'soloTackles assistTackles totalTackles tacklesForLoss stuffs sacks QBHits hurries passesDefended safeties kicksBlocked',
  defensiveInterceptions: 'interceptions interceptionYards interceptionTouchdowns',
};
const CFB_KEEPSET = Object.fromEntries(Object.entries(CFB_KEEP).map(([k, v]) => [k, new Set(v.split(' '))]));
const cfbRefId = (u, k) => { const m = new RegExp(`/${k}/(\\d+)`).exec(u || ''); return m ? +m[1] : 0; };

async function cfbPlayers(season) {
  const base = `${CFB_CORE}/seasons/${season}`, q = 'lang=en&region=us';
  const L = await getJSON(`${base}/types/2/leaders?limit=100&${q}`);
  const want = new Map();
  for (const c of L.categories || []) {
    const g = CFB_LEAD[c.name]; if (!g) continue;
    for (const l of c.leaders || []) { const id = cfbRefId(l.athlete?.$ref, 'athletes'); if (!id) continue; if (!want.has(id)) want.set(id, new Set()); want.get(id).add(g); }
  }
  const posCache = new Map(), out = [];
  const posOf = async ref => {
    const pid = cfbRefId(ref, 'positions'); if (!pid) return '';
    if (!posCache.has(pid)) posCache.set(pid, getJSON(`${CFB_CORE}/positions/${pid}?${q}`).then(j => j.abbreviation || '').catch(() => ''));
    return posCache.get(pid);
  };
  await pool([...want.keys()], 10, async id => {
    try {
      const [a, st] = await Promise.all([getJSON(`${base}/athletes/${id}?${q}`), getJSON(`${base}/types/2/athletes/${id}/statistics/0?${q}`)]);
      const v = {};
      for (const c of st.splits?.categories || []) { const keep = CFB_KEEPSET[c.name]; if (!keep) continue; const o = v[c.name] = {}; for (const s of c.stats || []) if (keep.has(s.name)) o[s.name] = s.value; }
      out.push({ id, name: a.displayName || a.fullName, tid: cfbRefId(a.team?.$ref, 'teams'), pos: await posOf(a.position?.$ref), jersey: a.jersey || '', h: a.displayHeight || '', w: a.displayWeight || '', exp: a.experience?.abbreviation || (typeof a.experience === 'string' ? a.experience : ''), g: [...want.get(id)], v });
    } catch (e) { /* a player without a season line is simply left out */ }
  });
  return out;
}
/* one flat row per player; stat keys are unique across roles so a player in several lists keeps one row */
function cfbPlayerRow(r) {
  const g = r.v.general || {}, p = r.v.passing || {}, ru = r.v.rushing || {}, rc = r.v.receiving || {}, d = r.v.defensive || {}, di = r.v.defensiveInterceptions || {};
  const gp = g.gamesPlayed, att = p.passingAttempts;
  const tdt = (ru.rushingTouchdowns || 0) + (rc.receivingTouchdowns || 0);
  return {
    id: r.id, name: r.name, tid: r.tid, pos: r.pos, jersey: r.jersey, h: r.h, wt: r.w, exp: r.exp, nt: 1, gp, grp: r.g,
    cmp: p.completions, att, cmpp: p.completionPct, pyds: p.passingYards, pypg: p.passingYardsPerGame, ypa: p.yardsPerPassAttempt, ypcm: p.yardsPerCompletion, ptd: p.passingTouchdowns, pint: p.interceptions,
    tdp: p.passingTouchdownPct, intp: p.interceptionPct, rtg: p.QBRating, sckd: p.sacks, sckyl: p.sackYardsLost, plng: p.longPassing, p1d: p.passingFirstDowns, pbig: p.passingBigPlays,
    ratt: ru.rushingAttempts, ryds: ru.rushingYards, rypg: ru.rushingYardsPerGame, ypc: ru.yardsPerRushAttempt, rtd: ru.rushingTouchdowns, rlng: ru.longRushing, r1d: ru.rushingFirstDowns, rbig: ru.rushingBigPlays, rfum: ru.rushingFumbles, rfuml: ru.rushingFumblesLost,
    tgt: rc.receivingTargets, rec: rc.receptions, recyds: rc.receivingYards, recpg: rc.receivingYardsPerGame, ypr: rc.yardsPerReception, rctd: rc.receivingTouchdowns, lrec: rc.longReception, yac: rc.receivingYardsAfterCatch, c1d: rc.receivingFirstDowns, cbig: rc.receivingBigPlays, cfum: rc.receivingFumbles,
    catchp: pctOf(rc.receptions, rc.receivingTargets), ypt: safeDiv(rc.receivingYards, rc.receivingTargets), recpg2: safeDiv(rc.receptions, gp),
    scrim: rc.totalYardsFromScrimmage ?? ru.totalYardsFromScrimmage ?? (ru.rushingYards || 0) + (rc.receivingYards || 0), scrimpg: ru.yardsFromScrimmagePerGame ?? rc.yardsFromScrimmagePerGame, tdt,
    solo: d.soloTackles, ast: d.assistTackles, tot: d.totalTackles, tpg: safeDiv(d.totalTackles, gp), tfl: d.tacklesForLoss, stf: d.stuffs, sck: d.sacks, sckpg: safeDiv(d.sacks, gp), qbh: d.QBHits, hur: d.hurries, pd: d.passesDefended, saf: d.safeties, kb: d.kicksBlocked,
    int: di.interceptions, intyd: di.interceptionYards, inttd: di.interceptionTouchdowns,
  };
}

async function loadSeason(season, prog = () => { }) {
  const ttl = ttlFor(season), D = { season, warn: [], pct: {} };
  const T = { team: [true, () => cfbTeamStats(season)], stand: [true, () => espnTypedStandings(season)] };
  const names = Object.keys(T), res = {}; let done = 0;
  await Promise.all(names.map(async n => {
    try { res[n] = await cached(`${season}:${n}`, ttl, T[n][1]); } catch (e) { res[n] = null; res[n + '_err'] = e; }
    prog(++done / names.length, n);
  }));
  for (const n of names) if (T[n][0] && !res[n]) throw new Error(`Could not load ${n} from ESPN (${res[n + '_err']?.message || 'network'}).`);
  if (!res.team.size) throw new Error(`ESPN has no college football team stats for ${SPORT.seasons.label(season)} yet.`);

  const rows = res.stand.filter(r => res.team.has(r.id));
  if (rows.length < res.stand.length) D.warn.push(`${res.stand.length - rows.length} teams without stats were left out.`);
  /* team colors and logos come with the standings' team objects only; the scoreboard fills in more later */
  buildTeamsAndStandings(D, rows, new Map(), {
    lgName: r => r.conf,
    divName: r => r.div ? `${r.conf} ${r.div}` : r.conf,
    stand: r => {
      const s = r.s, d = r.d, [w, l, t] = cfbRec(d.total), [cw, cl] = cfbRec(d.vsconf), gp = w + l + t;
      return { w, l, t, gp, pct: safeDiv(w + t / 2, gp), cw, cl, cpct: safeDiv(cw, cw + cl), rs: s.pointsfor, ra: s.pointsagainst, rdiff: s.pointdifferential, ppg: safeDiv(s.pointsfor, gp), oppg: safeDiv(s.pointsagainst, gp), diff: safeDiv(s.pointdifferential, gp),
        streak: d.streak || '', home: d.homerecord || '', road: d.awayrecord || '', top25: d.vsaprankedteams || '', conf: d.vsconf || '', pf: s.pointsfor, pa: s.pointsagainst };
    },
  });
  SPORT.standings.divOrder = [...new Set([...D.teams.values()].map(t => t.div))].sort((a, b) => (CFB_POWER.indexOf(a.split(' ')[0]) + 99) % 99 - (CFB_POWER.indexOf(b.split(' ')[0]) + 99) % 99 || a.localeCompare(b));
  SPORT.teamFilters = [...new Set([...D.teams.values()].map(t => t.lg))].sort((a, b) => (CFB_POWER.indexOf(a) + 99) % 99 - (CFB_POWER.indexOf(b) + 99) % 99 || a.localeCompare(b)).map(c => [c, c]);
  const byConf = new Map(); for (const t of D.teams.values()) { if (!byConf.has(t.div)) byConf.set(t.div, []); byConf.get(t.div).push(t); }
  for (const arr of byConf.values()) arr.sort((a, b) => D.stand.get(b.id).cpct - D.stand.get(a.id).cpct || D.stand.get(b.id).pct - D.stand.get(a.id).pct).forEach((t, i) => D.stand.get(t.id).dr = i + 1);
  /* the regular season ends in early December and bowls follow, so a past season is final and the current one is final from mid December */
  D.final = season < SPORT.seasons.current || new Date() >= new Date(season, 11, 14);
  D.stage = 'REGULAR SEASON';

  const tk = new Map();
  for (const [sid, t] of res.team) {
    const id = +sid, st = D.stand.get(id); if (!st) continue;
    const g = t.v.general || {}, ps = t.v.passing || {}, ru = t.v.rushing || {}, ki = t.v.kicking || {}, rt = t.v.returning || {}, pu = t.v.punting || {}, ms = t.v.miscellaneous || {};
    const g2 = t.v['general#2'] || {}, ps2 = t.v['passing#2'] || {}, ru2 = t.v['rushing#2'] || {}, ms2 = t.v['miscellaneous#2'] || {};
    const gp = g.gamesPlayed || st.gp, plays = ps.passingAttempts + ru.rushingAttempts + ps.sacks, plays2 = ps2.passingAttempts + ru2.rushingAttempts + ps2.sacks;
    const giv = (ps.interceptions || 0) + (g2.fumblesRecovered || 0), tak = (ps2.interceptions || 0) + (g.fumblesRecovered || 0);
    tk.set(id, {
      id, gp, w: st.w, l: st.l, t: st.t, pct: st.pct, diff: st.diff,
      ppg: st.ppg, ypg: ps.yardsPerGame ?? safeDiv(ps.totalYards, gp), ypp: safeDiv(ps.passingYards + ru.rushingYards, plays), plg: safeDiv(plays, gp),
      pyg: ps.passingYardsPerGame, cmpp: ps.completionPct, ypa: ps.yardsPerPassAttempt, ptd: ps.passingTouchdowns, pint: ps.interceptions, rtg: ps.QBRating, sckt: ps.sacks,
      ryg: ru.rushingYardsPerGame, ratt: safeDiv(ru.rushingAttempts, gp), ypc: ru.yardsPerRushAttempt, rtd: ru.rushingTouchdowns, rlng: ru.longRushing,
      fdg: safeDiv(ms.firstDowns, gp), thp: ms.thirdDownConvPct, fop: ms.fourthDownConvPct, give: giv, fuml: g2.fumblesRecovered,
      pag: st.oppg, pa: st.pa, oypg: ps2.yardsPerGame ?? safeDiv(ps2.totalYards, gp), oypp: safeDiv(ps2.passingYards + ru2.rushingYards, plays2),
      opyg: ps2.passingYardsPerGame, ocmpp: ps2.completionPct, oypa: ps2.yardsPerPassAttempt, optd: ps2.passingTouchdowns, ortg: ps2.QBRating,
      oryg: ru2.rushingYardsPerGame, oypc: ru2.yardsPerRushAttempt, ortd: ru2.rushingTouchdowns, othp: ms2.thirdDownConvPct,
      sck: ps2.sacks, sckg: safeDiv(ps2.sacks, gp), sckp: pctOf(ps2.sacks, ps2.passingAttempts + ps2.sacks),
      int: ps2.interceptions, fr: g.fumblesRecovered, take: tak, takeg: safeDiv(tak, gp), tod: tak - giv,
      fgm: ki.fieldGoalsMade, fga: ki.fieldGoalAttempts, fgp: ki.fieldGoalPct, f50: ki.fieldGoalsMade50, xpp: ki.extraPointPct, klng: ki.longFieldGoalMade,
      punts: pu.punts, pavg: pu.grossAvgPuntYards, pnet: pu.netAvgPuntYards, krav: rt.yardsPerKickReturn, prav: rt.yardsPerPuntReturn, retd: (rt.kickReturnTouchdowns || 0) + (rt.puntReturnTouchdowns || 0),
      penpg: safeDiv(ms.totalPenalties, gp), penyg: safeDiv(ms.totalPenaltyYards, gp),
    });
  }
  D.tof = D.tdf = D.tsp = tk; D.tofList = D.tdfList = D.tspList = [...tk.values()];
  /* players: the leaderboard pool; a failure leaves the team pages working */
  let raw = [];
  try { raw = await cached(`${season}:pl`, ttl, () => cfbPlayers(season)); } catch (e) { D.warn.push('Player stats did not load; only team pages are available.'); }
  const PG = ['qb', 'rb', 'wr', 'df'], pm = Object.fromEntries(PG.map(g => [g, new Map()])), all = new Map();
  for (const r of raw) {
    if (!D.teams.has(r.tid)) continue;
    const m = cfbPlayerRow(r); all.set(m.id, m);
    for (const g of m.grp) pm[g].set(m.id, m);
  }
  D.q = {}; D.pl = all; D.plList = [...all.values()];
  D.players = new Map(); for (const m of all.values()) D.players.set(m.id, { id: m.id, name: m.name, tid: m.tid, pos: m.pos, w: m.pyds || m.ryds || m.recyds || m.tot || 0, key: slugify(m.name) });
  D.maps = { ...pm, tof: tk, tdf: tk, tsp: tk }; D.lists = { ...Object.fromEntries(PG.map(g => [g, [...pm[g].values()]])), tof: D.tofList, tdf: D.tdfList, tsp: D.tspList };
  for (const g of [...PG, 'tof', 'tdf', 'tsp']) buildPct(D, g);
  return D;
}
