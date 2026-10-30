/* CFB season simulator rules: about 135 FBS teams, 12-team playoff (four Power 4 champions, the best Group of 6 team, at-large), straight seeding, top four get byes */
SPORT.season = {
  sigma: 16.5, hfa: 2.6, k: 5, prior: .3, unit: 'points per game', metric: 'wins', dec: 1,
  blurb: 'Plays out the rest of the FBS schedule thousands of times, then picks the 12-team College Football Playoff and plays the bracket.',
  topLabel: 'First-round bye', topDesc: 'Chance to be one of the four top-ranked teams and skip the first round', finalLabel: 'National title game',
  madeNote: ' (12-team field)', noDiv: false,
  cols: [['made', 'Playoff', 'Chance to make the 12-team playoff'], ['div', 'Conf. best', 'Chance to finish with the best record in the conference or division'], ['top', 'Bye', 'Chance to be a top-four seed and skip the first round'], ['conf', 'Title game', 'Chance to reach the national title game'], ['champ', 'Champion', 'Chance to win the national championship']],
  rec: s => `${s.w}-${s.l}`,
  games: (D, prog) => espnSeasonData(D, prog),
  doneNote: 'The regular season is over, so these odds replay the playoff from the final records. The real field is picked by the selection committee, which this page can only imitate.',
  bracket(X) {
    const T = i => X.team(i), power = ['Southeastern', 'Big Ten', 'Big 12', 'Atlantic Coast'], indep = i => /independ/i.test(T(i).lg), out = { made: [], top: [], conf: [], champ: null };
    const rank = X.all().filter(i => T(i).name !== 'UConn' && T(i).name !== 'Connecticut Huskies');
    const champs = power.map(c => X.sortLg(c).filter(i => rank.includes(i))[0]).filter(Boolean);
    const g6 = rank.find(i => !indep(i) && !power.includes(T(i).lg) && !champs.includes(i));
    const field = new Set([...champs, g6].filter(Boolean));
    for (const i of rank) { if (field.size >= 12) break; field.add(i); }
    const s = rank.filter(i => field.has(i)).slice(0, 12); /* straight seeding by rank */
    out.made.push(...s); out.top.push(...s.slice(0, 4));
    const G = (a, b) => X.game(a, b), N = (a, b) => X.game(a, b, true);
    const r1 = [G(s[4], s[11]), G(s[5], s[10]), G(s[6], s[9]), G(s[7], s[8])];
    const q = [N(s[0], r1[3]), N(s[1], r1[2]), N(s[2], r1[1]), N(s[3], r1[0])];
    const sf = [N(q[0], q[3]), N(q[1], q[2])]; out.conf.push(...sf); out.champ = N(sf[0], sf[1]); return out;
  },
  note: `<p><b>Strength.</b> Each team’s rating is its average scoring margin, adjusted for the opponents it faced and for home field, then pulled toward average. College schedules are lopsided, so early in the year the pull toward average is strong, and last season counts for about a third as much as this one. Games against non-FBS teams count toward records but not ratings. Every simulated season draws each team’s true strength from a range, because ratings are uncertain.</p>
  <p><b>Games.</b> Win chance comes from the rating gap plus a home edge of about two and a half points, against a typical game margin spread of about 16 points.</p>
  <p><b>Playoff.</b> The 12-team field is the four Power 4 champions (the best-ranked team in the SEC, Big Ten, Big 12 and ACC), the highest-ranked Group of 6 team, and the best remaining teams, with Notre Dame eligible on merit. Everyone is seeded straight by rank; the top four skip the first round, seeds 5 to 12 play at the higher seed’s campus, and the quarterfinals, semifinals and title game are on neutral fields.</p>
  <p><b>Limits.</b> The real field is picked by a selection committee that weighs résumé and polls; here the ranking is each team’s simulated record, then head-to-head, conference and division record, strength of victory, strength of schedule and point differential, so it can differ from the committee’s order. The conference champion is the team with the best simulated overall record in the conference, not the winner of the conference title game, and the title games themselves are not played. Injuries, transfers and coaching changes are not modeled.</p>`,
};
