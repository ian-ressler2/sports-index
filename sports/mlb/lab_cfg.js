/* lab_cfg.js: MLB lab recipes and the Zone Lab mode */
const MLB_RECIPES = {
  bat: [
    { name: 'Complete hitter', desc: 'Production, contact quality, eye, power and wheels', ing: { wrcp: 2, xwoba: 2, brl: 1, hh: 1, bbp: 1, kp: 1, spr: .5 } },
    { name: 'Hit tool', desc: 'Makes contact, finds grass, rarely whiffs', ing: { avg: 1, xba: 1.5, kp: 1, whiff: 1, izcon: 1 } },
    { name: 'Raw power', desc: 'Exit velocity and barrels', ing: { ev: 1, evb: 1, brl: 2, hh: 1, iso: 1 } },
    { name: 'Eye test', desc: 'Selective, patient, draws walks', ing: { bbp: 2, oswing: 2, kp: 1, zone: .5, whiff: 1 } },
    { name: 'Bat speed', desc: 'Fast swings that stay on plane', ing: { bs: 2, fast: 1, sq: 1, blast: 1 } },
    { name: 'Luck check', desc: 'Results minus contact quality: high means due to regress', ing: { woba: 1, xwoba: -1 } },
    { name: 'Athlete', desc: 'Run and field', ing: { spr: 1, oaa: 1, bsr: 1, frp: 1 } },
  ],
  pit: [
    { name: 'Ace profile', desc: 'Strikeouts, walks, contact suppression, run prevention', ing: { kbb: 2, xera: 1.5, fip: 1.5, brl: 1, whiff: 1 } },
    { name: 'Stuff', desc: 'Velocity and bats missed', ing: { fbv: 1.5, whiff: 2, oswing: 1, kp: 1 } },
    { name: 'Command', desc: 'Throws strikes, avoids free passes', ing: { bbp: 2, fstrike: 1, zone: 1, kbb: 1 } },
    { name: 'Contact suppression', desc: 'Soft contact and few barrels', ing: { ev: 1, brl: 1.5, hh: 1, xwoba: 1.5, sweet: .5 } },
    { name: 'Ground-baller', desc: 'Keeps it on the dirt', ing: { gb: 2, ld: 1, hr9: 1 } },
    { name: 'Luck check', desc: 'ERA minus xERA; negative weight ranks the unlucky first', ing: { era: 1, xera: -1 } },
  ],
};
/* ---- Zone Lab ---- */
const ZKEY = { pull_gb: 'pgb', straight_gb: 'sgb', oppo_gb: 'ogb', pull_air: 'pair', straight_air: 'sair', oppo_air: 'oair' };
function zoneLab(D, q, box) {
  const g = q.g === 'pit' ? 'pit' : 'bat'; let sel = new Set((q.z || 'pull_air').split(',').filter(k => ZKEY[k]));
  if (!sel.size) sel = new Set(['pull_air']);
  const src = g === 'bat' ? D.bbBat : D.bbPit;
  const fieldBox = h('div', {}), outBox = h('div', {});
  const save = () => setQ({ mode: 'zone', g, z: [...sel].join(',') });
  if (!src.size) { mount(box, h('div', { class: 'panel pad' }, h('h2', {}, 'Batted-ball directions did not load'), h('p', { class: 'muted' }, 'The Savant batted-ball leaderboard is unavailable right now, so the Zone Lab has nothing to work with.'))); return; }
  const scale = (() => { let mx = 0; for (const v of src.values()) mx = Math.max(mx, v.gb || 0, v.air || 0); return mx <= 1.01 ? 100 : 1; })();
  const share = v => [...sel].reduce((a, k) => a + (v[ZKEY[k]] || 0), 0) * scale;
  const drawField = () => { fieldBox.innerHTML = regionField(sel); $$('polygon[data-k]', fieldBox).forEach(p => p.onclick = () => { const k = p.dataset.k; sel.has(k) ? sel.delete(k) : sel.add(k); if (!sel.size) sel.add(k); save(); drawField(); drawOut(); }); };
  const drawOut = () => {
    const minB = g === 'bat' ? 100 : 100;
    let rows = [...src.values()].filter(v => v.bbe >= minB && (g === 'bat' ? D.bat : D.pit).has(v.id)).map(v => ({ v, s: share(v), r: (g === 'bat' ? D.bat : D.pit).get(v.id) })).filter(x => isFinite(x.s));
    const lgAvg = mean(rows.map(x => x.s)); rows.sort((a, b) => b.s - a.s);
    const label = [...sel].map(k => k.replace('_', ' ')).join(' + ');
    const rw = a => a.map((x, i) => `<tr class="clk" onclick="location.hash='${pLink(x.v.id)}'"><td class="rk">${i + 1}</td><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${avatar(x.v.id, x.r.name, 22)}<b>${esc(x.r.name)}</b><span class="dim">${esc(abbrOf(D, x.r))}</span></span></td><td style="font-weight:700">${x.s.toFixed(1)}%</td><td class="dim">${x.v.bbe}</td></tr>`).join('');
    const head = '<thead><tr><th>#</th><th style="text-align:left">Player</th><th>Share</th><th>BBE</th></tr></thead>';
    mount(outBox, h('div', { class: 'callout' }, h('span', {}, 'Selected: ', h('b', {}, label || 'nothing')), h('span', {}, 'League average ', h('b', {}, lgAvg.toFixed(1) + '%')), h('span', {}, rows.length + ' players with 100+ batted balls')),
      h('div', { class: 'grid2', style: { alignItems: 'start', padding: '12px' } }, h('div', {}, h('div', { class: 'cap', style: { marginBottom: '6px' } }, 'HIGHEST'), h('div', { class: 'sc', style: { maxHeight: '60vh' }, html: `<table class="dt">${head}<tbody>${rw(rows.slice(0, 25))}</tbody></table>` })), h('div', {}, h('div', { class: 'cap', style: { marginBottom: '6px' } }, 'LOWEST'), h('div', { class: 'sc', style: { maxHeight: '60vh' }, html: `<table class="dt">${head}<tbody>${rows.slice(-25).reverse().map((x, i) => ({ ...x })).map((x, i) => `<tr class="clk" onclick="location.hash='${pLink(x.v.id)}'"><td class="rk">${rows.length - i}</td><td style="text-align:left"><span class="row" style="gap:8px;flex-wrap:nowrap">${avatar(x.v.id, x.r.name, 22)}<b>${esc(x.r.name)}</b><span class="dim">${esc(abbrOf(D, x.r))}</span></span></td><td style="font-weight:700">${x.s.toFixed(1)}%</td><td class="dim">${x.v.bbe}</td></tr>`).join('')}</tbody></table>` }))));
  };
  const seg = segControl([['bat', 'Batters'], ['pit', 'Pitchers (allowed)']], g, v => navTo('/lab', { mode: 'zone', g: v }), 'sm');
  mount(box, h('div', { class: 'lab2' }, h('div', { class: 'panel pad stack', style: { gap: '12px' } }, h('div', { class: 'row sb' }, h('h2', {}, 'Carve up the field'), seg), h('p', { class: 'muted', style: { margin: 0, fontSize: '13px' } }, 'Click wedges to select where batted balls go. Inner is on the ground, outer is in the air (line drives and flies). Players are ranked by the share of their batted balls landing in your selection.'), fieldBox,
    h('div', { class: 'chips' }, [['Pull air', ['pull_air']], ['Oppo air', ['oppo_air']], ['All pull', ['pull_gb', 'pull_air']], ['Up the middle', ['straight_gb', 'straight_air']], ['Ground balls', ['pull_gb', 'straight_gb', 'oppo_gb']], ['Shift-prone', ['pull_gb']]].map(([l, ks]) => h('button', { class: 'chip', type: 'button', onclick: () => { sel = new Set(ks); save(); drawField(); drawOut(); } }, l)))), h('div', { class: 'panel' }, outBox)));
  drawField(); drawOut();
}


SPORT.lab = {
  recipes: MLB_RECIPES, ref: { bat: 'wrcp', pit: 'war' },
  plotDefaults: { bat: ['kp', 'brl'], pit: ['fbv', 'kp'], tbat: ['rpg', 'ops'], tpit: ['rapg', 'xwoba'] },
  extra: [{ id: 'zone', title: 'Zone Lab', desc: 'Select parts of the field and rank who hits or allows balls there', run: zoneLab }],
};
