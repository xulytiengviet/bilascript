#!/usr/bin/env python3
from pathlib import Path

def patch(path, old, new, label):
    p=Path(path); s=p.read_text(encoding='utf-8')
    if old in s:
        p.write_text(s.replace(old,new,1),encoding='utf-8'); print('patched',label)
    elif new in s:
        print('already patched',label)
    else:
        raise SystemExit(f'anchor missing: {label}')

patch('v4/src/semantic.js',
'''      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {\n''',
'''      case "MethodDefinition": {\n        visit(node.body,{...ctx,functionDepth:ctx.functionDepth+1}); return;\n      }\n      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {\n''',
'class methods are function scope')

patch('v4/src/normalize.js',
'''      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {\n''',
'''      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": case "MethodDefinition": {\n''',
'class methods participate in symbol/type scope')

patch('v4/src/lexer.js',
'''      if (interpolation) throw new BilaSyntaxError("v3.5 chưa hạ CVNSS4.0 bên trong ${...}; hãy dùng nối chuỗi hoặc template không nội suy", start);\n      add("template", raw, raw, start); continue;\n''',
'''      // Template interpolation is a structural JavaScript passthrough in v4.\n      // The complete template is preserved verbatim; CVNSS4.0 aliases inside ${...}\n      // are not semantically lowered yet, so no runtime helper or hidden rewrite is added.\n      add("template", raw, raw, start); continue;\n''',
'template interpolation structural passthrough')
