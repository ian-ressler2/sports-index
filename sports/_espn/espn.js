/* espn.js: shared adapter for ESPN's public JSON feeds (NHL, NBA and NFL sites).
   ESPN `season` is the year the season ends for NHL/NBA and the year it starts for NFL.
   Only the lean fields we use are kept, so cached copies stay small. */
const ESPN = { sp: '', lg: '', sbq: '', st: 2 };  /* sbq: extra scoreboard parameters, such as the college divisions to include; st: season type for team schedules (soccer feeds have no type 2, so soccer sets it to 0 for none) */
const espnWeb = () => `https://site.web.api.espn.com/apis/common/v3/sports/${ESPN.sp}/${ESPN.lg}`;
const espnSite = () => `https://site.web.api.espn.com/apis/site/v2/sports/${ESPN.sp}/${ESPN.lg}`;
const espnApi2 = () => `https://site.api.espn.com/apis/v2/sports/${ESPN.sp}/${ESPN.lg}`;
const ESPN_Q = 'region=us&lang=en&contentorigin=espn';

/* { cat: { statName: value } } from a categories array, using the header's names.
   Some feeds (NBA team stats) repeat a category: the second copy holds the opponents' numbers and is stored as "name#2". */
function espnCats(headCats, rowCats) {
  const named = {}; for (const c of headCats || []) if (c.names?.length && !named[c.name]) named[c.name] = c.names;
  const out = {}, seen = {};
  (rowCats || []).forEach((c, i) => {
    const ns = headCats?.[i]?.names?.length ? headCats[i].names : (named[c.name] || []);
    const n = seen[c.name] = (seen[c.name] || 0) + 1, key = n > 1 ? `${c.name}#${n}` : c.name, o = out[key] || (out[key] = {});
    (c.values || []).forEach((v, k) => { if (ns[k] != null && (o[ns[k]] == null || v != null)) o[ns[k]] = v; });
  });
  return out;
}
const espnLogo = t => { const l = (t.logos || []).find(x => (x.rel || []).includes('default')) || (t.logos || [])[0]; return l ? l.href : ''; };

/* every athlete with season totals, paged 1000 at a time. Returns { rows:[{id,name,pos,tid,abbr,age,v}], teams: Map } */
async function espnAthletes(season, type = 2) {
  const url = p => `${espnWeb()}/statistics/byathlete?${ESPN_Q}&isqualified=false&season=${season}&seasontype=${type}&limit=1000&page=${p}`;
  const first = await getJSON(url(1));
  const pages = first.pagination?.pages || 1;
  const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => getJSON(url(i + 2))));
  const rows = [], teams = new Map();
  for (const j of [first, ...rest]) for (const x of j.athletes || []) {
    const a = x.athlete; if (!a) continue;
    const tm = (a.teams || []).slice(-1)[0];
    if (tm && !teams.has(tm.id)) teams.set(tm.id, { id: tm.id, abbr: tm.abbreviation, name: tm.displayName, short: tm.name, color: tm.color ? '#' + tm.color : '', alt: tm.alternateColor ? '#' + tm.alternateColor : '', logo: espnLogo(tm) });
    /* the current season lists the team as flat teamId/teamShortName fields instead of a teams array */
    const tid = tm ? tm.id : a.teamId || '';
    if (!tm && tid && !teams.has(tid)) teams.set(tid, { id: tid, abbr: a.teamShortName || '', name: a.teamName || a.teamShortName || '', short: a.teamName || '', color: '', alt: '', logo: a.teamLogos?.[0]?.href || '' });
    rows.push({ id: a.id, name: a.displayName, pos: a.position?.abbreviation || '', tid, abbr: a.teamShortName || tm?.abbreviation || '', age: a.age, nt: (a.teams || []).length || (tid ? 1 : 0), v: espnCats(j.categories, x.categories) });
  }
  return { rows, teams, count: first.pagination?.count || rows.length, season: first.requestedSeason?.displayName };
}

/* team season totals: Map tid -> { cat: { stat: value } } */
async function espnTeamStats(season, type = 2) {
  const j = await getJSON(`${espnWeb()}/statistics/byteam?${ESPN_Q}&season=${season}&seasontype=${type}`);
  const m = new Map();
  for (const t of j.teams || []) m.set(t.team.id, { id: t.team.id, abbr: t.team.abbreviation, name: t.team.displayName, short: t.team.name, logo: espnLogo(t.team), v: espnCats(j.categories, t.categories) });
  return m;
}

/* Some college feeds list a team's categories in a different order than the header and repeat each category for the opponents
   (team first, then opponents, named "cat#2"), so a row's categories are matched to the header by name, not by position. */
function espnNamedCats(head, row) {
  const named = {}; for (const c of head || []) if (c.names?.length && !named[c.name]) named[c.name] = c.names;
  const out = {}, seen = {};
  for (const c of row || []) {
    const ns = named[c.name] || [], n = seen[c.name] = (seen[c.name] || 0) + 1, o = out[n > 1 ? `${c.name}#${n}` : c.name] = {};
    (c.values || []).forEach((v, k) => { if (ns[k] != null && (o[ns[k]] == null || v != null)) o[ns[k]] = v; });
  }
  return out;
}
/* standings whose stat names repeat for the overall, home, road and conference splits: values are keyed by ESPN's stat *type*
   (wins, total, home record...). Conferences may hold their entries directly or inside divisions. */
async function espnTypedStandings(season) {
  const j = await getJSON(`${espnApi2()}/standings?${ESPN_Q}&season=${season}&level=3`);
  const out = [];
  const walk = (node, conf, div) => {
    for (const e of node.standings?.entries || []) {
      const s = {}, d = {}; for (const x of e.stats || []) { s[x.type || x.name] = x.value; d[x.type || x.name] = x.displayValue; }
      out.push({ conf: String(conf || '').replace(/ Conference$/, ''), div, id: e.team.id, abbr: e.team.abbreviation, name: e.team.displayName, short: e.team.name, loc: e.team.location, logo: espnLogo(e.team), s, d });
    }
    for (const c of node.children || []) walk(c, conf, c.name);
  };
  for (const c of j.children || []) walk(c, c.name, '');
  return out;
}

/* standings: [{ conf, div, id, abbr, name, logo, s:{stat:value}, d:{displayStat} }] */
async function espnStandings(season) {
  const j = await getJSON(`${espnApi2()}/standings?season=${season}&level=3`);
  const out = [];
  const walk = (node, conf, div) => {
    if (node.standings?.entries) for (const e of node.standings.entries) {
      const s = {}, d = {}; for (const x of e.stats || []) { s[x.name] = x.value; d[x.name] = x.displayValue; }
      out.push({ conf, div, id: e.team.id, abbr: e.team.abbreviation, name: e.team.displayName, short: e.team.name, loc: e.team.location, logo: espnLogo(e.team), s, d });
    }
    for (const c of node.children || []) walk(c, conf || c.name, conf ? c.name : '');
  };
  for (const c of j.children || []) walk(c, c.name, '');
  /* flat leagues (no divisions) put entries directly under the conference */
  return out;
}

const ESPN_GL = (id, season) => cached(`gl:${id}:${season}`, 3600e3, async () => {
  const j = await getJSON(`${espnWeb()}/athletes/${id}/gamelog?${ESPN_Q}&season=${season}`);
  const evs = j.events || {}, out = { names: j.names || [], labels: j.labels || [], games: [] };
  for (const st of j.seasonTypes || []) for (const cat of st.categories || []) for (const e of cat.events || []) {
    const m = evs[e.eventId]; if (!m) continue;
    out.games.push({ id: e.eventId, date: (m.gameDate || '').slice(0, 10), t: m.gameDate, atVs: m.atVs, score: m.score, res: m.gameResult, opp: m.opponent?.abbreviation, oppId: m.opponent?.id, oppName: m.opponent?.displayName, hs: +m.homeTeamScore, as: +m.awayTeamScore, home: m.atVs === 'vs', post: !/regular/i.test(st.displayName || ''), month: cat.displayName, stats: e.stats || [] });
  }
  out.games.sort((a, b) => (a.t || '').localeCompare(b.t || ''));
  return out;
});
const ESPN_SPLITS = (id, season) => cached(`spl:${id}:${season}`, 3600e3, async () => {
  const j = await getJSON(`${espnWeb()}/athletes/${id}/splits?${ESPN_Q}&season=${season}`);
  return { labels: j.labels || [], names: j.names || [], cats: (j.splitCategories || []).map(c => ({ name: c.displayName, splits: (c.splits || []).map(s => ({ name: s.displayName, stats: s.stats })) })) };
});
const ESPN_BIO = id => cached(`bio:${id}`, 7 * 86400e3, async () => {
  const j = await getJSON(`${espnWeb()}/athletes/${id}?${ESPN_Q}`); const a = j.athlete || {};
  return { h: a.displayHeight, w: a.displayWeight, dob: a.displayDOB, born: a.displayBirthPlace, exp: a.displayExperience, jersey: a.displayJersey, draft: a.displayDraft, hand: a.hand?.displayValue || a.hand?.abbreviation, pos: a.position?.displayName, team: a.team?.displayName, status: a.status?.name, debut: a.debutYear };
});
/* a team's season schedule */
const ESPN_SCHED = (tid, season) => cached(`sch:${tid}:${season}`, 3600e3, async () => {
  const j = await getJSON(`${espnSite()}/teams/${tid}/schedule?season=${season}${ESPN.st ? `&seasontype=${ESPN.st}` : ''}`);
  return (j.events || []).map(e => {
    const c = e.competitions?.[0]; if (!c) return null;
    const me = c.competitors.find(k => k.team.id === String(tid)), op = c.competitors.find(k => k !== me);
    return { id: e.id, date: (e.date || '').slice(0, 10), t: e.date, final: c.status?.type?.completed || c.status?.type?.name === 'STATUS_FINAL', home: me?.homeAway === 'home', me: +(me?.score?.value ?? me?.score), op: +(op?.score?.value ?? op?.score), oppId: op?.team?.id, opp: op?.team?.abbreviation, oppName: op?.team?.displayName };
  }).filter(Boolean);
});
const ESPN_SUMMARY = id => cached(`sum:${id}`, 30 * 86400e3, async () => {
  const j = await getJSON(`${espnSite()}/summary?event=${id}`);
  const comp = j.header?.competitions?.[0];
  const teams = (comp?.competitors || []).map(c => ({ id: c.team.id, abbr: c.team.abbreviation, home: c.homeAway === 'home', score: +c.score }));
  const plays = (j.plays || []).map(p => ({ id: p.id, ty: p.type?.text, ab: p.type?.abbreviation, tx: p.text, per: p.period?.number, clk: p.clock?.displayValue, tid: p.team?.id, sp: !!p.shootingPlay, sc: !!p.scoringPlay, val: p.scoreValue, co: p.coordinate, as: p.awayScore, hs: p.homeScore, pp: (p.participants || []).map(q => ({ id: q.athlete?.id, ty: q.type })), st: p.start, en: p.end })).filter(p => p.ty);
  return { id, date: comp?.date, teams, plays };
});

/* run async work with limited concurrency */
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch (e) { out[k] = null; } } }));
  return out;
}
const espnHeadshot = id => `https://a.espncdn.com/i/headshots/${ESPN.lg}/players/full/${id}.png`;
const sec2min = s => isFinite(s) ? s / 60 : NaN;
const mmss = x => { if (!isFinite(x)) return '–'; const m = Math.floor(x), s = Math.round((x - m) * 60); return `${m}:${String(s === 60 ? 0 : s).padStart(2, '0')}`; };
