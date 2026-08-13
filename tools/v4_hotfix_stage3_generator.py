#!/usr/bin/env python3
from pathlib import Path
p=Path('tools/upgrade_v4.py')
s=p.read_text(encoding='utf-8')
patches=[
("marker='      case \"ExpressionStatement\": emit(ind()+expr(n.expression)+\";\\\\n\"); break;'",
 "marker='    case \"ExpressionStatement\": emit(ind()+expr(n.expression)+\";\\\\n\"); break;'"),
("code=replace_required(code,'      case \"MemberExpression\": return n.computed?', '      case \"AwaitExpression\": return `await ${expr(n.argument)}`;\\n      case \"MemberExpression\": return n.computed?',\"await codegen\")",
 "code=replace_required(code,'    case \"MemberExpression\":', '    case \"AwaitExpression\": return `await ${expr(n.argument)}`;\\n    case \"MemberExpression\":',\"await codegen\")"),
("anchor='  ast.body.forEach(stmt); return out.join(\"\").trimEnd()+\"\\\\n\";'",
 "anchor='  function blockExpr(b){'"),
("          git add v4", "          git add v4")
]
changed=False
for old,new in patches[:3]:
    if old in s:
        s=s.replace(old,new,1); changed=True
    elif new not in s:
        raise SystemExit(f'generator anchor not found for patch: {old[:60]}')
p.write_text(s,encoding='utf-8')
print('stage3 generator anchors are current' + (' (patched)' if changed else ' (already fixed)'))
