/* home.js: sport home page (hero, entry cards, leaders) driven by SPORT.home */
App.pages.home = async function ({ D, el }) {
  const H = SPORT.home, cv = h('canvas', { 'aria-hidden': 'true' });
  const hero = h('section', { class: 'hero' }, cv,
    h('h1', {}, SPORT.first, h('em', {}, SPORT.word)),
    h('div', { class: 'tag' }, H.tag),
    h('p', {}, H.blurb),
    h('button', { class: 'hsearch', type: 'button', onclick: openSearch, html: `${ICON.search.replace('<svg', '<svg width="18" height="18"')}<span>Search every player and team, ${esc(SPORT.seasons.label(D.season))}</span><kbd>⌘</kbd><kbd>K</kbd>` }));
  const cards = h('div', { class: 'cards4' }, H.cards.map(c => h('a', { class: 'nc', href: href(c.href) }, h('b', {}, c.title), h('span', {}, c.desc))));
  const top = (g, k, n = 5, qual = true, asc = false) => { const rows = listOf(D, g).filter(r => !qual || isQual(D, g, r)).filter(r => isFinite(r[k])); rows.sort((a, b) => asc ? a[k] - b[k] : b[k] - a[k]); return rows.slice(0, n); };
  const list = ({ title, g, k, f, qual = true, asc = false }) => {
    const rows = top(g, k, 5, qual, asc), isT = isTeamG(g);
    return h('div', { class: 'panel lead' }, h('h3', {}, title, h('a', { href: href('/stats/' + g, { sort: k, dir: asc ? 'asc' : '' }) }, 'All →')),
      h('ol', {}, rows.map((r, i) => h('li', { onclick: () => navTo((isT ? '/team/' : '/player/') + r.id), html: `<i>${i + 1}</i><span class="ln">${esc(isT ? D.teams.get(r.id).name : r.name)}${isT ? '' : `<small>${esc(D.teams.get(r.tid)?.abbr || '')}</small>`}</span><b>${fmt(r[k], f)}</b>` }))));
  };
  mount(el, hero, cards, h('div', { style: { marginTop: '30px' } }, h('div', { class: 'eyebrow' }, `${SPORT.seasons.label(D.season)} LEADERS · ${D.final ? 'FINAL ' + (D.stage || 'REGULAR SEASON') : 'THROUGH ' + (SPORT.unit || 'GAME') + ' ' + D.maxG}`)), h('div', { class: 'leaders' }, H.leaders.map(list)));
  (SPORT.heroCanvas || heroGeneric)(cv);
};
/* fallback hero: drifting dots */
function heroGeneric(cv) {
  const ctx = cv.getContext('2d'); let W, H, raf; const dots = Array.from({ length: 36 }, () => ({ x: Math.random(), y: Math.random(), v: .0002 + Math.random() * .0004 }));
  const size = () => { const r = cv.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }; size(); addEventListener('resize', size);
  const col = () => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#f80';
  const f = () => { if (!document.body.contains(cv)) return; ctx.clearRect(0, 0, W, H); ctx.fillStyle = col(); ctx.globalAlpha = .5; dots.forEach(d => { d.x = (d.x + d.v) % 1; ctx.beginPath(); ctx.arc(d.x * W, d.y * H, 2.2, 0, 7); ctx.fill(); }); raf = requestAnimationFrame(f); }; f();
}

/* a search handed over from another sport's palette: open the palette with the words already typed */
App.pages.search = async function ({ q }) { const words = q.q || ''; navTo('/'); const go = n => { if (App.D || n > 60) openSearch(words); else setTimeout(() => go(n + 1), 250); }; setTimeout(() => go(0), 300); };
