/* compare_cfg.js: MLB compare tape/radar and the spray + zone side-by-side maps */
const MLB_TAPE = {
  bat: ['pa', 'hr', 'sb', 'avg', 'obp', 'slg', 'ops', 'wrcp', 'war', 'xwoba', 'xslg', 'ev', 'brl', 'hh', 'kp', 'bbp', 'whiff', 'oswing', 'bs', 'spr', 'oaa'],
  pit: ['ipn', 'so', 'era', 'fip', 'xera', 'war', 'kp', 'bbp', 'kbb', 'whiff', 'oswing', 'fbv', 'ev', 'brl', 'hh', 'xwoba', 'gb'],
  tbat: ['w', 'rs', 'rpg', 'ops', 'hr', 'sb', 'xwoba', 'ev', 'brl', 'hh', 'kp', 'bbp', 'whiff', 'oswing', 'bs', 'spr'],
  tpit: ['w', 'ra', 'rapg', 'era', 'fip', 'whip', 'kp', 'bbp', 'xwoba', 'xera', 'ev', 'brl', 'hh', 'whiff', 'oswing', 'fbv', 'oaa'],
};
const MLB_RADAR = {
  bat: [['wrcp', 'wRC+'], ['xwoba', 'xwOBA'], ['brl', 'Barrel%'], ['hh', 'Hard-hit%'], ['kp', 'K%'], ['bbp', 'BB%'], ['whiff', 'Whiff%'], ['oswing', 'Chase%'], ['spr', 'Speed']],
  pit: [['era', 'ERA'], ['fip', 'FIP'], ['xera', 'xERA'], ['kp', 'K%'], ['bbp', 'BB%'], ['whiff', 'Whiff%'], ['oswing', 'Chase%'], ['brl', 'Barrel%'], ['fbv', 'FB velo']],
  tbat: [['rpg', 'R/G'], ['ops', 'OPS'], ['xwoba', 'xwOBA'], ['brl', 'Barrel%'], ['hh', 'Hard-hit%'], ['kp', 'K%'], ['bbp', 'BB%'], ['whiff', 'Whiff%'], ['spr', 'Speed']],
  tpit: [['rapg', 'RA/G'], ['era', 'ERA'], ['fip', 'FIP'], ['kp', 'K%'], ['bbp', 'BB%'], ['xwoba', 'xwOBA'], ['brl', 'Barrel%'], ['whiff', 'Whiff%'], ['fbv', 'FB velo']],
};
async function mlbCompareMaps({ D, A, B, g, q, nameOf, colorHex }) {
    const box = $('#cmpmaps'); let view = q.v === 'zone' ? 'zone' : 'spray', zm = 'whiff';
    try {
      const [ra, rb] = await Promise.all([loadPitches(A.id, g, D.season), loadPitches(B.id, g, D.season)]);
      const draw = () => {
        const one = (rows, e, i) => {
          let html, tipFn;
          if (view === 'spray') { const bb = rows.filter(p => p.inplay && isFinite(p.hx) && isFinite(p.hy)); html = sprayChart(bb.map(p => { const [x, y] = hcFt(p.hx, p.hy); return { x, y, color: RES_COL[resCat(p.ev)], r: p.ev === 'home_run' ? 4.4 : 3.4 }; })); tipFn = k => tipForPitch(bb[k], g); }
          else { const rz = rows.filter(p => isFinite(p.px) && isFinite(p.pz)); const sp = zoneMetricSpec(zm, g); const res = zoneHeat(rz, { ...sp, szb: median(rows.map(p => p.szb)) || 1.6, szt: median(rows.map(p => p.szt)) || 3.5 }); html = res.html; tipFn = k => res.tips[k]; }
          const c = h('div', {}, h('div', { class: 'cap', style: { color: colorHex(i), marginBottom: '4px' } }, nameOf(e)), h('div', { html })); tipBind(c, tipFn); return c;
        };
        mount(box, h('div', { class: 'panel pad' }, h('div', { class: 'row sb', style: { marginBottom: '8px' } }, h('h2', {}, view === 'spray' ? (g === 'bat' ? 'Spray charts' : 'Batted balls allowed') : 'Zone maps'), h('div', { class: 'row' }, view === 'zone' ? h('select', { class: 'sel sm', onchange: e => { zm = e.target.value; draw(); }, html: ZONE_METRICS[g].map(([k, l]) => `<option value="${k}"${k === zm ? ' selected' : ''}>${esc(l)}</option>`).join('') }) : null, segControl([['spray', 'Spray'], ['zone', 'Zone']], view, v => { view = v; setQ({ v }); draw(); }, 'sm'))), h('div', { class: 'cmpmaps' }, one(ra, A, 0), one(rb, B, 1))));
        if (view === 'zone') { const s = $('select', box); if (s) s.value = zm; }
      };
      draw();
    } catch (e) { mount(box, h('div', { class: 'panel pad' }, h('p', { class: 'muted' }, 'Statcast maps are unavailable right now: ' + (e.message || e)))); }
}
SPORT.compare = { tape: MLB_TAPE, radar: MLB_RADAR, maps: mlbCompareMaps };
