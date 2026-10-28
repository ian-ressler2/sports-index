#!/usr/bin/env python3
"""Print a compact data-layer bundle (shim + ESPN adapter + a sport's data.js) that can be pasted into a browser console
to run the real loadSeason against live feeds. Usage: tools/probe_bundle.py nhl"""
import re, sys, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
sport = sys.argv[1]
shim = """const SPORT={id:'%s',seasons:{current:2026},groups:{}};const COLS={},GROUPS={},GROUP_META={},COLMAP={};const App={};
const C=()=>0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const sum=a=>a.reduce((x,y)=>x+(isFinite(y)?y:0),0);const mean=a=>{const b=a.filter(isFinite);return b.length?sum(b)/b.length:NaN};
const slugify=s=>s.toLowerCase();const ttlFor=()=>0;const buildPct=()=>{};const cached=async(k,t,f)=>f();const wmean=()=>NaN;const esc=s=>s;
async function getJSON(u){const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
""" % sport
def strip(t):
    t = re.sub(r'^\s*/\*.*?\*/\s*$', '', t, flags=re.S | re.M)
    return '\n'.join(l.rstrip() for l in t.split('\n') if l.strip() and not l.strip().startswith('//'))
pack = (R / 'sports/_espn/pack.js').read_text()
m = re.search(r'/\* ---- map ESPN standings.*?\n(function buildTeamsAndStandings.*?\n}\n)', pack, re.S)
bits = "const numOf=v=>{if(v==null||v==='')return NaN;if(typeof v==='number')return v;const n=parseFloat(String(v));return isFinite(n)?n:NaN};\n" + m.group(1)
out = shim + strip((R / 'sports/_espn/espn.js').read_text()) + '\n' + bits + '\n' + strip((R / f'sports/{sport}/data.js').read_text())
print(out)
