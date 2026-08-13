#!/usr/bin/env python3
from pathlib import Path
p=Path('v4/src/typescript-oracle.js')
s=p.read_text(encoding='utf-8')
old='let ts; try{ ts=await import("typescript"); }catch{return {available:false,diagnostics:[],reason:"typescript package not installed"};}'
new='let ts; try{ const mod=await import("typescript"); ts=mod.default||mod; }catch{return {available:false,diagnostics:[],reason:"typescript package not installed"};}'
if old not in s: raise SystemExit('TypeScript oracle import anchor not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('normalized TypeScript ESM namespace')
