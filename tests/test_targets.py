import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tools'))
import build_cfb_targets as b
fx = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/real_shapes.json')))['cfb_summary']
got = b.parse_plays([('9', p) for d in fx['drives']['previous'] for p in d['plays']])
ok = got == {'9': {'mknight': [2, 1], 'bother': [1, 1]}}
print('cfb target parser OK' if ok else f'FAIL {got}'); sys.exit(0 if ok else 1)
