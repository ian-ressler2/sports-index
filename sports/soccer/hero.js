/* hero.js: shots curling toward goal on a pitch, for the soccer home page */
function socHero(cv) {
  const ctx = cv.getContext('2d'); let W = 0, H = 0, col = {};
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const sizeUp = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); col = { a: css('--acc') || '#b98cff', b: css('--b') || '#ff9c4a', line: css('--line') || 'rgba(128,128,128,.35)' }; };
  sizeUp(); addEventListener('resize', sizeUp);
  const rnd = (a, b) => a + Math.random() * (b - a), shots = [];
  const spawn = () => { const left = Math.random() < .5, x0 = rnd(.25, .45) * W, y0 = rnd(.2, .8) * H; shots.push({ x0: left ? x0 : W - x0, y0, x1: left ? W * .96 : W * .04, y1: H * rnd(.42, .58), t: 0, c: left ? col.a : col.b, bend: rnd(-.12, .12) * H }); };
  let last = 0, raf = 0;
  const draw = ts => {
    if (!cv.isConnected) return cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H); ctx.strokeStyle = col.line; ctx.lineWidth = 1.2;
    ctx.strokeRect(W * .02, H * .06, W * .96, H * .88); ctx.beginPath(); ctx.moveTo(W / 2, H * .06); ctx.lineTo(W / 2, H * .94); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, H * .16, 0, 7); ctx.stroke(); ctx.strokeRect(W * .02, H * .26, W * .13, H * .48); ctx.strokeRect(W * .85, H * .26, W * .13, H * .48);
    if (ts - last > 650) { last = ts; if (shots.length < 14) spawn(); }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; s.t += .016; const u = Math.min(1, s.t), x = s.x0 + (s.x1 - s.x0) * u, y = s.y0 + (s.y1 - s.y0) * u + Math.sin(u * Math.PI) * s.bend;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, s.t - 1) * 1.4); ctx.fillStyle = ctx.strokeStyle = s.c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x0, s.y0); for (let k = 0; k <= u; k += .05) ctx.lineTo(s.x0 + (s.x1 - s.x0) * k, s.y0 + (s.y1 - s.y0) * k + Math.sin(k * Math.PI) * s.bend); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      if (s.t > 1.8) shots.splice(i, 1);
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
}
