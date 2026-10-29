#!/usr/bin/env python3
"""Build every site into dist/.

dist/index.html             landing page
dist/assets/core.css|js     shared styles and engine
dist/<sport>/index.html     one site per sport (loads ../assets/core.* and ./sport.js)
dist/standalone/<sport>.html  the same site as a single self-contained file
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CORE_JS = "sport util charts data ui stats home player team lab compare extras today game season main".split()
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap">'

SPORTS = json.loads((ROOT / "sports" / "sports.json").read_text())


def read(p):
    return (ROOT / p).read_text()


def core_js():
    return "\n".join(read(f"core/js/{n}.js") for n in CORE_JS)


def sport_js(s):
    files = SPORTS[s]["files"]
    return "\n".join(read(f"sports/{s}/{f}.js") for f in files) + "\nboot();\n"


def page(title, desc, sport, body_css, head_extra, scripts_html, icon):
    return f"""<!doctype html>
<html lang="en" data-sport="{sport}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="{icon}">
{FONTS}
{head_extra}
</head>
<body>
{scripts_html}
</body>
</html>
"""


def theme_css(meta):
    t = meta.get("theme")
    if not t:
        return ""
    def blk(d):
        return ";".join(f"--{k}:{v}" for k, v in d.items())
    return (f':root{{{blk(t["light"])}}}\n@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{{blk(t["dark"])}}}}}\n'
            f':root[data-theme="dark"]{{{blk(t["dark"])}}}\n')


def icon(color):
    c = color.replace("#", "%23")
    return f"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230d1318'/%3E%3Cpath d='M16 5l11 11-11 11L5 16z' fill='none' stroke='{c}' stroke-width='2.4'/%3E%3C/svg%3E"


def build():
    DIST.mkdir(exist_ok=True)
    (DIST / "assets").mkdir(exist_ok=True)
    base_css = read("core/css/base.css")
    (DIST / "assets" / "core.css").write_text(base_css)
    cj = core_js()
    (DIST / "assets" / "core.js").write_text(cj)
    for s, meta in SPORTS.items():
        d = DIST / s
        d.mkdir(exist_ok=True)
        sj = sport_js(s)
        (d / "sport.js").write_text(sj)
        theme = theme_css(meta)
        title = f'{meta["name"]} · {meta["short"]} stats'
        html = page(title, meta["desc"], s, "", f'<link rel="stylesheet" href="../assets/core.css">\n<style>\n{theme}\n</style>',
                    '<script src="../assets/core.js"></script>\n<script src="sport.js"></script>', icon(meta["accent"]))
        (d / "index.html").write_text(html)
        single = page(title, meta["desc"], s, "", f"<style>\n{base_css}\n{theme}\n</style>", f"<script>\n{cj}\n</script>\n<script>\n{sj}\n</script>", icon(meta["accent"]))
        (DIST / "standalone").mkdir(exist_ok=True)
        (DIST / "standalone" / f"{s}.html").write_text(single)
        print(f"{s}: {len(single)//1024} KB standalone")
    land = ROOT / "landing"
    if land.exists():
        lcss = read("landing/landing.css")
        ljs = read("landing/landing.js")
        sports_json = json.dumps({k: {x: v[x] for x in ("name", "short", "desc", "accent", "tagline")} for k, v in SPORTS.items()})
        html = page("Sports Index · MLB, NHL, NBA and NFL stats", "Leaderboards, percentiles, charts and a stat lab for baseball, hockey, basketball and football.", "landing", "",
                    f"<style>\n{base_css}\n{lcss}\n</style>", f"<script>const SPORTS_META = {sports_json};</script>\n<script>\n{ljs}\n</script>", icon("#ff8a4c"))
        (DIST / "index.html").write_text(html)
        print("landing built")


if __name__ == "__main__":
    build()
