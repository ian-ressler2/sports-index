/* sim.js (MLB): plate-appearance game simulator. Batters and pitchers carry their own season rates, combined with the odds-ratio method,
   with pitch sequences, hit locations, baserunning, a starter who tires and a bullpen. */
const MLB_OUT = ['k', 'bb', 'hbp', 'hr', 'd3', 'd2', 'd1', 'ip'];
function mlbRates(r, pa) { const h = r.h || 0, d2 = r.d2 || 0, d3 = r.d3 || 0, hr = r.hr || 0, so = r.so || 0, bb = r.bb || 0, hbp = r.hbp || 0, n = Math.max(1, pa); return { k: so / n, bb: bb / n, hbp: hbp / n, hr: hr / n, d3: d3 / n, d2: d2 / n, d1: Math.max(0, h - d2 - d3 - hr) / n, ip: Math.max(.05, 1 - (so + bb + hbp + h) / n) }; }
function mlbLeague(D) {
  const t = { pa: 0, h: 0, d2: 0, d3: 0, hr: 0, so: 0, bb: 0, hbp: 0 }; for (const r of D.batList) for (const k in t) t[k] += (k === 'pa' ? r.pa : r[k]) || 0;
  return { ...mlbRates(t, t.pa), nonHr: 0, split2: t.d2 / Math.max(1, t.h - t.hr), split3: t.d3 / Math.max(1, t.h - t.hr) };
}
function mlbMatch(B, P, L) {
  const w = {}; let s = 0; for (const o of MLB_OUT) { w[o] = Math.max(1e-4, B[o]) * Math.max(1e-4, P[o]) / Math.max(1e-4, L[o]); s += w[o]; } for (const o of MLB_OUT) w[o] /= s; return w;
}
function mlbTeamSim(D, id, L) {
  const bats = D.batList.filter(r => r.tid === id && r.pa >= 25 && r.pos !== 'P').sort((a, b) => b.pa - a.pa).slice(0, 12);
  const ps = D.pitList.filter(r => r.tid === id && r.bf >= 10), sp = ps.filter(r => r.gs >= 3).sort((a, b) => b.ipn - a.ipn).slice(0, 5), rp = ps.filter(r => !(r.gs >= 3) || r.gs < r.g * .3).sort((a, b) => b.g - a.g).slice(0, 8);
  const fill = (arr, n, mk) => { const o = arr.slice(); while (o.length < n) o.push(mk(o.length)); return o; };
  const lineupRaw = fill(bats, 9, i => ({ name: `Batter ${i + 1}`, pa: 300, h: 60, d2: 12, d3: 1, hr: 8, so: 65, bb: 25, hbp: 3, obp: .315, bsx: 'Batter' })).slice(0, 9);
  const lineup = lineupRaw.slice().sort((a, b) => (b.obp || 0) - (a.obp || 0)); const ord = [lineup[0], lineup[3], lineup[1], lineup[2], lineup[4], lineup[5], lineup[6], lineup[7], lineup[8]].filter(Boolean);
  const bat = ord.map(r => ({ n: mlbShort(r.name), r: mlbRates(r, r.pa), spd: r.spr || 27 }));
  const pit = r => ({ n: mlbShort(r.name), r: mlbRates({ so: r.so, bb: r.bb, hbp: r.hbp, hr: r.hr, h: r.h, d2: (r.h - r.hr) * L.split2, d3: (r.h - r.hr) * L.split3 }, r.bf), len: r.gs ? clamp(r.bf / r.gs, 16, 28) : 9, np: r.np && r.bf ? r.np / r.bf : 3.9, fb: r.fbv || 93 });
  const starters = fill(sp, 1, () => ({ name: 'Starter', bf: 500, so: 110, bb: 40, hbp: 5, hr: 15, h: 120, gs: 25 })).map(pit), pen = fill(rp, 3, i => ({ name: `Reliever ${i + 1}`, bf: 200, so: 50, bb: 18, hbp: 2, hr: 6, h: 45, gs: 0, g: 40 })).map(pit);
  return { id, bat, starters, pen, rot: starters };
}
function mlbSimulate(D, hid, aid, rng) {
  const L = mlbLeague(D), th = D.teams.get(hid), ta = D.teams.get(aid), S = { [hid]: mlbTeamSim(D, hid, L), [aid]: mlbTeamSim(D, aid, L) };
  const mk = t => ({ id: t.id, abbr: t.abbr, name: t.name, logo: `https://www.mlbstatic.com/team-logos/${t.id}.svg`, color: t.color, score: 0 });
  const G = { id: 'sim', sim: true, home: mk(th), away: mk(ta), ev: [], tot: 1, dividers: [], sub: '', ot: false };
  const sc = { [hid]: 0, [aid]: 0 }, other = id => id === hid ? aid : hid;
  const st = { [hid]: { idx: 0, pitcher: rng.pick(S[hid].starters), bf: 0, pc: 0, used: 0 }, [aid]: { idx: 0, pitcher: rng.pick(S[aid].starters), bf: 0, pc: 0, used: 0 } };
  const pos = a => a < -34 ? 'left field' : a < -12 ? 'left-center' : a < 12 ? 'center field' : a < 34 ? 'right-center' : 'right field';
  const inf = a => a < -30 ? 'third baseman' : a < -8 ? 'shortstop' : a < 8 ? 'pitcher' : a < 30 ? 'second baseman' : 'first baseman';
  const POS = { lineout: ['lines out', 'on a line drive'], flyout: ['flies out', 'on a fly ball'], ground: ['grounds out', 'on a ground ball'], pop: ['pops out', 'on a pop fly'] };
  const nmOf = (arr => d => arr[d])(['Four-Seam Fastball', 'Slider', 'Changeup', 'Curveball', 'Sinker']), codes = ['FF', 'SL', 'CH', 'CU', 'SI'];
  /* a believable pitch sequence that ends the way the plate appearance ended */
  function sequence(pit, end) {
    const out = []; let b = 0, s = 0; const mixes = rng.chance(.5) ? [.5, .22, .12, .1, .06] : [.38, .2, .12, .1, .2];
    const mkp = (call, inZone) => { const ty = rng.weighted([0, 1, 2, 3, 4], i => mixes[i]), a = rng() * 6.28, rr = inZone ? Math.sqrt(rng()) * .85 : .95 + rng() * 1.1; return { px: Math.cos(a) * rr * (inZone ? .9 : 1), pz: clamp(2.55 + Math.sin(a) * rr * (inZone ? .95 : 1.05) , .6, 4.7), d: call, ty: codes[ty], nm: nmOf(ty), v: pit.fb - [0, 7, 8, 14, 1][ty] + rng.norm() * 1.4, szt: 3.5, szb: 1.6, b, s }; };
    const target = end === 'bb' ? [3, rng.int(0, 2)] : end === 'k' ? [rng.int(0, 3), 2] : [rng.int(0, 3), rng.int(0, 2)];
    let guard = 0;
    while ((b < target[0] || s < target[1]) && guard++ < 14) {
      const needB = target[0] - b, needS = target[1] - s;
      if (needB && (!needS || rng.chance(needB / (needB + needS)))) { out.push(mkp('Ball', false)); b++; }
      else { const fl = s >= 2 && rng.chance(.35) ? true : false; if (fl) out.push(mkp('Foul', true)); else { out.push(mkp(rng.chance(.55) ? 'Called Strike' : (end === 'k' && s === 2 ? 'Swinging Strike' : 'Swinging Strike'), true)); s++; } }
      if (s === 2 && target[1] >= 2 && rng.chance(.4)) out.push(mkp('Foul', true));
    }
    const last = end === 'bb' ? mkp('Ball', false) : end === 'k' ? mkp(rng.chance(.68) ? 'Swinging Strike' : 'Called Strike', true) : end === 'hbp' ? mkp('Hit By Pitch', false) : mkp('In play, out(s)', true);
    out.push(last); return out;
  }
  function spray(kind) {
    const a = clamp(rng.norm() * 21, -43, 43), t = a * Math.PI / 180;
    let r = kind === 'hr' ? 340 + rng.norm() * 25 + Math.max(0, 40 - Math.abs(a)) * 1.2 : kind === 'd3' ? 300 + rng.norm() * 28 : kind === 'd2' ? 230 + rng.norm() * 40 : kind === 'd1' ? 100 + Math.abs(rng.norm()) * 60 + rng() * 80 : kind === 'ground' ? 60 + rng() * 65 : kind === 'pop' ? 90 + rng() * 40 : kind === 'line' ? 140 + rng() * 120 : 190 + rng() * 150;
    if (kind === 'hr') r = Math.max(r, 330 - 70 * Math.pow(Math.abs(a) / 45, 2) + 12);
    return { a, x: r * Math.sin(t), y: r * Math.cos(t), r };
  }
  const inningOf = per => Math.ceil(per / 2);
  let per = 1, outs = 0, bases = [null, null, null];
  const push = (bt, pt, tx, k, P) => { const top = per % 2 === 1, tid = top ? aid : hid; G.ev.push({ per, clk: `${Math.min(outs, 3)} out${outs === 1 ? '' : 's'}`, t: G.ev.length, h: sc[hid], a: sc[aid], tid, tx, ctx: `${pt.n} pitching to ${bt.n}`, k, p: { inn: inningOf(per), top, outs: Math.min(outs, 3), bases: bases.map(Boolean), pitches: [], hit: null, ev: '', evt: '', bat: bt.n, pit: pt.n, tid, ...P } }); };
  const score = (id, n, e) => { if (!n) return; sc[id] += n; G[id === hid ? 'home' : 'away'].score = sc[id]; e.h = sc[hid]; e.a = sc[aid]; };
  function bullpen(id, lead) {
    const T = S[id], s = st[id], close = per >= 17 && lead > 0 && lead <= 3 ? T.pen[0] : null; const cand = T.pen.filter(p => p !== s.pitcher);
    return close && close !== s.pitcher ? close : rng.weighted(cand.length ? cand : T.pen, p => 1 + (T.pen.indexOf(p) < 3 ? 1 : 0));
  }
  function halfInning(per0) {
    per = per0; outs = 0; const top = per % 2 === 1, off = top ? aid : hid, def = other(off), O = S[off], dS = st[def];
    bases = [null, null, null]; if (inningOf(per) >= 10) bases[1] = O.bat[(st[off].idx + 8) % 9];
    let guard = 0;
    while (outs < 3 && guard++ < 70) {
      const lead = sc[def] - sc[off], p = dS.pitcher, isStarter = S[def].starters.includes(p);
      const lim = Math.min(112, p.len * p.np + 12), change = isStarter ? (dS.pc >= lim || dS.bf >= p.len + 5) : (dS.bf >= 9 || (outs === 0 && dS.bf >= 3 && rng.chance(.5)));
      if (change) { const np = bullpen(def, lead); if (np !== p) { dS.pitcher = np; dS.bf = 0; dS.pc = 0; if (G.ev.length) push(O.bat[st[off].idx % 9], np, `Pitching change: ${np.n} replaces ${p.n}.`, 'bg', {}); } }
      const pit = dS.pitcher, bt = O.bat[st[off].idx % 9]; st[off].idx++; dS.bf++;
      const w = mlbMatch(bt.r, pit.r, L), res = rng.weighted(MLB_OUT, o => w[o]);
      let tx = '', k = '', P = { ev: '', evt: '' }, pitches = []; const scored = [];
      const moveRunners = kind => {
        const [b1, b2, b3] = bases; let nb = [null, null, null];
        if (kind === 'walk') { if (b1 && b2 && b3) { scored.push(b3); nb = [bt, b1, b2]; } else if (b1 && b2) nb = [bt, b1, b2]; else if (b1) nb = [bt, b1, b3]; else nb = [bt, b2, b3]; }
        else if (kind === 'd1') { if (b3) scored.push(b3); let to3 = false; if (b2) { if (rng.chance(.55 + (b2.spd - 27) * .03)) scored.push(b2); else { nb[2] = b2; to3 = true; } } if (b1) { if (!to3 && !b2 && rng.chance(.26)) nb[2] = b1; else nb[1] = b1; } nb[0] = bt; }
        else if (kind === 'd2') { if (b3) scored.push(b3); if (b2) scored.push(b2); if (b1) { if (rng.chance(.42)) scored.push(b1); else nb[2] = b1; } nb[1] = bt; }
        else if (kind === 'd3') { for (const r of [b3, b2, b1]) if (r) scored.push(r); nb[2] = bt; }
        else if (kind === 'hr') { for (const r of [b3, b2, b1]) if (r) scored.push(r); scored.push(bt); }
        bases = nb;
      };
      if (res === 'k') { outs++; pitches = sequence(pit, 'k'); const looking = pitches[pitches.length - 1].d === 'Called Strike'; tx = `${bt.n} strikes out ${looking ? 'looking' : 'swinging'}.`; P = { ev: 'strikeout', evt: 'Strikeout' }; }
      else if (res === 'bb') { pitches = sequence(pit, 'bb'); moveRunners('walk'); tx = `${bt.n} walks.`; P = { ev: 'walk', evt: 'Walk' }; }
      else if (res === 'hbp') { pitches = sequence(pit, 'hbp'); moveRunners('walk'); tx = `${bt.n} is hit by a pitch.`; P = { ev: 'hit_by_pitch', evt: 'Hit By Pitch' }; }
      else {
        pitches = sequence(pit, 'ip');
        const kind = res === 'ip' ? rng.weighted(['ground', 'flyout', 'lineout', 'pop'], x => ({ ground: .46, flyout: .33, lineout: .13, pop: .08 })[x]) : res;
        const sp = spray(kind === 'flyout' ? 'fly' : kind === 'lineout' ? 'line' : kind), where = sp.r < 135 ? inf(sp.a) : pos(sp.a);
        P.hit = { x: sp.x, y: sp.y, ev: res === 'hr' ? 101 + rng.norm() * 5 : kind === 'pop' ? 70 + rng.norm() * 6 : 89 + rng.norm() * 9, la: kind === 'ground' ? -5 + rng.norm() * 8 : kind === 'pop' ? 55 + rng.norm() * 6 : kind === 'lineout' ? 14 + rng.norm() * 5 : res === 'hr' ? 28 + rng.norm() * 4 : 20 + rng.norm() * 12, dist: sp.r };
        if (res === 'hr') { moveRunners('hr'); tx = `${bt.n} homers on a fly ball to ${where}${scored.length === 4 ? ' (grand slam)' : scored.length > 1 ? ` (${scored.length}-run)` : ''}.`; P.ev = 'home_run'; P.evt = 'Home Run'; k = 'bg'; }
        else if (res === 'd3') { moveRunners('d3'); tx = `${bt.n} triples on a ${rng.pick(['line drive', 'fly ball'])} to ${where}.`; P.ev = 'triple'; P.evt = 'Triple'; k = 'bg'; }
        else if (res === 'd2') { moveRunners('d2'); tx = `${bt.n} doubles on a ${rng.pick(['line drive', 'fly ball', 'ground ball'])} to ${where}.`; P.ev = 'double'; P.evt = 'Double'; }
        else if (res === 'd1') { moveRunners('d1'); tx = `${bt.n} singles on a ${rng.pick(['ground ball', 'line drive', 'soft liner'])} to ${where}.`; P.ev = 'single'; P.evt = 'Single'; }
        else if (rng.chance(.012)) { moveRunners('d1'); tx = `${bt.n} reaches on a fielding error by the ${where}.`; P.ev = 'field_error'; P.evt = 'Field Error'; k = 'bg'; }
        else {
          const [verb, how] = POS[kind], [b1, b2, b3] = bases; let nb = [b1, b2, b3];
          if (kind === 'ground' && b1 && outs < 2 && rng.chance(.5)) {
            outs += 2; nb = [null, b2, b3];
            if (outs < 3) { if (b3) { scored.push(b3); nb[2] = null; } if (b2) { nb[2] = b2; nb[1] = null; } }
            tx = `${bt.n} grounds into a double play, ${where} to ${rng.pick(['second', 'first'])}.`; P.ev = 'grounded_into_double_play'; P.evt = 'Grounded Into DP'; k = 'bg';
          } else {
            outs++; tx = `${bt.n} ${verb} ${how} to ${where}.`; P.ev = 'field_out'; P.evt = 'Field Out';
            if (outs < 3 && kind === 'ground') { if (b3 && rng.chance(.55)) { scored.push(b3); nb[2] = null; } if (b2 && !nb[2] && rng.chance(.55)) { nb[2] = b2; nb[1] = null; } if (b1 && !nb[1]) { nb[1] = b1; nb[0] = null; } }
            else if (outs < 3 && kind === 'flyout') { if (b3 && rng.chance(.52)) { scored.push(b3); nb[2] = null; P.ev = 'sac_fly'; P.evt = 'Sac Fly'; tx = `${bt.n} hits a sacrifice fly to ${where}.`; } else if (b2 && !b3 && rng.chance(.2)) { nb[2] = b2; nb[1] = null; } }
          }
          bases = nb;
        }
      }
      const runs = scored.length; if (runs) { const names = scored.filter(x => x !== bt || res !== 'hr').map(x => x.n); if (names.length) tx += ` ${names.join(', ')} ${names.length > 1 ? 'score' : 'scores'}.`; k = 'sc'; }
      dS.pc += pitches.length; push(bt, pit, tx, k, { ...P, pitches }); score(off, runs, G.ev[G.ev.length - 1]);
      if (per % 2 === 0 && inningOf(per) >= 9 && sc[hid] > sc[aid]) return true;
    }
    return false;
  }
  let inn = 1;
  while (inn <= 9 || sc[hid] === sc[aid]) {
    halfInning(inn * 2 - 1);
    if (inn >= 9 && sc[hid] > sc[aid]) break;
    halfInning(inn * 2); if (inn >= 9 && sc[hid] !== sc[aid]) break;
    if (++inn > 18) { sc[rng.chance(.5) ? hid : aid]++; G.home.score = sc[hid]; G.away.score = sc[aid]; break; }
  }
  G.ot = inn > 9; G.tot = Math.max(1, G.ev.length - 1); G.dividers = G.ev.map((e, n) => n && e.per !== G.ev[n - 1].per && e.per % 2 === 1 ? n : -1).filter(n => n > 0);
  G.sub = `${G.away.abbr} ${G.away.score}, ${G.home.abbr} ${G.home.score}${inn > 9 ? ` (${inn})` : ''}`; return G;
}
SPORT.sim = {
  bin: 2, run: (D, h, a, rng) => mlbSimulate(D, h, a, rng),
  blurb: 'Every pitch sequence and every ball in play is drawn from the real batters’ and pitchers’ season rates.',
  note: 'Each plate appearance combines the batter’s own strikeout, walk, home-run, double, triple and single rates with the pitcher’s, using the odds-ratio method against the league average, so a great hitter facing a great pitcher lands in between. Lineups are the nine regulars with the most plate appearances ordered by on-base percentage; the starter goes until he reaches his usual workload or about 110 pitches, then relievers take over, with the best one saved for a close ninth. Runners advance on hits, outs and walks by simple rules (with an automatic runner on second from the tenth inning), pitch sequences are generated to match each result, and batted balls are placed on the field by type. It is a model: no defense, ballparks, platoons, injuries or stolen bases, so treat results as a plausible game, not a prediction.',
};

/* "what if" changes for the simulator page: hitters out of the lineup, and which starting pitcher takes the mound */
SPORT.sim.what = {
  blurb: 'Take hitters out of the lineup (a replacement-level bat steps in) or pick the starting pitcher. He pitches as long as his season workload suggests, then the bullpen takes over.',
  startLabel: 'Starting pitcher',
  roster: (D, tid) => D.batList.filter(r => r.tid === tid && r.pa >= 25 && r.pos !== 'P').sort((a, b) => b.pa - a.pa).slice(0, 10).map(r => ({ id: r.id, name: mlbShort(r.name), tag: r.pos })),
  starters: (D, tid) => D.pitList.filter(r => r.tid === tid && r.gs >= 3 && r.bf >= 10).sort((a, b) => b.ipn - a.ipn).slice(0, 6).map(r => ({ id: r.id, name: mlbShort(r.name), note: isFinite(r.era) ? `${r.era.toFixed(2)} ERA` : '' })),
  apply(D, adj) {
    const D2 = { ...D, batList: D.batList.filter(r => !adj.out.has(String(r.id))) }, pick = Object.entries(adj.start || {}).map(([t, p]) => [+t, String(p)]);
    if (pick.length) D2.pitList = D.pitList.map(r => { const want = pick.find(([t]) => t === r.tid); if (!want || !(r.gs >= 3)) return r; return String(r.id) === want[1] ? { ...r, ipn: 1e9 } : { ...r, gs: 0 }; });
    return D2;
  },
};
