/* hero.js: animated shot arcs on a half court for the college basketball home page */
function nbaHero(cv) {
  const ctx = cv.getContext('2d'); let W = 0, H = 0;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let col = {};
  const sizeUp = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); col = { fg: css('--fg') || '#fff', acc: css('--acc') || '#f60', a: css('--a') || '#5cf', line: css('--line2') || '#445' }; };
  sizeUp(); addEventListener('resize', sizeUp);
  const rnd = (a, b) => a + Math.random() * (b - a);
  /* court feet: x -25..25 across, y 0..47 up from the baseline (hoop at 5.25) */
  const k = () => Math.min(W / 56, H / 52);
  const P = (x, y, z = 0) => [W / 2 + x * k(), H * 0.93 - y * k() * 0.86 - z * k() * 0.5];
  const shots = []; const spawn = now => { const a = rnd(-80, 80) * Math.PI / 180, d = rnd(4, 26); shots.push({ x: Math.sin(a) * d, y: 5.25 + Math.abs(Math.cos(a)) * d * (Math.random() < .2 ? -0.1 : 1), born: now, life: rnd(900, 1300), made: Math.random() < .46, three: d > 22 }); if (shots.length > 12) shots.shift(); };
  const frame = now => {
    if (!document.body.contains(cv)) { removeEventListener('resize', sizeUp); return; }
    ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1; ctx.strokeStyle = col.line; ctx.globalAlpha = .75;
    const path = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => { const p = P(x, y); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }); ctx.stroke(); };
    path([[-25, 0], [-25, 47], [25, 47], [25, 0], [-25, 0]]); path([[-6, 0], [-6, 19], [6, 19], [6, 0]]);
    const arc = (cx, cy, r, a0, a1) => { const pts = []; for (let a = a0; a <= a1; a += 4) { const t = a * Math.PI / 180; pts.push([cx + r * Math.sin(t), cy + r * Math.cos(t)]); } path(pts); };
    arc(0, 19, 6, -90, 90); arc(0, 5.25, 4, -90, 90); arc(0, 5.25, 22.15, -90, 90); path([[-22.15, 0], [-22.15, 5.25]]); path([[22.15, 0], [22.15, 5.25]]);
    ctx.globalAlpha = .9; ctx.strokeStyle = col.fg; ctx.beginPath(); ctx.arc(...P(0, 5.25), .75 * k() * 1.6, 0, 7); ctx.stroke();
    for (const s of shots) {
      const u = (now - s.born) / s.life; if (u > 1.5) continue; const t = Math.min(u, 1), c = s.made ? col.acc : col.a, fade = u > 1 ? Math.max(0, 1 - (u - 1) * 2) : 1;
      const hx = 0, hy = 5.25, px = s.x + (hx - s.x) * t, py = s.y + (hy - s.y) * t, z = 4 * 14 * t * (1 - t) + 9 * t;
      ctx.strokeStyle = c; ctx.globalAlpha = .35 * fade; ctx.lineWidth = 1.3; ctx.beginPath();
      for (let q = 0; q <= t + 1e-6; q += .04) { const xx = s.x + (hx - s.x) * q, yy = s.y + (hy - s.y) * q, zz = 4 * 14 * q * (1 - q) + 9 * q; const p = P(xx, yy, zz); q === 0 ? ctx.moveTo(...p) : ctx.lineTo(...p); } ctx.stroke();
      const [bx, by] = P(px, py, z); ctx.globalAlpha = fade; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bx, by, 3.4, 0, 7); ctx.fill();
      if (u >= 1) { const [sx, sy] = P(s.x, s.y); ctx.globalAlpha = .9 * fade; ctx.lineWidth = 1.6; if (s.made) { ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(sx - 4, sy - 4); ctx.lineTo(sx + 4, sy + 4); ctx.moveTo(sx + 4, sy - 4); ctx.lineTo(sx - 4, sy + 4); ctx.stroke(); } }
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { if (!shots.length || now - shots[shots.length - 1].born > 420) spawn(now); requestAnimationFrame(frame); }
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i < 10; i++) { spawn(0); shots[i].born = -shots[i].life * 1.1; } frame(1); } else { for (let i = 0; i < 5; i++) spawn(performance.now() - i * 300); requestAnimationFrame(frame); }
}
