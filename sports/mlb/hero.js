/* hero.js: animated diamond for the MLB home page */
function heroCanvas(cv) {
  const ctx = cv.getContext('2d'); let W = 0, H = 0, raf = 0, t0 = performance.now();
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let col = {};
  const sizeUp = () => { const r = cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); col = { fg: css('--fg') || '#fff', acc: css('--acc') || '#f80', a: css('--a') || '#5cf', line: css('--line2') || '#345' }; };
  sizeUp(); addEventListener('resize', sizeUp);
  const P = (x, y, z = 0) => { const d = 0.0016, k = Math.min(W, 1100) / 760; const s = 1 / (1 + y * d); return [W / 2 + x * k * s * 1.0, H * 0.96 - (y * 0.78 * k) * s - z * k * s]; };
  const balls = []; const rnd = (a, b) => a + Math.random() * (b - a);
  const spawn = (now) => { const ang = rnd(-42, 42) * Math.PI / 180, dist = rnd(120, 360), life = rnd(1400, 2300); balls.push({ ang, dist, life, born: now, peak: rnd(60, 190), hr: Math.random() < .25 }); if (balls.length > 9) balls.shift(); };
  const frame = (now) => {
    if (!document.body.contains(cv)) { removeEventListener('resize', sizeUp); return; }
    ctx.clearRect(0, 0, W, H);
    const dark = isDark(); const lineA = dark ? 0.16 : 0.2;
    ctx.lineWidth = 1; ctx.strokeStyle = col.line;
    /* outfield fence arcs & distance rings */
    for (const r of [140, 220, 300, 380]) { ctx.globalAlpha = r === 380 ? .5 : .28; ctx.beginPath(); for (let a = -46; a <= 46; a += 2) { const t = a * Math.PI / 180, [x, y] = P(r * Math.sin(t), r * Math.cos(t)); a === -46 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    /* spokes */
    ctx.globalAlpha = .22; for (let a = -45; a <= 45; a += 15) { const t = a * Math.PI / 180; ctx.beginPath(); ctx.moveTo(...P(0, 0)); ctx.lineTo(...P(400 * Math.sin(t), 400 * Math.cos(t))); ctx.stroke(); }
    /* diamond */
    ctx.globalAlpha = .65; ctx.strokeStyle = col.fg; ctx.beginPath(); [[0, 0], [63.6, 63.6], [0, 127.3], [-63.6, 63.6], [0, 0]].forEach(([x, y], i) => { const p = P(x, y); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.stroke();
    ctx.globalAlpha = .9; for (const [x, y] of [[63.6, 63.6], [0, 127.3], [-63.6, 63.6]]) { const [px, py] = P(x, y); ctx.fillStyle = col.fg; ctx.fillRect(px - 3.5, py - 3.5, 7, 7); }
    ctx.globalAlpha = 1;
    /* foul lines */
    ctx.strokeStyle = col.fg; ctx.globalAlpha = .45; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(...P(0, 0)); ctx.lineTo(...P(s * 280, 280)); ctx.stroke(); } ctx.globalAlpha = 1;
    /* batted balls */
    for (const b of balls) {
      const u = (now - b.born) / b.life; if (u > 1.5) continue;
      const tt = Math.min(u, 1), x = Math.sin(b.ang) * b.dist * tt, y = Math.cos(b.ang) * b.dist * tt, z = 4 * b.peak * tt * (1 - tt);
      const fade = u > 1 ? Math.max(0, 1 - (u - 1) * 2) : 1;
      ctx.strokeStyle = b.hr ? col.acc : col.a; ctx.globalAlpha = .45 * fade; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let s = 0; s <= tt + 1e-6; s += 0.04) { const xx = Math.sin(b.ang) * b.dist * s, yy = Math.cos(b.ang) * b.dist * s, zz = 4 * b.peak * s * (1 - s); const p = P(xx, yy, zz); s === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p); } ctx.stroke();
      const [px, py] = P(x, y, z);
      ctx.globalAlpha = fade; ctx.fillStyle = b.hr ? col.acc : col.a; ctx.beginPath(); ctx.arc(px, py, tt < 1 ? 3.2 : 4.5, 0, 7); ctx.fill();
      if (u >= 1) { const [lx, ly] = P(Math.sin(b.ang) * b.dist, Math.cos(b.ang) * b.dist); ctx.strokeStyle = b.hr ? col.acc : col.a; ctx.globalAlpha = .9 * fade; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(lx, ly, 9, 5, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(lx, ly, 3, 1.8, 0, 0, 7); ctx.fillStyle = b.hr ? col.acc : col.a; ctx.fill(); }
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { if (!balls.length || (now - (balls[balls.length - 1]?.born || 0)) > 520) spawn(now); raf = requestAnimationFrame(frame); }
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i < 7; i++) { spawn(0); balls[i].born = -balls[i].life * 1.05; } frame(1); } else { for (let i = 0; i < 5; i++) { spawn(performance.now() - i * 500); } raf = requestAnimationFrame(frame); }
}

SPORT.heroCanvas = heroCanvas;
