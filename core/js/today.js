/* today.js: the daily page. One day's games, standout performances, storylines and highlight clips.
   Needs SPORT.today(ymd) -> games[]; see sports/_espn/pack.js and sports/mlb/game.js for the shape. */

const longDay = d => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const clockOf = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
const streakNum = s => { const m = /^([WL])(\d+)$/.exec(s || ''); return m ? { w: m[1] === 'W', n: +m[2] } : null; };

/* standout individual lines from the game leaders, scaled by how big each is for its category */
function standoutLines(games) {
  const ref = SPORT.noteRef || {}, out = [];
  for (const g of games) {
    if (g.state === 'pre') continue;
    for (const [side, opp] of [[g.away, g.home], [g.home, g.away]]) for (const l of side.lead || []) {
      const t = ref[l.k]; if (!t || !isFinite(l.val) || l.val <= 0) continue;
      out.push({ score: l.val / t, who: l.who, pid: l.pid, team: side, opp, lab: l.lab, v: l.v, game: g });
    }
  }
  out.sort((a, b) => b.score - a.score);
  const big = out.filter(x => x.score >= .85);
  const seen = new Set(), keep = [];
  for (const x of big.length >= 3 ? big : out) { const k = x.pid || x.who; if (seen.has(k)) continue; seen.add(k); keep.push(x); if (keep.length >= 10) break; }
  return keep;
}

/* storylines worked out from today's results and the standings */
function storylines(D, games) {
  const out = [], closeM = SPORT.closeMargin || 1;
  const pct = id => D.stand.get(id)?.pct, gp = id => D.stand.get(id)?.gp || 0;
  for (const g of games) {
    if (g.state !== 'post') continue;
    const [win, lose] = g.home.score > g.away.score ? [g.home, g.away] : [g.away, g.home], margin = Math.abs(g.home.score - g.away.score);
    const pw = pct(win.id), pl = pct(lose.id);
    if (isFinite(pw) && isFinite(pl) && gp(win.id) >= 4 && gp(lose.id) >= 4 && pl - pw >= .15) out.push({ tag: 'Upset', text: `${win.name} (${win.rec || 'record n/a'}) beat ${lose.name} (${lose.rec || 'record n/a'}), ${win.score}-${lose.score}.`, g, w: 3 });
    const ot = /OT|SO|F\/\d/.test(g.status);
    if (ot) out.push({ tag: 'Extra time', text: `${win.name} outlasted ${lose.name} ${win.score}-${lose.score} (${g.status}).`, g, w: 2 });
    else if (margin <= closeM) out.push({ tag: 'Down to the wire', text: `${win.name} edged ${lose.name} ${win.score}-${lose.score}.`, g, w: 1 });
  }
  for (const g of games) for (const t of [g.away, g.home]) {
    const s = streakNum(D.stand.get(t.id)?.streak); if (!s || s.n < 4) continue;
    if (g.state === 'post') continue;
    out.push({ tag: s.w ? 'Hot streak' : 'Cold streak', text: `${t.name} ${s.w ? 'have won' : 'have lost'} ${s.n} straight and play ${t === g.home ? g.away.name : g.home.name}${t === g.home ? ' at home' : ' on the road'}.`, g, w: s.n >= 6 ? 3 : 2 });
  }
  const ordered = out.sort((a, b) => b.w - a.w);
  for (const g of games) if (g.state === 'post' && g.headline) ordered.push({ tag: 'Recap', text: g.headline, g, w: 0 });
  return ordered.slice(0, 10);
}

App.pages.today = async function ({ q, D, el }) {
  const todayN = ymd(new Date()), day = q.d && /^\d{8}$/.test(q.d) ? +q.d : todayN, dt = parseYmd(day);
  const shift = k => { const d = new Date(dt); d.setDate(d.getDate() + k); navTo('/today', { d: ymd(d) === todayN ? undefined : ymd(d) }); };
  const dateIn = h('input', { type: 'date', class: 'sel sm', 'aria-label': 'Pick a date', value: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`, onchange: e => { const v = e.target.value; if (v) navTo('/today', { d: v.replaceAll('-', '') === String(todayN) ? undefined : v.replaceAll('-', '') }); } });
  const nav = h('div', { class: 'row', style: { gap: '6px', flexWrap: 'wrap' } }, h('button', { class: 'btn sm', type: 'button', onclick: () => shift(-1) }, '‹ Day before'), dateIn, h('button', { class: 'btn sm', type: 'button', onclick: () => shift(1) }, 'Next day ›'), day === todayN ? null : h('button', { class: 'btn sm', type: 'button', onclick: () => navTo('/today') }, 'Today'));
  const head = pageHead('DAILY', day === todayN ? 'Today' : longDay(dt).split(',')[0] + ', ' + dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), `Every ${SPORT.short} game on ${longDay(dt)}, with standout performances, storylines and highlight clips.`, nav);
  const out = h('div', {}, loadingEl('Loading the day’s games'));
  mount(el, head, out);
  let games; try { games = await SPORT.today(day); } catch (e) { mount(out, errorEl(e, () => render(true))); return; }
  if (!games.length) {
    mount(out, h('div', { class: 'panel empty', style: { marginTop: '14px' } }, h('p', { style: { margin: '0 0 10px' } }, `No ${SPORT.short} games on ${longDay(dt)}.`), h('button', { class: 'btn', type: 'button', onclick: async e => { e.target.disabled = true; e.target.textContent = 'Looking…'; try { const end = ymd(new Date()), s0 = new Date(); s0.setDate(s0.getDate() - 13); const list = (await SPORT.listGames(ymd(s0), end)).filter(g => g.final).sort((a, b) => b.t.localeCompare(a.t)); if (list[0]) navTo('/today', { d: String(list[0].day).replaceAll('-', '') }); else toast('No recent games found'); } catch (x) { toast('Could not look that up'); } e.target.disabled = false; } }, 'Jump to the latest game day')));
    return;
  }
  const order = { in: 0, pre: 1, post: 2 };
  const sorted = games.slice().sort((a, b) => order[a.state] - order[b.state] || a.t.localeCompare(b.t));
  const card = g => {
    const done = g.state !== 'pre', wa = g.state === 'post' && g.away.score > g.home.score, wh = g.state === 'post' && g.home.score > g.away.score;
    const row = (t, w) => `<div class="r${w ? ' w' : ''}">${t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy">` : '<i></i>'}<span class="nm">${esc(t.name || t.abbr)}${t.rec ? ` <small class="dim">${esc(t.rec)}</small>` : ''}</span><b>${done && t.score != null ? t.score : ''}</b></div>`;
    const status = g.state === 'pre' ? clockOf(g.t) : g.state === 'in' ? 'LIVE · ' + g.status : g.status || 'Final';
    const tail = g.extra?.length ? `<div class="cap">${esc(g.extra.join(' · '))}</div>` : '';
    const link = g.state === 'pre' ? href('/sim', { h: g.home.id, a: g.away.id }) : href('/game/' + g.id);
    return `<a class="gcard${g.state === 'in' ? ' live' : ''}" href="${link}">${row(g.away, wa)}${row(g.home, wh)}<div class="cap">${esc(status)}${g.note ? ' · ' + esc(g.note) : ''}</div>${tail}${g.state === 'pre' ? '<div class="cap dim">Open to simulate this matchup</div>' : ''}</a>`;
  };
  const nLive = games.filter(g => g.state === 'in').length, nDone = games.filter(g => g.state === 'post').length;
  const parts = [h('div', { class: 'panel pad', style: { marginTop: '14px' } }, h('div', { class: 'row sb' }, h('h2', {}, 'Scoreboard'), h('span', { class: 'cap' }, `${games.length} ${games.length === 1 ? 'game' : 'games'}${nLive ? ` · ${nLive} live` : ''}${nDone ? ` · ${nDone} final` : ''}`)), h('div', { class: 'gcards', style: { marginTop: '10px' }, html: sorted.map(card).join('') }))];
  const stand = standoutLines(games);
  if (stand.length) parts.push(h('div', { class: 'panel pad', style: { marginTop: '14px' } }, h('div', { class: 'row sb' }, h('h2', {}, 'Standout performances'), h('span', { class: 'cap' }, 'game leaders, biggest lines first')),
    h('ol', { class: 'standout' }, stand.map(x => h('li', {}, h('div', { html: avatar(x.pid || 0, x.who, 36) }), h('div', { class: 'grow', style: { minWidth: 0 } }, D.players.has(x.pid) ? h('a', { href: href('/player/' + x.pid), style: { fontWeight: 600 } }, x.who) : h('b', {}, x.who), h('div', { class: 'cap' }, `${x.team.abbr} vs ${x.opp.abbr}`)), h('div', { class: 'so-v', html: `<b>${esc(x.v)}</b><span>${esc(x.lab)}</span>` }))))));
  else if (nDone && SPORT.id === 'mlb') parts.push(h('div', { class: 'panel pad', style: { marginTop: '14px' } }, h('h2', {}, 'Pitching decisions'), h('div', { class: 'cap', style: { marginTop: '6px' } }, 'Winning, losing and saving pitchers are shown on each game card above.')));
  const st = storylines(D, games);
  if (st.length) parts.push(h('div', { class: 'panel pad', style: { marginTop: '14px' } }, h('h2', {}, 'Storylines'), h('ul', { class: 'storyl' }, st.map(s => h('li', {}, h('span', { class: 'pill' }, s.tag), s.g.state === 'pre' ? h('span', {}, s.text) : h('a', { href: href('/game/' + s.g.id) }, s.text))))));
  const clips = games.filter(g => g.state === 'post').flatMap(g => g.videos.map(v => ({ ...v, title: v.title || `${g.away.abbr} at ${g.home.abbr}` })));
  const hl = highlightsPanel(clips, 'Highlights'); if (hl) parts.push(h('div', { style: { marginTop: '14px' } }, hl));
  mount(out, parts);
  if (nLive) setTimeout(() => { if (location.hash.startsWith('#/today') && ![...el.querySelectorAll('video')].some(v => !v.paused)) render(true); }, 60000);
};
