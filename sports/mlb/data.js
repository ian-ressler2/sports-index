/* data.js: season loading, merging, percentiles */
const API = 'https://statsapi.mlb.com/api/v1', SAV = 'https://baseballsavant.mlb.com';
const NOW = new Date();
const CUR_SEASON = NOW.getMonth() >= 2 ? NOW.getFullYear() : NOW.getFullYear() - 1;
const FIRST_SEASON = 2015;

const SAV_BAT_SEL = 'player_age,pa,xba,xslg,woba,xwoba,xobp,xiso,wobacon,xwobacon,exit_velocity_avg,launch_angle_avg,sweet_spot_percent,barrel_batted_rate,hard_hit_percent,avg_best_speed,whiff_percent,swing_percent,avg_swing_speed,fast_swing_rate,squared_up_contact,groundballs_percent,flyballs_percent,linedrives_percent,popups_percent,pull_percent,straightaway_percent,opposite_percent,z_swing_percent,oz_swing_percent,oz_contact_percent,iz_contact_percent,in_zone_percent,edge_percent,meatball_swing_percent,sprint_speed';
const SAV_PIT_SEL = 'player_age,pa,xba,xslg,woba,xwoba,wobacon,xwobacon,xera,exit_velocity_avg,launch_angle_avg,sweet_spot_percent,barrel_batted_rate,hard_hit_percent,whiff_percent,swing_percent,groundballs_percent,flyballs_percent,linedrives_percent,popups_percent,pull_percent,straightaway_percent,opposite_percent,z_swing_percent,oz_swing_percent,oz_contact_percent,iz_contact_percent,in_zone_percent,edge_percent,f_strike_percent';
const SAV_MAP = {
  xba: 'xba', xslg: 'xslg', xwoba: 'xwoba', xobp: 'xobp', xiso: 'xiso', xwobacon: 'xwobacon', xera: 'xera', sav_woba: 'woba',
  ev: 'exit_velocity_avg', evb: 'avg_best_speed', la: 'launch_angle_avg', sweet: 'sweet_spot_percent', brl: 'barrel_batted_rate', hh: 'hard_hit_percent',
  whiff: 'whiff_percent', swing: 'swing_percent', zswing: 'z_swing_percent', oswing: 'oz_swing_percent', izcon: 'iz_contact_percent', occon: 'oz_contact_percent',
  zone: 'in_zone_percent', edge: 'edge_percent', meat: 'meatball_swing_percent', fstrike: 'f_strike_percent',
  gb: 'groundballs_percent', ld: 'linedrives_percent', fb: 'flyballs_percent', pu: 'popups_percent', pull: 'pull_percent', straight: 'straightaway_percent', oppo: 'opposite_percent',
  bs_c: 'avg_swing_speed', fast_c: 'fast_swing_rate', spr: 'sprint_speed',
};

function ensureNum(o) { for (const k in o) if (typeof o[k] === 'string' && k !== 'name') { const n = num(o[k]); if (isFinite(n)) o[k] = n; } return o; }

function mapBatApi(s) {
  const st = s.stat, pa = st.plateAppearances;
  const r = {
    id: s.player.id, name: s.player.fullName, tid: s.team?.id, pos: s.position?.abbreviation || '', age: st.age,
    g: st.gamesPlayed, pa, ab: st.atBats, h: st.hits, d2: st.doubles, d3: st.triples, hr: st.homeRuns, r: st.runs, rbi: st.rbi, bb: st.baseOnBalls, so: st.strikeOuts,
    hbp: st.hitByPitch, sb: st.stolenBases, cs: st.caughtStealing, sf: st.sacFlies, tb: st.totalBases,
    avg: num(st.avg), obp: num(st.obp), slg: num(st.slg), ops: num(st.ops), babip: num(st.babip), nt: s.numTeams || 1,
  };
  r.iso = r.slg - r.avg; r.kp = pa ? r.so / pa * 100 : NaN; r.bbp = pa ? r.bb / pa * 100 : NaN;
  return r;
}
function mapPitApi(s) {
  const st = s.stat, bf = st.battersFaced;
  const r = {
    id: s.player.id, name: s.player.fullName, tid: s.team?.id, pos: s.position?.abbreviation || 'P', age: st.age,
    g: st.gamesPlayed, gs: st.gamesStarted, ipn: ipToNum(st.inningsPitched), w: st.wins, l: st.losses, sv: st.saves, hld: st.holds, bf,
    h: st.hits, r: st.runs, er: st.earnedRuns, hr: st.homeRuns, bb: st.baseOnBalls, so: st.strikeOuts, hbp: st.hitByPitch, np: st.numberOfPitches, ab: st.atBats, sf: st.sacFlies,
    era: num(st.era), whip: num(st.whip), avg: num(st.avg), obp: num(st.obp), slg: num(st.slg), ops: num(st.ops),
    k9: num(st.strikeoutsPer9Inn), bb9: num(st.walksPer9Inn), hr9: num(st.homeRunsPer9), nt: s.numTeams || 1,
  };
  r.kp = bf ? r.so / bf * 100 : NaN; r.bbp = bf ? r.bb / bf * 100 : NaN; r.kbb = r.kp - r.bbp;
  const den = r.ab - r.so - r.hr + (r.sf || 0); r.babip = den > 0 ? (r.h - r.hr) / den : NaN;
  const lobd = r.h + r.bb + (r.hbp || 0) - 1.4 * r.hr; r.lob = lobd > 0 ? (r.h + r.bb + (r.hbp || 0) - r.r) / lobd * 100 : NaN;
  return r;
}
function mapTeamBat(s) {
  const st = s.stat, pa = st.plateAppearances;
  const r = { id: s.team.id, g: st.gamesPlayed, pa, ab: st.atBats, r: st.runs, h: st.hits, d2: st.doubles, d3: st.triples, hr: st.homeRuns, rbi: st.rbi, bb: st.baseOnBalls, so: st.strikeOuts, sb: st.stolenBases, cs: st.caughtStealing, hbp: st.hitByPitch, sf: st.sacFlies,
    avg: num(st.avg), obp: num(st.obp), slg: num(st.slg), ops: num(st.ops), babip: num(st.babip) };
  r.iso = r.slg - r.avg; r.rpg = r.r / r.g; r.kp = r.so / pa * 100; r.bbp = r.bb / pa * 100;
  return r;
}
function mapTeamPit(s) {
  const st = s.stat, bf = st.battersFaced;
  const r = { id: s.team.id, g: st.gamesPlayed, ipn: ipToNum(st.inningsPitched), sv: st.saves, h: st.hits, r: st.runs, er: st.earnedRuns, hr: st.homeRuns, bb: st.baseOnBalls, so: st.strikeOuts, hbp: st.hitByPitch, bf, ab: st.atBats, sf: st.sacFlies,
    era: num(st.era), whip: num(st.whip), avg: num(st.avg), obp: num(st.obp), slg: num(st.slg), ops: num(st.ops), k9: num(st.strikeoutsPer9Inn), bb9: num(st.walksPer9Inn), hr9: num(st.homeRunsPer9) };
  r.rapg = r.r / r.g; r.kp = r.so / bf * 100; r.bbp = r.bb / bf * 100; r.kbb = r.kp - r.bbp;
  const den = r.ab - r.so - r.hr + (r.sf || 0); r.babip = den > 0 ? (r.h - r.hr) / den : NaN;
  const lobd = r.h + r.bb + (r.hbp || 0) - 1.4 * r.hr; r.lob = (r.h + r.bb + (r.hbp || 0) - r.r) / lobd * 100;
  return r;
}

async function loadSeason(season, prog = () => { }) {
  const ttl = ttlFor(season), D = { season, warn: [], pct: {}, bbBat: new Map(), bbPit: new Map() };
  const st = (g, extra = '') => `${API}/stats?stats=${extra || 'season'}&group=${g}&playerPool=all&sportId=1&season=${season}&gameType=R&limit=3000`;
  const sv = path => `${SAV}/leaderboard/${path}`;
  const T = {
    teams: [true, () => getJSON(`${API}/teams?sportId=1&season=${season}`)],
    standings: [true, () => getJSON(`${API}/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason&hydrate=team`)],
    tbat: [true, () => getJSON(`${API}/teams/stats?stats=season&group=hitting&season=${season}&sportId=1&gameType=R`)],
    tpit: [true, () => getJSON(`${API}/teams/stats?stats=season&group=pitching&season=${season}&sportId=1&gameType=R`)],
    bat: [true, () => getJSON(st('hitting'))],
    pit: [true, () => getJSON(st('pitching'))],
    batSab: [false, () => getJSON(st('hitting', 'sabermetrics'))],
    pitSab: [false, () => getJSON(st('pitching', 'sabermetrics'))],
    sBat: [false, () => getCSV(sv(`custom?year=${season}&type=batter&filter=&min=1&selections=${SAV_BAT_SEL}&csv=true`))],
    sPit: [false, () => getCSV(sv(`custom?year=${season}&type=pitcher&filter=&min=1&selections=${SAV_PIT_SEL}&csv=true`))],
    track: [false, () => getCSV(sv(`bat-tracking?attackZone=&batSide=&contactType=&count=&dateStart=${season}-03-01&dateEnd=${season}-11-30&gameType=Regular&isHardHit=&minSwings=1&pitchHand=&pitchType=&seasonStart=${season}&seasonEnd=${season}&team=&type=batter&csv=true`))],
    sprint: [false, () => getCSV(sv(`sprint_speed?min=10&year=${season}&position=&team=&csv=true`))],
    oaa: [false, () => getCSV(sv(`outs_above_average?type=Fielder&startYear=${season}&endYear=${season}&split=no&team=&range=year&min=1&pos=&roles=&viz=hide&csv=true`))],
    speeds: [false, () => getCSV(sv(`pitch-arsenals?year=${season}&min=50&type=avg_speed&hand=&csv=true`))],
    bbB: [false, () => getCSV(sv(`batted-ball?type=batter&year=${season}&min=10&csv=true`))],
    bbP: [false, () => getCSV(sv(`batted-ball?type=pitcher&year=${season}&min=10&csv=true`))],
  };
  const names = Object.keys(T), res = {}; let done = 0;
  await Promise.all(names.map(async n => {
    try { res[n] = await cached(`${season}:${n}`, ttl, T[n][1]); }
    catch (e) { res[n] = null; if (T[n][0]) res[n + '_err'] = e; else D.warn.push(n); }
    prog(++done / names.length, n);
  }));
  for (const n of names) if (T[n][0] && !res[n]) throw new Error(`Could not load ${n} from the MLB Stats API (${res[n + '_err']?.message || 'network'}).`);

  /* teams */
  D.teams = new Map(); D.teamByName = new Map();
  for (const t of res.teams.teams) {
    const lg = t.league?.name === 'American League' ? 'AL' : 'NL';
    const dv = (t.division?.name || '').replace('American League', 'AL').replace('National League', 'NL');
    const o = { id: t.id, name: t.name, abbr: t.abbreviation, short: t.teamName, loc: t.locationName, lg, div: dv, venue: t.venue?.name, color: tcol(t.id) };
    D.teams.set(t.id, o); D.teamByName.set(t.teamName, o);
  }
  /* standings */
  D.stand = new Map();
  for (const rec of res.standings.records) for (const tr of rec.teamRecords) {
    const sp = {}; (tr.records?.splitRecords || []).forEach(x => sp[x.type] = `${x.wins}-${x.losses}`);
    const rs = tr.runsScored, ra = tr.runsAllowed;
    D.stand.set(tr.team.id, { id: tr.team.id, w: tr.wins, l: tr.losses, pct: num(tr.winningPercentage), gp: tr.gamesPlayed, rs, ra, rdiff: tr.runDifferential, streak: tr.streak?.streakCode || '', dr: +tr.divisionRank, lr: +tr.leagueRank, gb: tr.gamesBack, clinched: tr.clinched, divChamp: tr.divisionChamp, wcRank: tr.wildCardRank, split: sp, pyth: Math.pow(rs, 1.83) / (Math.pow(rs, 1.83) + Math.pow(ra, 1.83)), divName: rec.division?.id });
  }
  D.maxG = Math.max(...[...D.stand.values()].map(s => s.gp), 1);
  D.final = season < CUR_SEASON || [...D.stand.values()].every(s => s.gp >= 162);
  D.q = { bat: Math.floor(3.1 * D.maxG), pit: D.maxG };

  /* players */
  const bat = new Map(), pit = new Map();
  for (const s of res.bat.stats[0].splits) { if (!s.player?.id || !s.stat.plateAppearances) continue; bat.set(s.player.id, mapBatApi(s)); }
  for (const s of res.pit.stats[0].splits) { if (!s.player?.id || !s.stat.battersFaced) continue; pit.set(s.player.id, mapPitApi(s)); }
  const sab = (obj, map, fn) => { const sp = obj?.stats?.[0]?.splits; if (!sp) return; for (const s of sp) { const r = map.get(s.player.id); if (r) fn(r, s.stat); } };
  sab(res.batSab, bat, (r, x) => { r.woba = num(x.woba); r.wrcp = num(x.wRcPlus); r.wraa = num(x.wRaa); r.war = num(x.war); r.batr = num(x.batting); r.bsr = num(x.baseRunning); r.fldr = num(x.fielding); });
  sab(res.pitSab, pit, (r, x) => { r.fip = num(x.fip); r.xfip = num(x.xfip); r.fipm = num(x.fipMinus); r.eram = num(x.eraMinus); r.war = num(x.war); r.ra9w = num(x.ra9War); });
  const savMerge = (rows, map, kind) => {
    if (!rows) return;
    for (const o of rows) {
      const r = map.get(+o.player_id); if (!r) continue;
      for (const k in SAV_MAP) { const v = num(o[SAV_MAP[k]]); if (isFinite(v)) r[k] = v; }
      if (kind === 'bat') { if (isFinite(r.bs_c)) r.bs = r.bs_c; if (isFinite(r.fast_c)) r.fast = r.fast_c; const v = num(o.squared_up_contact); if (isFinite(v)) r.sq = v; }
      if (isFinite(r.sav_woba) && !isFinite(r.woba)) r.woba = r.sav_woba;
      if (isFinite(r.xwoba) && isFinite(r.sav_woba)) r.wdiff = r.sav_woba - r.xwoba; else if (isFinite(r.xwoba) && isFinite(r.woba)) r.wdiff = r.woba - r.xwoba;
    }
  };
  savMerge(res.sBat, bat, 'bat'); savMerge(res.sPit, pit, 'pit');
  if (res.track) for (const o of res.track) { const r = bat.get(+o.id); if (!r) continue; const bs = num(o.avg_bat_speed); if (isFinite(bs)) r.bs = bs; r.fast = num(o.hard_swing_rate) * 100; r.sq = num(o.squared_up_per_bat_contact) * 100; r.blast = num(o.blast_per_bat_contact) * 100; r.sl = num(o.swing_length); r.swings = num(o.swings_competitive); }
  if (res.sprint) for (const o of res.sprint) { const r = bat.get(+o.player_id); if (!r) continue; const v = num(o.sprint_speed); if (isFinite(v)) r.spr = v; r.bolts = num(o.bolts); }
  const teamOaa = new Map();
  if (res.oaa) for (const o of res.oaa) {
    const id = +o.player_id, oaa = num(o.outs_above_average), frp = num(o.fielding_runs_prevented), r = bat.get(id);
    if (r) { r.oaa = (r.oaa || 0) + (isFinite(oaa) ? oaa : 0); r.frp = (r.frp || 0) + (isFinite(frp) ? frp : 0); r.fpos = o.primary_pos_formatted; }
    const t = D.teamByName.get(o.display_team_name);
    if (t) { const c = teamOaa.get(t.id) || { oaa: 0, frp: 0 }; c.oaa += isFinite(oaa) ? oaa : 0; c.frp += isFinite(frp) ? frp : 0; teamOaa.set(t.id, c); }
  }
  if (res.speeds) for (const o of res.speeds) { const r = pit.get(+o.pitcher); if (!r) continue; const v = num(o.ff_avg_speed), s = num(o.si_avg_speed), c = num(o.fc_avg_speed); r.fbv = isFinite(v) ? v : isFinite(s) ? s : c; for (const k of ['ff', 'si', 'fc', 'sl', 'ch', 'cu', 'fs', 'st', 'sv', 'kn']) { const x = num(o[k + '_avg_speed']); if (isFinite(x)) (r.speeds ||= {})[k.toUpperCase()] = x; } }
  const bbMap = (rows, into) => { if (!rows) return; for (const o of rows) { const id = +o.id; if (!id) continue; into.set(id, { id, name: o.name, bbe: num(o.bbe), gb: num(o.gb_rate), air: num(o.air_rate), pgb: num(o.pull_gb_rate), sgb: num(o.straight_gb_rate), ogb: num(o.oppo_gb_rate), pair: num(o.pull_air_rate), sair: num(o.straight_air_rate), oair: num(o.oppo_air_rate) }); } };
  bbMap(res.bbB, D.bbBat); bbMap(res.bbP, D.bbPit);

  D.bat = bat; D.pit = pit; D.batList = [...bat.values()]; D.pitList = [...pit.values()];
  D.players = new Map();
  for (const r of D.batList) D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: r.pos, bat: true, pit: false, pa: r.pa });
  for (const r of D.pitList) { const p = D.players.get(r.id); if (p) { p.pit = true; if (r.bf > p.pa) { p.pos = 'TWP'; } } else D.players.set(r.id, { id: r.id, name: r.name, tid: r.tid, pos: r.pos || 'P', bat: false, pit: true, pa: 0 }); }
  for (const p of D.players.values()) { if (p.bat && p.pit) p.pos = 'TWP'; p.key = slugify(p.name); p.w = (p.pa || 0) + (D.pit.get(p.id)?.bf || 0); }

  /* teams: merge */
  const tb = new Map(), tp = new Map();
  for (const s of res.tbat.stats[0].splits) tb.set(s.team.id, mapTeamBat(s));
  for (const s of res.tpit.stats[0].splits) tp.set(s.team.id, mapTeamPit(s));
  const lg = { hr: 0, bb: 0, hbp: 0, so: 0, ip: 0, er: 0 };
  for (const r of tp.values()) { lg.hr += r.hr; lg.bb += r.bb; lg.hbp += r.hbp || 0; lg.so += r.so; lg.ip += r.ipn; lg.er += r.er; }
  const cFIP = (lg.er * 9 / lg.ip) - (13 * lg.hr + 3 * (lg.bb + lg.hbp) - 2 * lg.so) / lg.ip;
  for (const [id, r] of tb) { const s = D.stand.get(id); if (s) Object.assign(r, { w: s.w, l: s.l, pct: s.pct, rs: s.rs, ra: s.ra, rdiff: s.rdiff, pyth: s.pyth }); }
  for (const [id, r] of tp) {
    const s = D.stand.get(id); if (s) Object.assign(r, { w: s.w, l: s.l, pct: s.pct, rs: s.rs, ra: s.ra, rdiff: s.rdiff, pyth: s.pyth });
    r.fip = (13 * r.hr + 3 * (r.bb + (r.hbp || 0)) - 2 * r.so) / r.ipn + cFIP;
    const o = teamOaa.get(id); if (o) { r.oaa = o.oaa; r.frp = o.frp; }
  }
  const byTeam = (list) => { const m = new Map(); for (const r of list) { if (!m.has(r.tid)) m.set(r.tid, []); m.get(r.tid).push(r); } return m; };
  const bt = byTeam(D.batList), pt = byTeam(D.pitList);
  for (const [id, r] of tb) { const rows = bt.get(id) || []; for (const k of ['xwoba', 'ev', 'brl', 'hh', 'whiff', 'oswing', 'bs', 'spr']) r[k] = wmean(rows, k, 'pa'); }
  for (const [id, r] of tp) { const rows = pt.get(id) || []; for (const k of ['xwoba', 'ev', 'brl', 'hh', 'whiff', 'oswing']) r[k] = wmean(rows, k, 'bf'); r.fbv = wmean(rows, 'fbv', 'bf'); r.xera = wmean(rows, 'xera', 'bf'); }
  D.tbat = tb; D.tpit = tp; D.tbatList = [...tb.values()]; D.tpitList = [...tp.values()];
  D.maps = { bat, pit, tbat: tb, tpit: tp }; D.lists = { bat: D.batList, pit: D.pitList, tbat: D.tbatList, tpit: D.tpitList };
  for (const g of ['bat', 'pit', 'tbat', 'tpit']) buildPct(D, g);
  return D;
}

/* league-wide situational splits (standard stats only) */
async function loadSituation(D, g, code) {
  const grp = g === 'bat' ? 'hitting' : 'pitching';
  const j = await cached(`${D.season}:sit:${g}:${code}`, ttlFor(D.season), () => getJSON(`${API}/stats?stats=statSplits&sitCodes=${code}&group=${grp}&playerPool=all&sportId=1&season=${D.season}&gameType=R&limit=3000`));
  const out = [];
  for (const s of (j.stats?.[0]?.splits || [])) {
    if (!s.player?.id) continue;
    const base = (g === 'bat' ? mapBatApi : mapPitApi)(s);
    const own = (g === 'bat' ? D.bat : D.pit).get(base.id);
    if (!own) continue;
    if (g === 'bat' ? !base.pa : !base.bf) continue;
    base.tid = own.tid; base.pos = own.pos;
    out.push(base);
  }
  return out;
}
