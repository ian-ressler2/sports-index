/* hero.js: animated shots on goal for the NHL home page */
function nhlHero(cv) {
  const ctx = cv.getContext('2d'); let W = 0, H = 0, raf = 0;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let col = {};
  const sizeUp = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); col = { fg: css('--fg') || '#fff', acc: css('--acc') || '#5cf', a: css('--a') || '#5cf', line: css('--line2') || '#445', bad: '#d6455d' }; };
  sizeUp(); addEventListener('resize', sizeUp);
  const rnd = (a, b) => a + Math.random() * (b - a);
  /* rink in feet: x across -42.5..42.5, y from goal line (0) up the ice (0..75) */
  const P = (x, y) => { const k = Math.min(W / 90, H / 80) * 1.05; return [W / 2 + x * k, H * 0.2 + y * k * 0.98]; };
  const shots = []; const spawn = now => { const x = rnd(-30, 30), y = rnd(8, 60); shots.push({ x, y, born: now, life: rnd(700, 1100), goal: Math.random() < .14 }); if (shots.length > 12) shots.shift(); };
  const frame = now => {
    if (!document.body.contains(cv)) { removeEventListener('resize', sizeUp); return; }
    ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
    ctx.strokeStyle = col.line; ctx.globalAlpha = .7;
    [[-22, 20], [22, 20]].forEach(([x, y]) => { ctx.beginPath(); const [cx, cy] = P(x, y); ctx.arc(cx, cy, 15 * Math.min(W / 90, H / 80), 0, 7); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(...P(-42, 0)); ctx.lineTo(...P(42, 0)); ctx.stroke();
    ctx.strokeStyle = col.a; ctx.beginPath(); ctx.moveTo(...P(-42, 64)); ctx.lineTo(...P(42, 64)); ctx.stroke();
    ctx.strokeStyle = col.fg; ctx.globalAlpha = .5; ctx.beginPath(); const [gx, gy] = P(0, 0), k = Math.min(W / 90, H / 80); ctx.rect(gx - 3 * k, gy - 3.3 * k, 6 * k, 3.3 * k); ctx.stroke();
    ctx.beginPath(); ctx.arc(gx, gy, 6 * k, 0, Math.PI); ctx.stroke(); ctx.globalAlpha = 1;
    for (const s of shots) {
      const u = (now - s.born) / s.life; if (u > 1.6) continue; const t = Math.min(u, 1), [sx, sy] = P(s.x, s.y), tx = s.goal ? 0 : s.x * 0.18, [ex, ey] = P(tx, 0);
      const px = sx + (ex - sx) * t, py = sy + (ey - sy) * t, fade = u > 1 ? Math.max(0, 1 - (u - 1) * 1.8) : 1, c = s.goal ? col.acc : col.a;
      ctx.strokeStyle = c; ctx.globalAlpha = .4 * fade; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke();
      ctx.globalAlpha = fade; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, py, s.goal ? 4.5 : 3, 0, 7); ctx.fill();
      if (u >= 1 && s.goal) { ctx.globalAlpha = .6 * fade; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex, ey, 6 + (u - 1) * 30, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { if (!shots.length || now - shots[shots.length - 1].born > 380) spawn(now); raf = requestAnimationFrame(frame); }
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i < 9; i++) { spawn(0); shots[i].born = -shots[i].life * 1.0; } frame(1); } else { for (let i = 0; i < 5; i++) spawn(performance.now() - i * 300); raf = requestAnimationFrame(frame); }
}
