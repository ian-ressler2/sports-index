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
process.exit(bad ? 1 : 0);
