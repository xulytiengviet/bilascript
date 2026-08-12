#!/usr/bin/env python3
"""BilaScript v2 lexical bridge.

Keeps JavaScript punctuation/operators/structure and translates only semantic
vocabulary. It is intentionally conservative: strings and comments are never
rewritten. Property/method aliases are translated after '.', while a selected
set of standard globals may be translated in expression position.
"""
from pathlib import Path
import argparse, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
VOCAB = ROOT / 'spec' / 'bila-vocabulary-v2.json'
DATA = json.loads(VOCAB.read_text(encoding='utf-8'))
KW_EN2BI = DATA['keywords']
KW_BI2EN = {v:k for k,v in KW_EN2BI.items()}
OBJ_EN2BI = DATA['objects']
OBJ_BI2EN = {v:k for k,v in OBJ_EN2BI.items()}
GLOBALS = set('Array Object Function String Number Boolean Date Math RegExp Error EvalError RangeError ReferenceError SyntaxError TypeError URIError parseInt parseFloat isNaN isFinite eval alert undefined Infinity NaN'.split())
DIRECTIVE = re.compile(r'^\s*---(?:bila(?::(?:strict|js))?|cvss|cvnss|cvnss40|cvnss4)---\s*$', re.I)
IDENT = re.compile(r'[A-Za-z_$][A-Za-z0-9_$]*')


def split_directive(text):
    lines = text.splitlines(True)
    if lines and DIRECTIVE.match(lines[0].rstrip('\r\n')):
        return lines[0].strip(), ''.join(lines[1:])
    return None, text


def transform(text, direction):
    directive, src = split_directive(text)
    out=[]; i=0; state='code'; prev_sig=''
    while i < len(src):
        ch=src[i]
        if state == 'line':
            out.append(ch); i+=1
            if ch == '\n': state='code'
            continue
        if state == 'block':
            if src.startswith('*/', i): out.append('*/'); i+=2; state='code'
            else: out.append(ch); i+=1
            continue
        if state in ('sq','dq','tpl'):
            out.append(ch); i+=1
            if ch == '\\' and i < len(src): out.append(src[i]); i+=1; continue
            if (state=='sq' and ch=="'") or (state=='dq' and ch=='"') or (state=='tpl' and ch=='`'): state='code'
            continue
        if src.startswith('//', i): out.append('//'); i+=2; state='line'; continue
        if src.startswith('/*', i): out.append('/*'); i+=2; state='block'; continue
        if ch == "'": out.append(ch); i+=1; state='sq'; continue
        if ch == '"': out.append(ch); i+=1; state='dq'; continue
        if ch == '`': out.append(ch); i+=1; state='tpl'; continue
        m=IDENT.match(src, i)
        if m:
            tok=m.group(0); repl=tok
            after_dot = prev_sig == '.'
            if direction == 'to-js':
                if tok in KW_BI2EN: repl=KW_BI2EN[tok]
                elif after_dot and tok in OBJ_BI2EN: repl=OBJ_BI2EN[tok]
                elif tok in OBJ_BI2EN and OBJ_BI2EN[tok] in GLOBALS: repl=OBJ_BI2EN[tok]
            else:
                if tok in KW_EN2BI: repl=KW_EN2BI[tok]
                elif after_dot and tok in OBJ_EN2BI: repl=OBJ_EN2BI[tok]
                elif tok in GLOBALS and tok in OBJ_EN2BI: repl=OBJ_EN2BI[tok]
            out.append(repl); i=m.end(); prev_sig=tok; continue
        out.append(ch); i+=1
        if not ch.isspace(): prev_sig=ch
    body=''.join(out)
    if direction == 'from-js': return '---bila---\n\n' + body.lstrip('\r\n')
    return body


def strict_violations(text):
    directive, src = split_directive(text)
    # Reuse the scanner's safety by masking strings/comments through to-js comparison.
    violations=[]
    i=0; state='code'
    while i < len(src):
        ch=src[i]
        if state=='line':
            i+=1
            if ch=='\n': state='code'
            continue
        if state=='block':
            if src.startswith('*/',i): i+=2; state='code'
            else: i+=1
            continue
        if state in ('sq','dq','tpl'):
            i+=1
            if ch=='\\': i+=1; continue
            if (state=='sq' and ch=="'") or (state=='dq' and ch=='"') or (state=='tpl' and ch=='`'): state='code'
            continue
        if src.startswith('//',i): i+=2; state='line'; continue
        if src.startswith('/*',i): i+=2; state='block'; continue
        if ch=="'": i+=1; state='sq'; continue
        if ch=='"': i+=1; state='dq'; continue
        if ch=='`': i+=1; state='tpl'; continue
        m=IDENT.match(src,i)
        if m:
            tok=m.group(0)
            canonical=KW_EN2BI.get(tok)
            if canonical and canonical != tok:
                line=src.count('\n',0,i)+1
                violations.append((line,tok,canonical))
            i=m.end(); continue
        i+=1
    return violations


def main():
    ap=argparse.ArgumentParser(prog='bilac-v2', description='BilaScript v2 JavaScript-compatible lexical bridge')
    sub=ap.add_subparsers(dest='cmd', required=True)
    for name in ('to-js','from-js','fmt'):
        p=sub.add_parser(name); p.add_argument('input'); p.add_argument('output', nargs='?')
    p=sub.add_parser('check'); p.add_argument('input'); p.add_argument('--strict', action='store_true')
    args=ap.parse_args()
    text=Path(args.input).read_text(encoding='utf-8')
    if args.cmd=='to-js': result=transform(text,'to-js')
    elif args.cmd=='from-js': result=transform(text,'from-js')
    elif args.cmd=='fmt': result=transform(transform(text,'to-js'),'from-js')
    else:
        violations=strict_violations(text) if args.strict or (split_directive(text)[0] or '').lower()=='---bila:strict---' else []
        if violations:
            for line,old,new in violations: print('BILA-S001 line %d: `%s` -> canonical `%s`' % (line,old,new), file=sys.stderr)
            return 1
        print('BilaScript check: OK')
        return 0
    if getattr(args,'output',None): Path(args.output).write_text(result,encoding='utf-8')
    else: sys.stdout.write(result)
    return 0

if __name__=='__main__': raise SystemExit(main())
