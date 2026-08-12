from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]


def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(dedent(content).lstrip("\n"), encoding="utf-8")
    print("write", path)


write("v3/package.json", r'''
{
  "name": "@bilascript/core",
  "version": "3.5.0",
  "description": "BilaScript v3.5 zero-cost CVNSS4.0 frontend with JavaScript runtime backend",
  "type": "module",
  "bin": { "bila": "./bin/bila.js" },
  "scripts": {
    "test": "node --test test/*.test.js",
    "example": "node bin/bila.js run examples/hello.bila"
  },
  "license": "MIT",
  "author": "Long Ngo"
}
''')

write("v3/src/vocabulary.js", r'''
/** BilaScript v3.5 canonical vocabulary. MIT License. Copyright (c) 2026 Long Ngo. */
export const VERSION = "3.5.0";

export const KEYWORD_SPECS = Object.freeze({
  haml_sob: { id: "KW_FUNCTION", js: "function" },
  bilb: { id: "KW_VAR", js: "var" },
  neub: { id: "KW_IF", js: "if" },
  kac: { id: "KW_ELSE", js: "else" },
  vil: { id: "KW_FOR", js: "for" },
  trogp_ki: { id: "KW_WHILE", js: "while" },
  trov_ved: { id: "KW_RETURN", js: "return" },
  moix: { id: "KW_NEW", js: "new" },
  voy_jaj_trir: { id: "KW_NULL", js: "null" },
  thatf: { id: "KW_TRUE", js: "true" },
  sai: { id: "KW_FALSE", js: "false" },
  thuv: { id: "KW_TRY", js: "try" },
  chupr_layb: { id: "KW_CATCH", js: "catch" },
  nemj: { id: "KW_THROW", js: "throw" },
  cujb_cugl: { id: "KW_FINALLY", js: "finally" },
  laml: { id: "KW_DO", js: "do" },
  zugk: { id: "KW_BREAK", js: "break" },
  tifb_tucr: { id: "KW_CONTINUE", js: "continue" }
});

export const JS_PASSTHROUGH = Object.freeze({
  typeof: { id: "KW_TYPEOF", js: "typeof" },
  void: { id: "KW_VOID", js: "void" },
  delete: { id: "KW_DELETE", js: "delete" },
  in: { id: "KW_IN", js: "in" },
  instanceof: { id: "KW_INSTANCEOF", js: "instanceof" },
  this: { id: "KW_THIS", js: "this" }
});

export const JS_TO_KEYWORD = Object.freeze(Object.fromEntries(
  Object.entries(KEYWORD_SPECS).map(([canonical, spec]) => [spec.js, { ...spec, canonical }])
));

export const KEYWORD_JS = Object.freeze(Object.fromEntries([
  ...Object.values(KEYWORD_SPECS).map(spec => [spec.id, spec.js]),
  ...Object.values(JS_PASSTHROUGH).map(spec => [spec.id, spec.js])
]));

export const MAPPED_ENGLISH = new Set(Object.values(KEYWORD_SPECS).map(x => x.js));

export function resolveKeyword(word, mode = "bila") {
  if (Object.prototype.hasOwnProperty.call(KEYWORD_SPECS, word)) {
    const spec = KEYWORD_SPECS[word];
    return { ...spec, canonical: word, surface: "bila" };
  }
  if (Object.prototype.hasOwnProperty.call(JS_PASSTHROUGH, word)) {
    return { ...JS_PASSTHROUGH[word], canonical: null, surface: "javascript-required" };
  }
  if (mode !== "strict" && Object.prototype.hasOwnProperty.call(JS_TO_KEYWORD, word)) {
    return { ...JS_TO_KEYWORD[word], surface: "javascript-compat" };
  }
  return null;
}

export const GLOBAL_SPECS = Object.freeze({
  Magz: { js: "Array", type: "array" },
  Suh_vatf: { js: "Object", type: "object" },
  Haml_sob: { js: "Function", type: "function" },
  Wayl: { js: "Date", type: "date" },
  mony_Tolj: { js: "Math", type: "math" },
  Chujg: { js: "String", type: "string-constructor" },
  Sob: { js: "Number", type: "number-constructor" },
  Lalf_lij: { js: "Boolean", type: "boolean-constructor" }
});

export const MEMBER_SPECS = Object.freeze({
  dof_zail: { js: "length", receivers: ["array", "string"] },
  dayq: { js: "push", receivers: ["array"] },
  layb_cujb: { js: "pop", receivers: ["array"] },
  sapx_xepb: { js: "sort", receivers: ["array"] },
  daoz_wush: { js: "reverse", receivers: ["array"] },
  ahj_xar: { js: "map", receivers: ["array"] },
  locr: { js: "filter", receivers: ["array"] },
  cho_moig: { js: "forEach", receivers: ["array"] },
  motf_vail: { js: "some", receivers: ["array"] },
  takj: { js: "split", receivers: ["string"] },
  chujg_con: { js: "substring", receivers: ["string"] },
  kopx: { js: "match", receivers: ["string"] },
  timl_civb: { js: "search", receivers: ["string"] },
  thay_theb: { js: "replace", receivers: ["string"] },
  denb_chujg: { js: "toString", receivers: ["array", "string", "number", "object", "date", "boolean"] },
  goir: { js: "call", receivers: ["function"] },
  ap_zugr: { js: "apply", receivers: ["function"] },
  waug_nhily: { js: "random", receivers: ["math"] },
  laml_tronl: { js: "round", receivers: ["math"] },
  cano_bacf_hai: { js: "sqrt", receivers: ["math"] },
  jaj_trir_tydf_doib: { js: "abs", receivers: ["math"] },
  trand: { js: "ceil", receivers: ["math"] },
  sanl: { js: "floor", receivers: ["math"] },
  lys_thuak: { js: "pow", receivers: ["math"] }
});
''')

write("v3/src/lexer.js", r'''
import { resolveKeyword, MAPPED_ENGLISH } from "./vocabulary.js";

const OPS = [
  ">>>=", "===", "!==", "**=", "??=", ">>>", "...", "=>", "==", "!=", "<=", ">=",
  "++", "--", "+=", "-=", "*=", "/=", "%=", "&&", "||", "??", "?.", "**", "<<", ">>",
  "&=", "|=", "^="
];
const ONE = new Set("{}()[];,.?:+-*/%<>=!&|^~");
const idStart = ch => !!ch && (ch === "$" || ch === "_" || /\p{ID_Start}/u.test(ch));
const idPart = ch => !!ch && (ch === "$" || ch === "_" || /\p{ID_Continue}/u.test(ch));

export class BilaSyntaxError extends SyntaxError {
  constructor(message, token) {
    const p = token?.start || token;
    super(`${message}${p?.line ? ` tại dòng ${p.line}, cột ${p.column}` : ""}`);
    this.name = "BilaSyntaxError";
    this.token = token || null;
  }
}

export function detectProfile(source) {
  const re = /^\uFEFF?\s*---(?:bila(?::(strict|js))?|cvss|cvnss|cvnss40|cvnss4)---\s*(?:\r?\n|$)/;
  const m = source.match(re);
  if (!m) return { mode: "bila", source, directive: null, lineOffset: 0, offset: 0 };
  return {
    mode: m[1] || "bila",
    source: source.slice(m[0].length),
    directive: m[0].trim(),
    lineOffset: (m[0].match(/\n/g) || []).length,
    offset: m[0].length
  };
}

function canStartRegex(prev) {
  if (!prev) return true;
  if (prev.type === "keyword") {
    return !new Set(["KW_TRUE", "KW_FALSE", "KW_NULL", "KW_THIS"]).has(prev.value);
  }
  if (prev.type === "punctuator") {
    return new Set(["(", "{", "[", ",", ";", ":", "?", "=", "==", "===", "!=", "!==", "!", "&&", "||", "??", "=>", "+=", "-=", "*=", "/=", "%="]).has(prev.value);
  }
  return false;
}

export function lex(input) {
  const original = String(input);
  const profile = detectProfile(original);
  const source = profile.source;
  const tokens = [];
  let i = 0, line = 1 + profile.lineOffset, column = 1;
  let prev = null;

  const peek = (n = 0) => source[i + n] || "";
  const pos = () => ({ offset: profile.offset + i, line, column });
  const advance = () => {
    const ch = source[i++] || "";
    if (ch === "\n") { line++; column = 1; } else column++;
    return ch;
  };
  const add = (type, value, raw, start, extra = {}) => {
    const token = { type, value, raw, start, end: pos(), ...extra };
    tokens.push(token); prev = token; return token;
  };

  while (i < source.length) {
    const ch = peek();
    if (/\s/u.test(ch)) { advance(); continue; }
    if (ch === "/" && peek(1) === "/") { while (i < source.length && advance() !== "\n") {} continue; }
    if (ch === "/" && peek(1) === "*") {
      const start = pos(); advance(); advance();
      while (i < source.length && !(peek() === "*" && peek(1) === "/")) advance();
      if (i >= source.length) throw new BilaSyntaxError("Comment chưa đóng", start);
      advance(); advance(); continue;
    }

    const start = pos();
    if (idStart(ch)) {
      let raw = advance();
      while (idPart(peek())) raw += advance();
      if (profile.mode === "strict" && MAPPED_ENGLISH.has(raw)) {
        throw new BilaSyntaxError(`Từ khóa English '${raw}' bị cấm trong bila:strict; hãy dùng canonical CVNSS4.0`, start);
      }
      const kw = resolveKeyword(raw, profile.mode);
      if (kw) add("keyword", kw.id, raw, start, { js: kw.js, canonical: kw.canonical, surface: kw.surface });
      else add("identifier", raw, raw, start);
      continue;
    }

    if (/\d/.test(ch) || (ch === "." && /\d/.test(peek(1)))) {
      let raw = "", kind = "number";
      const takeWhile = re => { while (re.test(peek())) raw += advance(); };
      if (ch === "0" && /[xX]/.test(peek(1))) {
        raw += advance() + advance(); takeWhile(/[0-9A-Fa-f_]/);
      } else if (ch === "0" && /[bB]/.test(peek(1))) {
        raw += advance() + advance(); takeWhile(/[01_]/);
      } else if (ch === "0" && /[oO]/.test(peek(1))) {
        raw += advance() + advance(); takeWhile(/[0-7_]/);
      } else {
        takeWhile(/[0-9_]/);
        if (peek() === ".") { raw += advance(); takeWhile(/[0-9_]/); }
        if (/[eE]/.test(peek())) { raw += advance(); if (/[+-]/.test(peek())) raw += advance(); takeWhile(/[0-9_]/); }
      }
      if (peek() === "n") { raw += advance(); kind = "bigint"; }
      add("number", null, raw, start, { numericKind: kind });
      continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = advance(); let raw = quote, value = "", closed = false;
      while (i < source.length) {
        const c = advance(); raw += c;
        if (c === quote) { closed = true; break; }
        if (c === "\n" || c === "") break;
        if (c === "\\") { const e = advance(); raw += e; value += "\\" + e; }
        else value += c;
      }
      if (!closed) throw new BilaSyntaxError("Chuỗi chưa đóng", start);
      add("string", value, raw, start); continue;
    }

    if (ch === "`") {
      let raw = advance(), closed = false, interpolation = false;
      while (i < source.length) {
        const c = advance(); raw += c;
        if (c === "\\") { const e = advance(); raw += e; continue; }
        if (c === "$" && peek() === "{") interpolation = true;
        if (c === "`") { closed = true; break; }
      }
      if (!closed) throw new BilaSyntaxError("Template literal chưa đóng", start);
      if (interpolation) throw new BilaSyntaxError("v3.5 chưa hạ CVNSS4.0 bên trong ${...}; hãy dùng nối chuỗi hoặc template không nội suy", start);
      add("template", raw, raw, start); continue;
    }

    if (ch === "/" && canStartRegex(prev)) {
      let raw = advance(), inClass = false, closed = false;
      while (i < source.length) {
        const c = advance(); raw += c;
        if (c === "\\") { const e = advance(); raw += e; continue; }
        if (c === "[") inClass = true;
        if (c === "]") inClass = false;
        if (c === "/" && !inClass) { closed = true; break; }
        if (c === "\n") break;
      }
      if (!closed) throw new BilaSyntaxError("Regex literal chưa đóng", start);
      while (/[A-Za-z]/.test(peek())) raw += advance();
      add("regex", raw, raw, start); continue;
    }

    const op = OPS.find(x => source.startsWith(x, i));
    if (op) { for (let k = 0; k < op.length; k++) advance(); add("punctuator", op, op, start); continue; }
    if (ONE.has(ch)) { advance(); add("punctuator", ch, ch, start); continue; }
    throw new BilaSyntaxError(`Ký tự không hợp lệ '${ch}'`, start);
  }
  const eofPos = pos();
  tokens.push({ type: "eof", value: "<eof>", raw: "", start: eofPos, end: eofPos });
  return { mode: profile.mode, directive: profile.directive, tokens, source: original };
}
''')

write("v3/src/parser.js", r'''
import { lex, BilaSyntaxError } from "./lexer.js";

const PRECEDENCE = { "??":1, "||":2, "&&":3, "|":4, "^":5, "&":6, "==":7, "!=":7, "===":7, "!==":7, "<":8, ">":8, "<=":8, ">=":8, "in":8, "instanceof":8, "<<":9, ">>":9, ">>>":9, "+":10, "-":10, "*":11, "/":11, "%":11, "**":12 };
const ASSIGN = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "**=", "??="]);
const UNARY_KW = { KW_TYPEOF: "typeof", KW_VOID: "void", KW_DELETE: "delete" };
const BINARY_KW = { KW_IN: "in", KW_INSTANCEOF: "instanceof" };
const locFrom = (start, end = start) => ({ start: start?.start || start || null, end: end?.end || end?.start || end || null });

export class Parser {
  constructor(source) {
    const out = lex(source);
    this.mode = out.mode;
    this.directive = out.directive;
    this.tokens = out.tokens;
    this.source = out.source;
    this.i = 0;
  }
  cur() { return this.tokens[this.i]; }
  next() { return this.tokens[this.i++]; }
  at(value) { return this.cur().value === value; }
  atKw(id) { return this.cur().type === "keyword" && this.cur().value === id; }
  eat(value) { if (this.at(value)) return this.next(); return null; }
  eatKw(id) { if (this.atKw(id)) return this.next(); return null; }
  expect(value, message = `Mong đợi '${value}'`) { if (!this.at(value)) throw new BilaSyntaxError(message, this.cur()); return this.next(); }
  expectKw(id, message = `Mong đợi ${id}`) { if (!this.atKw(id)) throw new BilaSyntaxError(message, this.cur()); return this.next(); }
  expectIdentifier() { const t=this.cur(); if(t.type!=="identifier") throw new BilaSyntaxError("Mong đợi định danh",t); this.next(); return {type:"Identifier",name:t.value,loc:locFrom(t)}; }

  parseProgram() {
    const start=this.cur(); const body=[]; while(this.cur().type!=="eof") body.push(this.parseStatement());
    return {type:"Program",sourceType:"script",bilaMode:this.mode,directive:this.directive,body,loc:locFrom(start,this.cur())};
  }
  parseStatement() {
    const t=this.cur();
    if(this.eat(";")) return {type:"EmptyStatement",loc:locFrom(t)};
    if(this.at("{")) return this.parseBlock();
    if(t.type==="keyword") {
      switch(t.value) {
        case "KW_VAR": return this.parseVariableStatement(true);
        case "KW_FUNCTION": return this.parseFunctionDeclaration();
        case "KW_IF": return this.parseIf();
        case "KW_WHILE": return this.parseWhile();
        case "KW_DO": return this.parseDoWhile();
        case "KW_FOR": return this.parseFor();
        case "KW_RETURN": return this.parseReturn();
        case "KW_BREAK": { const s=this.next(); this.eat(";"); return {type:"BreakStatement",loc:locFrom(s)}; }
        case "KW_CONTINUE": { const s=this.next(); this.eat(";"); return {type:"ContinueStatement",loc:locFrom(s)}; }
        case "KW_THROW": return this.parseThrow();
        case "KW_TRY": return this.parseTry();
      }
    }
    const start=this.cur(); const expression=this.parseExpression(); const end=this.eat(";")||this.tokens[this.i-1];
    return {type:"ExpressionStatement",expression,loc:locFrom(start,end)};
  }
  parseBlock() { const start=this.expect("{"); const body=[]; while(!this.at("}")){ if(this.cur().type==="eof") throw new BilaSyntaxError("Khối lệnh chưa đóng",this.cur()); body.push(this.parseStatement()); } const end=this.expect("}"); return {type:"BlockStatement",body,loc:locFrom(start,end)}; }
  parseVariableStatement(withSemicolon=true) { const start=this.expectKw("KW_VAR"); const declarations=[]; do { const id=this.expectIdentifier(); let init=null; if(this.eat("=")) init=this.parseExpression(); declarations.push({type:"VariableDeclarator",id,init,loc:{start:id.loc.start,end:(init?.loc?.end||id.loc.end)}}); } while(this.eat(",")); const end=withSemicolon?(this.eat(";")||this.tokens[this.i-1]):this.tokens[this.i-1]; return {type:"VariableDeclaration",kind:"var",declarations,loc:locFrom(start,end)}; }
  parseFunctionDeclaration() { const start=this.expectKw("KW_FUNCTION"); const id=this.expectIdentifier(); this.expect("("); const params=[]; if(!this.at(")")){ do params.push(this.expectIdentifier()); while(this.eat(",")); } this.expect(")"); const body=this.parseBlock(); return {type:"FunctionDeclaration",id,params,body,async:false,generator:false,loc:{start:start.start,end:body.loc.end}}; }
  parseIf() { const start=this.expectKw("KW_IF"); this.expect("("); const test=this.parseExpression(); this.expect(")"); const consequent=this.parseStatement(); let alternate=null; if(this.eatKw("KW_ELSE")) alternate=this.parseStatement(); return {type:"IfStatement",test,consequent,alternate,loc:{start:start.start,end:(alternate?.loc?.end||consequent.loc?.end)}}; }
  parseWhile() { const start=this.expectKw("KW_WHILE"); this.expect("("); const test=this.parseExpression(); this.expect(")"); const body=this.parseStatement(); return {type:"WhileStatement",test,body,loc:{start:start.start,end:body.loc?.end}}; }
  parseDoWhile() { const start=this.expectKw("KW_DO"); const body=this.parseStatement(); this.expectKw("KW_WHILE"); this.expect("("); const test=this.parseExpression(); this.expect(")"); const end=this.eat(";")||this.tokens[this.i-1]; return {type:"DoWhileStatement",body,test,loc:locFrom(start,end)}; }
  parseFor() { const start=this.expectKw("KW_FOR"); this.expect("("); let init=null,test=null,update=null; if(!this.at(";")) init=this.atKw("KW_VAR")?this.parseVariableStatement(false):this.parseExpression(); this.expect(";"); if(!this.at(";")) test=this.parseExpression(); this.expect(";"); if(!this.at(")")) update=this.parseExpression(); this.expect(")"); const body=this.parseStatement(); return {type:"ForStatement",init,test,update,body,loc:{start:start.start,end:body.loc?.end}}; }
  parseReturn() { const start=this.expectKw("KW_RETURN"); let argument=null; if(!this.at(";")&&!this.at("}")&&this.cur().type!=="eof") argument=this.parseExpression(); const end=this.eat(";")||this.tokens[this.i-1]; return {type:"ReturnStatement",argument,loc:locFrom(start,end)}; }
  parseThrow() { const start=this.expectKw("KW_THROW"); const argument=this.parseExpression(); const end=this.eat(";")||this.tokens[this.i-1]; return {type:"ThrowStatement",argument,loc:locFrom(start,end)}; }
  parseTry() { const start=this.expectKw("KW_TRY"); const block=this.parseBlock(); let handler=null,finalizer=null; if(this.eatKw("KW_CATCH")){ this.expect("("); const param=this.expectIdentifier(); this.expect(")"); const body=this.parseBlock(); handler={type:"CatchClause",param,body,loc:{start:param.loc.start,end:body.loc.end}}; } if(this.eatKw("KW_FINALLY")) finalizer=this.parseBlock(); if(!handler&&!finalizer) throw new BilaSyntaxError("thuv/try cần chupr_layb/catch hoặc cujb_cugl/finally",this.cur()); return {type:"TryStatement",block,handler,finalizer,loc:{start:start.start,end:(finalizer?.loc?.end||handler?.loc?.end||block.loc.end)}}; }

  parseExpression() { return this.parseAssignment(); }
  parseAssignment() { let left=this.parseConditional(); if(this.at("=>")){ if(left.type!=="Identifier") throw new BilaSyntaxError("Tham số arrow đơn phải là định danh",this.cur()); this.next(); return this.finishArrow([left],left.loc.start); } if(ASSIGN.has(this.cur().value)){ const operator=this.next().value; const right=this.parseAssignment(); return {type:"AssignmentExpression",operator,left,right,loc:{start:left.loc?.start,end:right.loc?.end}}; } return left; }
  parseConditional() { let test=this.parseBinary(1); if(this.eat("?")){ const consequent=this.parseExpression(); this.expect(":"); const alternate=this.parseAssignment(); return {type:"ConditionalExpression",test,consequent,alternate,loc:{start:test.loc?.start,end:alternate.loc?.end}}; } return test; }
  operatorOf(token) { if(token.type==="punctuator") return token.value; return BINARY_KW[token.value]||null; }
  parseBinary(minPrec) { let left=this.parseUnary(); while(true){ const op=this.operatorOf(this.cur()); const prec=PRECEDENCE[op]||0; if(prec<minPrec) break; this.next(); const right=this.parseBinary(op==="**"?prec:prec+1); left={type:(op==="&&"||op==="||"||op==="??")?"LogicalExpression":"BinaryExpression",operator:op,left,right,loc:{start:left.loc?.start,end:right.loc?.end}}; } return left; }
  parseUnary() { const t=this.cur(); if(t.type==="punctuator"&&new Set(["!","+","-","~"]).has(t.value)){ this.next(); const argument=this.parseUnary(); return {type:"UnaryExpression",operator:t.value,prefix:true,argument,loc:{start:t.start,end:argument.loc?.end}}; } if(t.type==="keyword"&&UNARY_KW[t.value]){ this.next(); const argument=this.parseUnary(); return {type:"UnaryExpression",operator:UNARY_KW[t.value],prefix:true,argument,loc:{start:t.start,end:argument.loc?.end}}; } if(this.atKw("KW_NEW")){ const start=this.next(); const callee=this.parsePostfix(this.parsePrimary()); let args=[]; if(callee.type==="CallExpression") return {type:"NewExpression",callee:callee.callee,arguments:callee.arguments,loc:{start:start.start,end:callee.loc?.end}}; if(this.eat("(")) args=this.parseArgumentsAfterOpen(); return {type:"NewExpression",callee,arguments:args,loc:{start:start.start,end:(args.at(-1)?.loc?.end||callee.loc?.end)}}; } return this.parsePostfix(this.parsePrimary()); }
  parsePostfix(expr) { while(true){ if(this.eat("(")){ const args=this.parseArgumentsAfterOpen(); expr={type:"CallExpression",callee:expr,arguments:args,optional:false,loc:{start:expr.loc?.start,end:(args.at(-1)?.loc?.end||this.tokens[this.i-1].end)}}; continue; } if(this.eat("?.")){ if(this.eat("(")){ const args=this.parseArgumentsAfterOpen(); expr={type:"CallExpression",callee:expr,arguments:args,optional:true,loc:{start:expr.loc?.start,end:(args.at(-1)?.loc?.end||this.tokens[this.i-1].end)}}; continue; } if(this.eat("[")){ const property=this.parseExpression(); const end=this.expect("]"); expr={type:"MemberExpression",object:expr,property,computed:true,optional:true,loc:{start:expr.loc?.start,end:end.end}}; continue; } const p=this.expectIdentifier(); expr={type:"MemberExpression",object:expr,property:p,computed:false,optional:true,loc:{start:expr.loc?.start,end:p.loc.end}}; continue; } if(this.eat(".")){ const p=this.expectIdentifier(); expr={type:"MemberExpression",object:expr,property:p,computed:false,optional:false,loc:{start:expr.loc?.start,end:p.loc.end}}; continue; } if(this.eat("[")){ const property=this.parseExpression(); const end=this.expect("]"); expr={type:"MemberExpression",object:expr,property,computed:true,optional:false,loc:{start:expr.loc?.start,end:end.end}}; continue; } if(this.at("++")||this.at("--")){ const op=this.next(); expr={type:"UpdateExpression",operator:op.value,argument:expr,prefix:false,loc:{start:expr.loc?.start,end:op.end}}; continue; } break; } return expr; }
  parseArgumentsAfterOpen() { const args=[]; if(!this.at(")")){ do { if(this.eat("...")){ const argument=this.parseAssignment(); args.push({type:"SpreadElement",argument,loc:argument.loc}); } else args.push(this.parseAssignment()); } while(this.eat(",")); } this.expect(")"); return args; }
  finishArrow(params,start) { const body=this.at("{")?this.parseBlock():this.parseAssignment(); return {type:"ArrowFunctionExpression",params,body,expression:body.type!=="BlockStatement",async:false,loc:{start,end:body.loc?.end}}; }
  tryParenArrow() { const save=this.i; const start=this.cur().start; this.next(); const params=[]; try { if(!this.at(")")){ do { if(this.cur().type!=="identifier") throw new Error("not-arrow"); params.push(this.expectIdentifier()); } while(this.eat(",")); } this.expect(")"); if(!this.eat("=>")) throw new Error("not-arrow"); return this.finishArrow(params,start); } catch(e){ if(e instanceof BilaSyntaxError && e.message.includes("not-arrow")) throw e; this.i=save; return null; } }
  parsePrimary() {
    const t=this.cur();
    if(t.type==="number"){ this.next(); return {type:"Literal",value:null,raw:t.raw,numericKind:t.numericKind,loc:locFrom(t)}; }
    if(t.type==="string"){ this.next(); return {type:"Literal",value:t.value,raw:t.raw,loc:locFrom(t)}; }
    if(t.type==="regex"){ this.next(); return {type:"RegexLiteral",raw:t.raw,loc:locFrom(t)}; }
    if(t.type==="template"){ this.next(); return {type:"TemplateLiteralRaw",raw:t.raw,loc:locFrom(t)}; }
    if(t.type==="keyword"&&new Set(["KW_TRUE","KW_FALSE","KW_NULL"]).has(t.value)){ this.next(); return {type:"Literal",value:t.value==="KW_NULL"?null:t.value==="KW_TRUE",raw:t.raw,loc:locFrom(t)}; }
    if(this.atKw("KW_THIS")){ this.next(); return {type:"ThisExpression",loc:locFrom(t)}; }
    if(this.atKw("KW_FUNCTION")) return this.parseFunctionExpression();
    if(t.type==="identifier"){ this.next(); return {type:"Identifier",name:t.value,loc:locFrom(t)}; }
    if(this.at("(")){ const arrow=this.tryParenArrow(); if(arrow) return arrow; this.expect("("); const e=this.parseExpression(); this.expect(")"); return e; }
    if(this.eat("[")){ const start=t; const elements=[]; if(!this.at("]")){ do { if(this.eat("...")){ const argument=this.parseAssignment(); elements.push({type:"SpreadElement",argument,loc:argument.loc}); } else elements.push(this.parseAssignment()); } while(this.eat(",")); } const end=this.expect("]"); return {type:"ArrayExpression",elements,loc:locFrom(start,end)}; }
    if(this.eat("{")){ const start=t; const properties=[]; if(!this.at("}")){ do { if(this.eat("...")){ const argument=this.parseAssignment(); properties.push({type:"SpreadElement",argument,loc:argument.loc}); continue; } const k=this.cur(); let key; if(k.type==="identifier") key=this.expectIdentifier(); else if(k.type==="string"||k.type==="number"){ this.next(); key={type:"Literal",value:k.value,raw:k.raw,loc:locFrom(k)}; } else throw new BilaSyntaxError("Khóa object không hợp lệ",k); if(this.eat(":")){ const value=this.parseAssignment(); properties.push({type:"Property",key,value,kind:"init",computed:false,shorthand:false,loc:{start:key.loc?.start,end:value.loc?.end}}); } else if(key.type==="Identifier"){ properties.push({type:"Property",key,value:{...key},kind:"init",computed:false,shorthand:true,loc:key.loc}); } else throw new BilaSyntaxError("Object shorthand cần định danh",k); } while(this.eat(",")); } const end=this.expect("}"); return {type:"ObjectExpression",properties,loc:locFrom(start,end)}; }
    throw new BilaSyntaxError(`Biểu thức không hợp lệ gần '${t.raw||t.value}'`,t);
  }
  parseFunctionExpression() { const start=this.expectKw("KW_FUNCTION"); let id=null; if(this.cur().type==="identifier") id=this.expectIdentifier(); this.expect("("); const params=[]; if(!this.at(")")){ do params.push(this.expectIdentifier()); while(this.eat(",")); } this.expect(")"); const body=this.parseBlock(); return {type:"FunctionExpression",id,params,body,async:false,generator:false,loc:{start:start.start,end:body.loc.end}}; }
}

export function parse(source){ const p=new Parser(source); const ast=p.parseProgram(); return {ast,mode:p.mode,directive:p.directive,source:p.source}; }
''')

write("v3/src/semantic.js", r'''
const posOf = node => node?.loc?.start || node?.loc || null;
export function analyze(ast) {
  const diagnostics=[];
  const error=(node,code,message)=>{ const p=posOf(node); diagnostics.push({severity:"error",code,message,line:p?.line||null,column:p?.column||null}); };
  function visit(node,ctx={functionDepth:0,loopDepth:0}) {
    if(!node||typeof node!=="object") return;
    switch(node.type) {
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const seen=new Set(); for(const p of node.params||[]){ if(seen.has(p.name)) error(p,"BILA-S101",`Tham số trùng '${p.name}'`); seen.add(p.name); }
        if(node.body?.type==="BlockStatement") visit(node.body,{...ctx,functionDepth:ctx.functionDepth+1}); else visit(node.body,{...ctx,functionDepth:ctx.functionDepth+1}); return;
      }
      case "ReturnStatement": if(ctx.functionDepth===0) error(node,"BILA-S201","trov_ved/return chỉ hợp lệ bên trong hàm"); break;
      case "BreakStatement": if(ctx.loopDepth===0) error(node,"BILA-S202","zugk/break chỉ hợp lệ bên trong vòng lặp"); return;
      case "ContinueStatement": if(ctx.loopDepth===0) error(node,"BILA-S203","tifb_tucr/continue chỉ hợp lệ bên trong vòng lặp"); return;
      case "WhileStatement": case "DoWhileStatement": case "ForStatement":
        for(const [k,v] of Object.entries(node)) if(!["type","loc"].includes(k)){ if(k==="body") visit(v,{...ctx,loopDepth:ctx.loopDepth+1}); else visitAny(v,ctx); } return;
    }
    for(const [k,v] of Object.entries(node)) if(!["type","loc"].includes(k)) visitAny(v,ctx);
  }
  function visitAny(v,ctx){ if(Array.isArray(v)) v.forEach(x=>visit(x,ctx)); else visit(v,ctx); }
  visit(ast);
  return diagnostics;
}
''')

write("v3/src/normalize.js", r'''
import { GLOBAL_SPECS, MEMBER_SPECS } from "./vocabulary.js";

class Scope {
  constructor(parent=null){ this.parent=parent; this.bindings=new Map(); }
  define(name,info={}){ this.bindings.set(name,{name,...info}); }
  get(name){ return this.bindings.get(name)||this.parent?.get(name)||null; }
  hasOwn(name){ return this.bindings.has(name); }
}
const clone = x => JSON.parse(JSON.stringify(x));
const typeOfLiteral = n => {
  if(n?.type==="ArrayExpression") return "array";
  if(n?.type==="Literal") {
    if(typeof n.value==="string") return "string";
    if(typeof n.value==="boolean") return "boolean";
    if(n.value===null && n.raw && /^[0-9.]/.test(n.raw.replace(/^[-+]/,""))) return "number";
    if(n.value===null) return "null";
  }
  if(n?.type==="RegexLiteral") return "regexp";
  if(["FunctionExpression","ArrowFunctionExpression"].includes(n?.type)) return "function";
  return null;
};

export function normalize(inputAst) {
  const ast=clone(inputAst); const diagnostics=[]; const metadata={resolvedGlobals:0,resolvedMembers:0,unresolvedMemberAliases:0};
  const warn=(node,code,message)=>{ const p=node?.loc?.start; diagnostics.push({severity:"warning",code,message,line:p?.line||null,column:p?.column||null}); };

  function predeclare(body,scope){
    for(const n of body||[]){
      if(n?.type==="VariableDeclaration") for(const d of n.declarations) scope.define(d.id.name,{kind:"variable",type:null});
      if(n?.type==="FunctionDeclaration") scope.define(n.id.name,{kind:"function",type:"function"});
    }
  }
  function infer(n,scope){
    const literal=typeOfLiteral(n); if(literal) return literal;
    if(!n) return null;
    if(n.type==="Identifier") {
      const b=scope.get(n.name); if(b?.type) return b.type;
      const g=GLOBAL_SPECS[n.name]; return g?.type||null;
    }
    if(n.type==="NewExpression") {
      if(n.callee?.type==="Identifier") return GLOBAL_SPECS[n.callee.name]?.type||scope.get(n.callee.name)?.type||null;
    }
    return n.inferredType||null;
  }
  function visit(node,scope,context={}){
    if(!node||typeof node!=="object") return;
    switch(node.type){
      case "Program": predeclare(node.body,scope); node.body.forEach(n=>visit(n,scope)); return;
      case "BlockStatement": { const child=new Scope(scope); predeclare(node.body,child); node.body.forEach(n=>visit(n,child)); return; }
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const fnScope=new Scope(scope); if(node.id) fnScope.define(node.id.name,{kind:"function",type:"function"}); for(const p of node.params||[]) fnScope.define(p.name,{kind:"parameter",type:null});
        if(node.body?.type==="BlockStatement") visit(node.body,fnScope); else visit(node.body,fnScope); return;
      }
      case "VariableDeclaration":
        for(const d of node.declarations){ if(d.init) visit(d.init,scope); const info=scope.get(d.id.name); if(info) info.type=infer(d.init,scope); d.inferredType=info?.type||null; }
        return;
      case "Identifier": {
        if(context.propertyKey||context.declaration) return;
        const local=scope.get(node.name);
        if(!local && GLOBAL_SPECS[node.name]) { const spec=GLOBAL_SPECS[node.name]; node.jsName=spec.js; node.inferredType=spec.type; node.bilaGlobal=node.name; metadata.resolvedGlobals++; }
        else if(local?.type) node.inferredType=local.type;
        return;
      }
      case "MemberExpression": {
        visit(node.object,scope); if(node.computed) visit(node.property,scope); else visit(node.property,scope,{propertyKey:true});
        const receiver=infer(node.object,scope); node.receiverType=receiver;
        if(!node.computed && node.property?.type==="Identifier" && MEMBER_SPECS[node.property.name]){
          const spec=MEMBER_SPECS[node.property.name];
          if(receiver && spec.receivers.includes(receiver)){ node.jsProperty=spec.js; node.bilaProperty=node.property.name; metadata.resolvedMembers++; }
          else { metadata.unresolvedMemberAliases++; warn(node,"BILA-S310",`Không tự đổi '${node.property.name}' vì chưa chứng minh receiver thuộc [${spec.receivers.join(", ")}]; giữ nguyên property để tránh phá API người dùng.`); }
        }
        return;
      }
      case "NewExpression": case "CallExpression": visit(node.callee,scope); (node.arguments||[]).forEach(a=>visit(a,scope)); node.inferredType=infer(node,scope); return;
      case "Property": visit(node.key,scope,{propertyKey:true}); visit(node.value,scope); return;
      case "CatchClause": { const child=new Scope(scope); if(node.param) child.define(node.param.name,{kind:"catch",type:null}); visit(node.body,child); return; }
    }
    for(const [k,v] of Object.entries(node)) if(!["type","loc","jsName","jsProperty","receiverType","inferredType","bilaGlobal","bilaProperty"].includes(k)){
      if(Array.isArray(v)) v.forEach(x=>visit(x,scope)); else if(v&&typeof v==="object") visit(v,scope);
    }
  }
  visit(ast,new Scope());
  return {ast,diagnostics,metadata};
}
''')

write("v3/src/source-map.js", r'''
const CHARS="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function vlq(value){ let x=(Math.abs(value)<<1)+(value<0?1:0), out=""; do { let digit=x&31; x>>>=5; if(x>0) digit|=32; out+=CHARS[digit]; } while(x>0); return out; }
export function buildSourceMap(marks,{file="output.js",source="input.bila",sourceContent=""}={}){
  const rows=[]; for(const mark of marks){ if(!mark.original?.line) continue; const line=mark.generated.line; while(rows.length<=line) rows.push([]); rows[line].push(mark); }
  let prevSource=0, prevOrigLine=0, prevOrigCol=0; const encoded=[];
  for(let line=0; line<rows.length; line++){
    let prevGenCol=0; const segs=[];
    for(const mark of rows[line].sort((a,b)=>a.generated.column-b.generated.column)){
      const src=0, ol=mark.original.line-1, oc=Math.max(0,(mark.original.column||1)-1);
      segs.push(vlq(mark.generated.column-prevGenCol)+vlq(src-prevSource)+vlq(ol-prevOrigLine)+vlq(oc-prevOrigCol));
      prevGenCol=mark.generated.column; prevSource=src; prevOrigLine=ol; prevOrigCol=oc;
    }
    encoded.push(segs.join(","));
  }
  return {version:3,file,sources:[source],sourcesContent:[sourceContent],names:[],mappings:encoded.join(";")};
}
''')

write("v3/src/codegen-js.js", r'''
export function generateDetailed(ast) {
  const out=[]; const marks=[]; let level=0,line=0,column=0;
  const ind=()=>"  ".repeat(level);
  const emit=s=>{ out.push(s); for(const ch of s){ if(ch==="\n"){line++;column=0;} else column++; } };
  const mark=n=>{ const p=n?.loc?.start; if(p?.line) marks.push({generated:{line,column},original:p}); };
  const id=n=>n.jsName||n.name;
  function stmt(n){ mark(n); switch(n.type){
    case "EmptyStatement": emit(ind()+";\n"); break;
    case "BlockStatement": emit("{\n"); level++; n.body.forEach(stmt); level--; emit(ind()+"}"); break;
    case "VariableDeclaration": emit(ind()+n.kind+" "+n.declarations.map(d=>expr(d.id)+(d.init?" = "+expr(d.init):"")).join(", ")+";\n"); break;
    case "FunctionDeclaration": emit(ind()+`function ${expr(n.id)}(${n.params.map(expr).join(", ")}) `); stmt(n.body); emit("\n"); break;
    case "IfStatement": emit(ind()+`if (${expr(n.test)}) `); stmt(n.consequent); if(n.alternate){ emit(" else "); stmt(n.alternate); } emit("\n"); break;
    case "WhileStatement": emit(ind()+`while (${expr(n.test)}) `); stmt(n.body); emit("\n"); break;
    case "DoWhileStatement": emit(ind()+"do "); stmt(n.body); emit(` while (${expr(n.test)});\n`); break;
    case "ForStatement": { const init=n.init?(n.init.type==="VariableDeclaration"?n.init.kind+" "+n.init.declarations.map(d=>expr(d.id)+(d.init?" = "+expr(d.init):"")).join(", "):expr(n.init)):""; emit(ind()+`for (${init}; ${n.test?expr(n.test):""}; ${n.update?expr(n.update):""}) `); stmt(n.body); emit("\n"); break; }
    case "ReturnStatement": emit(ind()+"return"+(n.argument?" "+expr(n.argument):"")+";\n"); break;
    case "BreakStatement": emit(ind()+"break;\n"); break;
    case "ContinueStatement": emit(ind()+"continue;\n"); break;
    case "ThrowStatement": emit(ind()+"throw "+expr(n.argument)+";\n"); break;
    case "TryStatement": emit(ind()+"try "); stmt(n.block); if(n.handler){ emit(` catch (${expr(n.handler.param)}) `); stmt(n.handler.body); } if(n.finalizer){ emit(" finally "); stmt(n.finalizer); } emit("\n"); break;
    case "ExpressionStatement": emit(ind()+expr(n.expression)+";\n"); break;
    default: throw new Error(`Codegen chưa hỗ trợ statement ${n.type}`);
  }}
  function expr(n){ switch(n.type){
    case "Identifier": return id(n);
    case "ThisExpression": return "this";
    case "Literal": return n.raw ?? (typeof n.value==="string"?JSON.stringify(n.value):n.value===null?"null":String(n.value));
    case "RegexLiteral": case "TemplateLiteralRaw": return n.raw;
    case "ArrayExpression": return "["+n.elements.map(expr).join(", ")+"]";
    case "ObjectExpression": return "{"+n.properties.map(p=>p.type==="SpreadElement"?"..."+expr(p.argument):p.shorthand?expr(p.key):`${p.key.type==="Identifier"?p.key.name:p.key.raw}: ${expr(p.value)}`).join(", ")+"}";
    case "SpreadElement": return "..."+expr(n.argument);
    case "UnaryExpression": return (/[A-Za-z]/.test(n.operator)?n.operator+" ":n.operator)+expr(n.argument);
    case "UpdateExpression": return n.prefix?n.operator+expr(n.argument):expr(n.argument)+n.operator;
    case "BinaryExpression": case "LogicalExpression": return `(${expr(n.left)} ${n.operator} ${expr(n.right)})`;
    case "AssignmentExpression": return `${expr(n.left)} ${n.operator} ${expr(n.right)}`;
    case "ConditionalExpression": return `(${expr(n.test)} ? ${expr(n.consequent)} : ${expr(n.alternate)})`;
    case "CallExpression": return `${expr(n.callee)}${n.optional?"?.":""}(${n.arguments.map(expr).join(", ")})`;
    case "NewExpression": return `new ${expr(n.callee)}(${n.arguments.map(expr).join(", ")})`;
    case "MemberExpression": { const obj=expr(n.object); if(n.computed) return `${obj}${n.optional?"?.":""}[${expr(n.property)}]`; return `${obj}${n.optional?"?.":"."}${n.jsProperty||n.property.name}`; }
    case "FunctionExpression": return `function${n.id?" "+expr(n.id):""}(${n.params.map(expr).join(", ")}) ${blockExpr(n.body)}`;
    case "ArrowFunctionExpression": return `(${n.params.map(expr).join(", ")}) => ${n.expression?expr(n.body):blockExpr(n.body)}`;
    default: throw new Error(`Codegen chưa hỗ trợ expression ${n.type}`);
  }}
  function blockExpr(b){ const save=level; const local=[]; const oldOut=out.splice(0,out.length); const oldMarks=marks.splice(0,marks.length); const oldLine=line,oldColumn=column; level=0; line=0; column=0; stmt(b); const text=out.join(""); out.splice(0,out.length,...oldOut); marks.splice(0,marks.length,...oldMarks); level=save; line=oldLine; column=oldColumn; return text.trimEnd(); }
  ast.body.forEach(stmt); const code=out.join("").trimEnd()+"\n"; return {code,marks};
}
export function generate(ast){ return generateDetailed(ast).code; }
''')

write("v3/src/performance.js", r'''
export const PERFORMANCE_CONTRACT = Object.freeze({
  principle: "CVNSS4.0 ở frontend; JavaScript ở backend; không dịch từ vựng khi runtime.",
  runtimeTranslation: false,
  injectedRuntimeHelpers: false,
  operatorRewrite: false,
  numericRewrite: false,
  wrapperObjects: false
});
export function auditZeroCost(code){
  const injected=[];
  for(const name of ["BilaRuntime","BilaArray","__bilaRuntime","__bilaGet","__bilaCall"]) if(code.includes(name)) injected.push(name);
  return {zeroCost:injected.length===0,runtimeHelpers:injected,contract:PERFORMANCE_CONTRACT};
}
''')

write("v3/src/compiler.js", r'''
import { parse } from "./parser.js";
import { analyze } from "./semantic.js";
import { normalize } from "./normalize.js";
import { generateDetailed } from "./codegen-js.js";
import { buildSourceMap } from "./source-map.js";
import { auditZeroCost } from "./performance.js";
import { VERSION } from "./vocabulary.js";

export function compile(source, options={}) {
  const parsed=parse(source);
  const semanticDiagnostics=analyze(parsed.ast);
  const normalized=normalize(parsed.ast);
  const diagnostics=[...semanticDiagnostics,...normalized.diagnostics];
  const errors=diagnostics.filter(x=>x.severity==="error");
  if(options.failOnSemanticError!==false && errors.length){ const e=new Error(errors.map(x=>`${x.code}: ${x.message}`).join("\n")); e.name="BilaSemanticError"; e.diagnostics=diagnostics; throw e; }
  const generated=generateDetailed(normalized.ast);
  const performance=auditZeroCost(generated.code);
  const map=options.sourceMap?buildSourceMap(generated.marks,{file:options.fileName||"output.js",source:options.sourceName||"input.bila",sourceContent:String(source)}):null;
  return {version:VERSION,backend:"javascript",mode:parsed.mode,ast:parsed.ast,normalizedAst:normalized.ast,diagnostics,normalization:normalized.metadata,code:generated.code,map,performance};
}
export { parse } from "./parser.js";
export { lex } from "./lexer.js";
export { analyze } from "./semantic.js";
export { normalize } from "./normalize.js";
export { generate, generateDetailed } from "./codegen-js.js";
export { buildSourceMap } from "./source-map.js";
export { auditZeroCost, PERFORMANCE_CONTRACT } from "./performance.js";
''')

write("v3/bin/bila.js", r'''#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { compile, parse, lex } from "../src/compiler.js";

const [cmd,file,...rest]=process.argv.slice(2);
const usage=()=>console.log(`BilaScript v3.5.0\n\n  bila compile <file.bila> [-o out.js] [--map]\n  bila run <file.bila>\n  bila ast <file.bila> [--normalized]\n  bila tokens <file.bila>\n  bila check <file.bila>`);
if(!cmd||!file){usage();process.exit(cmd?1:0)}
const src=fs.readFileSync(file,"utf8");
try{
  if(cmd==="compile"){
    const oi=rest.indexOf("-o"), outFile=oi>=0?rest[oi+1]:null, sourceMap=rest.includes("--map");
    const r=compile(src,{sourceMap,sourceName:path.basename(file),fileName:outFile?path.basename(outFile):"output.js"});
    let code=r.code;
    if(sourceMap&&outFile){ const mapFile=outFile+".map"; fs.writeFileSync(mapFile,JSON.stringify(r.map)); code+=`//# sourceMappingURL=${path.basename(mapFile)}\n`; }
    if(outFile) fs.writeFileSync(outFile,code); else process.stdout.write(code);
  } else if(cmd==="run"){
    const r=compile(src); const x=spawnSync(process.execPath,["-e",r.code],{stdio:"inherit"}); process.exit(x.status??1);
  } else if(cmd==="ast") { const r=compile(src,{failOnSemanticError:false}); console.log(JSON.stringify(rest.includes("--normalized")?r.normalizedAst:r.ast,null,2)); }
  else if(cmd==="tokens") console.log(JSON.stringify(lex(src).tokens,null,2));
  else if(cmd==="check") { const r=compile(src); console.log(`OK BilaScript v${r.version} | mode=${r.mode} | backend=${r.backend} | zeroCost=${r.performance.zeroCost} | warnings=${r.diagnostics.filter(x=>x.severity==="warning").length}`); }
  else { usage(); process.exit(1); }
}catch(e){ console.error(`${e.name}: ${e.message}`); process.exit(1); }
''')

write("v3/test/compiler.test.js", r'''
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { compile, parse, lex } from "../src/compiler.js";

const strictSource=`---bila:strict---
haml_sob tong(a, b) { trov_ved a + b; }
bilb ds = moix Magz(10, 20, 30);
ds.dayq(40);
neub (ds.dof_zail > 0) { console.log(tong(ds[0], ds[1])); console.log(ds.dof_zail); }
`;

test("v3.5 native frontend: CVNSS4.0 -> semantic IDs -> AST -> clean JavaScript",()=>{
  const r=compile(strictSource); assert.equal(r.version,"3.5.0"); assert.equal(r.mode,"strict"); assert.match(r.code,/function tong/); assert.match(r.code,/new Array/); assert.match(r.code,/\.push\(40\)/); assert.match(r.code,/\.length/); assert.equal(r.performance.zeroCost,true);
  const logs=[]; vm.runInNewContext(r.code,{console:{log:x=>logs.push(String(x))}}); assert.deepEqual(logs,["30","4"]);
});

test("strict profile rejects mapped English vocabulary",()=>assert.throws(()=>compile("---bila:strict---\nfunction x(){ return 1; }")));

test("default profile keeps JavaScript migration compatibility",()=>{ const r=compile("---bila---\nfunction x(){ return 7; } console.log(x());"); const logs=[]; vm.runInNewContext(r.code,{console:{log:x=>logs.push(String(x))}}); assert.deepEqual(logs,["7"]); });

test("semantic analyzer rejects top-level return",()=>assert.throws(()=>compile("---bila:strict---\ntrov_ved 1;"),/BILA-S201/));

test("lexer uses backend-neutral semantic keyword IDs",()=>{ const r=lex("---bila:strict---\nneub (thatf) { bilb x = 1; }"); assert.deepEqual(r.tokens.filter(t=>t.type==="keyword").map(t=>t.value),["KW_IF","KW_TRUE","KW_VAR"]); });

test("AST remains backend-neutral",()=>{ const {ast}=parse("---bila:strict---\nhaml_sob f(a){ trov_ved a * 2; }"); assert.equal(ast.body[0].type,"FunctionDeclaration"); assert.equal(ast.body[0].body.body[0].type,"ReturnStatement"); assert.ok(ast.body[0].loc.start.line>=2); });

test("numbers and JavaScript operators are preserved, not localized",()=>{ const r=compile("---bila:strict---\nbilb x = 1_000 + 0x10; bilb y = x === 1016 ? x : 0;"); assert.match(r.code,/1_000 \+ 0x10/); assert.match(r.code,/=== 1016/); });

test("receiver-safe member aliasing maps known Array but does not rewrite unknown user API",()=>{ const r=compile("---bila:strict---\nbilb ds = [1,2]; ds.dayq(3); bilb obj = {}; obj.dayq(4);"); assert.match(r.code,/ds\.push\(3\)/); assert.match(r.code,/obj\.dayq\(4\)/); assert.ok(r.diagnostics.some(d=>d.code==="BILA-S310")); });

test("zero-cost contract injects no Bila runtime wrapper",()=>{ const r=compile(strictSource); assert.equal(r.performance.runtimeHelpers.length,0); assert.doesNotMatch(r.code,/BilaRuntime|BilaArray|__bila/); });

test("source map v3 is emitted from Bila source locations",()=>{ const r=compile(strictSource,{sourceMap:true,sourceName:"main.bila",fileName:"main.js"}); assert.equal(r.map.version,3); assert.deepEqual(r.map.sources,["main.bila"]); assert.ok(r.map.mappings.length>0); });

test("arrow function is structural JavaScript syntax and remains unchanged",()=>{ const r=compile("---bila:strict---\nbilb f = x => x + 1; console.log(f(4));"); assert.match(r.code,/\(x\) => \(x \+ 1\)/); const logs=[]; vm.runInNewContext(r.code,{console:{log:x=>logs.push(String(x))}}); assert.deepEqual(logs,["5"]); });

test("optional chaining and nullish operators remain JavaScript symbols",()=>{ const r=compile("---bila:strict---\nbilb obj = {}; bilb x = obj?.a ?? 9; console.log(x);"); assert.match(r.code,/obj\?\.a/); assert.match(r.code,/\?\?/); const logs=[]; vm.runInNewContext(r.code,{console:{log:x=>logs.push(String(x))}}); assert.deepEqual(logs,["9"]); });

test("Unicode user identifiers are preserved",()=>{ const r=compile("---bila:strict---\nbilb dữ_liệu = 5; console.log(dữ_liệu);"); assert.match(r.code,/dữ_liệu/); });
''')

write("v3/examples/hello.bila", r'''---bila:strict---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb ds = [10, 20, 30];
ds.dayq(40);
bilb gia_tri = ds?.dof_zail ?? 0;

neub (gia_tri > 0) {
    console.log("BilaScript v3.5.0");
    console.log(tong(ds[0], ds[1]));
    console.log(gia_tri);
}
''')

write("v3/PERFORMANCE_CONTRACT.md", r'''
# BilaScript v3.5 — Zero-cost Frontend Performance Contract

BilaScript không thay thế JavaScript runtime. CVNSS4.0 tồn tại ở **frontend**; JavaScript đảm nhiệm thực thi.

## Hợp đồng

1. Số, literal, dấu câu và toán tử JavaScript được giữ nguyên về mặt cú pháp/semantics.
2. Canonical CVNSS4.0 được chuyển thành semantic token (`KW_IF`, `KW_RETURN`, ...) trước parser; AST không phụ thuộc spelling.
3. Compiler không chèn runtime translator, Proxy, wrapper array/object hay helper call cho construct 1:1.
4. Built-in alias chỉ được đổi khi semantic normalizer chứng minh receiver phù hợp. `ds.dayq()` với `ds` là Array → `ds.push()`; `obj.dayq()` không rõ kiểu → giữ `dayq` và cảnh báo.
5. JavaScript output là code trực tiếp để V8/SpiderMonkey/JavaScriptCore/Bun tối ưu như JavaScript thông thường.
6. Source map được tạo ở compile-time; không thêm overhead runtime.

Không tuyên bố BilaScript nhanh hơn JavaScript. Mục tiêu là runtime performance tương đương **JavaScript được sinh ra**, và không thêm chi phí dịch CVNSS4.0 khi chạy.
''')

write("v3/HISTORY.md", r'''
# Lịch sử kiến trúc BilaScript

| Phiên bản | Mốc chính |
|---|---|
| v1.0.0 | Đưa vocabulary CVNSS4.0 vào dòng Babylscript/Rhino để thử nghiệm JavaScript đa ngôn ngữ. |
| v1.2.0 | `bila` trở thành language mode native trong tokenizer Rhino/Babylscript; thêm mapping API và xử lý collision parser-safe. |
| v2.0.0 | Chuẩn hóa ba profile `bila`, `bila:strict`, `bila:js`; giữ hình dạng JavaScript và thêm lexical bridge/spec. |
| v3.0.0 | Tách frontend mới khỏi Rhino: Bila Lexer → Bila Parser → Bila AST → Semantic → JavaScript Codegen. |
| v3.5.0 | Zero-cost frontend: semantic keyword IDs, receiver-safe aliasing, source locations/source maps, Unicode identifiers, modern operator surface (`=>`, `?.`, `??`, spread), performance contract và Pascal-inspired site. |
''')

write("docs/BILASCRIPT_v3.5.0.md", r'''
# BilaScript v3.5.0 — Zero-cost CVNSS4.0 Frontend

## Tuyên ngôn

**BilaScript không thay thế JavaScript runtime; BilaScript làm chủ cách con người viết chương trình, còn JavaScript đảm nhiệm việc chạy chương trình.**

V3.5 tiếp tục kiến trúc v3 nhưng siết ranh giới frontend/backend. Số, dấu câu và toán tử được giữ nguyên như JavaScript. Canonical CVNSS4.0 chỉ là surface vocabulary và được chuyển thành semantic IDs trước parser.

```text
*.bila
  ↓
Bila Lexer: CVNSS4.0 → KW_* semantic token
  ↓
Bila Parser
  ↓
Bila AST
  ↓
Semantic Analyzer
  ↓
Normalizer + receiver-safe alias resolution
  ↓
Normalized Bila AST
  ↓
JavaScript Codegen + Source Map
  ↓
Browser / Node / Bun / JavaScript runtime
```

## Điểm mới so với v3.0

- Keyword token chuyển sang backend-neutral IDs (`KW_IF`, `KW_FUNCTION`, ...), không dùng chuỗi JavaScript làm identity nội bộ.
- Token/AST có source span phục vụ diagnostics và source map.
- Normalizer chỉ đổi built-in member CVNSS4.0 khi receiver type được suy luận an toàn.
- Unknown/custom API được giữ nguyên, tránh phá npm/user object.
- Không có Bila runtime wrapper; construct 1:1 sinh JavaScript trực tiếp.
- Numeric literal giữ raw JavaScript, gồm hex/binary/octal, separator và BigInt surface.
- Unicode identifier của người dùng được giữ nguyên.
- Hỗ trợ thêm structural syntax không cần bản địa hóa: arrow `=>`, optional chaining `?.`, nullish `??`, spread `...`.
- CLI có `tokens`, `--normalized`, `--map`.
- Website chuyển sang Pascal-inspired dark blue / white / yellow minimal theme và bổ sung lịch sử phiên bản.

## Giới hạn

V3.5 chưa tuyên bố full ECMAScript/Test262 conformance. Template literal có `${...}` vẫn bị chặn vì compiler chưa tái lex expression bên trong. Module/class/async-await/destructuring đầy đủ, LSP và type system tĩnh là roadmap tiếp theo.
''')

write("docs/SCIENTIFIC_EVALUATION_v3.5.0.md", r'''
# Đánh giá kỹ thuật BilaScript v3.5.0

## Tóm tắt

BilaScript v3.5 nghiên cứu một thiết kế ngôn ngữ bản địa hóa trong đó surface vocabulary dùng CVNSS4.0 nhưng runtime không bị thay thế. Frontend được sở hữu bởi BilaScript; JavaScript là backend thực thi. Mục tiêu là giảm coupling, hạn chế semantic rewrite nguy hiểm và giữ khả năng tối ưu của JavaScript engine.

## Câu hỏi nghiên cứu

1. Có thể thay lớp từ vựng bằng CVNSS4.0 mà giữ số, toán tử và cấu trúc biểu thức JavaScript không?
2. Có thể tránh runtime translation/wrapper và sinh JavaScript trực tiếp không?
3. Có thể giảm rủi ro đổi nhầm API bằng semantic receiver resolution không?
4. Có thể làm AST độc lập hơn với backend bằng semantic token IDs không?

## Phương pháp

V3.5 triển khai lexer semantic-ID, parser riêng, AST có source span, semantic pass, normalization/type inference nhẹ, receiver-safe member mapping, JavaScript code generator, source-map encoder và zero-cost audit. Test suite chạy cả semantic correctness và execution của output.

## Kết quả kiến trúc

- CVNSS4.0 không tồn tại như runtime translator.
- `neub`, `trov_ved`, `haml_sob` được hạ thành `KW_IF`, `KW_RETURN`, `KW_FUNCTION` trước parser.
- `ds.dayq()` chỉ được hạ thành `ds.push()` khi `ds` được suy luận là Array.
- Property không rõ receiver được giữ nguyên và sinh cảnh báo thay vì rewrite im lặng.
- Output không chèn `BilaRuntime`, wrapper collection hay reflection helper.
- Source maps là metadata build-time, không thêm runtime overhead.

## Ưu điểm

- Frontend ownership rõ hơn v3.0.
- Rủi ro API collision giảm.
- JavaScript engine tiếp tục tối ưu output trực tiếp.
- Dễ xây formatter/LSP/type checker từ semantic AST.
- npm/user-defined API không bị bản địa hóa mù quáng.

## Nhược điểm và threats to validity

- Type inference hiện nhẹ, không phải hệ type hoàn chỉnh.
- Chưa có Test262/full ESNext conformance.
- Chưa công bố benchmark tốc độ; “zero-cost” ở đây nghĩa là không chèn runtime translation/helper cho mapping 1:1, không phải khẳng định nhanh hơn JavaScript.
- Template interpolation, module/class/async-await còn thiếu.
- Receiver inference có thể không chứng minh được dynamic values; khi đó compiler ưu tiên giữ property gốc.

## Kết luận

V3.5 chuyển trọng tâm từ “dịch tên JavaScript” sang “frontend semantic độc lập + JavaScript backend”. Đây là bước trung gian hợp lý trước Bila IR/multi-backend, đồng thời vẫn bảo toàn giá trị lớn nhất của JavaScript: runtime/JIT và ecosystem.
''')

write("index.html", r'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BilaScript v3.5 — Zero-cost CVNSS4.0 Frontend</title>
<meta name="description" content="BilaScript v3.5: CVNSS4.0 frontend do Bila làm chủ, JavaScript là backend runtime. MIT, Long Ngo, Pascal-inspired interface.">
<style>
:root{--bg:#001b33;--bg2:#00264d;--panel:#002b55;--panel2:#003366;--text:#fff;--muted:#b9c8d8;--yellow:#ffd43b;--cyan:#69e6ff;--line:#31577a;--red:#ff8b8b;--green:#7ee787;--max:1160px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.65 Consolas,"Lucida Console","Courier New",monospace}a{color:var(--yellow);text-decoration:none}a:hover{text-decoration:underline}.wrap{width:min(var(--max),calc(100% - 28px));margin:auto}.nav{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:2px solid var(--yellow)}.navin{min-height:58px;display:flex;align-items:center;gap:18px}.brand{font-weight:700;letter-spacing:.02em}.brand b{color:var(--yellow)}.links{margin-left:auto;display:flex;gap:16px;font-size:13px;flex-wrap:wrap}.hero{padding:76px 0 48px}.tag{display:inline-block;border:1px solid var(--yellow);color:var(--yellow);padding:4px 9px}.hero h1{font-size:clamp(38px,7vw,72px);line-height:1.02;margin:18px 0;letter-spacing:-.04em}.hero h1 span{color:var(--yellow)}.lead{font-size:18px;color:var(--muted);max-width:900px}.prompt{color:var(--cyan)}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}.btn,.mini{border:1px solid var(--yellow);background:transparent;color:var(--yellow);padding:9px 12px;font:inherit;cursor:pointer}.btn.primary,.mini:hover{background:var(--yellow);color:#00152a;text-decoration:none}.grid{display:grid;gap:12px}.grid.two{grid-template-columns:repeat(2,1fr)}.grid.three{grid-template-columns:repeat(3,1fr)}.grid.four{grid-template-columns:repeat(4,1fr)}.card,.stat{border:1px solid var(--line);background:var(--bg2);padding:18px}.stat strong{display:block;color:var(--yellow);font-size:20px}.muted,.stat span{color:var(--muted)}section{padding:52px 0;border-top:1px solid var(--line)}h2{font-size:30px;margin:0 0 12px;color:var(--yellow)}h3{margin-top:0;color:#fff}.kicker{color:var(--cyan);text-transform:uppercase;font-size:12px;letter-spacing:.12em;margin-bottom:8px}.flow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.node{border:1px solid var(--line);padding:13px 8px;text-align:center;background:var(--panel);font-size:12px}.node b{display:block;color:var(--yellow);margin-bottom:4px}.table{width:100%;border-collapse:collapse}.table th,.table td{border-bottom:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}.table th{color:var(--yellow)}pre,.editor{background:#001326;color:#fff;border:1px solid var(--line);font:14px/1.55 Consolas,"Lucida Console","Courier New",monospace}.editor{width:100%;min-height:340px;padding:14px;resize:vertical}.play{display:grid;grid-template-columns:1fr 1fr;gap:10px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.console{white-space:pre-wrap;min-height:70px}.timeline{border-left:2px solid var(--yellow);margin-left:8px}.event{position:relative;padding:0 0 28px 24px}.event:before{content:"";position:absolute;left:-7px;top:7px;width:10px;height:10px;background:var(--yellow)}.event h3{margin:0;color:var(--yellow)}.event .ver{color:var(--cyan)}.ok{color:var(--green)}.warn{color:var(--yellow)}.bad{color:var(--red)}footer{border-top:2px solid var(--yellow);padding:32px 0;color:var(--muted)}code{color:var(--cyan)}@media(max-width:900px){.links{display:none}.grid.two,.grid.three,.grid.four,.play{grid-template-columns:1fr}.flow{grid-template-columns:1fr 1fr}.hero{padding-top:48px}}
</style>
</head>
<body>
<nav class="nav"><div class="wrap navin"><div class="brand">BILA<b>SCRIPT</b>_3.5</div><div class="links"><a href="#architecture">KIẾN TRÚC</a><a href="#performance">HIỆU NĂNG</a><a href="#playground">PLAYGROUND</a><a href="#history">LỊCH SỬ</a><a href="#evaluation">ĐÁNH GIÁ</a><a href="#license">GIẤY PHÉP</a><a href="https://github.com/xulytiengviet/bilascript">GITHUB</a></div></div></nav>
<header class="hero"><div class="wrap"><span class="tag">[ v3.5.0 / ZERO-COST FRONTEND ]</span><h1>BilaScript làm chủ <span>frontend</span>.<br>JavaScript đảm nhiệm runtime.</h1><p class="lead"><span class="prompt">&gt;</span> Ký hiệu, số, toán tử và cấu trúc biểu thức giữ nguyên như JavaScript. CVNSS4.0 chỉ thay đổi lớp giao diện ngôn ngữ; compiler hạ về JavaScript sạch trước khi chạy, không chèn runtime translator hay wrapper không cần thiết.</p><div class="actions"><a class="btn primary" href="#playground">[ CHẠY COMPILER ]</a><a class="btn" href="https://github.com/xulytiengviet/bilascript/releases/tag/v3.5.0">[ RELEASE ]</a><a class="btn" href="docs/BILASCRIPT_v3.5.0.md">[ SPEC ]</a></div><div class="grid four"><div class="stat"><strong>CVNSS4.0</strong><span>surface vocabulary</span></div><div class="stat"><strong>KW_*</strong><span>semantic token IDs</span></div><div class="stat"><strong>0 helper</strong><span>cho mapping 1:1</span></div><div class="stat"><strong>MIT</strong><span>v3 Core · Long Ngo</span></div></div></div></header>
<section><div class="wrap"><div class="kicker">Tuyên ngôn v3.5</div><h2>BẢN CHẤT</h2><div class="grid two"><div class="card"><h3>Bila làm chủ cách viết</h3><p class="muted">Lexer, semantic token identity, parser, AST, semantic diagnostics, normalization và code-generation policy thuộc frontend BilaScript. <code>neub</code> được chuyển thành <code>KW_IF</code>; AST chỉ còn <code>IfStatement</code>.</p></div><div class="card"><h3>JavaScript làm nhiệm vụ chạy</h3><p class="muted">Output là JavaScript trực tiếp. V8, SpiderMonkey, JavaScriptCore, Node và Bun tiếp tục đảm nhiệm JIT/runtime. BilaScript không cố viết lại một JavaScript VM.</p></div></div></div></section>
<section id="architecture"><div class="wrap"><div class="kicker">Deep-tech core</div><h2>KIẾN TRÚC FRONTEND</h2><div class="flow"><div class="node"><b>01 SOURCE</b>*.bila</div><div class="node"><b>02 LEXER</b>CVNSS4.0 → KW_*</div><div class="node"><b>03 PARSER</b>Bila AST</div><div class="node"><b>04 SEMANTIC</b>diagnostics</div><div class="node"><b>05 NORMALIZE</b>safe alias</div><div class="node"><b>06 CODEGEN</b>JS + map</div><div class="node"><b>07 RUNTIME</b>V8 / JS engine</div></div><pre>CVNSS4.0 surface → semantic IDs → Bila AST → Normalized AST → JavaScript → runtime</pre><div class="grid three"><div class="card"><h3>Giữ nguyên JavaScript symbols</h3><p class="muted"><code>{ } ( ) [ ] + - * / === !== =&gt; ?. ?? ...</code> và numeric literals không bị dịch sang từ tự nhiên.</p></div><div class="card"><h3>Receiver-safe alias</h3><p class="muted"><code>ds.dayq()</code> chỉ thành <code>ds.push()</code> khi compiler suy luận <code>ds</code> là Array. Unknown API được giữ nguyên thay vì rewrite mù.</p></div><div class="card"><h3>Source span + map</h3><p class="muted">Token/AST giữ vị trí nguồn; CLI có <code>--map</code> để phát source map v3 mà không thêm runtime overhead.</p></div></div></div></section>
<section id="performance"><div class="wrap"><div class="kicker">Performance contract</div><h2>GIỮ HIỆU NĂNG JAVASCRIPT</h2><table class="table"><thead><tr><th>Nguyên tắc</th><th>v3.5</th><th>Lý do</th></tr></thead><tbody><tr><td>Runtime translation</td><td class="ok">KHÔNG</td><td>CVNSS4.0 được xử lý compile-time.</td></tr><tr><td>Wrapper Array/Object</td><td class="ok">KHÔNG</td><td>Alias hạ trực tiếp về built-in JS.</td></tr><tr><td>Toán tử / số</td><td class="ok">GIỮ NGUYÊN</td><td>Không phá optimizer/JIT assumptions.</td></tr><tr><td>User/npm API</td><td class="ok">GIỮ NGUYÊN KHI KHÔNG CHỨNG MINH RECEIVER</td><td>Giảm collision và interop risk.</td></tr><tr><td>Source map</td><td>BUILD-TIME</td><td>Không thêm runtime helper.</td></tr></tbody></table><p class="muted">Không tuyên bố BilaScript nhanh hơn JavaScript. Mục tiêu khoa học là runtime của chương trình Bila tương đương runtime của <b>JavaScript được sinh ra</b>, vì compiler không đưa lớp dịch CVNSS4.0 vào đường chạy.</p></div></section>
<section id="playground"><div class="wrap"><div class="kicker">Compiler thật trong trình duyệt</div><h2>PLAYGROUND_3.5</h2><div class="toolbar"><button class="mini" id="compileBtn">[ BIÊN DỊCH ]</button><button class="mini" id="runBtn">[ CHẠY JS ]</button><button class="mini" id="astBtn">[ AST ]</button><button class="mini" id="tokensBtn">[ TOKENS ]</button><button class="mini" id="resetBtn">[ RESET ]</button></div><div class="play"><textarea id="source" class="editor">---bila:strict---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb ds = [10, 20, 30];
ds.dayq(40);
bilb gia_tri = ds?.dof_zail ?? 0;

neub (gia_tri > 0) {
    console.log("BilaScript v3.5.0");
    console.log(tong(ds[0], ds[1]));
}</textarea><textarea id="output" class="editor" readonly placeholder="JavaScript / AST / token stream"></textarea></div><div id="console" class="card console">SYSTEM&gt; READY</div></div></section>
<section id="history"><div class="wrap"><div class="kicker">Tag lịch sử</div><h2>LỊCH SỬ NÂNG CẤP</h2><div class="timeline"><div class="event"><h3><span class="ver">v1.0.0</span> — CVNSS4.0 trên Babylscript/Rhino</h3><p class="muted">Khởi đầu bằng việc đưa vocabulary CVNSS4.0 vào cơ chế JavaScript đa ngôn ngữ của Babylscript, chứng minh khả năng thay đổi bề mặt ngôn ngữ.</p></div><div class="event"><h3><span class="ver">v1.2.0</span> — Native Bila language mode</h3><p class="muted"><code>bila</code> trở thành language mode thật trong tokenizer; bổ sung API mapping và chính sách collision parser-safe.</p></div><div class="event"><h3><span class="ver">v2.0.0</span> — JavaScript-compatible grammar</h3><p class="muted">Chuẩn hóa <code>---bila---</code>, <code>---bila:strict---</code>, <code>---bila:js---</code>; giữ punctuation/operators JavaScript và xây spec/lexical bridge.</p></div><div class="event"><h3><span class="ver">v3.0.0</span> — Native CVNSS4.0 frontend</h3><p class="muted">Tách khỏi Rhino làm frontend chính: Bila Lexer → Bila Parser → Bila AST → Semantic → JavaScript Codegen.</p></div><div class="event"><h3><span class="ver">v3.5.0</span> — Zero-cost frontend</h3><p class="muted">Semantic <code>KW_*</code> IDs, source span/map, receiver-safe aliasing, Unicode identifiers, modern structural operators, zero-runtime-helper contract và website Pascal-inspired.</p></div></div></div></section>
<section id="evaluation"><div class="wrap"><div class="kicker">Đánh giá toàn diện</div><h2>ƯU / NHƯỢC / RỦI RO</h2><div class="grid two"><div class="card"><h3 class="ok">ƯU ĐIỂM</h3><ul><li>Frontend ownership rõ ràng hơn v3.0.</li><li>Không runtime translation cho mapping 1:1.</li><li>Giảm nguy cơ phá API nhờ receiver-safe mapping.</li><li>Giữ tương thích tư duy JavaScript qua symbols/operators.</li><li>Source map và semantic IDs là nền cho LSP/type tooling.</li></ul></div><div class="card"><h3 class="warn">GIỚI HẠN</h3><ul><li>Chưa full ECMAScript/Test262.</li><li>Type inference còn nhẹ.</li><li>Template `${...}` chưa hỗ trợ.</li><li>Class/module/async-await đầy đủ chưa có.</li><li>Chưa có benchmark để công bố delta hiệu năng định lượng.</li></ul></div></div><p class="muted">Chi tiết phương pháp và threats to validity: <a href="docs/SCIENTIFIC_EVALUATION_v3.5.0.md">SCIENTIFIC_EVALUATION_v3.5.0.md</a>.</p></div></section>
<section id="license"><div class="wrap"><div class="kicker">Provenance</div><h2>GIẤY PHÉP & GHI CÔNG</h2><div class="card"><p><b>BilaScript v3 Core (`v3/`) — MIT License — Copyright © 2026 Long Ngo — phát triển dựa trên CVNSS4.0.</b></p><p class="muted">Mã lịch sử Rhino/Babylscript bên ngoài v3 giữ giấy phép upstream tương ứng. MIT của v3 Core không tự động relicensing legacy code.</p></div></div></section>
<footer><div class="wrap">BILASCRIPT_3.5 :: CVNSS4.0 FRONTEND / JAVASCRIPT BACKEND :: MIT CORE :: LONG NGO</div></footer>
<script type="module">
import {compile,lex} from './v3/src/compiler.js';
const src=document.querySelector('#source'), out=document.querySelector('#output'), con=document.querySelector('#console');
const sample=src.value;
const showErr=e=>{con.textContent='ERROR> '+e.name+': '+e.message; con.className='card console bad';};
document.querySelector('#compileBtn').onclick=()=>{try{const r=compile(src.value);out.value=r.code;con.textContent=`OK> v${r.version} | zeroCost=${r.performance.zeroCost} | resolvedMembers=${r.normalization.resolvedMembers} | warnings=${r.diagnostics.filter(x=>x.severity==='warning').length}`;con.className='card console ok';}catch(e){showErr(e)}};
document.querySelector('#astBtn').onclick=()=>{try{const r=compile(src.value,{failOnSemanticError:false});out.value=JSON.stringify(r.normalizedAst,null,2);con.textContent='OK> NORMALIZED AST';con.className='card console ok';}catch(e){showErr(e)}};
document.querySelector('#tokensBtn').onclick=()=>{try{out.value=JSON.stringify(lex(src.value).tokens,null,2);con.textContent='OK> SEMANTIC TOKENS';con.className='card console ok';}catch(e){showErr(e)}};
document.querySelector('#runBtn').onclick=()=>{try{const r=compile(src.value);out.value=r.code;const logs=[];const fake={log:(...x)=>logs.push(x.join(' '))};new Function('console',r.code)(fake);con.textContent='OUTPUT>\n'+logs.join('\n');con.className='card console ok';}catch(e){showErr(e)}};
document.querySelector('#resetBtn').onclick=()=>{src.value=sample;out.value='';con.textContent='SYSTEM> READY';con.className='card console';};
</script>
</body></html>
''')

# README: replace the v3 landing block while preserving detailed legacy history from v2 and earlier.
readme = (ROOT / "README.md").read_text(encoding="utf-8")
anchor = "## 🚀 BilaScript v2.0.0"
legacy = readme[readme.find(anchor):] if anchor in readme else readme
header = r'''# 🇻🇳 BilaScript — CVNSS4.0 Frontend / JavaScript Backend

## 🟨 BilaScript v3.5.0 — Zero-cost CVNSS4.0 Frontend

> **BilaScript không thay thế JavaScript runtime; BilaScript làm chủ cách con người viết chương trình, còn JavaScript đảm nhiệm việc chạy chương trình.**

V3.5 giữ nguyên số, ký hiệu, dấu câu và toán tử JavaScript; CVNSS4.0 là surface vocabulary. Lexer chuyển spelling thành semantic IDs (`KW_IF`, `KW_RETURN`, ...), parser tạo Bila AST, normalizer xử lý built-in alias theo receiver type, rồi codegen sinh JavaScript trực tiếp.

```text
*.bila → Bila Lexer (CVNSS4.0 → KW_*) → Bila Parser → Bila AST → Semantic → Normalize → JS Codegen + Source Map → JavaScript Runtime
```

- **Zero runtime translation:** không chèn Bila runtime translator/wrapper cho construct 1:1.
- **Receiver-safe mapping:** chỉ đổi `dayq → push`, `dof_zail → length` khi receiver được suy luận đúng loại; unknown API được giữ nguyên và cảnh báo.
- **Semantic token identity:** AST không phụ thuộc spelling JavaScript hay CVNSS4.0.
- **Source locations + source maps:** CLI `--map`.
- **Structural syntax giữ nguyên:** `=>`, `?.`, `??`, `...`, toán tử và numeric literal.
- **Unicode identifiers:** tên biến người dùng được giữ nguyên.
- **Pascal-inspired GitHub Pages:** nền xanh đậm, trắng/vàng, tối giản, có tab **Lịch sử**.

[![BilaScript v3.5 CI](https://github.com/xulytiengviet/bilascript/actions/workflows/v35-ci.yml/badge.svg?branch=Babylscript1_7R2_BRANCH)](https://github.com/xulytiengviet/bilascript/actions/workflows/v35-ci.yml)
[![Release v3.5.0](https://img.shields.io/badge/release-v3.5.0-blue)](https://github.com/xulytiengviet/bilascript/releases/tag/v3.5.0)
![Frontend](https://img.shields.io/badge/frontend-Bila%20owned-0b63ce)
![Backend](https://img.shields.io/badge/backend-JavaScript-f7df1e)
![License](https://img.shields.io/badge/v3%20Core-MIT-success)

### Lịch sử kiến trúc

| Phiên bản | Cải tiến chính |
|---|---|
| v1.0.0 | CVNSS4.0 vocabulary trên Babylscript/Rhino. |
| v1.2.0 | Native `bila` language mode trong tokenizer. |
| v2.0.0 | Ba profile + JavaScript-compatible grammar/spec/tooling. |
| v3.0.0 | Native Bila Lexer/Parser/AST/Semantic + JS backend. |
| **v3.5.0** | **Semantic IDs, receiver-safe aliases, source maps, zero-cost contract, modern structural operators, Pascal-inspired site.** |

Tài liệu: `docs/BILASCRIPT_v3.5.0.md` · đánh giá: `docs/SCIENTIFIC_EVALUATION_v3.5.0.md` · performance contract: `v3/PERFORMANCE_CONTRACT.md` · website: https://xulytiengviet.github.io/bilascript/

### Giấy phép

**BilaScript v3 Core (`v3/`) — MIT License — Copyright © 2026 Long Ngo — phát triển dựa trên CVNSS4.0.** Các file lịch sử Rhino/Babylscript bên ngoài `v3/` giữ license upstream tương ứng.

---

## 🧠 BilaScript v3.0.0 — Native CVNSS4.0 Frontend (lịch sử)

V3.0 là mốc tách frontend khỏi Rhino/Babylscript: BilaScript bắt đầu sở hữu lexer, parser, AST và semantic diagnostics; JavaScript trở thành backend sinh mã. V3.5 kế thừa và làm cứng ranh giới này bằng semantic IDs, normalizer và zero-cost performance contract.

---

'''
(ROOT / "README.md").write_text(header + legacy, encoding="utf-8")
print("write README.md")
