/* sim.js (NHL): shot-by-shot game simulator. Shot volume, shooting percentage, save percentage, penalties and power plays come from each team's season. */
const nhlShort = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : p[0] || 'Player'; };
function nhlLeague(D) {
  const L = D.tskList || [], M = (k, d) => { const v = L.map(r => r[k]).filter(x => isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : d; };
  return { sgp: M('sgp', 29.5), shp: M('shp', 9.6), svp: M('svp', .905) > 1 ? M('svp', .905) / 100 : M('svp', .905), ppopg: M('ppopg', 3.1), pimgp: M('pimgp', 8.5), ppp: M('ppp', 21) };
}
function nhlTeamSim(D, id, Lg) {
  const t = D.tsk.get(id) || {}, sk = (D.skList || []).filter(r => r.tid === id && r.gp >= 5).sort((a, b) => b.toi - a.toi).slice(0, 18), gk = (D.gkList || []).filter(r => r.tid === id).sort((a, b) => b.toi - a.toi);
  const F = sk.length >= 6 ? sk : [...sk, ...Array.from({ length: 6 - sk.length }, (_, i) => ({ name: `Skater ${i + 1}`, s: 60, g: 6, a: 10, gp: 40, pos: 'C', shp: Lg.shp }))];
  const svp = t.svp > 1 ? t.svp / 100 : t.svp;
  return { id, sgp: t.sgp || Lg.sgp, sagp: t.sagp || Lg.sgp, shp: (isFinite(t.shp) ? t.shp : Lg.shp) / 100, svp: isFinite(svp) ? svp : Lg.svp, ppopg: t.ppopg || Lg.ppopg, pimgp: t.pimgp || Lg.pimgp, ppp: isFinite(t.ppp) ? t.ppp : Lg.ppp,
    sk: F.map(r => ({ n: nhlShort(r.name), w: Math.max(5, r.s || 30) * (r.pos === 'D' ? .55 : 1), a: Math.max(1, (r.a || 4) / Math.max(1, r.gp || 1) * 10 + (r.pos === 'D' ? 1 : 0)), shp: isFinite(r.shp) && r.s >= 40 ? r.shp / 100 : Lg.shp / 100, pos: r.pos, pim: r.pim || 4 })),
    gk: gk.length ? gk.slice(0, 2).map((r, i) => ({ n: nhlShort(r.name), w: i ? .12 : 1, svp: r.sa >= 200 && isFinite(r.svp) ? r.svp : svp || Lg.svp })) : [{ n: 'Goalie', w: 1, svp: svp || Lg.svp }] };
}
function nhlSimulate(D, hid, aid, rng) {
  const Lg = nhlLeague(D), th = D.teams.get(hid), ta = D.teams.get(aid), S = { [hid]: nhlTeamSim(D, hid, Lg), [aid]: nhlTeamSim(D, aid, Lg) };
  const mk = t => ({ id: t.id, abbr: t.abbr, name: t.name, logo: t.logo, color: t.color, score: 0 });
  const G = { id: 'sim', sim: true, home: mk(th), away: mk(ta), ev: [], tot: 3600, dividers: [1200, 2400], sub: '', ot: false };
  const sc = { [hid]: 0, [aid]: 0 }, other = id => id === hid ? aid : hid, abbr = id => id === hid ? th.abbr : ta.abbr;
  const goalie = id => rng.weighted(S[id].gk, g => g.w), skater = (id, ...ex) => rng.weighted(S[id].sk.filter(p => !ex.includes(p)), p => p.w);
  /* shot quality by distance, scaled so the average shot goes in at the shooter's rate */
  const xg = d => Math.exp(-d / 17) * .42 + .02;
  const dists = []; for (let i = 0; i < 400; i++) dists.push(clamp(Math.exp(Math.log(27) + rng.norm() * .45), 4, 62)); const xgMean = dists.reduce((a, d) => a + xg(d), 0) / dists.length;
  let per = 1, t0 = 0, left = 1200, pens = [];
  const clk = () => `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
  const push = (tid, tx, ctx, P, scoring, big) => G.ev.push({ per, clk: clk(), t: t0 + (per <= 3 ? 1200 : 300) - left, h: sc[hid], a: sc[aid], tid, tx, ctx, k: scoring ? 'sc' : big ? 'bg' : '', p: { kind: '', x: null, y: null, ty: ctx, tid, ...P } });
  const endOf = (id, p) => (id === hid ? (p % 2 === 1 ? 1 : -1) : (p % 2 === 1 ? -1 : 1)) * (p >= 4 ? -1 : 1);
  const strength = id => { const own = pens.filter(x => x.team === id).length, opp = pens.filter(x => x.team !== id).length; return opp - own; };
  function shotAttempt(id, ppState, ot3) {
    const T = S[id], O = S[other(id)], sh = skater(id), gk = goalie(other(id)), d = clamp(Math.exp(Math.log(27) + rng.norm() * .45), 4, 62), th0 = rng.norm() * (d < 12 ? 38 : 26) * Math.PI / 180;
    const end = endOf(id, per), x = end * clamp(89 - d * Math.cos(th0), 0, 98), y = clamp(d * Math.sin(th0), -40, 40), r = rng();
    const pBlock = .22, pMiss = .18;
    if (r < pBlock) { const b = skater(other(id)); push(id, `${sh.n} shot blocked by ${b.n}.`, 'Blocked', { kind: 'B', x, y, tid: id }); return false; }
    if (r < pBlock + pMiss) { push(id, `${sh.n} shot missed ${rng.pick(['wide of the net', 'high', 'wide left', 'wide right'])}.`, 'Missed', { kind: 'M', x, y, tid: id }); return false; }
    const kind = d < 10 ? rng.pick(['Wrist shot', 'Backhand', 'Tip-in', 'Deflection', 'Snap shot']) : d < 28 ? rng.pick(['Wrist shot', 'Snap shot', 'Slap shot', 'Backhand']) : rng.pick(['Slap shot', 'Wrist shot', 'Snap shot']);
    const rel = (1 - gk.svp) / (1 - Lg.svp), shRel = clamp(.6 + .4 * sh.shp / (Lg.shp / 100), .6, 1.5), pg = clamp((T.shp * 1) * (xg(d) / xgMean) * rel * shRel * (ppState > 0 ? 1.25 : ppState < 0 ? .7 : 1) * (ot3 ? 1.25 : 1), .01, .55);
    if (rng.chance(pg)) {
      const a1 = rng.chance(.9) ? skater(id, sh) : null, a2 = a1 && rng.chance(.65) ? skater(id, sh, a1) : null;
      sc[id]++; G[id === hid ? 'home' : 'away'].score = sc[id];
      push(id, `${sh.n} scores on a ${kind.toLowerCase()} (${Math.round(d)} ft) against ${gk.n}${a1 ? `. Assists: ${a1.n}${a2 ? `, ${a2.n}` : ''}` : '. Unassisted'}.`, 'Goal', { kind: 'G', x, y, tid: id }, true); return true;
    }
    push(id, `${sh.n} ${kind.toLowerCase()} saved by ${gk.n}.`, 'Shot', { kind: 'S', x, y, tid: id }); return false;
  }
  function period(len, ot3) {
    left = len; t0 = per <= 3 ? (per - 1) * 1200 : 3600 + (per - 4) * 300; pens = [];
    let guard = 0;
    while (left > 0 && guard++ < 400) {
      pens = pens.filter(p => p.until < left);   // pens expire as the clock counts down
      const rates = id => { const T = S[id], O = S[other(id)], st = strength(id); return (T.sgp + O.sagp) / 2 * 1.65 / 3600 * (st > 0 ? 1.9 : st < 0 ? .55 : 1) * (ot3 ? 2.1 : 1) * (id === hid ? 1.02 : .98); };
      const penRate = id => (S[id].pimgp / 2.3 + S[other(id)].ppopg * .9) / 2 / 3600 * 1.0;
      const rH = rates(hid), rA = rates(aid), pH = pens.length < 4 ? penRate(hid) : 0, pA = pens.length < 4 ? penRate(aid) : 0, tot = rH + rA + pH + pA;
      const dt = -Math.log(1 - rng()) / tot; if (dt >= left) { left = 0; break; }
      left -= dt; const z = rng() * tot;
      if (z < rH + rA) { const id = z < rH ? hid : aid, st = strength(id), scored = shotAttempt(id, st, ot3); if (scored) { if (ot3) return true; const pp = pens.filter(p => p.team !== id).sort((a, b) => b.until - a.until)[0]; if (pp && st > 0) pens.splice(pens.indexOf(pp), 1); } }
      else { const id = z < rH + rA + pH ? hid : aid, p = skater(id), mins = rng.chance(.07) ? 4 : 2, nm = rng.pick(['Hooking', 'Tripping', 'Slashing', 'Interference', 'Holding', 'High sticking', 'Roughing', 'Cross checking', 'Too many men on the ice']);
        push(id, `${p.n} (${abbr(id)}) ${nm}, ${mins} min.`, 'Penalty', { tid: id }, false, true); pens.push({ team: id, until: Math.max(0, left - mins * 60) }); }
    }
    return false;
  }
  for (per = 1; per <= 3; per++) { push(rng.chance(.5) ? hid : aid, `Period ${per} begins.`, 'Period Start', {}); period(1200, false); }
  if (sc[hid] === sc[aid]) {
    G.ot = true; per = 4; G.dividers.push(3600); push(hid, 'Overtime begins, 3-on-3.', 'Period Start', {}); period(300, true); G.tot = 3900;
    if (sc[hid] === sc[aid]) {
      per = 5; G.dividers.push(3900); t0 = 3900; left = 0; G.tot = 3960; const first = rng.chance(.5) ? hid : aid, order = [first, other(first)], goals = { [hid]: 0, [aid]: 0 }, tries = { [hid]: 0, [aid]: 0 }; let fin = false;
      push(first, 'Shootout begins.', 'Shootout', {});
      for (let r = 0; r < 30 && !fin; r++) for (const id of order) {
        const T = S[id], gk = goalie(other(id)), sh = rng.weighted(T.sk.filter(p => p.pos !== 'D'), p => p.w), ok = rng.chance(clamp(.33 * ((1 - gk.svp) / (1 - Lg.svp)) * (.7 + .3 * sh.shp / (Lg.shp / 100)), .12, .6)); tries[id]++; if (ok) goals[id]++;
        G.ev.push({ per: 5, clk: '', t: 3900 + G.ev.filter(e => e.per === 5).length, h: sc[hid], a: sc[aid], tid: id, tx: `${sh.n} ${ok ? 'scores' : 'is stopped by ' + gk.n} in the shootout.`, ctx: `Shootout ${goals[aid]}\u2013${goals[hid]}`, k: ok ? 'sc' : '', p: { kind: '', x: null, y: null, ty: 'Shootout', tid: id } });
        if (r < 3) { const rem = x => 3 - tries[x]; if (goals[hid] > goals[aid] + rem(aid) || goals[aid] > goals[hid] + rem(hid)) { fin = true; break; } }
        else if (id === order[1] && goals[hid] !== goals[aid]) { fin = true; break; }
      }
      const win = goals[hid] > goals[aid] ? hid : aid; sc[win]++; G[win === hid ? 'home' : 'away'].score = sc[win]; const e = G.ev[G.ev.length - 1]; e.h = sc[hid]; e.a = sc[aid]; e.tx += ` ${abbr(win)} wins the shootout ${Math.max(goals[hid], goals[aid])}–${Math.min(goals[hid], goals[aid])}.`; e.k = 'sc'; G.so = true;
    }
  }
  /* the OT/shootout winner is credited at the end; make the score line of the last events consistent */
  G.sub = `${G.away.abbr} ${G.away.score}, ${G.home.abbr} ${G.home.score}${G.so ? ' (SO)' : G.ot ? ' (OT)' : ''}`; return G;
}
SPORT.sim = {
  bin: 1, run: (D, h, a, rng) => nhlSimulate(D, h, a, rng),
  blurb: 'Shots, saves, penalties and goals come from the teams’ real season rates.',
  note: 'Each team gets shot attempts at a rate set by its own shots per game and the opponent’s shots allowed, ramped up on the power play and down when shorthanded. Every attempt is blocked, missed or on net; shot distance is drawn at random and closer shots are more dangerous, with the overall chance scaled to the shooter’s shooting percentage and the opposing goalie’s save percentage. Penalties arrive at each team’s season rate, shooters and assists are chosen by shot volume and playmaking, and tied games go to five minutes of 3-on-3 and then a shootout. It is a model: no line matchups, injuries, empty nets or back-to-backs, so treat results as a plausible game, not a prediction.',
};
