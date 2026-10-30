/* sim.js (NBA): possession-by-possession game simulator driven by each team's season rates and its players' usage */
const nbaShort = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : p[0] || 'Player'; };
function nbaLeague(D) {
  const L = D.tofList || [], M = (k, d) => { const v = L.map(r => r[k]).filter(x => isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : d; };
  return { pace: M('pace', 99), efg: M('efg', 54), tovp: M('tovp', 13.5), orebp: M('orebp', 27), ftr: M('ftr', 26), tpar: M('tpar', 40), tpp: M('tpp', 36.5), ftp: M('ftp', 78), fgp: M('fgp', 47) };
}
function nbaTeamSim(D, id, Lg) {
  const t = D.tof.get(id) || {}, ps = (D.plList || []).filter(r => r.tid === id && r.mpg >= 6).sort((a, b) => b.mpg - a.mpg).slice(0, 10);
  const roster = ps.length >= 5 ? ps : [...ps, ...Array.from({ length: 5 - ps.length }, (_, i) => ({ name: `Player ${i + 1}`, mpg: 20, usg: 20, fgapg: 6, tpapg: 2, tpp: Lg.tpp, ftp: Lg.ftp, fgp: Lg.fgp }))];
  const P = roster.map(r => ({ n: nbaShort(r.name), mpg: r.mpg || 15, usg: r.usg || 18, fga: r.fgapg || 5, tpa: r.tpapg || 1.5, tpp: isFinite(r.tpp) && r.tpa >= 20 ? r.tpp : Lg.tpp, ftp: isFinite(r.ftp) && r.fta >= 20 ? r.ftp : Lg.ftp, fgp: isFinite(r.fgp) ? r.fgp : Lg.fgp, reb: r.rebp || 8, ast: r.astp || 12, stl: r.spg || .7, blk: r.bpg || .4 }));
  return { id, pace: t.pace || Lg.pace, efg: t.efg || Lg.efg, tovp: t.tovp || Lg.tovp, orebp: t.orebp || Lg.orebp, ftr: t.ftr || Lg.ftr, tpar: t.tpar || Lg.tpar, tpp: t.tpp || Lg.tpp, ftp: t.ftp || Lg.ftp, fgp: t.fgp || Lg.fgp,
    oefg: t.oefg || Lg.efg, otovp: t.otovp || Lg.tovp, drebp: t.drebp || 100 - Lg.orebp, oftr: t.oftr || Lg.ftr, otpp: t.otpp || Lg.tpp, P };
}
function nbaSimulate(D, hid, aid, rng) {
  const Lg = nbaLeague(D), th = D.teams.get(hid), ta = D.teams.get(aid), S = { [hid]: nbaTeamSim(D, hid, Lg), [aid]: nbaTeamSim(D, aid, Lg) };
  const mk = t => ({ id: t.id, abbr: t.abbr, name: t.name, logo: t.logo, color: t.color, score: 0 });
  const G = { id: 'sim', sim: true, home: mk(th), away: mk(ta), ev: [], tot: 2880, dividers: [720, 1440, 2160], sub: '', ot: false };
  const sc = { [hid]: 0, [aid]: 0 }, other = id => id === hid ? aid : hid, abbr = id => id === hid ? th.abbr : ta.abbr;
  let per = 1, left = 720, t0 = 0;
  const clk = () => `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
  const push = (tid, tx, ctx, P, scoring, turn, big) => G.ev.push({ per, clk: clk(), t: t0 + (per <= 4 ? 720 : 300) - left, h: sc[hid], a: sc[aid], tid, tx, ctx, k: scoring ? 'sc' : turn ? 'to' : big ? 'bg' : '', p: { tid, shot: false, ft: false, m: 0, v: 0, th: false, x: null, y: null, ...P } });
  const pts = (id, n) => { sc[id] += n; G[id === hid ? 'home' : 'away'].score = sc[id]; const e = G.ev[G.ev.length - 1]; e.h = sc[hid]; e.a = sc[aid]; };
  const who = (T, f, ex) => rng.weighted(T.P.filter(p => p !== ex), p => Math.max(.01, f(p)) * Math.max(.2, p.mpg / 24));
  const spotXY = z => {
    if (z === 'c3') return [rng.chance(.5) ? rng.int(1, 3) + rng() : 47 + rng() - rng.int(0, 2), rng.int(1, 13)];
    const R = z === 'ra' ? [0, 3.6] : z === 'a3' ? [23.8, 26.5] : z === 'mid' ? [8, 21] : [5, 12], a = z === 'paint' ? rng.int(55, 125) : z === 'ra' ? rng.int(0, 359) : rng.int(8, 172), r = R[0] + rng() * (R[1] - R[0]);
    let x = 25 + r * Math.cos(a * Math.PI / 180), y = 5.25 + Math.abs(r * Math.sin(a * Math.PI / 180)); if (z === 'paint') { x = clamp(x, 18, 32); y = clamp(y, 6, 18); }
    return [clamp(x, .5, 49.5), clamp(y, .5, 46)];
  };
  /* one trip: returns what happens next ({ keep: true } means the same team keeps the ball) */
  function possession(id, cont) {
    const T = S[id], O = S[other(id)];
    const secs = cont ? clamp(Math.round(rng.norm() * 2 + 5), 2, 12) : clamp(Math.round(rng.norm() * 4.2 + 2880 / (T.pace + O.pace) * .94), 3, 24);
    const used = Math.min(secs, left); left -= used;
    const tov = clamp((T.tovp + (O.otovp - Lg.tovp)) / 100, .07, .22);
    if (rng.chance(tov)) {
      const w = who(T, p => p.usg), st = rng.chance(.55) ? who(O, p => p.stl) : null, how = rng.pick(['bad pass', 'traveling', 'lost ball', 'offensive foul', 'out of bounds']);
      push(id, st ? `${w.n} ${how}, stolen by ${st.n}.` : `${w.n} ${how} turnover.`, `${abbr(id)} turnover`, { tid: id }, false, true); return { keep: false };
    }
    const fta = clamp(.105 * (T.ftr + (O.oftr - Lg.ftr)) / Lg.ftr, .04, .2);
    if (rng.chance(fta)) {
      const w = who(T, p => p.usg), n = rng.chance(.12) ? 3 : 2; let made = 0;
      push(id, `Shooting foul on ${rng.pick(O.P).n}, ${w.n} to the line.`, `${abbr(id)} free throws`, { tid: id }, false, false, false);
      for (let k = 1; k <= n; k++) { const ok = rng.chance(clamp(w.ftp / 100, .5, .95)); if (ok) made++; push(id, `${w.n} ${ok ? 'makes' : 'misses'} free throw ${k} of ${n}.`, `${abbr(id)} free throws`, { tid: id, ft: true, m: ok ? 1 : 0, v: ok ? 1 : 0 }, ok, false, false); if (ok) pts(id, 1); }
      return made ? { keep: false } : reboundAfter(id, T, O, 'ft', n);
    }
    const three = rng.chance(clamp((T.tpar + (O.tpar - Lg.tpar) * .15) / 100, .2, .6));
    const sh = who(T, p => three ? p.tpa + .15 : p.fga - p.tpa + .4), p3 = clamp((sh.tpp + (O.otpp - Lg.tpp) * .6) / 100, .24, .5);
    const ef = clamp((T.efg + (O.oefg - Lg.efg)) / 100, .44, .62), p2team = clamp((ef - 1.5 * clamp(T.tpp / 100, .28, .45) * T.tpar / 100) / (1 - T.tpar / 100), .45, .66);
    let zone, pm, kind, dist;
    if (three) { zone = rng.chance(.27) ? 'c3' : 'a3'; pm = p3; dist = zone === 'c3' ? 22 : rng.int(24, 27); kind = rng.pick(['three point jumper', 'three point pullup jumper', 'three point step back jumper', 'three point jumper']); }
    else {
      zone = rng.weighted(['ra', 'paint', 'mid'], z => ({ ra: .5, paint: .13, mid: .37 })[z]); const f = p2team / .541, base = { ra: .66, paint: .42, mid: .41 }[zone];
      pm = clamp(base * f * clamp(1 + .6 * (sh.fgp - Lg.fgp) / Lg.fgp, .85, 1.15), .25, .85);
      kind = zone === 'ra' ? rng.pick(['layup', 'driving layup', 'dunk', 'layup', 'driving finger roll layup', 'alley oop dunk']) : zone === 'paint' ? rng.pick(['floating jumper', 'hook shot', 'turnaround jumper', 'driving floating jump shot']) : rng.pick(['pullup jump shot', 'jumper', 'turnaround fadeaway', 'step back jumper']);
      dist = zone === 'ra' ? rng.int(1, 3) : zone === 'paint' ? rng.int(5, 12) : rng.int(10, 21);
    }
    const [x, y] = spotXY(zone), made = rng.chance(pm), blockedBy = !made && !three && zone !== 'mid' && rng.chance(.12) ? who(O, p => p.blk) : null;
    const shotTxt = `${sh.n} ${made ? 'makes' : 'misses'} ${dist}-foot ${kind}`;
    if (made) {
      const ast = rng.chance(three ? .8 : .58) ? who(T, p => p.ast, sh) : null, and1 = rng.chance(.045);
      push(id, `${shotTxt}${ast ? ` (${ast.n} assists)` : ''}`, `${abbr(id)} ${three ? '3-pointer' : 'field goal'}`, { tid: id, shot: true, m: 1, v: three ? 3 : 2, th: three, x, y }, true, false, three || /dunk/.test(kind)); pts(id, three ? 3 : 2);
      if (and1) { const ok = rng.chance(clamp(sh.ftp / 100, .5, .95)); push(id, `${sh.n} ${ok ? 'makes' : 'misses'} free throw 1 of 1.`, `${abbr(id)} and-one`, { tid: id, ft: true, m: ok ? 1 : 0, v: ok ? 1 : 0 }, ok, false, false); if (ok) pts(id, 1); }
      return { keep: false };
    }
    push(id, blockedBy ? `${blockedBy.n} blocks ${sh.n}'s ${dist}-foot ${kind}` : shotTxt, `${abbr(id)} ${three ? '3-pointer' : 'shot'} missed`, { tid: id, shot: true, m: 0, v: 0, th: three, x, y }, false, false, !!blockedBy);
    return reboundAfter(id, T, O, 'fg');
  }
  function reboundAfter(id, T, O, how, nft) {
    const oreb = clamp((T.orebp + (100 - O.drebp)) / 200 * (how === 'ft' ? .75 : 1), .08, .4);
    if (rng.chance(oreb)) { const r = who(T, p => p.reb); push(id, `${r.n} offensive rebound.`, `${abbr(id)} offensive rebound`, { tid: id }, false, false, false); return { keep: true }; }
    const r = who(O, p => p.reb); push(other(id), `${r.n} defensive rebound.`, `${abbr(other(id))} defensive rebound`, { tid: other(id) }, false, false, false); return { keep: false };
  }
  function play(len, first) {
    left = len; t0 = per <= 4 ? (per - 1) * 720 : 2880 + (per - 5) * 300; let own = first, guard = 0, cont = false;
    while (left > 0 && guard++ < 160) { const r = possession(own, cont); cont = r.keep; if (!r.keep) own = other(own); }
    return own;
  }
  const tip = rng.chance(.5) ? hid : aid, tipLoser = other(tip), starters = [tip, tipLoser, tipLoser, tip];
  push(tip, `Jump ball won by ${abbr(tip)}.`, 'Tip-off', { tid: tip }, false, false, false);
  for (per = 1; per <= 4; per++) { play(720, starters[per - 1]); if (per < 4) G.dividers = [720, 1440, 2160]; }
  while (sc[hid] === sc[aid] && per < 12) { G.ot = true; per++; G.tot = 2880 + (per - 4 - 1) * 300 + 300; G.dividers.push(2880 + (per - 5) * 300); push(rng.chance(.5) ? hid : aid, `Start of overtime.`, 'Overtime', {}, false, false, false); play(300, G.ev[G.ev.length - 1].tid); }
  G.dividers = G.dividers.filter(t => t < G.tot);
  G.sub = `${G.away.abbr} ${G.away.score}, ${G.home.abbr} ${G.home.score}${G.ot ? ' (OT)' : ''}`; return G;
}
SPORT.sim = {
  bin: 4, run: (D, h, a, rng) => nbaSimulate(D, h, a, rng),
  blurb: 'Every possession is drawn from the teams’ real season rates, with shots spread across the floor.',
  note: 'Each possession starts from the offense’s turnover rate (adjusted for how often the defense forces them), then becomes a free-throw trip, a three or a two. The shooter is picked in proportion to his usage and minutes, three-point odds use his own percentage, and two-point odds are set so the team’s effective field-goal percentage lines up with its season number, nudged by the defense’s. Misses can be blocked or rebounded using each side’s offensive and defensive rebounding rates, and assists, steals and fouls are handed out by player rates. Shot locations are generated by zone so the chart fills in like a real one. It is a model: no injuries, rotations, back-to-backs or matchups beyond season totals, so treat results as a plausible game, not a prediction.',
};

/* "what if" changes for the simulator page: players out of the game */
SPORT.sim.what = {
  blurb: 'Take players out of the game. Their minutes and shots go to the rest of the roster, and the team shoots like the players who are left (each teammate’s own season shooting, weighted by his shot attempts). A star leaving costs more than a poor shooter leaving.',
  roster: (D, tid) => (D.plList || []).filter(r => r.tid === tid && r.mpg >= 6).sort((a, b) => b.mpg - a.mpg).slice(0, 10).map(r => ({ id: r.id, name: nbaShort(r.name), tag: `${Math.round(r.mpg)} min` })),
  apply(D, adj) {
    const gone = (D.plList || []).filter(r => adj.out.has(String(r.id))), D2 = { ...D, plList: (D.plList || []).filter(r => !adj.out.has(String(r.id))), tof: new Map(D.tof) };
    for (const tid of new Set(gone.map(r => r.tid))) {
      /* the missing players' shots go to the teammates who are left, at those teammates' own shooting; no fudge factor */
      const rest = D.plList.filter(r => r.tid === tid && !adj.out.has(String(r.id)) && r.fga > 0), fga = rest.reduce((a, r) => a + r.fga, 0), pts = rest.reduce((a, r) => a + r.fgm + .5 * r.tpm, 0), t = D.tof.get(tid);
      if (t && fga > 50) D2.tof.set(tid, { ...t, efg: 100 * pts / fga });
    }
    return D2;
  },
};
