/* team_cfg.js: MLB standings columns and team-profile layout */
const SCHED = (tid, s) => cached(`sched:${tid}:${s}`, 3600e3, () => getJSON(`${API}/schedule?sportId=1&teamId=${tid}&season=${s}&gameType=R&hydrate=team`).then(j => (j.dates || []).flatMap(d => d.games)));
SPORT.standings = {
  divOrder: ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'],
  sort: s => s.pct,
  cols: [
    { l: 'W', k: 'w' }, { l: 'L', k: 'l' }, { l: 'W%', k: 'pct', f: 'f3' }, { l: 'GB', get: (s, t, i) => i === 0 ? '–' : s.gb },
    { l: 'RS', k: 'rs' }, { l: 'RA', k: 'ra' }, { l: 'Diff', k: 'rdiff', f: 'sgi' }, { l: 'Pyth', k: 'pyth', f: 'f3', desc: 'Pythagorean win percentage' },
    { l: 'Luck', get: s => fmt((s.pyth - s.pct) * s.gp, 'sg1'), desc: 'Wins above the pythagorean expectation' }, { l: 'Strk', k: 'streak' },
  ],
  scatter: { title: 'Offense vs defense', note: 'down and right is best', x: s => s.rs / s.gp, y: s => s.ra / s.gp, xlab: 'Runs scored per game', ylab: 'Runs allowed per game',
    tip: s => [['Record', s.w + '-' + s.l], ['R/G', (s.rs / s.gp).toFixed(2)], ['RA/G', (s.ra / s.gp).toFixed(2)], ['Run diff', fmt(s.rdiff, 'sgi')]] },
};
SPORT.team = {
  tiles(D, id, st) {
    const tb = D.tbat.get(id), tp = D.tpit.get(id);
    return [['Record', `${st.w}-${st.l}`, NaN], ['W%', fmt(st.pct, 'f3'), pctile(D, 'tbat', 'pct', st.pct)], ['Runs/G', fmt(tb?.rpg, 'f2'), pctile(D, 'tbat', 'rpg', tb?.rpg)], ['RA/G', fmt(tp?.rapg, 'f2'), pctile(D, 'tpit', 'rapg', tp?.rapg)], ['Run diff', fmt(st.rdiff, 'sgi'), pctile(D, 'tbat', 'rdiff', st.rdiff)], ['Pythag', fmt(st.pyth, 'f3'), pctile(D, 'tbat', 'pyth', st.pyth)], ['OPS', fmt(tb?.ops, 'f3'), pctile(D, 'tbat', 'ops', tb?.ops)], ['ERA', fmt(tp?.era, 'f2'), pctile(D, 'tpit', 'era', tp?.era)]];
  },
  bars: [
    { title: 'Offense', g: 'tbat', keys: ['rpg', 'ops', 'iso', 'kp', 'bbp', 'hr', 'sb', 'xwoba', 'ev', 'brl', 'hh', 'whiff', 'oswing', 'bs', 'spr'] },
    { title: 'Run prevention', g: 'tpit', keys: ['rapg', 'era', 'fip', 'whip', 'kp', 'bbp', 'hr9', 'xera', 'xwoba', 'ev', 'brl', 'hh', 'whiff', 'oswing', 'fbv', 'oaa'] },
  ],
  roster: [
    { g: 'bat', title: 'Hitters', keys: ['pa', 'hr', 'avg', 'obp', 'slg', 'wrcp', 'xwoba', 'brl', 'kp', 'bbp', 'war'], sort: 'pa' },
    { g: 'pit', title: 'Pitchers', keys: ['ipn', 'era', 'fip', 'xera', 'kp', 'bbp', 'whiff', 'war'], sort: 'ipn' },
  ],
  arc: {
    title: 'Season arc', note: 'cumulative run differential',
    draw(D, id, box) {
      SCHED(id, D.season).then(games => {
        if (!box) return;
        const gs = games.filter(g => g.status?.abstractGameState === 'Final' && g.teams?.home?.score != null).sort((a, b) => a.gameDate.localeCompare(b.gameDate));
        if (gs.length < 2) { box.innerHTML = '<div class="empty">No finished games yet.</div>'; return; }
        let cum = 0, w = 0, l = 0; const pts = [], info = [];
        gs.forEach((g, i) => { const home = g.teams.home.team.id === id, me = home ? g.teams.home : g.teams.away, op = home ? g.teams.away : g.teams.home; cum += me.score - op.score; if (me.score > op.score) w++; else l++; pts.push([i + 1, cum]); info.push({ date: g.officialDate || g.gameDate.slice(0, 10), opp: op.team.name, me: me.score, op: op.score, home, w, l, cum }); });
        const ticks = []; for (let n = 20; n < gs.length; n += 20) ticks.push({ v: n, l: 'G' + n });
        box.innerHTML = lineSVG({ series: [{ name: 'Run diff', color: 'var(--acc)', area: true, dots: true, pts }], xticks: ticks, yfmt: v => (v > 0 ? '+' : '') + Math.round(v), refY: 0, H: 240 });
        tipBind(box, i => { const g = info[i % 10000]; return g ? `<b>${esc(g.date)}</b>${tr(g.home ? 'vs' : '@', g.opp)}${tr('Score', g.me + '–' + g.op)}${tr('Record', g.w + '-' + g.l)}${tr('Run diff', (g.cum > 0 ? '+' : '') + g.cum)}` : ''; });
      }).catch(() => { if (box) box.innerHTML = '<div class="empty">Schedule unavailable.</div>'; });
    },
  },
};
