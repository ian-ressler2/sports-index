/* util.js: DOM helpers, number formatting, CSV, cache, fetch */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv); }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return el;
}
function mount(el, ...kids) { el.replaceChildren(...kids.flat(Infinity).filter(x => x != null && x !== false).map(k => k.nodeType ? k : document.createTextNode(k))); return el; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* numbers */
function num(v) {
  if (v == null || v === '') return NaN;
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  if (/^[-.\s]+$/.test(v) || v === '-.--' || v === '.---') return NaN;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isFinite(n) ? n : NaN;
}
function noLead(s) { return s.replace(/^(-?)0\./, '$1.'); }
function ipToNum(s) { const n = num(s); if (!isFinite(n)) return NaN; const w = Math.floor(n); return w + Math.round((n - w) * 10) / 3; }
function fmtIP(x) { if (!isFinite(x)) return '–'; let w = Math.floor(x + 1e-9); let t = Math.round((x - w) * 3); if (t === 3) { w++; t = 0; } return w + '.' + t; }
function fmt(v, f) {
  if (v == null || typeof v !== 'number' || !isFinite(v)) return '–';
  switch (f) {
    case 'int': return Math.round(v).toLocaleString('en-US');
    case 'f1': return v.toFixed(1);
    case 'f2': return v.toFixed(2);
    case 'f3': return noLead(v.toFixed(3));
    case 'sg1': return (v > 0 ? '+' : '') + v.toFixed(1);
    case 'sg2': return (v > 0 ? '+' : '') + v.toFixed(2);
    case 'sg3': return (v > 0 ? '+' : v < 0 ? '' : '') + noLead(v.toFixed(3));
    case 'sgi': return (v > 0 ? '+' : '') + Math.round(v);
    case 'ip': return fmtIP(v);
    case 'ms': { const m = Math.floor(v), x = Math.round((v - m) * 60); return m + ':' + String(x === 60 ? 0 : x).padStart(2, '0'); }
    case 'pct0': return Math.round(v) + '%';
    default: return String(v);
  }
}
const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const sum = a => a.reduce((x, y) => x + (isFinite(y) ? y : 0), 0);
const mean = a => { const b = a.filter(isFinite); return b.length ? sum(b) / b.length : NaN; };
function wmean(rows, k, w) { let s = 0, ws = 0; for (const r of rows) { const v = r[k], x = r[w]; if (isFinite(v) && isFinite(x) && x > 0) { s += v * x; ws += x; } } return ws ? s / ws : NaN; }
function corr(xs, ys) {
  const n = xs.length; if (n < 3) return NaN; const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxy / Math.sqrt(sxx * syy);
}
function linfit(xs, ys) { const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0; for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } const m = sxy / sxx; return { m, b: my - m * mx }; }
function niceTicks(lo, hi, n = 5) {
  if (!(hi > lo)) { hi = lo + 1; }
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}
function fmtTick(v) { const a = Math.abs(v); if (a >= 1000) return Math.round(v).toLocaleString('en-US'); if (a >= 10 || v === Math.round(v)) return String(+v.toFixed(1)); return String(+v.toFixed(3)).replace(/^(-?)0\./, '$1.'); }

/* colour */
function hexToRgb(hex) { const m = hex.replace('#', ''); return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)]; }
function lum([r, g, b]) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
function isDark() { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
function visColor(hex) {
  const rgb = hexToRgb(hex); const l = lum(rgb);
  if (isDark() && l < 0.38) { const t = (0.46 - l) * 1.5; return `rgb(${rgb.map(c => Math.round(c + (255 - c) * clamp(t, 0, .75))).join(',')})`; }
  if (!isDark() && l > 0.7) { return `rgb(${rgb.map(c => Math.round(c * 0.72)).join(',')})`; }
  return hex;
}
/* heat shading: p in 0..100 -> css background (red high / blue low) */
function heat(p) {
  if (p == null || !isFinite(p)) return '';
  const t = (p - 50) / 50, a = Math.abs(t);
  const col = t >= 0 ? 'var(--hot)' : 'var(--cold)';
  return `background:rgba(${col},${(0.12 + a * 0.62).toFixed(2)})`;
}
function pctColor(p) {
  if (p == null || !isFinite(p)) return 'var(--bg4)';
  const t = (p - 50) / 50;
  return t >= 0 ? `rgba(var(--hot),${(0.45 + t * 0.55).toFixed(2)})` : `rgba(var(--cold),${(0.45 + -t * 0.55).toFixed(2)})`;
}

/* CSV */
function parseCSV(t) {
  t = t.replace(/^﻿/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
function csvObjects(t) {
  const rows = parseCSV(t).filter(r => r.length > 1 || (r[0] && r[0] !== ''));
  if (!rows.length) return [];
  const hd = rows[0].map(x => x.trim());
  const out = new Array(rows.length - 1);
  for (let i = 1; i < rows.length; i++) { const o = {}, r = rows[i]; for (let j = 0; j < hd.length; j++) o[hd[j]] = r[j]; out[i - 1] = o; }
  return out;
}

/* IndexedDB cache (best effort) */
const IDB = {
  db: null, failed: false,
  open() {
    if (this.db || this.failed) return Promise.resolve(this.db);
    return new Promise(res => {
      try {
        const rq = indexedDB.open('diamond-index', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
        rq.onsuccess = () => { this.db = rq.result; res(this.db); };
        rq.onerror = rq.onblocked = () => { this.failed = true; res(null); };
      } catch (e) { this.failed = true; res(null); }
    });
  },
  async get(k) { const db = await this.open(); if (!db) return null; return new Promise(res => { try { const r = db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); } catch (e) { res(null); } }); },
  async set(k, v) { const db = await this.open(); if (!db) return; return new Promise(res => { try { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = tx.onerror = tx.onabort = () => res(); } catch (e) { res(); } }); },
};
const MEM = new Map();
async function cached(key, ttl, loader) {
  key = (typeof SPORT !== 'undefined' && SPORT.id ? SPORT.id : '') + '|' + key;
  if (MEM.has(key)) return MEM.get(key);
  const p = (async () => {
    const hit = await IDB.get(key);
    const age = hit ? Date.now() - hit.t : Infinity;
    if (age < ttl) return hit.v;
    /* stale-while-revalidate: data a little past its time is shown at once and refreshed behind the scenes, so the next visit is fresh */
    if (age < Math.min(ttl * 12, 3 * 86400e3)) { loader().then(v => IDB.set(key, { t: Date.now(), v })).catch(() => { }); return hit.v; }
    const v = await loader();
    IDB.set(key, { t: Date.now(), v });
    return v;
  })();
  MEM.set(key, p);
  p.catch(() => MEM.delete(key));
  return p;
}

/* fetch */
async function getText(url, { retries = 2, timeout = 70000 } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    const ac = new AbortController(); const to = setTimeout(() => ac.abort(), timeout);
    try {
      const r = await fetch(url, { signal: ac.signal });
      clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) { clearTimeout(to); last = e; await sleep(400 * (i + 1)); }
  }
  throw last;
}
async function getJSON(url) { return JSON.parse(await getText(url)); }
async function getCSV(url) {
  const t = await getText(url);
  if (t.trimStart().startsWith('<')) throw new Error('not csv');
  return csvObjects(t);
}

/* misc */
function toast(msg) { const t = h('div', { class: 'toast' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2200); }
function copyText(s) { return navigator.clipboard?.writeText(s).then(() => true).catch(() => false) || Promise.resolve(false); }
const store = {
  get(k, d) { try { const v = localStorage.getItem('dm:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dm:' + k, JSON.stringify(v)); } catch (e) { } },
};
const initials = n => n.split(/\s+/).map(x => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
