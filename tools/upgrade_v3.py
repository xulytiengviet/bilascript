from pathlib import Path
from textwrap import dedent
import json

ROOT = Path(__file__).resolve().parents[1]

def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(dedent(content).lstrip("\n"), encoding="utf-8")
    print("write", path)

write("v3/package.json", r'''
{
  "name": "@bilascript/core",
  "version": "3.0.0",
  "description": "BilaScript v3 native CVNSS4.0 frontend with JavaScript backend",
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
/** BilaScript v3 canonical vocabulary. MIT License. Copyright (c) 2026 Long Ngo. */
export const KEYWORDS = Object.freeze({
  haml_sob: "function",
  bilb: "var",
  neub: "if",
  kac: "else",
  vil: "for",
  trogp_ki: "while",
  trov_ved: "return",
  moix: "new",
  voy_jaj_trir: "null",
  thatf: "true",
  sai: "false",
  thuv: "try",
  chupr_layb: "catch",
  nemj: "throw",
  cujb_cugl: "finally",
  laml: "do",
  zugk: "break",
  tifb_tucr: "continue"
});

export const ENGLISH_KEYWORDS = new Set([
  "function", "var", "if", "else", "for", "while", "return", "new",
  "null", "true", "false", "try", "catch", "throw", "finally", "do",
  "break", "continue", "typeof", "void", "delete", "in", "instanceof"
]);

export const GLOBALS = Object.freeze({
  Magz: "Array",
  Suh_vatf: "Object",
  Haml_sob: "Function",
  Wayl: "Date",
  mony_Tolj: "Math",
  Chujg: "String",
  Sob: "Number",
  Lalf_lij: "Boolean"
});

export const MEMBERS = Object.freeze({
  dof_zail: "length",
  dayq: "push",
  layb_cujb: "pop",
  sapx_xepb: "sort",
  daoz_wush: "reverse",
  ahj_xar: "map",
  locr: "filter",
  cho_moig: "forEach",
  motf_vail: "some",
  takj: "split",
  chujg_con: "substring",
  kopx: "match",
  timl_civb: "search",
  thay_theb: "replace",
  denb_chujg: "toString",
  goir: "call",
  ap_zugr: "apply",
  waug_nhily: "random",
  laml_tronl: "round",
  cano_bacf_hai: "sqrt",
  jaj_trir_tydf_doib: "abs",
  trand: "ceil",
  sanl: "floor",
  lys_thuak: "pow"
});

export function keywordOf(word, mode = "bila") {
  if (Object.prototype.hasOwnProperty.call(KEYWORDS, word)) return KEYWORDS[word];
  if (mode !== "strict" && ENGLISH_KEYWORDS.has(word)) return word;
  return null;
}
''')

write("v3/src/lexer.js", r'''
import { keywordOf } from "./vocabulary.js";

const OPS = ["===", "!==", ">>>", "**=", "=>", "==", "!=", "<=", ">=", "++", "--", "+=", "-=", "*=", "/=", "%=", "&&", "||", "**", "<<", ">>", "&=", "|=", "^="];
const ONE = new Set("{}()[];,.?:+-*/%<>=!&|^~");

export class BilaSyntaxError extends SyntaxError {
  constructor(message, token) {
    super(`${message}${token ? ` tại dòng ${token.line}, cột ${token.column}` : ""}`);
    this.name = "BilaSyntaxError";
    this.token = token || null;
  }
}

export function detectProfile(source) {
  const re = /^\uFEFF?\s*---(?:bila(?::(strict|js))?|cvss|cvnss|cvnss40|cvnss4)---\s*(?:\r?\n|$)/;
  const m = source.match(re);
  if (!m) return { mode: "bila", source, directive: null };
  return { mode: m[1] || "bila", source: source.slice(m[0].length), directive: m[0].trim() };
}

export function lex(input) {
  const profile = detectProfile(String(input));
  const source = profile.source;
  const tokens = [];
  let i = 0, line = 1, column = 1;

  const peek = (n = 0) => source[i + n] || "";
  const advance = () => {
    const ch = source[i++] || "";
    if (ch === "\n") { line++; column = 1; } else column++;
    return ch;
  };
  const add = (type, value, raw, startLine, startColumn) => tokens.push({ type, value, raw, line: startLine, column: startColumn });

  while (i < source.length) {
    const ch = peek();
    if (/\s/.test(ch)) { advance(); continue; }
    if (ch === "/" && peek(1) === "/") { while (i < source.length && advance() !== "\n") {} continue; }
    if (ch === "/" && peek(1) === "*") {
      advance(); advance();
      while (i < source.length && !(peek() === "*" && peek(1) === "/")) advance();
      if (i >= source.length) throw new BilaSyntaxError("Comment chưa đóng", { line, column });
      advance(); advance(); continue;
    }

    const sl = line, sc = column;
    if (/[A-Za-z_$]/.test(ch)) {
      let raw = advance();
      while (/[A-Za-z0-9_$]/.test(peek())) raw += advance();
      const kw = keywordOf(raw, profile.mode);
      add(kw ? "keyword" : "identifier", kw || raw, raw, sl, sc);
      continue;
    }

    if (/\d/.test(ch) || (ch === "." && /\d/.test(peek(1)))) {
      let raw = "";
      if (ch === "0" && /[xX]/.test(peek(1))) {
        raw += advance() + advance(); while (/[0-9A-Fa-f]/.test(peek())) raw += advance();
      } else {
        while (/\d/.test(peek())) raw += advance();
        if (peek() === ".") { raw += advance(); while (/\d/.test(peek())) raw += advance(); }
        if (/[eE]/.test(peek())) { raw += advance(); if (/[+-]/.test(peek())) raw += advance(); while (/\d/.test(peek())) raw += advance(); }
      }
      add("number", Number(raw), raw, sl, sc); continue;
    }

    if (ch === "'" || ch === '"') {
      const quote = advance(); let value = "", raw = quote, closed = false;
      while (i < source.length) {
        const c = advance(); raw += c;
        if (c === quote) { closed = true; break; }
        if (c === "\\") {
          const e = advance(); raw += e;
          const map = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" };
          value += map[e] ?? e;
        } else value += c;
      }
      if (!closed) throw new BilaSyntaxError("Chuỗi chưa đóng", { line: sl, column: sc });
      add("string", value, raw, sl, sc); continue;
    }

    let op = OPS.find(x => source.startsWith(x, i));
    if (op) { for (let k = 0; k < op.length; k++) advance(); add("punctuator", op, op, sl, sc); continue; }
    if (ONE.has(ch)) { advance(); add("punctuator", ch, ch, sl, sc); continue; }
    throw new BilaSyntaxError(`Ký tự không hợp lệ '${ch}'`, { line: sl, column: sc });
  }
  tokens.push({ type: "eof", value: "<eof>", raw: "", line, column });
  return { mode: profile.mode, directive: profile.directive, tokens };
}
''')

write("v3/src/parser.js", r'''
import { lex, BilaSyntaxError } from "./lexer.js";

const PRECEDENCE = { "||":1, "&&":2, "|":3, "^":4, "&":5, "==":6, "!=":6, "===":6, "!==":6, "<":7, ">":7, "<=":7, ">=":7, "in":7, "instanceof":7, "<<":8, ">>":8, ">>>":8, "+":9, "-":9, "*":10, "/":10, "%":10, "**":11 };
const ASSIGN = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "**="]);
const UNARY = new Set(["!", "+", "-", "~", "typeof", "void", "delete"]);

export class Parser {
  constructor(source) {
    const out = lex(source);
    this.mode = out.mode;
    this.directive = out.directive;
    this.tokens = out.tokens;
    this.i = 0;
  }
  cur() { return this.tokens[this.i]; }
  next() { return this.tokens[this.i++]; }
  at(value) { return this.cur().value === value; }
  eat(value) { if (this.at(value)) { this.next(); return true; } return false; }
  expect(value, message = `Mong đợi '${value}'`) { if (!this.at(value)) throw new BilaSyntaxError(message, this.cur()); return this.next(); }
  expectIdentifier() { const t=this.cur(); if (t.type !== "identifier") throw new BilaSyntaxError("Mong đợi định danh", t); this.next(); return {type:"Identifier", name:t.value, loc:{line:t.line,column:t.column}}; }

  parseProgram() {
    const body=[]; while (this.cur().type !== "eof") body.push(this.parseStatement());
    return { type:"Program", sourceType:"script", bilaMode:this.mode, directive:this.directive, body };
  }
  parseStatement() {
    const t=this.cur();
    if (this.eat(";")) return {type:"EmptyStatement"};
    if (this.at("{")) return this.parseBlock();
    if (t.type === "keyword") {
      switch(t.value) {
        case "var": return this.parseVariableStatement(true);
        case "function": return this.parseFunctionDeclaration();
        case "if": return this.parseIf();
        case "while": return this.parseWhile();
        case "do": return this.parseDoWhile();
        case "for": return this.parseFor();
        case "return": return this.parseReturn();
        case "break": this.next(); this.eat(";"); return {type:"BreakStatement", loc:{line:t.line,column:t.column}};
        case "continue": this.next(); this.eat(";"); return {type:"ContinueStatement", loc:{line:t.line,column:t.column}};
        case "throw": return this.parseThrow();
        case "try": return this.parseTry();
      }
    }
    const expression=this.parseExpression(); this.eat(";"); return {type:"ExpressionStatement", expression};
  }
  parseBlock() { this.expect("{"); const body=[]; while(!this.at("}")) { if(this.cur().type==="eof") throw new BilaSyntaxError("Khối lệnh chưa đóng",this.cur()); body.push(this.parseStatement()); } this.expect("}"); return {type:"BlockStatement",body}; }
  parseVariableStatement(withSemicolon=true) { this.expect("var"); const declarations=[]; do { const id=this.expectIdentifier(); let init=null; if(this.eat("=")) init=this.parseExpression(); declarations.push({type:"VariableDeclarator",id,init}); } while(this.eat(",")); if(withSemicolon) this.eat(";"); return {type:"VariableDeclaration",kind:"var",declarations}; }
  parseFunctionDeclaration() { const start=this.expect("function"); const id=this.expectIdentifier(); this.expect("("); const params=[]; if(!this.at(")")) { do params.push(this.expectIdentifier()); while(this.eat(",")); } this.expect(")"); const body=this.parseBlock(); return {type:"FunctionDeclaration",id,params,body,loc:{line:start.line,column:start.column}}; }
  parseIf() { this.expect("if"); this.expect("("); const test=this.parseExpression(); this.expect(")"); const consequent=this.parseStatement(); let alternate=null; if(this.eat("else")) alternate=this.parseStatement(); return {type:"IfStatement",test,consequent,alternate}; }
  parseWhile() { this.expect("while"); this.expect("("); const test=this.parseExpression(); this.expect(")"); return {type:"WhileStatement",test,body:this.parseStatement()}; }
  parseDoWhile() { this.expect("do"); const body=this.parseStatement(); this.expect("while"); this.expect("("); const test=this.parseExpression(); this.expect(")"); this.eat(";"); return {type:"DoWhileStatement",body,test}; }
  parseFor() { this.expect("for"); this.expect("("); let init=null,test=null,update=null; if(!this.at(";")) init=this.at("var")?this.parseVariableStatement(false):this.parseExpression(); this.expect(";"); if(!this.at(";")) test=this.parseExpression(); this.expect(";"); if(!this.at(")")) update=this.parseExpression(); this.expect(")"); return {type:"ForStatement",init,test,update,body:this.parseStatement()}; }
  parseReturn() { const t=this.expect("return"); let argument=null; if(!this.at(";") && !this.at("}") && this.cur().type!=="eof") argument=this.parseExpression(); this.eat(";"); return {type:"ReturnStatement",argument,loc:{line:t.line,column:t.column}}; }
  parseThrow() { const t=this.expect("throw"); const argument=this.parseExpression(); this.eat(";"); return {type:"ThrowStatement",argument,loc:{line:t.line,column:t.column}}; }
  parseTry() { this.expect("try"); const block=this.parseBlock(); let handler=null,finalizer=null; if(this.eat("catch")) { this.expect("("); const param=this.expectIdentifier(); this.expect(")"); handler={type:"CatchClause",param,body:this.parseBlock()}; } if(this.eat("finally")) finalizer=this.parseBlock(); if(!handler&&!finalizer) throw new BilaSyntaxError("try cần catch hoặc finally",this.cur()); return {type:"TryStatement",block,handler,finalizer}; }

  parseExpression() { return this.parseAssignment(); }
  parseAssignment() { let left=this.parseConditional(); if(ASSIGN.has(this.cur().value)) { const operator=this.next().value; const right=this.parseAssignment(); return {type:"AssignmentExpression",operator,left,right}; } return left; }
  parseConditional() { let test=this.parseBinary(1); if(this.eat("?")) { const consequent=this.parseExpression(); this.expect(":"); const alternate=this.parseAssignment(); return {type:"ConditionalExpression",test,consequent,alternate}; } return test; }
  parseBinary(minPrec) { let left=this.parseUnary(); while(true) { const op=this.cur().value, prec=PRECEDENCE[op]||0; if(prec<minPrec) break; this.next(); const right=this.parseBinary(op==="**"?prec:prec+1); left={type:(op==="&&"||op==="||")?"LogicalExpression":"BinaryExpression",operator:op,left,right}; } return left; }
  parseUnary() { const t=this.cur(); if((t.type==="punctuator"||t.type==="keyword") && UNARY.has(t.value)) { this.next(); return {type:"UnaryExpression",operator:t.value,prefix:true,argument:this.parseUnary()}; } if(t.type==="keyword"&&t.value==="new") { this.next(); const callee=this.parsePostfix(this.parsePrimary()); let args=[]; if(callee.type==="CallExpression") return {type:"NewExpression",callee:callee.callee,arguments:callee.arguments}; if(this.eat("(")) { args=this.parseArgumentsAfterOpen(); } return {type:"NewExpression",callee,arguments:args}; } return this.parsePostfix(this.parsePrimary()); }
  parsePostfix(expr) { while(true) { if(this.eat("(")) { expr={type:"CallExpression",callee:expr,arguments:this.parseArgumentsAfterOpen()}; continue; } if(this.eat(".")) { const p=this.expectIdentifier(); expr={type:"MemberExpression",object:expr,property:p,computed:false}; continue; } if(this.eat("[")) { const property=this.parseExpression(); this.expect("]"); expr={type:"MemberExpression",object:expr,property,computed:true}; continue; } if(this.at("++")||this.at("--")) { const operator=this.next().value; expr={type:"UpdateExpression",operator,argument:expr,prefix:false}; continue; } break; } return expr; }
  parseArgumentsAfterOpen() { const args=[]; if(!this.at(")")) { do args.push(this.parseExpression()); while(this.eat(",")); } this.expect(")"); return args; }
  parsePrimary() {
    const t=this.cur();
    if(t.type==="number") { this.next(); return {type:"Literal",value:t.value,raw:t.raw}; }
    if(t.type==="string") { this.next(); return {type:"Literal",value:t.value,raw:t.raw}; }
    if(t.type==="keyword"&&(t.value==="true"||t.value==="false"||t.value==="null")) { this.next(); return {type:"Literal",value:t.value==="null"?null:t.value==="true",raw:t.raw}; }
    if(t.type==="identifier") { this.next(); return {type:"Identifier",name:t.value,loc:{line:t.line,column:t.column}}; }
    if(this.eat("(")) { const e=this.parseExpression(); this.expect(")"); return e; }
    if(this.eat("[")) { const elements=[]; if(!this.at("]")) { do elements.push(this.parseExpression()); while(this.eat(",")); } this.expect("]"); return {type:"ArrayExpression",elements}; }
    if(this.eat("{")) { const properties=[]; if(!this.at("}")) { do { const k=this.cur(); let key; if(k.type==="identifier") key=this.expectIdentifier(); else if(k.type==="string"||k.type==="number") { this.next(); key={type:"Literal",value:k.value,raw:k.raw}; } else throw new BilaSyntaxError("Khóa object không hợp lệ",k); this.expect(":"); properties.push({type:"Property",key,value:this.parseExpression(),kind:"init",computed:false}); } while(this.eat(",")); } this.expect("}"); return {type:"ObjectExpression",properties}; }
    throw new BilaSyntaxError(`Biểu thức không hợp lệ gần '${t.raw||t.value}'`,t);
  }
}

export function parse(source) { const p=new Parser(source); const ast=p.parseProgram(); return {ast,mode:p.mode,directive:p.directive}; }
''')

write("v3/src/semantic.js", r'''
export function analyze(ast) {
  const diagnostics=[];
  const error=(node,code,message)=>diagnostics.push({severity:"error",code,message,line:node?.loc?.line||null,column:node?.loc?.column||null});
  function visit(node,ctx={functionDepth:0,loopDepth:0}) {
    if(!node||typeof node!=="object") return;
    switch(node.type) {
      case "FunctionDeclaration": {
        const seen=new Set(); for(const p of node.params){ if(seen.has(p.name)) error(p,"BILA-S101",`Tham số trùng '${p.name}'`); seen.add(p.name); }
        visit(node.body,{...ctx,functionDepth:ctx.functionDepth+1}); return;
      }
      case "ReturnStatement": if(ctx.functionDepth===0) error(node,"BILA-S201","trov_ved/return chỉ hợp lệ bên trong hàm"); break;
      case "BreakStatement": if(ctx.loopDepth===0) error(node,"BILA-S202","zugk/break chỉ hợp lệ bên trong vòng lặp"); return;
      case "ContinueStatement": if(ctx.loopDepth===0) error(node,"BILA-S203","tifb_tucr/continue chỉ hợp lệ bên trong vòng lặp"); return;
      case "WhileStatement": case "DoWhileStatement": case "ForStatement":
        for(const k of Object.keys(node)) if(k!=="type") { const v=node[k]; if(k==="body") visit(v,{...ctx,loopDepth:ctx.loopDepth+1}); else visitAny(v,ctx); } return;
    }
    for(const [k,v] of Object.entries(node)) if(k!=="type"&&k!=="loc") visitAny(v,ctx);
  }
  function visitAny(v,ctx){ if(Array.isArray(v)) v.forEach(x=>visit(x,ctx)); else visit(v,ctx); }
  visit(ast);
  return diagnostics;
}
''')

write("v3/src/codegen-js.js", r'''
import { GLOBALS, MEMBERS } from "./vocabulary.js";
const g = n => GLOBALS[n] || n;
const m = n => MEMBERS[n] || n;

export function generate(ast) {
  const out=[]; let level=0;
  const ind=()=>"  ".repeat(level);
  const emit=s=>out.push(s);
  function stmt(n){
    switch(n.type){
      case "EmptyStatement": emit(ind()+";\n"); break;
      case "BlockStatement": emit("{\n"); level++; n.body.forEach(stmt); level--; emit(ind()+"}"); break;
      case "VariableDeclaration": emit(ind()+"var "+n.declarations.map(d=>expr(d.id)+(d.init?" = "+expr(d.init):"")).join(", ")+";\n"); break;
      case "FunctionDeclaration": emit(ind()+`function ${expr(n.id)}(${n.params.map(expr).join(", ")}) `); stmt(n.body); emit("\n"); break;
      case "IfStatement": emit(ind()+`if (${expr(n.test)}) `); stmt(n.consequent); if(n.alternate){ emit(" else "); stmt(n.alternate); } emit("\n"); break;
      case "WhileStatement": emit(ind()+`while (${expr(n.test)}) `); stmt(n.body); emit("\n"); break;
      case "DoWhileStatement": emit(ind()+"do "); stmt(n.body); emit(` while (${expr(n.test)});\n`); break;
      case "ForStatement": { const init=n.init?(n.init.type==="VariableDeclaration"?"var "+n.init.declarations.map(d=>expr(d.id)+(d.init?" = "+expr(d.init):"")).join(", "):expr(n.init)):""; emit(ind()+`for (${init}; ${n.test?expr(n.test):""}; ${n.update?expr(n.update):""}) `); stmt(n.body); emit("\n"); break; }
      case "ReturnStatement": emit(ind()+"return"+(n.argument?" "+expr(n.argument):"")+";\n"); break;
      case "BreakStatement": emit(ind()+"break;\n"); break;
      case "ContinueStatement": emit(ind()+"continue;\n"); break;
      case "ThrowStatement": emit(ind()+"throw "+expr(n.argument)+";\n"); break;
      case "TryStatement": emit(ind()+"try "); stmt(n.block); if(n.handler){ emit(` catch (${expr(n.handler.param)}) `); stmt(n.handler.body); } if(n.finalizer){ emit(" finally "); stmt(n.finalizer); } emit("\n"); break;
      case "ExpressionStatement": emit(ind()+expr(n.expression)+";\n"); break;
      default: throw new Error(`Codegen chưa hỗ trợ statement ${n.type}`);
    }
  }
  function expr(n){
    switch(n.type){
      case "Identifier": return g(n.name);
      case "Literal": return typeof n.value==="string"?JSON.stringify(n.value):n.value===null?"null":String(n.value);
      case "ArrayExpression": return "["+n.elements.map(expr).join(", ")+"]";
      case "ObjectExpression": return "{"+n.properties.map(p=>{const k=p.key.type==="Identifier"?p.key.name:JSON.stringify(p.key.value); return `${k}: ${expr(p.value)}`;}).join(", ")+"}";
      case "UnaryExpression": return (/[A-Za-z]/.test(n.operator)?n.operator+" ":n.operator)+expr(n.argument);
      case "UpdateExpression": return n.prefix?n.operator+expr(n.argument):expr(n.argument)+n.operator;
      case "BinaryExpression": case "LogicalExpression": return `(${expr(n.left)} ${n.operator} ${expr(n.right)})`;
      case "AssignmentExpression": return `${expr(n.left)} ${n.operator} ${expr(n.right)}`;
      case "ConditionalExpression": return `(${expr(n.test)} ? ${expr(n.consequent)} : ${expr(n.alternate)})`;
      case "CallExpression": return `${expr(n.callee)}(${n.arguments.map(expr).join(", ")})`;
      case "NewExpression": return `new ${expr(n.callee)}(${n.arguments.map(expr).join(", ")})`;
      case "MemberExpression": return n.computed?`${expr(n.object)}[${expr(n.property)}]`:`${expr(n.object)}.${m(n.property.name)}`;
      default: throw new Error(`Codegen chưa hỗ trợ expression ${n.type}`);
    }
  }
  ast.body.forEach(stmt); return out.join("").trimEnd()+"\n";
}
''')

write("v3/src/compiler.js", r'''
import { parse } from "./parser.js";
import { analyze } from "./semantic.js";
import { generate } from "./codegen-js.js";

export function compile(source, options={}) {
  const parsed=parse(source);
  const diagnostics=analyze(parsed.ast);
  const errors=diagnostics.filter(x=>x.severity==="error");
  if(options.failOnSemanticError!==false && errors.length){
    const e=new Error(errors.map(x=>`${x.code}: ${x.message}`).join("\n")); e.name="BilaSemanticError"; e.diagnostics=diagnostics; throw e;
  }
  return {version:"3.0.0",backend:"javascript",mode:parsed.mode,ast:parsed.ast,diagnostics,code:generate(parsed.ast)};
}
export { parse } from "./parser.js";
export { lex } from "./lexer.js";
export { analyze } from "./semantic.js";
export { generate } from "./codegen-js.js";
''')

write("v3/bin/bila.js", r'''#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { compile, parse } from "../src/compiler.js";

const [cmd,file,...rest]=process.argv.slice(2);
const usage=()=>console.log(`BilaScript v3.0.0\n\n  bila compile <file.bila> [-o out.js]\n  bila run <file.bila>\n  bila ast <file.bila>\n  bila check <file.bila>`);
if(!cmd||!file){usage();process.exit(cmd?1:0)}
const src=fs.readFileSync(file,"utf8");
try{
  if(cmd==="compile"){
    const r=compile(src); const oi=rest.indexOf("-o"); if(oi>=0&&rest[oi+1]) fs.writeFileSync(rest[oi+1],r.code); else process.stdout.write(r.code);
  } else if(cmd==="run"){
    const r=compile(src); const x=spawnSync(process.execPath,["-e",r.code],{stdio:"inherit"}); process.exit(x.status??1);
  } else if(cmd==="ast") console.log(JSON.stringify(parse(src).ast,null,2));
  else if(cmd==="check") { const r=compile(src); console.log(`OK BilaScript v${r.version} | mode=${r.mode} | backend=${r.backend}`); }
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

test("native frontend: strict CVNSS4.0 -> AST -> JavaScript",()=>{
  const r=compile(strictSource);
  assert.equal(r.mode,"strict");
  assert.equal(r.ast.type,"Program");
  assert.match(r.code,/function tong/);
  assert.match(r.code,/new Array/);
  assert.match(r.code,/\.push\(40\)/);
  assert.match(r.code,/\.length/);
  const logs=[]; vm.runInNewContext(r.code,{console:{log:x=>logs.push(String(x))}});
  assert.deepEqual(logs,["30","4"]);
});

test("strict profile rejects English keyword surface",()=>{
  assert.throws(()=>compile("---bila:strict---\nfunction x(){ return 1; }"));
});

test("default profile accepts English compatibility",()=>{
  const r=compile("---bila---\nfunction x(){ return 7; } console.log(x());");
  const logs=[]; vm.runInNewContext(r.code,{console:{log:x=>logs.push(String(x))}});
  assert.deepEqual(logs,["7"]);
});

test("semantic analyzer rejects top-level return",()=>{
  assert.throws(()=>compile("---bila:strict---\ntrov_ved 1;"),/BILA-S201/);
});

test("lexer owns Bila tokens before JavaScript backend",()=>{
  const r=lex("---bila:strict---\nneub (thatf) { bilb x = 1; }");
  assert.equal(r.mode,"strict");
  assert.deepEqual(r.tokens.filter(t=>t.type==="keyword").map(t=>t.value),["if","true","var"]);
});

test("AST is backend-neutral semantic structure",()=>{
  const {ast}=parse("---bila:strict---\nhaml_sob f(a){ trov_ved a * 2; }");
  assert.equal(ast.body[0].type,"FunctionDeclaration");
  assert.equal(ast.body[0].body.body[0].type,"ReturnStatement");
  assert.equal(ast.body[0].body.body[0].argument.type,"BinaryExpression");
});
''')

write("v3/examples/hello.bila", r'''
---bila:strict---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb ds = moix Magz(10, 20, 30);
ds.dayq(40);

neub (ds.dof_zail > 0) {
    console.log("BilaScript v3.0.0");
    console.log(tong(ds[0], ds[1]));
    console.log("Độ dài:", ds.dof_zail);
}
''')

write("v3/LICENSE", r'''
MIT License

Copyright (c) 2026 Long Ngo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
''')

write("LICENSE-v3-MIT", r'''
BilaScript v3 Core License
==========================

The new source code under `v3/` is licensed under the MIT License:

MIT License
Copyright (c) 2026 Long Ngo

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies,
and to permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

IMPORTANT: historical Rhino/Babylscript-derived files outside `v3/` retain
their upstream license notices and are not relicensed merely by this file.
''')

write("v3/README.md", r'''
# BilaScript v3 Core

**BilaScript v3.0.0** là frontend ngôn ngữ CVNSS4.0 độc lập ở mức compiler core: Bila tự sở hữu lexer, parser, AST, semantic diagnostics và JavaScript code generator. JavaScript được dùng như **backend thực thi**, không còn là nơi định nghĩa vocabulary/grammar bề mặt của Bila.

```text
*.bila
  ↓
Bila Lexer
  ↓
Bila Parser
  ↓
Bila AST
  ↓
Semantic Analyzer
  ↓
JavaScript Codegen
  ↓
Browser / Node.js / Bun / JS runtime
```

## Chạy

```bash
cd v3
npm test
node bin/bila.js run examples/hello.bila
node bin/bila.js compile examples/hello.bila -o hello.js
node bin/bila.js ast examples/hello.bila
```

## Phạm vi v3.0 Core

Frontend hiện hỗ trợ một tập lõi JavaScript-compatible: biến, hàm, block, `if/else`, `for`, `while`, `do/while`, `return`, `break`, `continue`, `try/catch/finally`, `throw`, array/object literal, call, member access, `new`, toán tử unary/binary/assignment/conditional và canonical built-in/member CVNSS4.0.

Đây **không phải full ECMAScript 2026 parser**. `class`, module ESM, template literal, destructuring, generator, async/await và nhiều cú pháp ESNext là roadmap sau v3.0.

## License và ghi công

BilaScript v3 Core: **MIT License** — Copyright © 2026 **Long Ngo**. Dự án được phát triển dựa trên hệ chữ **CVNSS4.0**. Các file lịch sử Rhino/Babylscript bên ngoài `v3/` tiếp tục tuân thủ giấy phép upstream tương ứng.
''')

write("docs/BILASCRIPT_v3.0.0.md", r'''
# BilaScript v3.0.0 — Native CVNSS4.0 Frontend / JavaScript Backend

## Tóm tắt
BilaScript v3 chuyển ranh giới sở hữu công nghệ: thay vì để Rhino/Babylscript quyết định toàn bộ quá trình phân tích cú pháp, v3 có frontend riêng gồm lexer, parser, AST và semantic analyzer. JavaScript chỉ còn là backend đầu tiên.

## Bản chất
BilaScript không phải một VM JavaScript mới. V3 là một **source language + compiler frontend** có bề mặt CVNSS4.0 và cấu trúc JavaScript-compatible. Nó hạ AST Bila sang JavaScript để tận dụng browser/Node/Bun.

## Kiến trúc
```text
Bila source
  ↓ lexical analysis
Bila tokens
  ↓ parsing
Bila AST
  ↓ semantic analysis
Validated Bila AST
  ↓ JavaScript code generation
ECMAScript source
  ↓
Browser / Node / Bun
```

## Tại sao quan trọng
1. AST không phụ thuộc spelling `neub` hay `if`; nó mang `IfStatement`.
2. Backend có thể thay mà không đổi source Bila.
3. Diagnostics thuộc Bila, không phụ thuộc thông báo lỗi Rhino.
4. CVNSS4.0 trở thành lexical/semantic contract của frontend.
5. Legacy Rhino có thể tiếp tục tồn tại như compatibility runtime, nhưng không còn là kiến trúc duy nhất.

## Phạm vi đã triển khai trong 3.0.0
Một core JavaScript-compatible có thể chạy thực tế: declarations, functions, control flow cơ bản, exceptions, arrays/objects, calls/member access, new, expression precedence, semantic diagnostics và JS codegen. Full ESNext chưa phải phạm vi v3.0.0.

## Ghi công
BilaScript v3 Core được phát triển bởi **Long Ngo**, dựa trên **CVNSS4.0**, phát hành theo **MIT License** cho phần mã mới trong `v3/`. Di sản Rhino/Babylscript giữ giấy phép upstream.
''')

write("docs/SCIENTIFIC_EVALUATION_v3.0.0.md", r'''
# Đánh giá kỹ thuật BilaScript v3.0.0 theo cấu trúc bài báo khoa học

## Tóm tắt
BilaScript v3 nghiên cứu khả năng xây dựng một frontend ngôn ngữ lập trình CVNSS4.0 có cú pháp quen thuộc với JavaScript nhưng không phụ thuộc vào tokenizer/parser của JavaScript runtime lịch sử. Thiết kế tách frontend khỏi backend: source Bila được phân tích thành AST riêng rồi sinh JavaScript. Mục tiêu là tăng quyền làm chủ ngôn ngữ mà vẫn duy trì khả năng chạy trên hệ sinh thái JavaScript.

## Câu hỏi nghiên cứu
**RQ1:** Có thể tách vocabulary CVNSS4.0 khỏi JavaScript runtime nhưng giữ mô hình cú pháp quen thuộc không?  
**RQ2:** AST trung gian có giảm coupling với Rhino/Babylscript không?  
**RQ3:** JavaScript có thể đóng vai trò backend mà không quyết định bề mặt ngôn ngữ Bila không?

## Phương pháp
V3 triển khai lexer riêng, recursive-descent/precedence parser, AST backend-neutral, semantic analyzer và JavaScript code generator. Kiểm thử xác nhận: strict CVNSS4.0, English compatibility ở mode mặc định, AST shape, semantic error và thực thi output bằng Node VM.

## Kết quả định tính
- **Tăng mức làm chủ:** vocabulary, tokenization, parsing, AST và diagnostics nằm trong `v3/`.
- **Giảm phụ thuộc Rhino:** JavaScript backend không cần Rhino để xác định grammar core mới.
- **Khả năng di động:** output JavaScript có thể chuyển tới nhiều runtime JS.
- **Tính kiểm toán:** compiler stages tách biệt, dễ unit test hơn search/replace.

Không báo cáo con số hiệu năng hoặc mức tương thích ESNext giả định vì v3.0.0 chưa có benchmark/conformance corpus đủ lớn.

## Ưu điểm
1. Kiến trúc compiler chuẩn hơn: lexer → parser → AST → semantic → codegen.
2. JavaScript-compatible syntax làm giảm chi phí học.
3. Strict mode bảo vệ canonical CVNSS4.0.
4. Backend JS tận dụng browser/Node/Bun và thư viện hiện có.
5. Core mới nhỏ, dễ kiểm thử, MIT và có provenance rõ.

## Nhược điểm
1. Parser v3.0 mới bao phủ core subset, chưa phải full ECMAScript.
2. JavaScript backend khiến semantics cuối cùng vẫn chịu giới hạn runtime JS đích.
3. Source map, debugger protocol, formatter/LSP chưa đầy đủ.
4. Mapping built-in có thể tạo collision với identifier nếu specification chưa reserve rõ.
5. Chưa có type system tĩnh hay optimizer IR.

## Đe dọa tới tính hợp lệ
- Test hiện là smoke/unit tests, chưa phải Test262-equivalent conformance.
- Đánh giá hiện chủ yếu chức năng/kiến trúc, không phải benchmark hiệu năng.
- Vocabulary CVNSS4.0 cần tiếp tục audit collision/canonicalization.
- Tính dễ học cần nghiên cứu người dùng thực nghiệm, chưa thể kết luận từ code alone.

## Roadmap nghiên cứu
v3.1: source maps + formatter + richer diagnostics.  
v3.2: module/class/arrow/template literals.  
v3.5: TypeScript-like optional types + LSP.  
v4: Bila IR ổn định và backend WebAssembly thử nghiệm.

## Kết luận
V3 chứng minh bước chuyển kiến trúc từ “localized JavaScript runtime mode” sang “CVNSS4.0 language frontend with JavaScript backend”. Giá trị chính không nằm ở việc loại JavaScript, mà ở việc kiểm soát ranh giới compiler trước khi hạ xuống JavaScript.
''')

write("index.html", r'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BilaScript v3.0 — CVNSS4.0 Language Frontend</title>
<meta name="description" content="BilaScript v3: frontend ngôn ngữ CVNSS4.0 riêng, JavaScript là backend thực thi. MIT, phát triển bởi Long Ngo.">
<style>
:root{--bg:#07111f;--panel:#0d1b2a;--panel2:#10243a;--text:#eaf2ff;--muted:#9fb2c8;--line:#203951;--accent:#59a5ff;--accent2:#70e1c8;--warn:#ffcc66;--bad:#ff7b86;--good:#7ee787;--max:1180px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 15% 0,#102946 0,transparent 35%),var(--bg);color:var(--text);font:16px/1.7 Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}a{color:#8fc5ff;text-decoration:none}a:hover{text-decoration:underline}.wrap{width:min(var(--max),calc(100% - 32px));margin:auto}.nav{position:sticky;top:0;z-index:20;background:#07111fdd;backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.navin{height:64px;display:flex;align-items:center;gap:20px}.brand{font-weight:900;letter-spacing:-.03em;font-size:20px}.brand b{color:var(--accent2)}.links{margin-left:auto;display:flex;gap:18px;font-size:14px}.hero{padding:86px 0 58px}.badge{display:inline-flex;border:1px solid #2c577e;border-radius:999px;padding:6px 11px;color:#b8d9ff;background:#0c2137;font-size:13px}.hero h1{font-size:clamp(42px,8vw,82px);line-height:.98;letter-spacing:-.06em;margin:20px 0}.hero h1 span{background:linear-gradient(90deg,var(--accent),var(--accent2));background-clip:text;color:transparent}.lead{font-size:20px;color:#bed0e4;max-width:830px}.actions{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0}.btn{display:inline-block;padding:11px 16px;border-radius:10px;background:var(--accent);color:#04111d;font-weight:800}.btn.secondary{background:transparent;color:var(--text);border:1px solid var(--line)}.stats,.grid{display:grid;gap:14px}.stats{grid-template-columns:repeat(4,1fr);margin-top:40px}.stat,.card{border:1px solid var(--line);background:linear-gradient(180deg,#0e2033,#0a1725);border-radius:16px;padding:20px}.stat strong{display:block;font-size:24px}.stat span,.muted{color:var(--muted)}section{padding:62px 0;border-top:1px solid #112840}h2{font-size:36px;letter-spacing:-.04em;margin:0 0 14px}h3{margin-top:0}.kicker{text-transform:uppercase;color:var(--accent2);font-weight:800;font-size:12px;letter-spacing:.14em}.grid.two{grid-template-columns:repeat(2,1fr)}.grid.three{grid-template-columns:repeat(3,1fr)}pre{overflow:auto;background:#050b13;border:1px solid #20364a;border-radius:12px;padding:16px;color:#dcecff}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.flow{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:26px 0}.node{text-align:center;border:1px solid #2b4c69;background:#0d2236;padding:18px 8px;border-radius:12px;font-size:13px}.node b{display:block;color:var(--accent2);font-size:15px}.arrow{color:#5f7f9b;text-align:center}.paper{max-width:900px}.paper p{color:#c3d2e2}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:11px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.table th{color:#8fc5ff}.play{display:grid;grid-template-columns:1fr 1fr;gap:12px}.editor{width:100%;min-height:360px;background:#050b13;color:#eaf2ff;border:1px solid #29455f;border-radius:12px;padding:16px;font:14px/1.55 ui-monospace,Consolas,monospace;resize:vertical}.toolbar{display:flex;gap:8px;margin:10px 0}.mini{border:1px solid #365978;background:#10243a;color:#eaf2ff;padding:8px 11px;border-radius:8px;cursor:pointer}.console{min-height:90px;white-space:pre-wrap}.ok{color:var(--good)}.warn{color:var(--warn)}.bad{color:var(--bad)}footer{padding:45px 0;color:var(--muted);border-top:1px solid var(--line)}@media(max-width:820px){.links{display:none}.stats,.grid.two,.grid.three,.play{grid-template-columns:1fr}.flow{grid-template-columns:1fr 1fr}.hero{padding-top:56px}}
</style>
</head>
<body>
<nav class="nav"><div class="wrap navin"><div class="brand">Bila<b>Script</b> v3</div><div class="links"><a href="#architecture">Kiến trúc</a><a href="#playground">Playground</a><a href="#paper">Bài báo kỹ thuật</a><a href="#license">Giấy phép</a><a href="https://github.com/xulytiengviet/bilascript">GitHub</a></div></div></nav>
<header class="hero"><div class="wrap"><span class="badge">v3.0.0 · Native CVNSS4.0 Frontend · JavaScript Backend</span><h1>BilaScript sở hữu <span>frontend ngôn ngữ</span>.</h1><p class="lead">BilaScript v3 tách ngôn ngữ CVNSS4.0 khỏi runtime lịch sử: lexer, parser, AST và semantic diagnostics thuộc Bila; JavaScript trở thành backend sinh mã để chạy trên browser, Node.js, Bun và các JavaScript runtime.</p><div class="actions"><a class="btn" href="#playground">Thử compiler</a><a class="btn secondary" href="https://github.com/xulytiengviet/bilascript/releases/tag/v3.0.0">Release v3.0.0</a><a class="btn secondary" href="v3/README.md">Tài liệu Core</a></div><div class="stats"><div class="stat"><strong>MIT</strong><span>v3 Core mới</span></div><div class="stat"><strong>Long Ngo</strong><span>phát triển</span></div><div class="stat"><strong>CVNSS4.0</strong><span>bề mặt ngôn ngữ</span></div><div class="stat"><strong>JavaScript</strong><span>backend đầu tiên</span></div></div></div></header>
<section><div class="wrap paper"><div class="kicker">Tóm tắt</div><h2>Bản chất của BilaScript v3</h2><p>V3 không cố tạo một JavaScript VM mới. Nó tạo một <b>compiler frontend riêng</b> nhưng duy trì cấu trúc lập trình quen thuộc của JavaScript. Mã nguồn CVNSS4.0 được biến thành token Bila, AST Bila, được kiểm tra ngữ nghĩa rồi mới hạ xuống JavaScript.</p><p>Điểm thay đổi cốt lõi là ranh giới sở hữu: JavaScript không còn quyết định vocabulary hay parser của core v3; nó là một target code-generation. Điều này cho phép Bila tiến hóa grammar/tooling mà vẫn tận dụng hệ sinh thái JavaScript.</p></div></section>
<section id="architecture"><div class="wrap"><div class="kicker">Deep-tech core</div><h2>Kiến trúc compiler</h2><div class="flow"><div class="node"><b>01 Source</b>*.bila + CVNSS4.0</div><div class="node"><b>02 Lexer</b>Bila tokens</div><div class="node"><b>03 Parser</b>Bila AST</div><div class="node"><b>04 Semantic</b>Diagnostics</div><div class="node"><b>05 Codegen</b>JavaScript</div><div class="node"><b>06 Runtime</b>Browser / Node / Bun</div></div><div class="grid three"><div class="card"><h3>Frontend thuộc Bila</h3><p class="muted">Vocabulary, profile strict/default, lexical analysis, precedence parser, AST và semantic diagnostics nằm trong mã `v3/`.</p></div><div class="card"><h3>AST trung lập backend</h3><p class="muted"><code>neub</code> không đi sâu vào AST. AST mang <code>IfStatement</code>; vì vậy backend tương lai không cần hiểu spelling CVNSS4.0.</p></div><div class="card"><h3>JavaScript là backend</h3><p class="muted">Codegen tạo JavaScript chuẩn để tận dụng browser/Node/Bun. Đây là lựa chọn chiến lược, không phải phụ thuộc grammar.</p></div></div><pre>Bila source → Bila Lexer → Bila Parser → Bila AST → Semantic Analyzer → JavaScript Codegen → JS Runtime</pre></div></section>
<section id="playground"><div class="wrap"><div class="kicker">Compiler thật chạy trên GitHub Pages</div><h2>Bila Playground v3</h2><p class="muted">Trang này import trực tiếp compiler trong <code>v3/src/</code>. Nút “Biên dịch” chạy chính frontend v3 trong trình duyệt.</p><div class="toolbar"><button class="mini" id="compileBtn">Biên dịch</button><button class="mini" id="runBtn">Chạy JavaScript</button><button class="mini" id="astBtn">Xem AST</button><button class="mini" id="resetBtn">Khôi phục mẫu</button></div><div class="play"><textarea id="source" class="editor">---bila:strict---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb ds = moix Magz(10, 20, 30);
ds.dayq(40);

neub (ds.dof_zail > 0) {
    console.log("BilaScript v3.0.0");
    console.log(tong(ds[0], ds[1]));
    console.log(ds.dof_zail);
}</textarea><textarea id="output" class="editor" readonly placeholder="JavaScript/AST sẽ xuất hiện ở đây"></textarea></div><div class="card console" id="console">Sẵn sàng.</div></div></section>
<section><div class="wrap"><div class="kicker">Nguyên lý thiết kế</div><h2>Giữ hình dạng JavaScript, thay quyền sở hữu frontend</h2><div class="grid two"><div class="card"><h3>Giữ lại</h3><p class="muted"><code>{ } ( ) [ ]</code>, toán tử, block, array/object literal, function call, member access và precedence quen thuộc.</p></div><div class="card"><h3>Bila kiểm soát</h3><p class="muted">CVNSS4.0 keyword, built-in aliases, token semantics, parser, AST, diagnostics, code generation policy và roadmap grammar.</p></div></div><table class="table"><thead><tr><th>JavaScript</th><th>BilaScript canonical</th><th>AST semantic</th></tr></thead><tbody><tr><td>function</td><td>haml_sob</td><td>FunctionDeclaration</td></tr><tr><td>if</td><td>neub</td><td>IfStatement</td></tr><tr><td>return</td><td>trov_ved</td><td>ReturnStatement</td></tr><tr><td>new</td><td>moix</td><td>NewExpression</td></tr><tr><td>Array.length</td><td>Magz / dof_zail</td><td>Identifier / MemberExpression</td></tr></tbody></table></div></section>
<section id="paper"><div class="wrap paper"><div class="kicker">Đánh giá như bài báo khoa học</div><h2>Đánh giá toàn diện</h2><h3>Vấn đề nghiên cứu</h3><p>V1–v2 chứng minh JavaScript có thể mang vocabulary CVNSS4.0 nhưng vẫn gắn mạnh với Rhino/Babylscript. V3 đặt câu hỏi khác: có thể kiểm soát frontend mà vẫn giữ JavaScript làm backend hay không?</p><h3>Phương pháp</h3><p>Chúng tôi triển khai lexical analyzer, recursive-descent/precedence parser, AST, semantic pass và JavaScript code generator độc lập trong v3. Unit test kiểm tra strict mode, English compatibility, AST structure, diagnostics và thực thi output.</p><h3>Kết quả</h3><p>Kết quả ở v3.0 là <b>kiến trúc</b>, không phải tuyên bố benchmark: compiler stages đã tách khỏi Rhino và output có thể chạy bằng JavaScript runtime. Không công bố số liệu tốc độ hay “% tương thích ECMAScript” khi chưa có conformance corpus đầy đủ.</p><div class="grid two"><div class="card"><h3 class="ok">Ưu điểm</h3><ul><li>Làm chủ lexer/parser/AST/diagnostics.</li><li>Cú pháp quen thuộc với JavaScript.</li><li>Backend JS có hệ sinh thái lớn.</li><li>Cấu trúc dễ test, audit và mở rộng.</li><li>Core mới có MIT provenance rõ.</li></ul></div><div class="card"><h3 class="warn">Nhược điểm / giới hạn</h3><ul><li>V3.0 mới là core subset, chưa full ESNext.</li><li>Chưa có source map/LSP/debugger đầy đủ.</li><li>Runtime semantics cuối cùng vẫn phụ thuộc JS backend.</li><li>Chưa có type system tĩnh hay optimizer IR.</li><li>Cần tiếp tục audit collision CVNSS4.0.</li></ul></div></div><h3>Đe dọa tới tính hợp lệ</h3><p>Test hiện chủ yếu unit/smoke tests; chưa tương đương Test262. Khả năng học dễ hơn chưa được xác nhận bằng nghiên cứu người dùng. Vì vậy trang này cố tình không biến đánh giá định tính thành số liệu định lượng giả.</p><h3>Công dụng</h3><p>Giáo dục lập trình bằng CVNSS4.0; nghiên cứu localized programming languages; transpilation; sandbox/browser experimentation; công cụ học song song Bila↔JavaScript; tiền đề cho LSP, formatter, optional types và backend WebAssembly.</p></div></section>
<section><div class="wrap"><div class="kicker">Roadmap</div><h2>Từ v3 tới Bila độc lập hơn</h2><div class="grid three"><div class="card"><h3>v3.1</h3><p class="muted">Source maps, formatter, diagnostics giàu ngữ cảnh.</p></div><div class="card"><h3>v3.5</h3><p class="muted">Class/module/arrow/template + LSP + optional typing.</p></div><div class="card"><h3>v4</h3><p class="muted">Ổn định Bila IR; thử backend WebAssembly để JS trở thành một backend trong nhiều backend.</p></div></div></div></section>
<section id="license"><div class="wrap paper"><div class="kicker">Provenance & attribution</div><h2>MIT · Long Ngo · CVNSS4.0</h2><p><b>BilaScript v3 Core mới trong thư mục <code>v3/</code></b> được phát hành theo MIT License, Copyright © 2026 Long Ngo, và được phát triển dựa trên CVNSS4.0.</p><p class="muted">Lưu ý kỹ thuật/pháp lý: repository có lịch sử fork từ Babylscript/Rhino. Các thành phần lịch sử bên ngoài v3 tiếp tục giữ giấy phép và thông báo upstream tương ứng; MIT của v3 không tự động tái cấp phép các file legacy.</p><div class="actions"><a class="btn secondary" href="LICENSE-v3-MIT">Xem MIT v3</a><a class="btn secondary" href="docs/SCIENTIFIC_EVALUATION_v3.0.0.md">Bản đánh giá đầy đủ</a></div></div></section>
<footer><div class="wrap">BilaScript v3.0.0 · CVNSS4.0-first language frontend · JavaScript backend · Developed by Long Ngo · 2026</div></footer>
<script type="module">
import {compile,parse} from './v3/src/compiler.js';
const src=document.querySelector('#source'), out=document.querySelector('#output'), con=document.querySelector('#console'); const sample=src.value;
function showError(e){con.innerHTML='<span class="bad">'+String(e.name+': '+e.message).replaceAll('<','&lt;')+'</span>'}
document.querySelector('#compileBtn').onclick=()=>{try{const r=compile(src.value);out.value=r.code;con.innerHTML='<span class="ok">OK · frontend Bila v'+r.version+' · mode='+r.mode+' · backend='+r.backend+'</span>'}catch(e){showError(e)}};
document.querySelector('#astBtn').onclick=()=>{try{out.value=JSON.stringify(parse(src.value).ast,null,2);con.innerHTML='<span class="ok">AST được tạo bởi Bila Parser.</span>'}catch(e){showError(e)}};
document.querySelector('#runBtn').onclick=()=>{try{const r=compile(src.value);out.value=r.code;let logs=[];const c={log:(...x)=>logs.push(x.join(' ')),error:(...x)=>logs.push(x.join(' '))};Function('console',r.code)(c);con.textContent=logs.join('\n')||'(không có output)'}catch(e){showError(e)}};
document.querySelector('#resetBtn').onclick=()=>{src.value=sample;out.value='';con.textContent='Sẵn sàng.'};
</script>
</body></html>
''')

# Update README without destroying historical documentation.
readme = ROOT / "README.md"
if readme.exists():
    text = readme.read_text(encoding="utf-8")
    text = text.replace("Release v2.0.0", "Release v3.0.0").replace("releases/tag/v2.0.0", "releases/tag/v3.0.0")
    marker = "## 🧠 BilaScript v3.0.0 — Native CVNSS4.0 Frontend"
    if marker not in text:
        insert = dedent(r'''

## 🧠 BilaScript v3.0.0 — Native CVNSS4.0 Frontend

V3 thay đổi ranh giới kiến trúc: **BilaScript sở hữu lexer, parser, AST và semantic diagnostics; JavaScript trở thành backend sinh mã**. Core mới nằm trong `v3/`, phát triển bởi **Long Ngo**, dựa trên **CVNSS4.0**, cấp phép **MIT**. Di sản Rhino/Babylscript bên ngoài `v3/` giữ license upstream.

```text
*.bila → Bila Lexer → Bila Parser → Bila AST → Semantic → JS Codegen → Browser / Node / Bun
```

- Chạy test: `cd v3 && npm test`
- CLI: `node v3/bin/bila.js run v3/examples/hello.bila`
- Website/Playground: https://xulytiengviet.github.io/bilascript/
- Kiến trúc: `docs/BILASCRIPT_v3.0.0.md`
- Đánh giá khoa học: `docs/SCIENTIFIC_EVALUATION_v3.0.0.md`
- MIT cho v3 Core: `LICENSE-v3-MIT`

> Phạm vi v3.0 là **core JavaScript-compatible subset**, chưa tuyên bố full ESNext/Test262 conformance.

---
''')
        first_break = text.find("\n", text.find("# "))
        text = text[:first_break+1] + insert + text[first_break+1:]
    readme.write_text(text, encoding="utf-8")

print("BilaScript v3 files generated")
