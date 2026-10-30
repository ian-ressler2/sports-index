// Runs the production soccer stat parser against a fixture trimmed from a real ESPN core API response.
const fs = require('fs'), path = require('path');
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/real_shapes.json'), 'utf8'));
const src = fs.readFileSync(path.join(__dirname, '../sports/_espn/espn.js'), 'utf8');
const m = src.match(/function socStatMap[\s\S]*?\n\}\n/);
if (!m) { console.error('socStatMap not found'); process.exit(1); }
const socStatMap = new Function(m[0] + '; return socStatMap;')();
const got = socStatMap(fx.soccer_core_stats), want = { minutes: '90', starts: '1', totalShots: '5', shotsOnTarget: '2', totalGoals: '0', saves: '0' };
let bad = 0;
for (const [k, v] of Object.entries(want)) if (got[k] !== v) { bad++; console.error(`${k}: expected ${v}, got ${got[k]}`); }
console.log(bad ? `FAIL ${bad}` : 'soccer stat parser OK');
process.exitCode = bad ? 1 : 0;

// College football: targets counted from play text.
(async () => {
  const cfg = fs.readFileSync(path.join(__dirname, '../sports/cfb/config.js'), 'utf8');
  const m2 = cfg.match(/const CFB_TGT = [\s\S]*?\n\}\);\n/);
  if (!m2) { console.error('CFB_TGT not found'); process.exit(1); }
  const make = new Function('getJSON', 'espnSite', m2[0] + '; return CFB_TGT;')(async () => fx.cfb_summary, () => 'x');
  const r = await make((k, t, fn) => fn())({ id: '1' }, { players: new Map([[5, { name: 'Mike Knight' }]]) }, 5);
  const ok = r && r[0] === 2 && r[1] === '50%';
  console.log(ok ? 'cfb targets OK' : 'FAIL cfb targets ' + JSON.stringify(r));
  if (!ok) process.exitCode = 1;
})();
