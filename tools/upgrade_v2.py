#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')

def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise RuntimeError('Missing patch anchor in %s: %r' % (path, old[:100]))
    text = text.replace(old, new, 1)
    write(path, text)

# ---------------------------------------------------------------------------
# 1) Native language profiles in the Rhino/Babylscript engine
# ---------------------------------------------------------------------------
replace_once('src/org/mozilla/javascript/TokenStream.java',
'''        bn,\n        bila,\n        de,''',
'''        bn,\n        bila,\n        bila_js,\n        bila_strict,\n        de,''')

replace_once('src/org/mozilla/javascript/TokenStream.java',
'''        else if ("bila".equals(str) || "cvss".equals(str) || "cvnss".equals(str) || "cvnss40".equals(str) || "cvnss4".equals(str))\n            return LanguageMode.bila;''',
'''        else if ("bila:strict".equals(str) || "bilastrict".equals(str) || "bila_strict".equals(str))\n            return LanguageMode.bila_strict;\n        else if ("bila:js".equals(str) || "bilajs".equals(str) || "bila_js".equals(str))\n            return LanguageMode.bila_js;\n        else if ("bila".equals(str) || "cvss".equals(str) || "cvnss".equals(str) || "cvnss40".equals(str) || "cvnss4".equals(str))\n            return LanguageMode.bila;''')

replace_once('src/org/mozilla/javascript/TokenStream.java',
'''        case bila:\n            return "bila";\n        case de:''',
'''        case bila:\n            return "bila";\n        case bila_js:\n            return "bila:js";\n        case bila_strict:\n            return "bila:strict";\n        case de:''')

replace_once('src/org/mozilla/javascript/TokenStream.java',
'''        case bila:\n            currentTokenizer = BabylGenericTokenizer.createBilaTokenizer(parser, in, this);\n            break;\n        case de:''',
'''        case bila:\n            currentTokenizer = BabylGenericTokenizer.createBilaTokenizer(parser, in, this);\n            break;\n        case bila_js:\n            currentTokenizer = BabylGenericTokenizer.createBilaJsTokenizer(parser, in, this);\n            break;\n        case bila_strict:\n            currentTokenizer = BabylGenericTokenizer.createBilaStrictTokenizer(parser, in, this);\n            break;\n        case de:''')

replace_once('src/org/mozilla/javascript/BabylTokenizer.java',
'''        languageModeCodes.put("bila", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("cvss", TokenStream.LanguageMode.bila);''',
'''        languageModeCodes.put("bila", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("bila:strict", TokenStream.LanguageMode.bila_strict);\n        languageModeCodes.put("bilastrict", TokenStream.LanguageMode.bila_strict);\n        languageModeCodes.put("bila_strict", TokenStream.LanguageMode.bila_strict);\n        languageModeCodes.put("bila:js", TokenStream.LanguageMode.bila_js);\n        languageModeCodes.put("bilajs", TokenStream.LanguageMode.bila_js);\n        languageModeCodes.put("bila_js", TokenStream.LanguageMode.bila_js);\n        languageModeCodes.put("cvss", TokenStream.LanguageMode.bila);''')

replace_once('src/org/mozilla/javascript/BabylTokenizer.java',
'''            if (!Character.isJavaIdentifierPart(c))\n            {''',
'''            // BilaScript v2 profile directives use ':' (---bila:strict--- / ---bila:js---).\n            if (!Character.isJavaIdentifierPart(c) && c != ':')\n            {''')

replace_once('src/org/mozilla/javascript/babylscript/BabylGenericTokenizer.java',
'''    public static BabylTokenizer createBilaTokenizer(ParserErrorReportingBase p, TokenCharStream in, TokenStream ts)\n    {\n        BabylGenericTokenizer tokenizer = new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n        // CVNSS4.0 is canonical. English remains a fallback for unmapped terms,\n        // migrations from v1.0.0, and parser-safe collision cases.\n        tokenizer.keywordLookup.putAll(englishKeywordLookup);\n        return tokenizer;\n    }''',
'''    public static BabylTokenizer createBilaTokenizer(ParserErrorReportingBase p, TokenCharStream in, TokenStream ts)\n    {\n        BabylGenericTokenizer tokenizer = new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n        // Default profile: CVNSS4.0 canonical + ECMAScript compatibility aliases.\n        tokenizer.keywordLookup.putAll(englishKeywordLookup);\n        return tokenizer;\n    }\n\n    /** Strict profile: if a canonical Bila token exists, English is not a keyword fallback. */\n    public static BabylTokenizer createBilaStrictTokenizer(ParserErrorReportingBase p, TokenCharStream in, TokenStream ts)\n    {\n        return new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n    }\n\n    /** JavaScript migration profile: accepts both ECMAScript and canonical Bila tokens. */\n    public static BabylTokenizer createBilaJsTokenizer(ParserErrorReportingBase p, TokenCharStream in, TokenStream ts)\n    {\n        BabylGenericTokenizer tokenizer = new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n        tokenizer.keywordLookup.putAll(englishKeywordLookup);\n        return tokenizer;\n    }''')

replace_once('src/org/mozilla/javascript/babylscript/TranslatedNameBindings.java',
'''        String [] bilaNames = new String[] {"bila", "cvss", "cvnss", "cvnss40", "cvnss4"};''',
'''        String [] bilaNames = new String[] {"bila", "bila:strict", "bila:js", "bilastrict", "bilajs", "cvss", "cvnss", "cvnss40", "cvnss4"};''')

replace_once('src/org/mozilla/javascript/babylscript/TranslatedNameBindings.java',
'''        EquivalentLanguageNames.put("bila", bilaNames);\n        EquivalentLanguageNames.put("cvss", bilaNames);''',
'''        EquivalentLanguageNames.put("bila", bilaNames);\n        EquivalentLanguageNames.put("bila:strict", bilaNames);\n        EquivalentLanguageNames.put("bila:js", bilaNames);\n        EquivalentLanguageNames.put("bilastrict", bilaNames);\n        EquivalentLanguageNames.put("bilajs", bilaNames);\n        EquivalentLanguageNames.put("cvss", bilaNames);''')

replace_once('src/org/mozilla/javascript/babylscript/TranslatedNameBindings.java',
'''        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila), Cvnss40.objectMap());''',
'''        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila), Cvnss40.objectMap());\n        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila_strict), Cvnss40.objectMap());\n        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila_js), Cvnss40.objectMap());''')

replace_once('src/org/mozilla/javascript/babylscript/TranslatedNameBindings.java',
'''        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila), Cvnss40.keywordMap());''',
'''        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila), Cvnss40.keywordMap());\n        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila_strict), Cvnss40.keywordMap());\n        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila_js), Cvnss40.keywordMap());''')

replace_once('src/org/mozilla/javascript/babylscript/gen/Cvnss40.java',
'''    public static final String VERSION = "1.2.0";''',
'''    public static final String VERSION = "2.0.0";''')

# Babyl2JS must emit runtime translations for all three v2 profiles.
replace_once('babylrunner/Babyl2JS.java',
'''        TranslatedNameBindings.keywordResourceMap.put("bila", Cvnss40.keywordMap());\n        TranslatedNameBindings.langResourceMap.put("bila", Cvnss40.objectMap());''',
'''        TranslatedNameBindings.keywordResourceMap.put("bila", Cvnss40.keywordMap());\n        TranslatedNameBindings.langResourceMap.put("bila", Cvnss40.objectMap());\n        TranslatedNameBindings.keywordResourceMap.put("bila:strict", Cvnss40.keywordMap());\n        TranslatedNameBindings.langResourceMap.put("bila:strict", Cvnss40.objectMap());\n        TranslatedNameBindings.keywordResourceMap.put("bila:js", Cvnss40.keywordMap());\n        TranslatedNameBindings.langResourceMap.put("bila:js", Cvnss40.objectMap());''')

replace_once('babylrunner/Runner.java',
''' * BilaScript v1.2.0 exposes the native ---bila--- language mode.''',
''' * BilaScript v2.0 exposes ---bila---, ---bila:strict--- and ---bila:js--- profiles.''')
replace_once('babylrunner/Runner.java',
'''                + "Dung ---bila--- de bat BilaScript CVNSS4.0 (---cvss--- van la alias).\\n"''',
'''                + "Profiles: ---bila--- (mac dinh), ---bila:strict--- (CVNSS canonical), ---bila:js--- (migration).\\n"''')

# ---------------------------------------------------------------------------
# 2) Generate a single canonical vocabulary artifact from the Java table.
# ---------------------------------------------------------------------------
cv = read('src/org/mozilla/javascript/babylscript/gen/Cvnss40.java')

def parse_array(name):
    m = re.search(r'public static final String \[\] %s = \{(.*?)\n    \};' % name, cv, re.S)
    if not m: raise RuntimeError('Cannot parse array ' + name)
    vals = re.findall(r'"((?:\\.|[^"\\])*)"', m.group(1))
    vals = [bytes(v, 'utf-8').decode('unicode_escape') for v in vals]
    return dict(zip(vals[0::2], vals[1::2]))

def apply_overrides(fn_name, mapping):
    m = re.search(r'public static Map<String, String> %s\(\).*?\{(.*?)\n    \}' % fn_name, cv, re.S)
    if not m: return mapping
    for k, v in re.findall(r'map\.put\("([^"]+)",\s*"([^"]+)"\)', m.group(1)):
        mapping[k] = v
    return mapping

keywords = apply_overrides('keywordMap', parse_array('RAW_KEYWORDS'))
objects = apply_overrides('objectMap', parse_array('OBJECTS'))
vocab = {
    'version': '2.0.0',
    'language': 'BilaScript',
    'canonical_directive': '---bila---',
    'profiles': ['bila', 'bila:strict', 'bila:js'],
    'keywords': keywords,
    'objects': objects,
}
write('spec/bila-vocabulary-v2.json', json.dumps(vocab, ensure_ascii=False, indent=2) + '\n')

# ---------------------------------------------------------------------------
# 3) BilaScript v2 lexical bridge CLI (JavaScript <-> canonical Bila)
# ---------------------------------------------------------------------------
bilac = r'''#!/usr/bin/env python3
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
'''
write('tools/bilac_v2.py', bilac)

# ---------------------------------------------------------------------------
# 4) Formal grammar/specification and examples
# ---------------------------------------------------------------------------
write('spec/BilaScript-2.0.ebnf', r'''(* BilaScript 2.0 Core Grammar — JavaScript-compatible surface syntax. *)
Program              = BilaDirective , StatementList ;
BilaDirective        = "---bila---" | "---bila:strict---" | "---bila:js---"
                     | "---cvss---" | "---cvnss---" | "---cvnss40---" | "---cvnss4---" ;
StatementList        = { Statement } ;
Statement            = Block | VariableStatement | FunctionDeclaration | IfStatement
                     | ForStatement | WhileStatement | DoWhileStatement | ReturnStatement
                     | BreakStatement | ContinueStatement | TryStatement | SwitchStatement
                     | ExpressionStatement | EmptyStatement ;
Block                = "{" , StatementList , "}" ;
VariableStatement    = KW_VAR , VariableDeclaration , { "," , VariableDeclaration } , [ ";" ] ;
VariableDeclaration  = Identifier , [ "=" , Expression ] ;
FunctionDeclaration  = KW_FUNCTION , Identifier , "(" , [ FormalParameters ] , ")" , Block ;
FormalParameters     = Identifier , { "," , Identifier } ;
IfStatement          = KW_IF , "(" , Expression , ")" , Statement , [ KW_ELSE , Statement ] ;
ForStatement         = KW_FOR , "(" , [ Expression ] , ";" , [ Expression ] , ";" , [ Expression ] , ")" , Statement ;
WhileStatement       = KW_WHILE , "(" , Expression , ")" , Statement ;
DoWhileStatement     = KW_DO , Statement , KW_WHILE , "(" , Expression , ")" , [ ";" ] ;
ReturnStatement      = KW_RETURN , [ Expression ] , [ ";" ] ;
BreakStatement       = KW_BREAK , [ Identifier ] , [ ";" ] ;
ContinueStatement    = KW_CONTINUE , [ Identifier ] , [ ";" ] ;
TryStatement         = KW_TRY , Block , ( CatchClause , [ FinallyClause ] | FinallyClause ) ;
CatchClause          = KW_CATCH , "(" , Identifier , ")" , Block ;
FinallyClause        = KW_FINALLY , Block ;
SwitchStatement      = KW_SWITCH , "(" , Expression , ")" , "{" , { CaseClause } , "}" ;
CaseClause           = ( KW_CASE , Expression | KW_DEFAULT ) , ":" , StatementList ;
ExpressionStatement  = Expression , [ ";" ] ;
EmptyStatement       = ";" ;
Expression           = AssignmentExpression , { "," , AssignmentExpression } ;
AssignmentExpression = ConditionalExpression , [ AssignmentOperator , AssignmentExpression ] ;
ConditionalExpression = LogicalExpression , [ "?" , Expression , ":" , AssignmentExpression ] ;
LogicalExpression    = UnaryExpression , { BinaryOperator , UnaryExpression } ;
UnaryExpression      = [ UnaryOperator ] , MemberExpression ;
MemberExpression     = PrimaryExpression , { "." , Identifier | "[" , Expression , "]" | Arguments } ;
Arguments            = "(" , [ AssignmentExpression , { "," , AssignmentExpression } ] , ")" ;
PrimaryExpression    = Identifier | Literal | ArrayLiteral | ObjectLiteral | "(" , Expression , ")" ;
ArrayLiteral         = "[" , [ AssignmentExpression , { "," , AssignmentExpression } ] , "]" ;
ObjectLiteral        = "{" , [ Property , { "," , Property } ] , "}" ;
Property             = Identifier , ":" , AssignmentExpression ;
Identifier           = identifier ;
Literal              = string | number | KW_TRUE | KW_FALSE | KW_NULL ;

(* Semantic tokens: lexer accepts canonical CVNSS4.0; compatible profiles also accept English aliases. *)
KW_FUNCTION = "haml_sob" ;
KW_IF       = "neub" ;
KW_ELSE     = "kac" ;
KW_FOR      = "vil" ;
KW_WHILE    = "trogp_ki" ;
KW_RETURN   = "trov_ved" ;
KW_DO       = "laml" ;
KW_TRUE     = "thatf" ;
KW_FALSE    = "sai" ;
KW_VAR      = "bilb" ;
KW_NEW      = "moix" ;
KW_NULL     = "voy_jaj_trir" ;
KW_TRY      = "thuv" ;
KW_CATCH    = "chupr_layb" ;
KW_FINALLY  = "cujb_cugl" ;
KW_BREAK    = "faj_vow" ;
KW_CONTINUE = "tifb_tucr" ;
KW_SWITCH   = "cogy_tacx" ;
KW_CASE     = "truzk_hoph" ;
KW_DEFAULT  = "mach_dihr" ;
''')

write('spec/PROFILE_MODES.md', '''# BilaScript 2.0 — Language profiles\n\n## `---bila---`\nCVNSS4.0 là spelling canonical. Từ khóa ECMAScript gốc vẫn là compatibility alias để di trú mã cũ và xử lý trường hợp chưa thể chuẩn hóa an toàn.\n\n## `---bila:strict---`\nTokenizer chỉ đăng ký bảng keyword canonical của Bila. Nếu một spelling CVNSS4.0 tồn tại, keyword tiếng Anh không còn được nhận như keyword. Các spelling tiếng Anh được giữ nguyên trong bảng vì collision/parser-safety vẫn được phép.\n\n## `---bila:js---`\nProfile di trú JavaScript: chấp nhận đồng thời vocabulary JavaScript và Bila, giữ nguyên dấu câu/toán tử/cấu trúc JavaScript.\n\n## Alias cũ\n`---cvss---`, `---cvnss---`, `---cvnss40---`, `---cvnss4---` ánh xạ về profile mặc định `bila`.\n''')

write('spec/JAVASCRIPT_COMPATIBILITY.md', '''# JavaScript Compatibility Policy — BilaScript 2.0\n\nBilaScript 2.0 **dùng lại cú pháp JavaScript**. Các thành phần sau giữ nguyên: `{ } ( ) [ ]`, `. , ; :`, toán tử số học/logic/so sánh/gán, object literal, array literal, function call, member access, string/number literal và comment.\n\nBilaScript thay **semantic vocabulary**: keyword, reserved word có mapping an toàn, built-in object, global function, property và method chuẩn. Identifier do người dùng đặt không bị dịch tự động bởi engine.\n\n### Runtime hiện tại\nJava runtime kế thừa Rhino 1.7R2/Babylscript nên chỉ thực thi tập ECMAScript mà engine đó hỗ trợ. `bilac_v2.py` là lexical bridge cho source JavaScript hiện đại hơn, nhưng không được xem là full ECMAScript parser. Arrow functions, modules, async/await và các feature mới hơn được giữ nguyên về dấu/cấu trúc khi bridge không cần hiểu chúng; thực thi phụ thuộc backend JavaScript đích.\n\n### Quy tắc an toàn\n1. Không đổi string/comment.\n2. Keyword canonical là reserved vocabulary của Bila.\n3. Property/method chỉ canonicalize sau dấu `.` trong lexical bridge.\n4. Một nhóm built-in global chuẩn có thể canonicalize ở global position.\n5. Collision CVNSS4.0 không được overwrite im lặng; spelling English parser-safe được giữ nếu chưa có mapping duy nhất.\n''')

write('spec/CVNSS40_CANONICAL.md', '''# CVNSS4.0 Canonical Vocabulary — BilaScript 2.0\n\nNguồn máy đọc chính thức: `spec/bila-vocabulary-v2.json`, được sinh trực tiếp từ `Cvnss40.java` trong quá trình nâng cấp để engine và tooling dùng cùng một vocabulary.\n\nMỗi semantic keyword có hai lớp:\n\n```text\nsource spelling (haml_sob / function)\n        ↓ lexer\nsemantic token (KW_FUNCTION)\n        ↓ parser\nFunctionDeclaration\n```\n\nCVNSS4.0 spelling là canonical. English spelling là compatibility alias tùy profile. Cú pháp nhiều từ chuẩn hóa khoảng trắng thành `_` để tạo một JavaScript identifier/token parser-safe.\n\nBilaScript không CVNSS4.0 hóa dấu câu, toán tử, protocol/standard identifier (`JSON`, `URL`, `HTTP`, `WebSocket`, `WebAssembly`...) nếu việc đổi tên làm giảm khả năng tương thích hoặc không có canonical mapping đã kiểm chứng.\n''')

write('examples/v2/hello.bila.js', '''---bila---\n\nhaml_sob chao(ten) {\n    neub (ten == voy_jaj_trir) {\n        trov_ved "Xin chaol BilaScript 2.0!";\n    } kac {\n        trov_ved "Xin chaol " + ten;\n    }\n}\n\nbilb ds = moix Magz("BilaScript", "CVNSS4.0");\njava.lang.System.out.println(chao(ds[0]));\njava.lang.System.out.println("Dof zail: " + ds.dof_zail);\n''')
write('examples/v2/strict.bila.js', '''---bila:strict---\n\nhaml_sob tong(a, b) {\n    trov_ved a + b;\n}\n\nbilb ds = moix Magz(1, 2, 3);\nneub (ds.dof_zail > 0) {\n    java.lang.System.out.println(tong(ds[0], ds[1]));\n}\n''')
write('examples/v2/js-compat.bila.js', '''---bila:js---\n\nfunction tong(a, b) {\n    return a + b;\n}\n\nvar ds = new Array(10, 20, 30);\nif (ds.length > 0) {\n    java.lang.System.out.println(tong(ds[0], ds[1]));\n}\n''')
write('examples/v2/source.js', '''function max(a, b) {\n    if (a > b) return a;\n    else return b;\n}\nvar ds = new Array(1, 2, 3);\nconsole.log(ds.length, max(ds[0], ds[1]));\n''')

write('docs/BILASCRIPT_v2.0.0.md', '''# BilaScript v2.0.0 — JavaScript-compatible CVNSS4.0 Grammar\n\nBilaScript 2.0 chuyển dự án từ “native CVNSS4.0 mode trên Babylscript” thành một **language profile được đặc tả rõ**: giữ cấu trúc/cú pháp JavaScript và chuẩn hóa semantic vocabulary sang CVNSS4.0.\n\n## Thành phần đã triển khai\n- `---bila---`: canonical + English fallback.\n- `---bila:strict---`: canonical keyword profile, không nạp English keyword fallback.\n- `---bila:js---`: migration profile cho JavaScript.\n- Lexer hiểu dấu `:` trong language directive.\n- `TokenStream.LanguageMode.bila`, `bila_strict`, `bila_js`.\n- Cùng một object/property/method translation namespace cho cả 3 profile.\n- `spec/BilaScript-2.0.ebnf`: grammar JavaScript-compatible.\n- `spec/bila-vocabulary-v2.json`: vocabulary máy đọc sinh từ `Cvnss40.java`.\n- `tools/bilac_v2.py`: `to-js`, `from-js`, `fmt`, `check --strict`.\n- Examples cho default/strict/js migration.\n\n## Mục tiêu ngữ pháp\n```text\nJavaScript syntax + operators + punctuation\n                ↓ giữ nguyên\nBila semantic vocabulary\n                ↓ canonical CVNSS4.0\nECMAScript-compatible program structure\n```\n\n## Lưu ý runtime\nJAR Java vẫn kế thừa Rhino 1.7R2, vì vậy runtime không tự nhiên có toàn bộ ECMAScript hiện đại. Tooling v2 được tách khỏi giới hạn đó để có thể làm backend JavaScript mới trong các bản tiếp theo mà không đổi grammar/vocabulary.\n''')

# ---------------------------------------------------------------------------
# 5) README v2 front matter (retain historical/technical material below)
# ---------------------------------------------------------------------------
readme = read('README.md')
readme = readme.replace('Release v1.2.0', 'Release v2.0.0')
readme = readme.replace('release-v1.2.0-blue', 'release-v2.0.0-blue')
readme = readme.replace('/releases/tag/v1.2.0', '/releases/tag/v2.0.0')
marker = '## 🚀 BilaScript v1.2.0 — Native Bila Mode'
if marker in readme:
    intro = '''## 🚀 BilaScript v2.0.0 — JavaScript-compatible CVNSS4.0 Grammar\n\nBilaScript 2.0 **giữ cú pháp JavaScript** (`{}`, `()`, `[]`, toán tử, expression, object/array literal, member access...) và chuẩn hóa lớp **semantic vocabulary** sang CVNSS4.0. Engine có 3 profile: `---bila---`, `---bila:strict---`, `---bila:js---`.\n\n```javascript\n---bila:strict---\n\nhaml_sob tong(a, b) {\n    trov_ved a + b;\n}\n\nbilb ds = moix Magz(10, 20, 30);\nneub (ds.dof_zail > 0) {\n    java.lang.System.out.println(tong(ds[0], ds[1]));\n}\n```\n\n**Đặc tả:** `spec/BilaScript-2.0.ebnf` · **Vocabulary:** `spec/bila-vocabulary-v2.json` · **Tool:** `python tools/bilac_v2.py --help` · **Chi tiết:** `docs/BILASCRIPT_v2.0.0.md`.\n\n---\n\n'''
    readme = readme.replace(marker, intro + '## 🧬 BilaScript v1.2.0 — nền native Bila Mode', 1)
write('README.md', readme)

print('BilaScript v2.0 source/spec/tooling upgrade applied successfully')
