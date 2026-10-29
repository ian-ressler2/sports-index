// Report identifiers that are used but never declared (typos, missing helpers). Usage:
//   node --expose-internals tools/lint_globals.js dist/assets/core.js dist/nhl/sport.js
const acorn = require('internal/deps/acorn/acorn/dist/acorn');
const fs = require('fs');
const src = process.argv.slice(2).map(f => fs.readFileSync(f, 'utf8')).join('\n');
const ast = acorn.parse(src, { ecmaVersion: 2022, locations: true });
const GLOBALS = new Set(('window document location history navigator console Math JSON Object Array String Number Boolean Date RegExp Map Set WeakMap Promise Error TypeError Symbol Infinity NaN undefined isFinite isNaN parseInt parseFloat encodeURIComponent decodeURIComponent escape fetch AbortController URL URLSearchParams setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame addEventListener removeEventListener matchMedia getComputedStyle devicePixelRatio innerWidth innerHeight indexedDB localStorage sessionStorage performance Intl Blob FileReader Image CustomEvent Event Element HTMLElement Node NodeList DOMParser XMLSerializer IntersectionObserver ResizeObserver MutationObserver queueMicrotask structuredClone atob btoa TextEncoder TextDecoder crypto Uint8Array Float64Array Int16Array File ClipboardItem Int32Array Int32Array Uint32Array ArrayBuffer arguments globalThis scrollTo scrollY scrollX alert prompt confirm open print getSelection screen ClipboardItem').split(' '));
const top = new Set();
const declPattern = (p, add) => { if (!p) return; switch (p.type) { case 'Identifier': add(p.name); break; case 'ObjectPattern': p.properties.forEach(x => declPattern(x.value || x.argument, add)); break; case 'ArrayPattern': p.elements.forEach(x => declPattern(x, add)); break; case 'RestElement': declPattern(p.argument, add); break; case 'AssignmentPattern': declPattern(p.left, add); break; } };
const hoist = (body, add) => { // declarations visible in a function/program scope
  const visit = n => { if (!n || typeof n.type !== 'string') return; switch (n.type) {
    case 'FunctionDeclaration': add(n.id.name); return;
    case 'ClassDeclaration': add(n.id.name); return;
    case 'VariableDeclaration': n.declarations.forEach(d => declPattern(d.id, add)); n.declarations.forEach(d => visit(d.init)); return;
    case 'FunctionExpression': case 'ArrowFunctionExpression': return;
  } for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === 'string') visit(v); } };
  body.forEach(visit); };
hoist(ast.body, n => top.add(n));
const bad = new Map();
function walk(n, scopes) {
  if (!n || typeof n.type !== 'string') return;
  const has = name => GLOBALS.has(name) || top.has(name) || scopes.some(s => s.has(name));
  switch (n.type) {
    case 'Identifier': if (!has(n.name)) { const k = n.name; if (!bad.has(k)) bad.set(k, n.loc.start.line); } return;
    case 'MemberExpression': walk(n.object, scopes); if (n.computed) walk(n.property, scopes); return;
    case 'Property': if (n.computed) walk(n.key, scopes); walk(n.value, scopes); return;
    case 'PropertyDefinition': case 'MethodDefinition': if (n.computed) walk(n.key, scopes); walk(n.value, scopes); return;
    case 'LabeledStatement': walk(n.body, scopes); return;
    case 'BreakStatement': case 'ContinueStatement': return;
    case 'FunctionDeclaration': case 'FunctionExpression': case 'ArrowFunctionExpression': {
      const s = new Set(); n.params.forEach(p => declPattern(p, x => s.add(x))); if (n.type === 'FunctionExpression' && n.id) s.add(n.id.name);
      if (n.body.type === 'BlockStatement') hoist(n.body.body, x => s.add(x));
      const sc = [...scopes, s]; n.params.forEach(p => { if (p.type === 'AssignmentPattern') walk(p.right, sc); if (p.type === 'ObjectPattern' || p.type === 'ArrayPattern') walkPatDefaults(p, sc); });
      walk(n.body, sc); return; }
    case 'BlockStatement': { const s = new Set(); n.body.forEach(st => { if (st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') s.add(st.id.name); if (st.type === 'VariableDeclaration') st.declarations.forEach(d => declPattern(d.id, x => s.add(x))); }); const sc = [...scopes, s]; n.body.forEach(x => walk(x, sc)); return; }
    case 'ForStatement': case 'ForInStatement': case 'ForOfStatement': { const s = new Set(); const d = n.init || n.left; if (d && d.type === 'VariableDeclaration') d.declarations.forEach(x => declPattern(x.id, y => s.add(y))); const sc = [...scopes, s]; for (const k of ['init', 'test', 'update', 'left', 'right', 'body']) if (n[k]) { if (n[k].type === 'VariableDeclaration') n[k].declarations.forEach(x => walk(x.init, sc)); else walk(n[k], sc); } return; }
    case 'CatchClause': { const s = new Set(); declPattern(n.param, x => s.add(x)); walk(n.body, [...scopes, s]); return; }
    case 'VariableDeclarator': walkPatDefaults(n.id, scopes); walk(n.init, scopes); return;
    case 'ClassDeclaration': case 'ClassExpression': walk(n.superClass, scopes); n.body.body.forEach(m => walk(m, scopes)); return;
  }
  for (const k in n) { if (k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, scopes)); else if (v && typeof v.type === 'string') walk(v, scopes); }
}
function walkPatDefaults(p, sc) { if (!p) return; if (p.type === 'AssignmentPattern') { walk(p.right, sc); walkPatDefaults(p.left, sc); } else if (p.type === 'ObjectPattern') p.properties.forEach(x => { if (x.computed) walk(x.key, sc); walkPatDefaults(x.value || x.argument, sc); }); else if (p.type === 'ArrayPattern') p.elements.forEach(x => walkPatDefaults(x, sc)); }
ast.body.forEach(n => walk(n, []));
for (const [k, l] of bad) console.log(`undefined: ${k} (first at line ${l})`);
console.log(bad.size ? `${bad.size} possible problems` : 'no undefined identifiers');
