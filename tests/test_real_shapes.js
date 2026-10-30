// Runs the production ESPN_MIN against fixtures trimmed from real ESPN responses.
const fs = require('fs'), path = require('path');
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/real_shapes.json'), 'utf8'));
const src = fs.readFileSync(path.join(__dirname, '../sports/_espn/espn.js'), 'utf8');
const m = src.match(/const ESPN_MIN = [\s\S]*?\n\}\);\n/);
if (!m) { console.error('ESPN_MIN not found'); process.exit(1); }
const cached = (k, t, fn) => fn(), getJSON = async () => fx.soccer_summary, espnSite = () => 'x';
const ESPN_MIN = new Function('cached', 'getJSON', 'espnSite', m[0] + '; return ESPN_MIN;')(cached, getJSON, espnSite);
(async () => {
  let bad = 0;
  for (const [id, want] of Object.entries(fx.soccer_expect)) {
    const got = await ESPN_MIN('1', id);
    if (got !== want) { bad++; console.error(`player ${id}: expected ${want}, got ${got}`); }
  }
  console.log(bad ? `FAIL ${bad}` : 'soccer minutes OK');
  process.exit(bad ? 1 : 0);
})();
