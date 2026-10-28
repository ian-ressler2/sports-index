/* charts_page.js: chart explorer: every home run on the map + jump-in directory */
function savantHRURL(season) {
  return `${SAV}/statcast_search/csv?all=true&hfPT=&hfAB=home%5C.%5C.run%7C&hfGT=R%7C&hfPR=&hfZ=&hfStadium=&hfBBL=&hfNewZones=&hfPull=&hfC=&hfSea=${season}%7C&hfSit=&player_type=batter&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfInn=&hfBBT=&hfFlag=&metric_1=&group_by=name&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&type=details`;
}
const loadHRs = season => cached(`${season}:allhr`, ttlFor(season), async () => { const t = await getText(savantHRURL(season), { timeout: 180000 }); if (t.trimStart().startsWith('<')) throw new Error('Savant returned a page instead of data'); return csvObjects(t).map(compactPitch).filter(p => p.ev === 'home_run'); });

App.pages.charts = async function ({ D, el, q }) {
  const mode = q.m === 'players' ? 'players' : 'hr';
  const seg = segControl([['hr', 'Every home run'], ['players', 'Player charts']], mode, v => navTo('/charts', { m: v }), 'sm');
  const head = pageHead('CHART EXPLORER', 'Charts', 'Where every home run landed, and a shortcut into any player’s spray chart and zone map.', seg);
  if (mode === 'players') {
    const top = [...D.batList].filter(r => isQual(D, 'bat', r)).sort((a, b) => (b.hr || 0) - (a.hr || 0)).slice(0, 18);
    const tops = [...D.pitList].filter(r => isQual(D, 'pit', r)).sort((a, b) => (b.war || 0) - (a.war || 0)).slice(0, 12);
    const pick = pickerEl(D, 'Find a player', it => { if (it.type === 't') navTo('/team/' + it.t.id); else { const p = D.players.get(it.p.id); navTo('/player/' + it.p.id, { tab: 'field', role: p.pit && !p.bat ? 'pit' : 'bat' }); } });
    mount(el, head, h('div', { class: 'panel pad' }, h('h2', {}, 'Open a Field Explorer'), h('p', { class: 'muted', style: { margin: '6px 0 12px', fontSize: '13px' } }, 'Spray charts, zone maps, pitch locations, exit velocity and launch angle, movement and velocity for any hitter or pitcher.'), h('div', { style: { maxWidth: '420px' } }, pick)),
      h('div', { class: 'grid2', style: { marginTop: '14px', alignItems: 'start' } },
        h('div', { class: 'panel pad' }, h('h2', {}, 'Home run leaders'), h('div', { class: 'chips', style: { marginTop: '10px' } }, top.map(r => h('a', { class: 'chip', href: href('/player/' + r.id, { tab: 'field' }) }, `${r.name} · ${r.hr}`)))),
        h('div', { class: 'panel pad' }, h('h2', {}, 'Top pitchers by WAR'), h('div', { class: 'chips', style: { marginTop: '10px' } }, tops.map(r => h('a', { class: 'chip', href: href('/player/' + r.id, { tab: 'field', role: 'pit' }) }, `${r.name} · ${fmt(r.war, 'f1')}`))))));
    return;
  }
  mount(el, head, h('div', { class: 'panel' }, loadingEl('Loading every home run from Baseball Savant (about 5 MB)')));
  let all;
  try { all = await loadHRs(D.season); } catch (e) { mount(el, head, errorEl(e, () => render(true))); return; }
  const rows0 = all.filter(p => isFinite(p.hx) && isFinite(p.hy));
  const batTeam = p => { const ab = (p.tb || '').toLowerCase().startsWith('top') ? p.away : p.home; return ab; };
  const F = { team: q.team || '', min: +q.min || 0, month: q.mo || '', hand: q.hand || '', find: '', color: q.col || 'dist' };
  const abbrs = [...new Set(rows0.map(batTeam))].filter(Boolean).sort();
  const months = [...new Set(rows0.map(p => p.month))].sort((a, b) => a - b);
  const chart = h('div', { class: 'panel pad' }), stats = h('div', { class: 'tiles', style: { marginTop: '12px' } }), lists = h('div', { class: 'grid2', style: { marginTop: '14px', alignItems: 'start' } });
  const colFn = p => F.color === 'ev' ? evColor(p.les) : F.color === 'angle' ? evColor(65 + clamp((p.la - 15) / 30, 0, 1) * 50) : evColor(65 + clamp(((p.dist || 380) - 330) / 120, 0, 1) * 50);
  const draw = () => {
    const f = F.find.trim().toLowerCase();
    const rows = rows0.filter(p => (!F.team || batTeam(p) === F.team) && (!F.min || p.dist >= F.min) && (!F.month || p.month === +F.month) && (!F.hand || p.stand === F.hand) && (!f || (p.nm || '').toLowerCase().includes(f)));
    const pts = rows.map(p => { const [x, y] = hcFt(p.hx, p.hy); return { x, y, color: colFn(p), r: 3.4, op: .8 }; });
    const c = h('div', { html: sprayChart(pts) }); mount(chart, c);
    tipBind(c, i => { const p = rows[i]; if (!p) return ''; return `<b>${esc((p.nm || '').split(', ').reverse().join(' '))}</b>${tr('Date', p.d)}${tr('Distance', isFinite(p.dist) ? p.dist + ' ft' : '–')}${tr('Exit velo', isFinite(p.les) ? p.les.toFixed(1) + ' mph' : '–')}${tr('Launch angle', isFinite(p.la) ? p.la.toFixed(0) + '°' : '–')}${tr('Matchup', esc(p.away) + ' @ ' + esc(p.home))}`; });
    c.onclick = e => { const t = e.target.closest('[data-i]'); if (t && rows[+t.dataset.i]?.bat) navTo('/player/' + rows[+t.dataset.i].bat, { tab: 'field' }); };
    const dists = rows.map(p => p.dist).filter(isFinite), evs = rows.map(p => p.les).filter(isFinite);
    stats.innerHTML = [['Home runs', rows.length], ['Avg distance', dists.length ? mean(dists).toFixed(0) + ' ft' : '–'], ['Longest', dists.length ? Math.max(...dists) + ' ft' : '–'], ['Avg exit velo', evs.length ? mean(evs).toFixed(1) + ' mph' : '–'], ['Hardest', evs.length ? Math.max(...evs).toFixed(1) + ' mph' : '–'], ['Avg launch angle', rows.length ? mean(rows.map(p => p.la).filter(isFinite)).toFixed(0) + '°' : '–']].map(([k, v]) => `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="p">&nbsp;</div></div>`).join('');
    const lst = (title, key, unit) => { const t = rows.filter(p => isFinite(p[key])).sort((a, b) => b[key] - a[key]).slice(0, 8); return h('div', { class: 'panel lead' }, h('h3', {}, title), h('ol', {}, t.map((p, i) => h('li', { onclick: () => p.bat && navTo('/player/' + p.bat, { tab: 'field' }), html: `<i>${i + 1}</i><span class="ln">${esc((p.nm || '').split(', ').reverse().join(' '))}<small>${esc(batTeam(p) || '')} · ${esc(p.d)}</small></span><b>${key === 'dist' ? p.dist : p.les.toFixed(1)} ${unit}</b>` })))); };
    mount(lists, lst('Longest', 'dist', 'ft'), lst('Hardest hit', 'les', 'mph'));
    setQ({ team: F.team, min: F.min || '', mo: F.month, hand: F.hand, col: F.color === 'dist' ? '' : F.color, m: '' });
  };
  const sel = (label, opts, cur, on) => h('label', { class: 'row', style: { gap: '6px' } }, h('span', { class: 'cap' }, label), h('select', { class: 'sel sm', onchange: e => on(e.target.value), html: opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('') }));
  const bar = h('div', { class: 'panel', style: { padding: '12px 14px' } }, h('div', { class: 'row' },
    sel('Team', [['', 'All teams'], ...abbrs.map(a => [a, a])], F.team, v => { F.team = v; draw(); }),
    sel('Month', [['', 'All'], ...months.map(m => [m, MONTHS[m] || m])], F.month, v => { F.month = v; draw(); }),
    sel('Batter', [['', 'Both'], ['L', 'Lefty'], ['R', 'Righty']], F.hand, v => { F.hand = v; draw(); }),
    sel('Min distance', [[0, 'Any'], [380, '380+ ft'], [420, '420+ ft'], [440, '440+ ft'], [460, '460+ ft']], F.min, v => { F.min = +v; draw(); }),
    sel('Color', [['dist', 'Distance'], ['ev', 'Exit velo'], ['angle', 'Launch angle']], F.color, v => { F.color = v; draw(); }),
    h('input', { class: 'fld', placeholder: 'Find a batter', style: { width: '160px' }, oninput: debounce(e => { F.find = e.target.value; draw(); }, 180), 'aria-label': 'Find a batter' })));
  mount(el, head, bar, h('div', { style: { marginTop: '14px' } }, chart), stats, lists);
  draw();
};
