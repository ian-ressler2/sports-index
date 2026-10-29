/* sim.js (NFL): play-by-play game simulator driven by each team's season numbers.
   Every snap is drawn from the offense's own pass rate, completion rate, yards per attempt, yards per carry, sack and interception
   rates, adjusted for how the opposing defense allows points, sacks and takeaways. Kickers use their season field-goal accuracy. */
function nflLeague(D) {
  const L = D.tofList || [], M = k => { const v = L.map(r => r[k]).filter(x => isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
  const dl = D.tdfList || [], N = k => { const v = dl.map(r => r[k]).filter(x => isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
  return { ypa: M('ypa') || 6.9, cmp: (M('cmpp') || 64) / 100, ypc: M('ypc') || 4.4, prate: (M('prate') || 58) / 100, plays: M('plays') || 63, pag: N('pag') || 22.5, sckg: N('sckg') || 2.5, takeg: N('takeg') || 1.3, fgp: 84 };
}
function nflTeamSim(D, id, Lg) {
  const o = D.tof.get(id) || {}, d = D.tdf.get(id) || {}, gp = o.gp || 1, att = (o.plays || Lg.plays) * ((o.prate || Lg.prate * 100) / 100) || 36;
  const sckRate = clamp(((o.sck || 0) / gp) / (att + (o.sck || 0) / gp) || 0.065, .02, .13), intRate = clamp((o.pint || 0) / gp / att || 0.022, .008, .045);
  const rows = g => (D.lists[g] || []).filter(r => r.tid === id);
  const qb = rows('qb').sort((a, b) => b.att - a.att)[0], rbs = rows('rb').filter(r => r.att >= 4).sort((a, b) => b.att - a.att).slice(0, 4), recs = rows('rec').filter(r => r.tgt >= 4).sort((a, b) => b.tgt - a.tgt).slice(0, 7), k = rows('k').sort((a, b) => (b.fga || 0) - (a.fga || 0))[0], pu = rows('p').sort((a, b) => b.punts - a.punts)[0];
  const ab = r => r ? (r.ab || nflAbbr(r.name)) : '';
  return { id, ypa: o.ypa || Lg.ypa, cmp: (o.cmpp || Lg.cmp * 100) / 100, ypc: o.ypc || Lg.ypc, prate: (o.prate || Lg.prate * 100) / 100, plays: o.plays || Lg.plays, sckRate, intRate, pag: d.pag || Lg.pag, sckg: d.sckg ?? Lg.sckg, takeg: d.takeg ?? Lg.takeg,
    qb: ab(qb) || 'QB', rbs: rbs.length ? rbs.map(r => ({ n: ab(r), w: r.att, r: (r.ypc || Lg.ypc) / Lg.ypc })) : [{ n: 'RB', w: 1, r: 1 }], recs: recs.length ? recs.map(r => ({ n: ab(r), w: r.tgt, c: (r.catch || Lg.cmp * 100) / (Lg.cmp * 100), y: (r.ypr || 11) / 11.5 })) : [{ n: 'WR', w: 1, c: 1, y: 1 }],
    kick: ab(k) || 'K', fgq: clamp(((k?.fgp || Lg.fgp) / Lg.fgp), .85, 1.1), punter: ab(pu) || 'P', punt: pu?.avg || 46 };
}
const nflOrd = n => ['', '1st', '2nd', '3rd', '4th'][n] || n + 'th';
/* chance a field goal of this length (including the 17 yards of snap and end zone) is good */
const nflFgProb = d => { const T = [[18, .995], [30, .975], [38, .93], [43, .87], [48, .8], [53, .68], [58, .5], [63, .28], [70, .1]]; if (d <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (d <= T[i][0]) { const [a, pa] = T[i - 1], [b, pb] = T[i]; return pa + (pb - pa) * (d - a) / (b - a); } return .05; };

function nflSimulate(D, hid, aid, rng) {
  const Lg = nflLeague(D), th = D.teams.get(hid), ta = D.teams.get(aid), H = nflTeamSim(D, hid, Lg), A = nflTeamSim(D, aid, Lg), S = { [hid]: H, [aid]: A };
  const mk = t => ({ id: t.id, abbr: t.abbr, name: t.name, logo: t.logo, color: t.color, score: 0 });
  const G = { id: 'sim', sim: true, home: mk(th), away: mk(ta), ev: [], tot: 3600, dividers: [900, 1800, 2700, 3600], sub: '', ot: false };
  const sc = { [hid]: 0, [aid]: 0 }; let clock = 3600, half = 1, ot = false, otLeft = 0, drv = 0;
  const abbr = id => id === hid ? th.abbr : ta.abbr, other = id => id === hid ? aid : hid, dirOf = id => id === aid ? 1 : -1, absx = (id, yte) => id === aid ? 100 - yte : yte;
  const spot = (id, yte) => yte === 50 ? '50' : yte > 50 ? `${abbr(id)} ${100 - yte}` : `${abbr(other(id))} ${yte}`;
  const qOf = () => clock > 2700 ? 1 : clock > 1800 ? 2 : clock > 900 ? 3 : 4;
  const clkText = () => { const q = ot ? otLeft : clock - (4 - qOf()) * 900; return `${Math.floor(q / 60)}:${String(Math.floor(q) % 60).padStart(2, '0')}`; };
  const elapsed = () => ot ? 3600 + (600 - otLeft) : 3600 - clock, perNow = () => ot ? 5 : qOf();
  const over = () => ot ? otLeft <= 0 : clock <= (half === 1 ? 1800 : 0);
  const burn = s => { if (ot) otLeft = Math.max(0, otLeft - s); else clock = Math.max(half === 1 ? 1800 : 0, clock - s); };
  const push = (tid, k, tx, ctx, P, scoring = false, turn = false, big = false) => { G.ev.push({ per: perNow(), clk: clkText(), t: elapsed(), h: sc[hid], a: sc[aid], tid, tx, ctx, k: scoring ? 'sc' : turn ? 'to' : big ? 'bg' : '', p: { dr: drv, off: tid, dir: dirOf(tid), ...P } }); };
  const addPts = (id, pts) => { sc[id] += pts; G[id === hid ? 'home' : 'away'].score = sc[id]; const e = G.ev[G.ev.length - 1]; e.h = sc[hid]; e.a = sc[aid]; };
  const pickRB = T => rng.weighted(T.rbs, r => r.w), pickWR = T => rng.weighted(T.recs, r => r.w);
  const gapN = [['left end', -2], ['left tackle', -1.2], ['left guard', -.5], ['up the middle', 0], ['right guard', .5], ['right tackle', 1.2], ['right end', 2]];
  /* where the other team starts after a punt: their yards to the end zone */
  const afterKick = (yte, gross) => { const L = yte - gross; return L <= 0 ? 80 : clamp(100 - L - rng.int(0, 7), 4, 96); };
  function kickoff(kicker) {
    const R = other(kicker), tb = rng.chance(.62), yte = tb ? 75 : clamp(75 - rng.int(-6, 18), 55, 99), K = S[kicker];
    push(kicker, 'o', tb ? `${K.kick} kicks 65 yards from ${spot(kicker, 65)} to the end zone, touchback.` : `${K.kick} kicks 63 yards from ${spot(kicker, 65)}. Returned to ${spot(R, yte)}.`, 'Kickoff', { k: 'o', x0: absx(kicker, 65), x1: absx(R, yte), y: 63 });
    burn(5); return { cur: R, yte };
  }
  function drive(id, yte) {
    drv++; const T = S[id], D2 = S[other(id)]; let dn = 1, dist = Math.min(10, yte), y = yte, plays = 0;
    const df = clamp(D2.pag / Lg.pag, .72, 1.32), eff = 1 + .22 * (df - 1);
    const sackP = T.sckRate * (.55 + .45 * clamp(D2.sckg / Lg.sckg, .5, 1.6)), intP = T.intRate * (.6 + .4 * clamp(D2.takeg / Lg.takeg, .5, 1.7));
    const cmpEff = clamp(T.cmp * eff, .5, .8), ypaEff = T.ypa * eff, ypcEff = T.ypc * eff;
    while (!over() && plays++ < 40) {
      const ctx = `${dist >= y ? `${nflOrd(dn)} & Goal` : `${nflOrd(dn)} & ${dist}`} at ${spot(id, y)}`;
      const trail = sc[id] < sc[other(id)], lead = sc[id] > sc[other(id)], late = !ot && half === 2 && clock <= 900, urgent = late && trail && clock < 300, burning = late && lead && clock < 420;
      /* a penalty now and then */
      if (rng.chance(.055)) {
        const offp = rng.chance(.55), yd = offp ? rng.pick([5, 5, 10, 10, 15]) : rng.pick([5, 5, 10, 15]), nm = offp ? rng.pick(['False start', 'Offensive holding', 'Delay of game']) : rng.pick(['Defensive offside', 'Defensive holding', 'Neutral zone infraction', 'Defensive pass interference']);
        const pt = offp ? id : other(id), gainY = offp ? -Math.min(yd, 99 - y) : Math.min(yd, y - 1);
        push(id, 'n', `PENALTY on ${abbr(pt)}, ${nm}, ${yd} yards, enforced at ${spot(id, y)}.`, ctx, { k: 'n', x0: absx(id, y), dn, dist }); burn(8);
        y -= gainY; if (offp) dist += yd; else { dist -= yd; if (dist <= 0) { dn = 1; dist = Math.min(10, y); } }
        continue;
      }
      if (dn === 4) {
        const goFor = (urgent && y > 25) || (dist <= 2 && y <= 45 && y > 6 && rng.chance(.38)) || (y <= 2 && dist <= 2 && rng.chance(.8));
        if (!goFor) {
          if (y <= 40) {
            const kd = y + 17, ok = rng.chance(clamp(nflFgProb(kd) * T.fgq, .02, .995));
            push(id, 'f', `${T.kick} ${kd} yard field goal is ${ok ? 'GOOD' : 'No Good'}.`, ctx, { k: 'f', x0: absx(id, y) - dirOf(id) * 7, y: kd, made: ok, wide: rng.chance(.5) ? -1 : 1, dn, dist }, ok, false, !ok); burn(6);
            if (ok) { addPts(id, 3); return { kick: id }; }
            return { cur: other(id), yte: clamp(100 - y - 7, 20, 90) };
          }
          const gross = clamp(Math.round(rng.norm() * 6 + T.punt), 28, 68), nx = afterKick(y, gross), tb = y - gross <= 0;
          push(id, 'u', `${T.punter} punts ${tb ? y : gross} yards ${tb ? 'into the end zone, touchback' : `to ${spot(other(id), nx)}`}.`, ctx, { k: 'u', x0: absx(id, y), x1: absx(other(id), nx), y: gross, dn, dist }); burn(8); return { cur: other(id), yte: nx };
        }
      }
      let pp = T.prate + (dist >= 8 && dn >= 2 ? .2 : dist <= 2 ? -.2 : 0) + (urgent ? .2 : 0) - (burning ? .3 : 0); pp = clamp(pp, .15, .92);
      let gain = 0, tx = '', P = null, kind = '', sec = 30, turnAt = 0, fumble = false;
      if (rng.chance(pp)) {
        const QB = T.qb, W = pickWR(T), deep = rng.chance(dist >= 12 ? .26 : .14), lane = rng.pick(['left', 'middle', 'right']), laneN = { left: -1, middle: 0, right: 1 }[lane];
        kind = 'p';
        if (rng.chance(sackP)) { gain = -rng.int(3, 9); kind = 's'; tx = `${QB} sacked at ${spot(id, clamp(y - gain, 1, 99))} for ${gain} yards.`; P = { k: 's', lane: laneN, y: gain }; sec = 30; }
        else if (rng.chance(intP / (1 - sackP))) {
          const air = deep ? rng.int(14, 32) : rng.int(3, 14), nx = clamp(100 - Math.max(1, y - air) - rng.int(0, 12), 3, 97); turnAt = nx;
          tx = `${QB} pass ${deep ? 'deep' : 'short'} ${lane} intended for ${W.n} INTERCEPTED. Returned to ${spot(other(id), nx)}.`; P = { k: 'p', inc: true, to: true, dep: deep ? 'd' : 's', lane: laneN, y: air, x1: absx(id, Math.max(1, y - air)) }; sec = 14;
        } else {
          const cDeep = clamp(.44 * cmpEff / .64, .2, .6), cShort = clamp((cmpEff - .14 * cDeep) / .86, .35, .9);
          const comp = rng.chance(clamp((deep ? cDeep : cShort) * Math.sqrt(W.c), .15, .95));
          if (!comp) { tx = `${QB} pass incomplete ${deep ? 'deep' : 'short'} ${lane} intended for ${W.n}.`; P = { k: 'p', inc: true, dep: deep ? 'd' : 's', lane: laneN }; sec = 6; }
          else {
            const yS = Math.max(4, (ypaEff - .14 * cDeep * 25) / (.86 * cShort)), m = (deep ? 25 : yS) * Math.sqrt(W.y);
            gain = Math.max(0, Math.round(Math.exp(rng.norm() * .6) * m * .92)); sec = 29; tx = `${QB} pass ${deep ? 'deep' : 'short'} ${lane} to ${W.n} for ${gain} yards.`; P = { k: 'p', dep: deep ? 'd' : 's', lane: laneN, y: gain };
          }
        }
      } else {
        const R = pickRB(T), [gp, gl] = rng.pick(gapN); kind = 'r';
        gain = Math.max(-3, Math.round(rng.norm() * 2.5 + ypcEff * .8 * Math.sqrt(R.r) + (rng.chance(.065) ? 7 + rng.int(0, 14) : 0))); sec = rng.chance(.12) ? 9 : 38; fumble = rng.chance(.007);
        tx = `${R.n} ${gp} for ${gain} yards.`; P = { k: 'r', lane: gl, y: gain };
      }
      const x0 = absx(id, y);
      if (turnAt) { push(id, 'p', tx, ctx, { ...P, dn, dist, x0 }, false, true); burn(sec); return { cur: other(id), yte: turnAt }; }
      if (fumble) { const nx = clamp(100 - clamp(y - gain, 1, 99), 3, 97); push(id, 'r', `${tx.replace(/ for .*/, '')} for ${gain} yards, FUMBLES, recovered by ${abbr(other(id))} at ${spot(other(id), nx)}.`, ctx, { ...P, dn, dist, x0, x1: absx(id, clamp(y - gain, 1, 99)) }, false, true); burn(sec); return { cur: other(id), yte: nx }; }
      if (gain >= y) {
        const xp = rng.chance(.945);
        push(id, kind, tx.replace(/for -?\d+ yards/, `for ${y} yards, TOUCHDOWN.`) + (xp ? ` ${T.kick} extra point is GOOD.` : ` ${T.kick} extra point is No Good.`), ctx, { ...P, y, td: true, dn, dist, x0, x1: absx(id, 0) }, true); addPts(id, 6 + (xp ? 1 : 0)); burn(sec); return { kick: id, scored: 6 };
      }
      push(id, kind, tx, ctx, { ...P, dn, dist, x0, x1: P.inc ? null : absx(id, clamp(y - gain, 0, 100)) }, false, false, Math.abs(gain) >= 20); burn(sec);
      y = clamp(y - gain, 1, 99);
      if (gain >= dist) { dn = 1; dist = Math.min(10, y); } else { dn++; dist -= gain; if (dn > 4) return { cur: other(id), yte: clamp(100 - y, 3, 97) }; }
    }
    return { cur: other(id), yte: clamp(100 - y, 3, 97) };
  }
  /* regulation */
  const opener = rng.chance(.5) ? hid : aid, secondKick = other(opener); let st = kickoff(opener), cur = st.cur, curY = st.yte;
  for (let guard = 0; guard < 90; guard++) {
    const res = drive(cur, curY);
    if (over()) { if (half === 1) { half = 2; clock = 1800; st = kickoff(secondKick); cur = st.cur; curY = st.yte; continue; } break; }
    if (res.kick) { st = kickoff(res.kick); cur = st.cur; curY = st.yte; } else { cur = res.cur; curY = res.yte; }
  }
  /* overtime: ten minutes, sudden death once both teams have had the ball */
  if (sc[hid] === sc[aid]) {
    ot = true; G.ot = true; otLeft = 600; G.dividers.push(4200); let poss = 0; const recv = rng.chance(.5) ? hid : aid; st = kickoff(other(recv)); cur = st.cur; curY = st.yte;
    for (let guard = 0; guard < 40 && otLeft > 0; guard++) {
      const res = drive(cur, curY); poss++;
      if (sc[hid] !== sc[aid] && (poss >= 2 || res.scored >= 6)) break;
      if (res.kick) { st = kickoff(res.kick); cur = st.cur; curY = st.yte; } else { cur = res.cur; curY = res.yte; }
    }
    G.tot = 4200;
  }
  G.sub = `${G.away.abbr} ${G.away.score}, ${G.home.abbr} ${G.home.score}${G.ot ? ' (OT)' : ''}`; return G;
}
SPORT.sim = {
  bin: 4, run: (D, h, a, rng) => nflSimulate(D, h, a, rng),
  blurb: 'Every snap is drawn from the teams’ real season rates.',
  note: 'Each play is chosen from the offense’s own pass rate, then resolved with its completion rate, yards per attempt, yards per carry, sack rate and interception rate, nudged up or down by how many points, sacks and takeaways the defense allows compared with the league. Receivers and runners get the ball in proportion to their targets and carries, and kickers use their season field-goal accuracy by distance. Fourth-down decisions, the clock, turnovers and overtime follow the usual rules. It is a model: it knows nothing about injuries, weather or matchups beyond team season totals, so treat results as a plausible game, not a prediction.',
};

/* "what if" changes for the simulator page: key offensive players and the kicker out of the game */
SPORT.sim.what = {
  blurb: 'Take the quarterback, a back, a receiver or the kicker out of the game. A backup quarterback throws for fewer yards per attempt and completes fewer passes; a missing back or receiver trims the offense in proportion to his share of the carries or targets.',
  roster: (D, tid) => {
    const rows = g => (D.lists[g] || []).filter(r => r.tid === tid), out = [], add = (r, tag) => r && out.push({ id: r.id, name: r.ab || nflAbbr(r.name), tag });
    const qbs = rows('qb').sort((a, b) => b.att - a.att); add(qbs[0], 'QB'); rows('rb').sort((a, b) => b.att - a.att).slice(0, 2).forEach(r => add(r, 'RB')); rows('rec').sort((a, b) => b.tgt - a.tgt).slice(0, 3).forEach(r => add(r, r.pos || 'WR')); add(rows('k').sort((a, b) => (b.fga || 0) - (a.fga || 0))[0], 'K');
    return out.filter((r, i) => out.findIndex(x => x.id === r.id) === i);
  },
  apply(D, adj) {
    const gone = g => (D.lists[g] || []).filter(r => adj.out.has(String(r.id))), lists = {}; for (const g of Object.keys(D.lists)) lists[g] = (D.lists[g] || []).filter(r => !adj.out.has(String(r.id)));
    const D2 = { ...D, lists, tof: new Map(D.tof) }, edit = (tid, f) => { const t = D2.tof.get(tid); if (t) D2.tof.set(tid, f({ ...t })); };
    for (const q of gone('qb')) { const rep = lists.qb.filter(r => r.tid === q.tid && r.att >= 15).sort((a, b) => b.att - a.att)[0], rY = rep && q.ypa ? clamp(rep.ypa / q.ypa, .7, 1.02) : .85, rC = rep && q.cmpp ? clamp(rep.cmpp / q.cmpp, .85, 1.02) : .94; edit(q.tid, t => { t.ypa *= rY; t.cmpp *= rC; return t; }); }
    for (const r of gone('rec')) { const all = (D.lists.rec || []).filter(x => x.tid === r.tid).reduce((a, x) => a + (x.tgt || 0), 0); if (all) edit(r.tid, t => { t.ypa *= 1 - .12 * (r.tgt || 0) / all; return t; }); }
    for (const r of gone('rb')) { const all = (D.lists.rb || []).filter(x => x.tid === r.tid).reduce((a, x) => a + (x.att || 0), 0); if (all) edit(r.tid, t => { t.ypc *= 1 - .08 * (r.att || 0) / all; return t; }); }
    return D2;
  },
};
