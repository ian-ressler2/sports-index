/* pack.js: generic player and team page pieces for the ESPN-backed sites.
   A sport passes small config objects; these builders return the tab and chart functions the core expects. */
const numOf = v => { if (v == null || v === '') return NaN; if (typeof v === 'number') return v; const s = String(v).trim(); if (/^-?\d+:\d{2}$/.test(s)) { const [m, x] = s.replace('-', '').split(':'); return (+m + x / 60) * (s[0] === '-' ? -1 : 1); } const n = parseFloat(s.replace(/,/g, '')); return isFinite(n) ? n : NaN; };
const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ---- career table from ESPN's athlete stats feed ---- */
const ESPN_CAREER = id => cached(`career:${id}`, 6 * 3600e3, async () => {
  const j = await getJSON(`${espnWeb()}/athletes/${id}/stats?${ESPN_Q}`);
  const slug = {}; for (const [k, t] of Object.entries(j.teams || {})) slug[k] = t.abbreviation;
  return (j.categories || []).map(c => ({ name: c.name, disp: c.displayName, labels: c.labels || [], names: c.names || [], totals: c.totals || [], rows: (c.statistics || []).map(s => ({ season: s.season?.year, label: s.season?.displayName, team: slug[s.teamSlug] || s.teamSlug || '', stats: s.stats || [] })) }));
});
function mkCareer(pick) {
  return async (D, id, role) => {
    const cats = await ESPN_CAREER(id);
    const c = pick ? pick(cats, role) : cats[0]; if (!c) return null;
    const show = c.labels.map((l, i) => [l, i]);
    return { title: `${SPORT.short} career by season`, note: 'click a season to jump to it', head: ['Year', 'Team', ...show.map(x => x[0])],
      rows: [...c.rows.map(s => ({ season: s.season, cells: [esc(s.label || s.season), esc(s.team), ...show.map(([, i]) => esc(s.stats[i] ?? '–'))] })),
        ...(c.totals.length ? [{ season: 0, cells: ['<b>Career</b>', '', ...show.map(([, i]) => `<b>${esc(c.totals[i] ?? '')}</b>`)] }] : [])] };
  };
}

/* ---- game log tab. cfg: { cols:{role:[stat names]}, form:{role:{name,label,mode,win}}, res(g) } ---- */
function mkGameLog(cfg) {
  return async ({ D, id, role }) => {
    const gl = await ESPN_GL(id, D.season);
    const games = gl.games.filter(g => !g.post); if (!games.length) return h('div', { class: 'panel empty' }, 'No games found for this season.');
    const idx = n => gl.names.indexOf(n), val = (g, n) => numOf(g.stats[idx(n)]);
    const f = cfg.form?.[role];
    const cols = [...new Set(cfg.cols?.[role] || gl.names)].map(n => [n, gl.labels[idx(n)] || n]).filter(x => idx(x[0]) >= 0);
    const out = [];
    if (f && idx(f.name) >= 0) {
      const win = f.win || 10, vals = games.map(g => val(g, f.name)); let cum = 0, n = 0;
      const cumPts = [], rollPts = [];
      vals.forEach((v, i) => { if (isFinite(v)) { cum += v; n++; } cumPts.push([i, f.mode === 'sum' ? cum : (n ? cum / n : NaN)]); if (i >= Math.min(3, win - 1)) { const w = vals.slice(Math.max(0, i - win + 1), i + 1).filter(isFinite); rollPts.push([i, f.mode === 'sum' ? sum(w) : mean(w)]); } });
      const series = f.mode === 'sum' ? [{ name: `Cumulative ${f.label}`, color: 'var(--a)', pts: cumPts, dots: false, area: true }, { name: `Last ${win} games`, color: 'var(--acc)', pts: rollPts.map(p => [p[0], p[1] * (f.scale || 1)]), dots: false, hidden: !f.showRoll }].filter(s => !s.hidden)
        : [{ name: `Season average ${f.label}`, color: 'var(--a)', pts: cumPts, dots: false }, { name: `Last ${win} games`, color: 'var(--acc)', pts: rollPts, dots: true }];
      const yf = f.fmt ? v => fmt(v, f.fmt) : (v => String(+v.toFixed(2)));
      const ticks = games.map((g, i) => ({ v: i, l: g.date.slice(5) })).filter((t, i) => i % Math.max(1, Math.ceil(games.length / 9)) === 0);
      const box = h('div', { class: 'panel pad' }, h('div', { class: 'row sb' }, h('h2', {}, 'Form'), h('div', { class: 'legend', style: { margin: 0 }, html: series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('') })), h('div', { html: lineSVG({ series, xticks: ticks, yfmt: yf, H: 260 }) }));
      tipBind(box, i => { const si = Math.floor(i / 10000), k = i % 10000, se = series[si], p = se?.pts[k]; if (!p) return ''; const g = games[p[0]]; return `<b>${esc(se.name)}</b>${tr('Through', g.date)}${tr('Value', yf(p[1]))}`; });
      out.push(box);
    }
    const trs = games.slice().reverse().map(g => { const opp = D.teams.get(+g.oppId); const res = g.res === 'W' ? '<b style="color:#2fa36b">W</b>' : g.res === 'L' ? '<b style="color:#d6455d">L</b>' : esc(g.res || '');
      return `<tr><td>${g.date}</td><td style="text-align:left">${g.home ? 'vs' : '@'} ${esc(opp?.abbr || g.opp || '')}</td><td>${res} ${esc(g.score || '')}</td>${cols.map(([n]) => `<td>${esc(g.stats[idx(n)] ?? '–')}</td>`).join('')}</tr>`; }).join('');
    out.push(h('div', { class: 'panel', style: { marginTop: '14px' } }, h('div', { class: 'hd' }, h('h2', {}, 'Game log'), h('small', {}, games.length + ' games')), h('div', { class: 'sc', style: { padding: '8px 4px 4px', maxHeight: '60vh' }, html: `<table class="dt"><thead><tr><th>Date</th><th style="text-align:left">Opp</th><th>Result</th>${cols.map(c => `<th>${esc(c[1])}</th>`).join('')}</tr></thead><tbody>${trs}</tbody></table>` })));
    return h('div', {}, out);
  };
}

/* ---- splits tab ---- */
function mkSplits(cfg = {}) {
  return async ({ D, id }) => {
    const j = await ESPN_SPLITS(id, D.season);
    if (!j.cats.length) return h('div', { class: 'panel empty' }, 'No splits available.');
    const keep = cfg.labels ? j.labels.map((l, i) => [l, i]).filter(x => cfg.labels.includes(x[0])) : j.labels.map((l, i) => [l, i]);
    let html = `<table class="dt"><thead><tr><th style="text-align:left">Split</th>${keep.map(x => `<th>${esc(x[0])}</th>`).join('')}</tr></thead><tbody>`;
    for (const c of j.cats) {
      if (!c.splits.length) continue;
      html += `<tr><td colspan="${keep.length + 1}" style="background:var(--bg3);font:600 10.5px var(--f-mono);letter-spacing:.14em;color:var(--fg3);text-align:left">${esc(c.name.toUpperCase())}</td></tr>`;
      for (const s of c.splits) html += `<tr><td style="text-align:left">${esc(s.name)}</td>${keep.map(([, i]) => `<td>${esc(s.stats?.[i] ?? '–')}</td>`).join('')}</tr>`;
    }
    html += '</tbody></table>';
    return h('div', { class: 'panel' }, h('div', { class: 'hd' }, h('h2', {}, `${SPORT.seasons.label(D.season)} splits`), h('small', {}, 'ESPN situational splits')), h('div', { class: 'sc', style: { padding: '8px 4px 4px', maxHeight: '75vh' }, html }));
  };
}

/* ---- player overview arc: a stat by month, from the game log. cfg:{ name, label, mode:'sum'|'mean', fmt } ---- */
function mkMonthArc(cfgByRole) {
  return {
    title: () => 'Season arc',
    note: role => cfgByRole[role] ? `${cfgByRole[role].label} by month` : '',
    draw(D, id, role, box) {
      const c = cfgByRole[role]; if (!c) { box.innerHTML = ''; return; }
      ESPN_GL(id, D.season).then(gl => {
        if (!box.isConnected) return;
        const i = gl.names.indexOf(c.name), by = new Map();
        for (const g of gl.games) { if (g.post) continue; const v = numOf(g.stats[i]); if (!isFinite(v)) continue; const a = by.get(g.month) || []; a.push(v); by.set(g.month, a); }
        const ms = [...by.keys()].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)).sort((a, b) => (MONTH_ORDER.indexOf(a) + 9) % 12 - (MONTH_ORDER.indexOf(b) + 9) % 12);
        if (ms.length < 2) { box.innerHTML = '<div class="empty">Not enough months to chart.</div>'; return; }
        const pts = ms.map((m, k) => [k, c.mode === 'sum' ? sum(by.get(m)) : mean(by.get(m))]);
        box.innerHTML = lineSVG({ series: [{ name: 'm', color: 'var(--acc)', area: true, dots: true, pts }], xticks: ms.map((m, k) => ({ v: k, l: m.slice(0, 3) })), yfmt: v => c.fmt ? fmt(v, c.fmt) : String(+v.toFixed(1)), H: 200 });
        tipBind(box, k => { const m = ms[k % 10000]; return m ? `<b>${m}</b>${tr(c.label, fmt(pts[k % 10000][1], c.fmt || 'f1'))}${tr('Games', by.get(m).length)}` : ''; });
      }).catch(() => { if (box.isConnected) box.innerHTML = '<div class="empty">Game log unavailable.</div>'; });
    },
  };
}

/* ---- team season arc: cumulative scoring margin from the schedule ---- */
function mkTeamArc(noun) {
  return {
    title: 'Season arc', note: `cumulative ${noun} differential`,
    draw(D, id, box) {
      ESPN_SCHED(id, D.season).then(all => {
        if (!box) return;
        const gs = all.filter(g => g.final && isFinite(g.me) && isFinite(g.op)).sort((a, b) => a.t.localeCompare(b.t));
        if (gs.length < 2) { box.innerHTML = '<div class="empty">No finished games yet.</div>'; return; }
        let cum = 0, w = 0, l = 0; const pts = [], info = [];
        gs.forEach((g, i) => { cum += g.me - g.op; if (g.me > g.op) w++; else l++; pts.push([i + 1, cum]); info.push({ ...g, cum, w, l }); });
        const ticks = []; const step = gs.length > 60 ? 20 : 10; for (let n = step; n < gs.length; n += step) ticks.push({ v: n, l: 'G' + n });
        box.innerHTML = lineSVG({ series: [{ name: 'Diff', color: 'var(--acc)', area: true, dots: gs.length < 40, pts }], xticks: ticks, yfmt: v => (v > 0 ? '+' : '') + Math.round(v), refY: 0, H: 240 });
        tipBind(box, i => { const g = info[i % 10000]; return g ? `<b>${esc(g.date)}</b>${tr(g.home ? 'vs' : '@', g.oppName || g.opp)}${tr('Score', g.me + '–' + g.op)}${tr('Run', (g.cum > 0 ? '+' : '') + g.cum)}` : ''; });
      }).catch(() => { if (box) box.innerHTML = '<div class="empty">Schedule unavailable.</div>'; });
    },
  };
}

/* ---- map ESPN standings rows into D.teams / D.stand. cfg:{ divName(row), lgName(row), stand(row) } ---- */
function buildTeamsAndStandings(D, rows, teamMeta, cfg) {
  D.teams = new Map(); D.stand = new Map(); D.teamByAbbr = new Map();
  for (const r of rows) {
    const id = +r.id, meta = teamMeta?.get(String(r.id)) || {};
    const t = { id, name: r.name, abbr: r.abbr, short: r.short, loc: r.loc, lg: cfg.lgName(r), div: cfg.divName(r), color: meta.color || '', alt: meta.alt || '', logo: r.logo || meta.logo || '' };
    D.teams.set(id, t); D.teamByAbbr.set(r.abbr, t);
    D.stand.set(id, { id, ...cfg.stand(r) });
  }
  D.maxG = Math.max(...[...D.stand.values()].map(s => s.gp || 0), 1);
}
const teamColorFrom = D => id => { const t = App.D?.teams?.get(+id) || D?.teams?.get(+id); return t?.color || '#667788'; };

/* ---- per-game play events (shots, passes) kept lean and cached for 60 days ---- */
const ESPN_EVENTS = id => cached(`ev${SPORT.evVer || ''}:${id}`, 60 * 86400e3, async () => {
  const j = await getJSON(`${espnSite()}/summary?event=${id}`);
  const comp = j.header?.competitions?.[0];
  const teams = (comp?.competitors || []).map(c => ({ id: +c.team.id, abbr: c.team.abbreviation, home: c.homeAway === 'home', score: +c.score }));
  const ctx = SPORT.leanGame ? SPORT.leanGame(j, teams) : null;
  const ev = []; for (const p of (SPORT.playsOf ? SPORT.playsOf(j) : j.plays) || []) { const e = SPORT.leanPlay(p, teams, ctx); if (e) ev.push(e); }
  return { id, date: (comp?.date || '').slice(0, 10), teams, ev };
});
async function loadEvents(ids, prog) {
  let n = 0;
  const out = await pool(ids, 5, async id => { const r = await ESPN_EVENTS(id); prog && prog(++n, ids.length); return r; });
  return out.filter(Boolean);
}
/* game ids for a player (from the game log) or a team (from the schedule), newest last */
async function gameIdsFor(kind, id, season, postToo = false) {
  if (kind === 'player') { const gl = await ESPN_GL(id, season); return gl.games.filter(g => postToo || !g.post).map(g => g.id); }
  const s = await ESPN_SCHED(id, season); return s.filter(g => g.final).sort((a, b) => a.t.localeCompare(b.t)).map(g => g.id);
}
SPORT.dataSrc = 'ESPN';
/* ---- game center: the scoreboard for a date window and one game's full play by play ---- */
/* ESPN's scoreboard rejects a start-end range, so ask for one day at a time and merge */
const ESPN_BOARD = (a, b) => cached(`bd:${a}-${b}`, 300e3, async () => {
  const days = [], d0 = new Date(Math.floor(a / 10000), Math.floor(a / 100) % 100 - 1, a % 100), d1 = new Date(Math.floor(b / 10000), Math.floor(b / 100) % 100 - 1, b % 100);
  for (const d = new Date(d0); d <= d1 && days.length < 14; d.setDate(d.getDate() + 1)) days.push(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
  const seen = new Set(), events = [];
  await pool(days, 7, async day => { const j = await getJSON(`${espnSite()}/scoreboard?dates=${day}&limit=300${ESPN.sbq}`).catch(() => ({})); for (const e of j.events || []) if (!seen.has(e.id)) { seen.add(e.id); events.push(e); } });
  return events.map(e => {
    const c = e.competitions?.[0]; if (!c) return null; const st = c.status?.type || {};
    const tm = w => { const k = c.competitors.find(z => z.homeAway === w); return { id: +k.team.id, abbr: k.team.abbreviation, name: k.team.displayName, logo: espnLogo(k.team), score: +(k.score?.value ?? k.score) }; };
    if (st.state === 'pre') return null;
    return { id: e.id, t: e.date, day: new Date(e.date).toLocaleDateString('en-CA'), final: !!st.completed, status: st.shortDetail || st.description || '', home: tm('home'), away: tm('away') };
  }).filter(Boolean);
});
SPORT.listGames = (a, b) => ESPN_BOARD(a, b);
const espnClips = a => (a || []).map(v => ({ title: v.headline || v.description || 'Highlight', dur: fmtClip(v.duration), thumb: v.thumbnail || '', src: v.links?.source?.HD?.href || v.links?.source?.href || v.links?.mobile?.source?.href || '' })).filter(v => /^https:\/\/.*\.mp4/i.test(v.src)).slice(0, 12);
/* one day's scoreboard including games not yet played, with each team's game leaders, the recap headline and the highlight reel */
SPORT.today = day => cached(`today:${day}`, 60e3, async () => {
  const j = await getJSON(`${espnSite()}/scoreboard?dates=${day}&limit=300${ESPN.sbq}`);
  return (j.events || []).map(e => {
    const c = e.competitions?.[0]; if (!c) return null; const st = c.status?.type || {};
    const tm = w => {
      const k = c.competitors.find(z => z.homeAway === w); if (!k) return null;
      return { id: +k.team.id, abbr: k.team.abbreviation, name: k.team.displayName, logo: espnLogo(k.team), rank: k.curatedRank?.current > 0 && k.curatedRank.current <= 25 ? k.curatedRank.current : 0, score: st.state === 'pre' || k.score == null ? null : +(k.score?.value ?? k.score), rec: (k.records || []).find(r => r.type === 'total')?.summary || '',
        lead: (k.leaders || []).map(l => { const t = l.leaders?.[0]; return t && t.athlete ? { k: l.name, lab: l.shortDisplayName || l.displayName || l.name, v: t.displayValue, val: +t.value, who: t.athlete.shortName || t.athlete.displayName, pid: +t.athlete.id || 0 } : null; }).filter(Boolean) };
    };
    const home = tm('home'), away = tm('away'); if (!home || !away) return null;
    const hd = c.headlines?.[0];
    return { id: e.id, t: e.date, state: st.state, final: !!st.completed, status: st.shortDetail || st.description || '', home, away, headline: hd?.shortLinkText || hd?.description || '', note: c.notes?.[0]?.headline || '', videos: espnClips(c.highlights).slice(0, 1), extra: [] };
  }).filter(Boolean);
});
SPORT.loadGame = id => cached(`game:${id}:${SPORT.evVer || 1}`, 600e3, async () => {
  const j = await getJSON(`${espnSite()}/summary?event=${id}`);
  const comp = j.header?.competitions?.[0]; if (!comp) throw new Error('Game not found');
  const tm = w => { const c = comp.competitors.find(k => k.homeAway === w); return { id: +c.team.id, abbr: c.team.abbreviation, name: c.team.displayName, logo: espnLogo(c.team), color: c.team.color ? '#' + c.team.color : '', score: +c.score }; };
  const G = { id, sim: false, date: (comp.date || '').slice(0, 10), sub: comp.status?.type?.detail || '', home: tm('home'), away: tm('away'), ev: [], tot: 0 };
  G.videos = espnClips(j.videos);
  SPORT.gameEvents(j, G); return G;
});

const GAMES_OPTS = [[5, 'Last 5 games'], [10, 'Last 10 games'], [20, 'Last 20 games'], [40, 'Last 40 games'], [0, 'Whole season']];

/* ---- multi-team scope for the chart pages ----
   The ?t= query holds a comma list of team ids. An empty list means every team. */
function teamsFromQ(q, D) { return (q.t || '').split(',').map(Number).filter(id => D.teams.has(id)); }
/* last-n finished games per team (n = 0 for the whole season), loaded with a small pool */
async function gameIdsByTeam(tids, season) {
  const m = new Map();
  await pool(tids, 6, async tid => { m.set(tid, await gameIdsFor('team', tid, season)); });
  return m;
}
/* a dropdown of checkboxes grouped by division. selected: array of ids; apply(ids) fires on Apply */
function teamMultiPicker(D, selected, apply) {
  const cur = new Set(selected), teams = [...D.teams.values()];
  const order = SPORT.standings?.divOrder || [];
  const groups = [...new Set(teams.map(t => t.div || t.lg || 'Teams'))].sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)) || a.localeCompare(b));
  const label = () => cur.size ? `${cur.size} team${cur.size > 1 ? 's' : ''} selected` : SPORT.pickerNone || `All ${teams.length} teams`;
  const btn = h('button', { class: 'sel', type: 'button', 'aria-haspopup': 'true', style: { minWidth: '150px', textAlign: 'left' } }, label());
  const menu = h('div', { class: 'menu', style: { display: 'none', minWidth: '320px', maxHeight: '420px' } });
  const boxes = new Map();
  const sync = () => { btn.textContent = label(); boxes.forEach((b, id) => b.checked = cur.has(id)); };
  const head = h('div', { class: 'row', style: { gap: '8px', padding: '4px 6px 8px' } },
    h('button', { class: 'btn sm', type: 'button', onclick: () => { cur.clear(); sync(); } }, 'All teams'),
    h('button', { class: 'btn sm', type: 'button', onclick: () => { teams.forEach(t => cur.add(t.id)); sync(); } }, 'Select every box'),
    h('button', { class: 'btn sm pri', type: 'button', style: { marginLeft: 'auto' }, onclick: () => { menu.style.display = 'none'; apply(cur.size === teams.length ? [] : [...cur]); } }, 'Apply'));
  menu.append(head);
  for (const g of groups) {
    menu.append(h('div', { class: 'mh' }, g.toUpperCase()));
    for (const t of teams.filter(t => (t.div || t.lg || 'Teams') === g).sort((a, b) => a.name.localeCompare(b.name))) {
      const cb = h('input', { type: 'checkbox' }); cb.checked = cur.has(t.id); boxes.set(t.id, cb);
      cb.onchange = () => { cb.checked ? cur.add(t.id) : cur.delete(t.id); btn.textContent = label(); };
      menu.append(h('label', { class: 'row', style: { gap: '10px', padding: '6px 10px', cursor: 'pointer', flexWrap: 'nowrap' } }, cb, h('span', { html: tbadge(D, t.id, 22) }), h('span', {}, t.name)));
    }
  }
  btn.onclick = () => { menu.style.display = menu.style.display === 'none' ? '' : 'none'; };
  const wrap = h('div', { class: 'pop' }, btn, menu);
  document.addEventListener('click', function f(e) { if (!document.body.contains(wrap)) return document.removeEventListener('click', f); if (!wrap.contains(e.target)) menu.style.display = 'none'; });
  return wrap;
}
/* removable chips for the selected teams */
function teamChips(D, tids, apply) {
  return h('div', { class: 'chips' }, tids.map(id => h('button', { class: 'chip on', type: 'button', title: 'Remove ' + (D.teams.get(id)?.name || ''), onclick: () => apply(tids.filter(x => x !== id)), html: `${esc(D.teams.get(id)?.abbr || id)} <span aria-hidden="true">×</span>` })));
}

/* ---- every team's schedule for a season, merged into one game list for the season simulator ---- */
async function espnSeasonGames(D, season, prog) {
  const ids = [...D.teams.keys()], seen = new Map(); let n = 0;
  const all = await pool(ids, 6, async id => { const r = await ESPN_SCHED(id, season); prog && prog(++n / ids.length); return r; });
  ids.forEach((id, k) => { for (const g of all[k] || []) {
    if (seen.has(g.id) || !D.teams.has(+g.oppId)) continue;
    seen.set(g.id, g.home ? { id: g.id, h: id, a: +g.oppId, hs: g.me, as: g.op, final: g.final } : { id: g.id, h: +g.oppId, a: id, hs: g.op, as: g.me, final: g.final });
  } });
  return [...seen.values()];
}
/* current season (finished + remaining) and last season (finished), for SPORT.season.games */
async function espnSeasonData(D, prog) {
  const cur = await espnSeasonGames(D, D.season, f => prog && prog(f * .5));
  let prev = []; try { prev = (await espnSeasonGames(D, D.season - 1, f => prog && prog(.5 + f * .5))).filter(g => g.final); } catch (e) { /* last season is only a prior */ }
  const fin = g => g.final && isFinite(g.hs) && isFinite(g.as);
  return { cur: cur.filter(fin), rem: cur.filter(g => !g.final), prev };
}
