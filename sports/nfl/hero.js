/* hero.js: animated drives on a football field for the NFL home page */
function nflHero(cv) {
  const ctx = cv.getContext('2d'); let W = 0, H = 0;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let col = {};
  const sizeUp = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); col = { fg: css('--fg') || '#fff', acc: css('--acc') || '#4c4', a: css('--a') || '#e66', b: css('--b') || '#6af', line: css('--line2') || '#445' }; };
  sizeUp(); addEventListener('resize', sizeUp);
  const rnd = (a, b) => a + Math.random() * (b - a);
  /* field: x 0..100 yards (goal line to goal line), y 0..53 */
  const F = () => { const w = Math.min(W * .96, (H * .8) * 100 / 53 * 1.0), h = w * 53 / 100; return { x0: (W - w) / 2, y0: (H - h) / 2, w, h }; };
  const X = (x, y) => { const f = F(); return [f.x0 + x / 100 * f.w, f.y0 + y / 53 * f.h]; };
  const plays = []; let t0 = 0;
  const spawn = now => { const pass = Math.random() < .58, sx = rnd(15, 75), sy = rnd(14, 39), len = pass ? rnd(8, 32) : rnd(2, 9), ey = pass ? rnd(6, 47) : sy + rnd(-6, 6); plays.push({ sx, sy, ex: sx + len, ey, pass, born: now, life: pass ? rnd(900, 1300) : rnd(600, 900), td: Math.random() < .08 }); if (plays.length > 9) plays.shift(); };
  const frame = now => {
    if (!document.body.contains(cv)) { removeEventListener('resize', sizeUp); return; }
    ctx.clearRect(0, 0, W, H); const f = F();
    ctx.strokeStyle = col.line; ctx.globalAlpha = .8; ctx.lineWidth = 1; ctx.strokeRect(f.x0, f.y0, f.w, f.h);
    for (let y = 10; y < 100; y += 5) { ctx.globalAlpha = y % 10 ? .25 : .55; ctx.beginPath(); ctx.moveTo(...X(y, 0)); ctx.lineTo(...X(y, 53)); ctx.stroke(); }
    ctx.globalAlpha = .6; ctx.strokeStyle = col.a; ctx.beginPath(); ctx.moveTo(...X(0, 0)); ctx.lineTo(...X(0, 53)); ctx.moveTo(...X(100, 0)); ctx.lineTo(...X(100, 53)); ctx.stroke();
    for (const p of plays) {
      const u = (now - p.born) / p.life; if (u > 1.5) continue; const t = Math.min(u, 1), fade = u > 1 ? Math.max(0, 1 - (u - 1) * 2) : 1, c = p.pass ? col.acc : col.b;
      const px = p.sx + (p.ex - p.sx) * t, py = p.sy + (p.ey - p.sy) * t, lift = p.pass ? Math.sin(t * Math.PI) * 5 : 0;
      ctx.strokeStyle = c; ctx.globalAlpha = .4 * fade; ctx.lineWidth = 1.5; ctx.setLineDash(p.pass ? [] : [4, 3]); ctx.beginPath();
      for (let q = 0; q <= t + 1e-6; q += .05) { const qx = p.sx + (p.ex - p.sx) * q, qy = p.sy + (p.ey - p.sy) * q - (p.pass ? Math.sin(q * Math.PI) * 5 : 0); const pt = X(qx, qy); q === 0 ? ctx.moveTo(...pt) : ctx.lineTo(...pt); } ctx.stroke(); ctx.setLineDash([]);
      const [bx, by] = X(px, py - lift); ctx.globalAlpha = fade; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(bx, by, 5, 3, Math.atan2(p.ey - p.sy, p.ex - p.sx), 0, 7); ctx.fill();
      if (u >= 1) { const [ex, ey] = X(p.ex, p.ey); ctx.globalAlpha = .7 * fade; ctx.lineWidth = 1.6; ctx.strokeStyle = p.td ? col.a : c; ctx.beginPath(); ctx.arc(ex, ey, 5 + (u - 1) * 24, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { if (!plays.length || now - plays[plays.length - 1].born > 420) spawn(now); requestAnimationFrame(frame); }
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i < 8; i++) { spawn(0); plays[i].born = -plays[i].life * 1.1; } frame(1); } else { for (let i = 0; i < 4; i++) spawn(performance.now() - i * 300); requestAnimationFrame(frame); }
}
