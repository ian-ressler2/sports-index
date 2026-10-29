/* game.js (MLB): game list and play-by-play from the MLB Stats API live feed. Every plate appearance carries its pitches (plate location, type, speed, call)
   and, when the ball was put in play, Statcast's hit coordinates. The same stage draws simulated games. */
SPORT.perName = (p, short) => `${p % 2 ? (short ? 'T' : 'Top') : (short ? 'B' : 'Bot')} ${Math.ceil(p / 2)}`;
SPORT.seasonEnd = s => new Date(s, 9, 31);
SPORT.gameSpan = 2;
SPORT.gamesNote = 'Open a game to see every pitch in the strike zone and every ball in play on the field.';
const mlbLogo = id => `https://www.mlbstatic.com/team-logos/${id}.svg`;
const mlbDay = n => { const s = String(n); return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`; };
SPORT.listGames = (a, b) => cached(`bd:${a}-${b}`, 300e3, async () => {
  const j = await getJSON(`${API}/schedule?sportId=1&startDate=${mlbDay(a)}&endDate=${mlbDay(b)}&hydrate=team&gameType=R,F,D,L,W`);
  return (j.dates || []).flatMap(d => d.games.map(g => {
    const st = g.status || {}; if (st.abstractGameCode === 'P' || st.codedGameState === 'S' || /postponed|cancel|suspended/i.test(st.detailedState || '')) return null;
    const tm = w => { const t = g.teams[w]; return { id: t.team.id, abbr: t.team.abbreviation, name: t.team.name, logo: mlbLogo(t.team.id), score: t.score }; };
    return { id: String(g.gamePk), t: g.gameDate, day: g.officialDate || d.date, final: st.abstractGameCode === 'F', status: st.detailedState || '', home: tm('home'), away: tm('away') };
  }).filter(Boolean));
});
SPORT.loadGame = (id, D) => cached(`game:${id}:1`, 600e3, async () => {
  const j = await getJSON(`https://statsapi.mlb.com/api/v1.1/game/${id}/feed/live`);
  const gd = j.gameData || {}, ls = j.liveData?.linescore || {};
  const tm = w => { const t = gd.teams[w]; return { id: t.id, abbr: t.abbreviation, name: t.name, logo: mlbLogo(t.id), color: tcol(t.id), score: ls.teams?.[w]?.runs ?? 0 }; };
  const G = { id, sim: false, date: gd.datetime?.officialDate || '', sub: gd.status?.detailedState || '', home: tm('home'), away: tm('away'), ev: [], tot: 0 };
  SPORT.gameEvents(j, G); return G;
});
const mlbShort = n => { const p = String(n || '').trim().split(/\s+/); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : p[0] || ''; };
const MLB_BIG = /^(Triple|Home Run|Grounded Into DP|Double Play|Triple Play|Field Error|Fielders Choice|Stolen Base|Caught Stealing|Pickoff)/i;
SPORT.gameEvents = (j, G) => {
  const plays = j.liveData?.plays?.allPlays || [], ev = []; let hs = 0, as = 0;
  const half = new Set();
  for (const p of plays) {
    const r = p.result || {}, ab = p.about || {}; if (!ab.isComplete && !r.event) continue;
    const per = (ab.inning - 1) * 2 + (ab.isTopInning ? 1 : 2), top = !!ab.isTopInning, pe = p.playEvents || [];
    hs = r.homeScore ?? hs; as = r.awayScore ?? as;
    const pitches = pe.filter(e => e.isPitch && e.pitchData?.coordinates).map(e => ({ px: e.pitchData.coordinates.pX, pz: e.pitchData.coordinates.pZ, d: e.details?.call?.description || '', ty: e.details?.type?.code || '', nm: e.details?.type?.description || '', v: e.pitchData.startSpeed, szt: e.pitchData.strikeZoneTop, szb: e.pitchData.strikeZoneBottom, b: e.count?.balls, s: e.count?.strikes }));
    const hd = [...pe].reverse().find(e => e.hitData?.coordinates?.coordX != null)?.hitData, hit = hd ? (([x, y]) => ({ x, y, ev: hd.launchSpeed, la: hd.launchAngle, dist: hd.totalDistance, traj: hd.trajectory }))(hcFt(hd.coordinates.coordX, hd.coordinates.coordY)) : null;
    const on = m => !!m.postOnFirst, mt = p.matchup || {}, outs = p.count?.outs ?? 0;
    const bases = [!!mt.postOnFirst, !!mt.postOnSecond, !!mt.postOnThird];
    const inn = ab.inning, ty = r.eventType || '', evt = r.event || '';
    const tid = top ? G.away.id : G.home.id, sc = !!ab.isScoringPlay;
    ev.push({ per, clk: `${Math.min(outs, 3)} out${outs === 1 ? '' : 's'}`, t: ev.length, h: hs, a: as, tid, tx: (r.description || evt).replace(/\s+/g, ' ').trim(), ctx: `${mlbShort(mt.pitcher?.fullName)} pitching to ${mlbShort(mt.batter?.fullName)}`, k: sc ? 'sc' : MLB_BIG.test(evt) ? 'bg' : '', p: { inn, top, outs: Math.min(outs, 3), bases, pitches, hit, ev: ty, evt, bat: mt.batter?.fullName || '', pit: mt.pitcher?.fullName || '', tid } });
    if (!half.has(per)) half.add(per);
  }
  G.ev = ev; G.tot = Math.max(1, ev.length - 1);
  G.dividers = ev.map((e, n) => n && e.per !== ev[n - 1].per && e.per % 2 === 1 ? n : -1).filter(n => n > 0);
  G.sub = G.sub || ''; return G;
};

/* the stage: the field on the left (runners, the ball in play) and the strike zone on the right (every pitch of the at-bat) */
const MLB_CALL = d => /^Ball|Intent|Pitchout/i.test(d) ? ['Ball', '#5b8def'] : /Called Strike/i.test(d) ? ['Called strike', '#ff6b6b'] : /Swinging|Missed|Foul Tip/i.test(d) ? ['Swinging strike', '#ff3d71'] : /Foul/i.test(d) ? ['Foul', '#f2c14e'] : /In play/i.test(d) ? ['In play', '#4fd18b'] : /Hit By/i.test(d) ? ['Hit by pitch', '#9a66e0'] : [d || 'Pitch', '#9aa7b5'];
SPORT.stage = {
  make(G, D) {
    const el = h('div', { class: 'mlbstage' });
    return { el, show(i, e) {
      const P = e.p, id = uid();
      /* field: runners and the ball in play */
      let f = fieldMarkup(id, { rings: false }) + `<g transform="scale(1,-1)">`;
      [[63.6, 63.6], [0, 127.3], [-63.6, 63.6]].forEach(([x, y], n) => { if (P.bases[n]) f += `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})" fill="${gTeamColor(D, P.tid)}" stroke="#fff" stroke-width="2"/>`; });
      if (P.hit) { const c = RES_COL[resCat(P.ev)]; f += `<line x1="0" y1="0" x2="${P.hit.x.toFixed(1)}" y2="${P.hit.y.toFixed(1)}" stroke="${c}" stroke-width="2.4" stroke-dasharray="6 5" opacity=".8"/><circle cx="${P.hit.x.toFixed(1)}" cy="${P.hit.y.toFixed(1)}" r="${P.ev === 'home_run' ? 11 : 8}" fill="${c}" stroke="#fff" stroke-width="2.2"/>`; }
      f += `</g>`;
      /* zone: pitches of this plate appearance, numbered */
      const sz = P.pitches.find(q => q.szt)?.szt || 3.5, sb = P.pitches.find(q => q.szb)?.szb || 1.6;
      let z = ''; P.pitches.forEach((q, n) => { if (!isFinite(q.px) || !isFinite(q.pz)) return; const [lab, c] = MLB_CALL(q.d), last = n === P.pitches.length - 1; z += `<g><title>${esc(`${n + 1}. ${q.nm || ''} ${q.v ? Math.round(q.v) + ' mph' : ''} – ${lab}`)}</title><circle cx="${zoneX(q.px).toFixed(1)}" cy="${zoneY(q.pz).toFixed(1)}" r="${last ? 21 : 17}" fill="${c}" fill-opacity="${last ? 1 : .8}" stroke="#fff" stroke-width="${last ? 3 : 1.4}"/><text x="${zoneX(q.px).toFixed(1)}" y="${(zoneY(q.pz) + 6).toFixed(1)}" text-anchor="middle" font-size="17" font-weight="700" fill="#fff">${n + 1}</text></g>`; });
      const seq = P.pitches.map((q, n) => `<span style="white-space:nowrap"><b>${n + 1}</b> ${esc(q.nm || 'Pitch')}${q.v ? ' ' + Math.round(q.v) : ''} <i style="color:${MLB_CALL(q.d)[1]}">●</i> ${esc(MLB_CALL(q.d)[0])}</span>`).join(' &nbsp; ');
      const info = P.hit && isFinite(P.hit.ev) ? `Exit velocity ${Math.round(P.hit.ev)} mph, launch angle ${Math.round(P.hit.la)}°${P.hit.dist ? ', ' + Math.round(P.hit.dist) + ' ft' : ''}` : '';
      el.innerHTML = `<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:6px;align-items:center;background:var(--bg3)"><svg class="chart" viewBox="${FIELD_VB}" role="img" aria-label="Field with runners and the ball in play">${f}</svg><svg class="chart" viewBox="0 0 480 460" role="img" aria-label="Strike zone with the pitches of this at-bat">${zoneFrame(sb, sz, z)}</svg></div>`
        + `<div class="cap" style="padding:8px 14px 0">${seq || 'No pitch data for this play.'}${info ? `<div style="margin-top:4px">${esc(info)}</div>` : ''}</div>`;
    } };
  },
};
/* win probability from the score, the inning and the base-out state, using the standard run-expectancy table for the half inning in progress */
const MLB_RE = [[.50, .90, 1.10, 1.50, 1.35, 1.75, 1.96, 2.28], [.27, .54, .66, .95, .95, 1.14, 1.38, 1.54], [.10, .23, .32, .46, .35, .49, .58, .76]];
SPORT.winProb = e => {
  const p = e.p; if (!p.bases) return .54;
  let per = e.per, outs = p.outs, b = 0, d = e.h - e.a;
  if (outs >= 3) { if (per >= 18 && per % 2 === 0) return d > 0 ? 1 : d < 0 ? 0 : .53; per++; outs = 0; } else b = (p.bases[0] ? 1 : 0) + (p.bases[1] ? 2 : 0) + (p.bases[2] ? 4 : 0);
  if (per === 18 && d > 0) return 1;                                   // the home team never bats in the bottom of the ninth when it is already ahead
  const batHome = per % 2 === 0, re = MLB_RE[outs][b], endHalf = per <= 18 ? 18 : per % 2 ? per + 1 : per;
  let homeF = 0, awayF = 0; for (let k = per + 1; k <= endHalf; k++) k % 2 ? awayF++ : homeF++;
  const m = d + (batHome ? re : -re) + .5 * (homeF - awayF) + .1;       // about half a run per half inning
  return normCdf(m / Math.sqrt(endHalf - per + .5 + 1.4 * re));       // the half inning in progress is riskier when more runners are on and fewer are out
};
