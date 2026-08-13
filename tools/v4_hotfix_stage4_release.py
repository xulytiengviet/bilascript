#!/usr/bin/env python3
from pathlib import Path
p=Path('v4/examples/hello.bila')
s=p.read_text(encoding='utf-8')
s=s.replace('BilaScript v3.5.0','BilaScript v4.0.0').replace('BilaScript v3.0.0','BilaScript v4.0.0')
p.write_text(s,encoding='utf-8')
print('finalized v4 example version string')
