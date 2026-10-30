/* game.js (soccer): a match replay built from ESPN's minute-by-minute commentary. Shots carry pitch coordinates, so the stage is a pitch that fills with every shot. */
SPORT.perName = p => ['', '1H', '2H', 'ET1', 'ET2', 'PEN'][p] || `P${p}`;
SPORT.seasonEnd = SOC.seasonEnd;
SPORT.gameSpan = 7;
SPORT.noteRef = {}; SPORT.closeMargin = 1;
SPORT.gamesNote = 'Open a match to replay every shot, card and goal on the pitch.';
const SOC_SKIP = /^(Foul|Lineups|Delay|VAR)/i;
const SOC_START = { 1: 0, 2: 2700, 3: 5400, 4: 6300, 5: 7200 };
SPORT.playsOf = j => j.commentary || [];
SPORT.gameEvents = (j, G) => {
  const cm = (j.commentary || []).slice().sort((a, b) => a.sequence - b.sequence), ev = [], names = new Map([[G.home.name, G.home.id], [G.away.name, G.away.id]]);
  let hs = 0, as = 0, last = 0;
  for (const c of cm) {
    const p = c.play || {}, ty = p.type?.text || '', tx = (c.text || p.text || '').replace(/\s+/g, ' ').trim();
    if (!tx || SOC_SKIP.test(ty) || SOC_SKIP.test(tx)) continue;
    const per = p.period?.number || (ev.length ? ev[ev.length - 1].per : 1);
    let t = c.time?.value ?? p.clock?.value ?? 0;
    if (/^(First Half begins|Kickoff)/i.test(tx) || /^Kickoff$/i.test(ty)) t = 0;
    else if (/^Second Half begins/i.test(tx)) t = Math.max(2700, last);
    else if (!t) t = last;
    t = Math.max(t, per === 1 ? 0 : 0); last = Math.max(last, t);
    const tid = names.get(p.team?.displayName) || 0;
    const goal = /^(Goal|Own Goal|Penalty - Scored|Penalty Scored)/i.test(ty) || /^Goal!|^Own Goal/i.test(tx);
    let sc = false;
    if (goal) {
      sc = true; const m = tx.match(/(\d+),\s.*?\s(\d+)\./);
      if (m) { hs = +m[1]; as = +m[2]; } else if (tid === G.home.id) hs++; else as++;
    }
    const red = /^Red Card|second yellow/i.test(ty) || /red card/i.test(tx) && !/yellow/i.test(ty), yel = /^Yellow Card/i.test(ty), post = /Woodwork/i.test(ty), pen = /Penalty/i.test(ty) && !goal;
    const sh = /^Shot|^Goal|^Own Goal|^Penalty/i.test(ty) && p.fieldPositionX != null && isFinite(p.fieldPositionX);
    const kind = goal ? 'g' : /On Target|Saved/i.test(ty) ? 't' : /Blocked/i.test(ty) ? 'b' : post ? 'w' : 'o';
    const k = sc ? 'sc' : red ? 'to' : yel || post || pen || /On Target/i.test(ty) ? 'bg' : '';
    ev.push({ per, clk: c.time?.displayValue || p.clock?.displayValue || '', t, h: hs, a: as, tid, tx, ctx: ty, k, p: { x: sh ? +p.fieldPositionX : null, y: sh ? +p.fieldPositionY : null, kind, tid } });
  }
  /* "Match ends" and the like carry no clock; keep order and make sure time never runs backwards */
  let mx = 0; for (const e of ev) { e.t = Math.max(e.t, mx); mx = e.t; }
  const maxPer = Math.max(2, ...ev.map(e => e.per));
  G.ev = ev; G.tot = Math.max(5400, ev.length ? ev[ev.length - 1].t : 0); G.dividers = [2700].concat(maxPer > 2 ? [5400] : []).filter(t => t < G.tot);
  return G;
};
/* the pitch: 105 x 68 metres drawn at 10x */
const socPitch = inner => `<svg class="gstage" viewBox="0 0 1050 680" role="img" aria-label="Pitch with every shot so far"><rect width="1050" height="680" fill="#2f7a46"/>
  <g fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3"><rect x="20" y="20" width="1010" height="640"/><line x1="525" y1="20" x2="525" y2="660"/><circle cx="525" cy="340" r="91.5"/>
  <rect x="20" y="138" width="165" height="404"/><rect x="20" y="248" width="55" height="184"/><rect x="865" y="138" width="165" height="404"/><rect x="975" y="248" width="55" height="184"/>
  <path d="M185 290a91.5 91.5 0 0 1 0 100M865 290a91.5 91.5 0 0 0 0 100"/></g><rect x="6" y="290" width="14" height="100" fill="#fff" fill-opacity=".5"/><rect x="1030" y="290" width="14" height="100" fill="#fff" fill-opacity=".5"/>${inner}</svg>`;
SPORT.stage = {
  make(G, D) {
    const ch = gTeamColor(D, G.home.id), ca = gTeamColor(D, G.away.id), el = h('div', {});
    const pos = (e, home) => { const x = 20 + e.x / 100 * 1010, y = 20 + e.y / 100 * 640; return home ? [x, y] : [1050 - x, 680 - y]; };
    return { el, show(i) {
      let s = ''; const n = { h: [0, 0], a: [0, 0] };
      for (let k = 0; k <= i; k++) {
        const e = G.ev[k], q = e.p; if (q.x == null) continue;
        const home = q.tid === G.home.id || (!q.tid && false), side = home ? 'h' : 'a'; n[side][0]++; if (q.kind === 'g' || q.kind === 't') n[side][1]++;
        const [x, y] = pos(q, home), c = home ? ch : ca, cur = k === i, r = q.kind === 'g' ? 15 : q.kind === 't' ? 11 : 8;
        s += q.kind === 'g' ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#fff" stroke-width="3"/>` : q.kind === 't' ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" fill-opacity=".85" stroke="#fff" stroke-width="1.5"/>` :
          `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-width="3" ${q.kind === 'b' ? 'stroke-dasharray="3 3"' : ''} opacity=".85"/>`;
        if (cur) s += `<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#fff" stroke-width="3"><animate attributeName="r" from="14" to="44" dur="1.1s" repeatCount="2"/><animate attributeName="opacity" from="1" to="0" dur="1.1s" repeatCount="2"/></circle>`;
      }
      el.innerHTML = socPitch(s) + `<div class="cap" style="padding:6px 14px 8px;display:flex;gap:16px;flex-wrap:wrap"><span><b style="color:${ca}">●</b> ${esc(G.away.abbr)} ${n.a[0]} shots, ${n.a[1]} on target</span><span><b style="color:${ch}">●</b> ${esc(G.home.abbr)} ${n.h[0]} shots, ${n.h[1]} on target</span><span>Filled: goal or on target · ring: off target · dashed: blocked · each side attacks its own end</span></div>`;
    } };
  },
};
/* win chance: both sides keep scoring at about a goal and a quarter each per 90 minutes (a touch more at home); the chance is the home win plus half the draw */
const socPois = (l, k) => { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; };
SPORT.winProb = e => {
  const end = e.per <= 2 ? 5400 : 7200, rem = Math.max(0, end - e.t) / 5400, lh = 1.45 * rem, la = 1.15 * rem, d = e.h - e.a;
  if (rem <= 0) return d > 0 ? 1 : d < 0 ? 0 : .5;
  let w = 0, dr = 0;
  for (let i = 0; i <= 9; i++) for (let k = 0; k <= 9; k++) { const p = socPois(lh, i) * socPois(la, k); if (d + i - k > 0) w += p; else if (d + i - k === 0) dr += p; }
  return w + dr / 2;
};
