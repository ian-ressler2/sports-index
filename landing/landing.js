(function(){
const ACC={mlb:['#cf5418','#ff8a4c'],nhl:['#0a7fc2','#5cc8ff'],nba:['#d4382c','#ff6b57'],nfl:['#1c8a4e','#4fd18b']};
const dark=()=>document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;
const art={
 mlb:'<svg viewBox="0 0 240 72" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M120 66 L30 30 A110 110 0 0 1 210 30 Z" opacity=".5"/><path d="M120 66 L120 46 L100 36 L120 26 L140 36 L120 46" opacity=".9"/><circle cx="150" cy="22" r="3" fill="currentColor"/><circle cx="82" cy="30" r="3" fill="currentColor"/><circle cx="170" cy="40" r="3" fill="currentColor"/></svg>',
 nhl:'<svg viewBox="0 0 240 72" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="6" width="228" height="60" rx="26" opacity=".5"/><path d="M120 6V66" opacity=".5"/><circle cx="120" cy="36" r="10" opacity=".5"/><path d="M206 28h14v16h-14z"/><circle cx="168" cy="24" r="3" fill="currentColor"/><circle cx="184" cy="46" r="3" fill="currentColor"/><circle cx="196" cy="34" r="3" fill="currentColor"/></svg>',
 nba:'<svg viewBox="0 0 240 72" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 66V6h228v60" opacity=".5"/><path d="M96 6v30h48V6" opacity=".5"/><path d="M60 6v24a60 60 0 0 0 120 0V6" opacity=".5"/><circle cx="120" cy="14" r="5"/><circle cx="84" cy="44" r="3" fill="currentColor"/><circle cx="150" cy="52" r="3" fill="currentColor"/><circle cx="176" cy="30" r="3" fill="currentColor"/></svg>',
 nfl:'<svg viewBox="0 0 240 72" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="6" width="228" height="60" rx="3" opacity=".5"/><path d="M42 6v60M78 6v60M114 6v60M126 6v60M162 6v60M198 6v60" opacity=".35"/><path d="M30 50 C80 50 90 22 150 24 S200 20 214 14" stroke-dasharray="4 4"/><circle cx="214" cy="14" r="3.5" fill="currentColor"/></svg>'};
art.wnba=art.nba;
art.cbb='<svg viewBox="0 0 240 72" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 8h34M8 24h34M42 8v16M42 16h30M8 48h34M8 64h34M42 48v16M42 56h30M72 16v40M72 36h38" opacity=".5"/><path d="M232 8h-34M232 24h-34M198 8v16M198 16h-30M232 48h-34M232 64h-34M198 48v16M198 56h-30M168 16v40M168 36h-38" opacity=".5"/><circle cx="120" cy="36" r="10"/><path d="M110 36h20M120 26v20" opacity=".7"/></svg>';
for(const k in SPORTS_META)if(!ACC[k])ACC[k]=[SPORTS_META[k].light||SPORTS_META[k].accent,SPORTS_META[k].accent];
function paint(){const d=dark()?1:0;for(const k in ACC)document.documentElement.style.setProperty('--c-'+k,ACC[k][d]);}
function el(h){const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild}
const cards=Object.entries(SPORTS_META).map(([k,m])=>`<a class="lp-card" href="${k}/" style="--c:var(--c-${k})"><span class="lg">${m.short}</span><h2>${m.name}</h2><p>${m.desc}</p>${art[k]||''}<span class="go">Open ${m.short} →</span></a>`).join('');
document.body.appendChild(el(`<div class="lp">
<div class="lp-top"><div class="lp-brand">Sports<b>Index</b></div><button class="lp-theme" id="lpt" aria-label="Toggle theme">Theme</button></div>
<section class="lp-hero"><div class="eyebrow">${Object.keys(SPORTS_META).length} sites · one set of tools</div><h1>Every stat, <em>ranked</em> against the field.</h1><p>Pick a sport. Each site has the same toolkit: sortable leaderboards with percentile shading, a stat lab for building your own metrics, side-by-side compare, and charts drawn from public tracking data.</p></section>
<div class="lp-grid">${cards}</div>
<div class="lp-feat"><div><h3>Percentiles everywhere</h3><p>Every number is shaded against qualified players, flipped where lower is better.</p></div><div><h3>Build your own stat</h3><p>Combine columns into a formula, filter the field, and plot anything against anything.</p></div><div><h3>Compare</h3><p>Two players or two teams on a tale of the tape and a percentile radar.</p></div><div><h3>Runs in your browser</h3><p>No account and no server. Data loads live from public stats feeds and is cached locally.</p></div></div>
<p class="lp-foot">Not affiliated with or endorsed by any league, conference or club. Statistics come from public feeds (MLB Stats API, Baseball Savant, ESPN). <a href="https://github.com/ian-ressler2/sports-index" rel="noopener">Open source on GitHub</a>.</p></div>`));
paint();matchMedia('(prefers-color-scheme:dark)').addEventListener('change',paint);
document.getElementById('lpt').onclick=()=>{const r=document.documentElement;r.dataset.theme=dark()?'light':'dark';try{localStorage.setItem('dm:theme',JSON.stringify(r.dataset.theme))}catch(e){}paint()};
try{const t=JSON.parse(localStorage.getItem('dm:theme')||'null');if(t)document.documentElement.dataset.theme=t;paint()}catch(e){}
})();
