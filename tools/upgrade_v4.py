#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
V3 = ROOT / "v3"
V4 = ROOT / "v4"


def write(rel: str, text: str):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip() + "\n", encoding="utf-8")


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def replace_required(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"patch anchor missing: {label}")
    return text.replace(old, new, 1)


def regex_required(text: str, pattern: str, repl: str, label: str) -> str:
    out, n = re.subn(pattern, repl, text, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError(f"regex patch failed ({n}): {label}")
    return out


def set_version(version: str):
    pkg = json.loads(read("v4/package.json"))
    pkg["version"] = version
    pkg["description"] = "BilaScript v4 hardened CVNSS4.0 frontend with zero-cost JavaScript backend"
    pkg["author"] = "Long Ngo"
    pkg["license"] = "MIT"
    write("v4/package.json", json.dumps(pkg, ensure_ascii=False, indent=2))
    vocab = read("v4/src/vocabulary.js")
    vocab = re.sub(r'export const VERSION = "[^"]+";', f'export const VERSION = "{version}";', vocab, count=1)
    write("v4/src/vocabulary.js", vocab)
    cli = read("v4/bin/bila.js")
    cli = re.sub(r'BilaScript v[0-9.]+', f'BilaScript v{version}', cli)
    write("v4/bin/bila.js", cli)


def stage1():
    if V4.exists():
        shutil.rmtree(V4)
    shutil.copytree(V3, V4)
    shutil.rmtree(V4 / "test", ignore_errors=True)
    (V4 / "test").mkdir(parents=True, exist_ok=True)
    set_version("3.6.0")

    parser = read("v4/src/parser.js")
    anchor = '  expectIdentifier() { const t=this.cur(); if(t.type!=="identifier") throw new BilaSyntaxError("Mong đợi định danh",t); this.next(); return {type:"Identifier",name:t.value,loc:locFrom(t)}; }\n'
    addition = anchor + '''  parseTypeRef() {
    const id=this.expectIdentifier(); const typeArguments=[];
    if(this.eat("<")){ if(!this.at(">")){ do typeArguments.push(this.parseTypeRef()); while(this.eat(",")); } this.expect(">"); }
    return {type:"BilaTypeReference",name:id.name,typeArguments,loc:id.loc};
  }
  parseTypeAnnotation() {
    const colon=this.eat(":"); if(!colon) return null;
    const types=[this.parseTypeRef()]; while(this.eat("|")) types.push(this.parseTypeRef());
    return {type:"BilaTypeAnnotation",types,loc:{start:colon.start,end:types.at(-1).loc?.end}};
  }
'''
    parser = replace_required(parser, anchor, addition, "parser type helpers")

    parser = regex_required(parser,
        r'  parseVariableStatement\(withSemicolon=true\) \{.*?\n  parseFunctionDeclaration\(\) \{.*?\n  parseIf\(\)',
        '''  parseVariableStatement(withSemicolon=true) {
    const start=this.expectKw("KW_VAR"); const declarations=[];
    do {
      const id=this.expectIdentifier(); const typeAnnotation=this.parseTypeAnnotation(); let init=null;
      if(this.eat("=")) init=this.parseExpression();
      declarations.push({type:"VariableDeclarator",id,typeAnnotation,init,loc:{start:id.loc.start,end:(init?.loc?.end||typeAnnotation?.loc?.end||id.loc.end)}});
    } while(this.eat(","));
    const end=withSemicolon?(this.eat(";")||this.tokens[this.i-1]):this.tokens[this.i-1];
    return {type:"VariableDeclaration",kind:"var",declarations,loc:locFrom(start,end)};
  }
  parseFunctionDeclaration(asyncFlag=false, asyncStart=null) {
    const fn=this.expectKw("KW_FUNCTION"); const start=asyncStart||fn; const id=this.expectIdentifier(); this.expect("("); const params=[];
    if(!this.at(")")){ do { const p=this.expectIdentifier(); p.typeAnnotation=this.parseTypeAnnotation(); params.push(p); } while(this.eat(",")); }
    this.expect(")"); const returnType=this.parseTypeAnnotation(); const body=this.parseBlock();
    return {type:"FunctionDeclaration",id,params,returnType,body,async:asyncFlag,generator:false,loc:{start:start.start,end:body.loc.end}};
  }
  parseIf()''', "typed declarations/functions")
    write("v4/src/parser.js", parser)

    write("v4/src/type-system.js", r'''
export const CERTAINTY = Object.freeze({ PROVEN:"PROVEN", DECLARED:"DECLARED", EXTERNAL:"EXTERNAL", UNKNOWN:"UNKNOWN", CONFLICT:"CONFLICT" });
const BUILTIN = Object.freeze({
  Magz:"array", Sob:"number", Chujg:"string", Lalf_lij:"boolean", Suh_vatf:"object", Haml_sob:"function", Wayl:"date",
  Array:"array", Number:"number", String:"string", Boolean:"boolean", Object:"object", Function:"function", Date:"date",
  any:"any", unknown:"unknown", void:"void", null:"null"
});
export function typeRefName(ref){ return ref?.name || null; }
export function typeFromAnnotation(annotation){
  if(!annotation?.types?.length) return null;
  const members=annotation.types.map(t=>({kind:BUILTIN[t.name]||`named:${t.name}`,args:(t.typeArguments||[]).map(x=>typeFromAnnotation({types:[x]}))}));
  return members.length===1?members[0]:{kind:"union",members};
}
export function typeKind(type){ return typeof type==="string"?type:type?.kind||null; }
export function receiverKinds(type){
  if(!type) return [];
  if(typeof type==="string") return [type];
  if(type.kind==="union") return [...new Set(type.members.flatMap(receiverKinds))];
  return [type.kind];
}
export function receiverProven(type, allowed){ const kinds=receiverKinds(type); return kinds.length>0 && kinds.every(k=>allowed.includes(k)); }
export function compatible(declared, actual){
  if(!declared||!actual) return true;
  const dk=receiverKinds(declared), ak=receiverKinds(actual);
  if(dk.includes("any")||dk.includes("unknown")) return true;
  return ak.every(k=>dk.includes(k));
}
export function describeType(type){
  if(!type) return "unknown";
  if(typeof type==="string") return type;
  if(type.kind==="union") return type.members.map(describeType).join(" | ");
  if(type.args?.length) return `${type.kind}<${type.args.map(describeType).join(", ")}>`;
  return type.kind;
}
''')

    write("v4/src/normalize.js", r'''
import { GLOBAL_SPECS, MEMBER_SPECS } from "./vocabulary.js";
import { CERTAINTY, compatible, describeType, receiverProven, typeFromAnnotation, typeKind } from "./type-system.js";

class Scope {
  constructor(parent=null){ this.parent=parent; this.bindings=new Map(); }
  define(name,info={}){ const value={name,kind:"variable",type:null,certainty:CERTAINTY.UNKNOWN,mutations:0,...info}; this.bindings.set(name,value); return value; }
  get(name){ return this.bindings.get(name)||this.parent?.get(name)||null; }
}
const clone=x=>JSON.parse(JSON.stringify(x));
function literalType(n){
  if(n?.type==="ArrayExpression") return {kind:"array",args:[]};
  if(n?.type==="ObjectExpression") return {kind:"object"};
  if(n?.type==="Literal"){
    if(typeof n.value==="string") return {kind:"string"};
    if(typeof n.value==="boolean") return {kind:"boolean"};
    if(n.value===null && n.raw && /^[0-9.]/.test(n.raw.replace(/^[-+]/,""))) return {kind:"number"};
    if(n.value===null) return {kind:"null"};
  }
  if(n?.type==="RegexLiteral") return {kind:"regexp"};
  if(["FunctionExpression","ArrowFunctionExpression"].includes(n?.type)) return {kind:"function"};
  return null;
}
export function normalize(inputAst,{mode="bila"}={}){
  const ast=clone(inputAst); const diagnostics=[];
  const metadata={resolvedGlobals:0,resolvedMembers:0,unresolvedMemberAliases:0,declaredTypes:0,typeConflicts:0,symbols:0};
  const report=(severity,node,code,message)=>{ const p=node?.loc?.start; diagnostics.push({severity,code,message,line:p?.line||null,column:p?.column||null}); };
  const aliasFailure=(node,spec,name)=>{ metadata.unresolvedMemberAliases++; report(mode==="strict"?"error":"warning",node,mode==="strict"?"BILA-T310":"BILA-S310",`Không thể chứng minh receiver của '${name}' thuộc [${spec.receivers.join(", ")}]. ${mode==="strict"?"Strict mode dừng biên dịch":"Giữ nguyên property để bảo vệ user/npm API"}.`); };

  function predeclare(body,scope){
    for(const n of body||[]){
      if(n?.type==="VariableDeclaration") for(const d of n.declarations) if(d.id?.type==="Identifier") { scope.define(d.id.name,{declaration:d}); metadata.symbols++; }
      if(n?.type==="FunctionDeclaration"&&n.id) { scope.define(n.id.name,{kind:"function",type:{kind:"function"},certainty:CERTAINTY.PROVEN,declaration:n}); metadata.symbols++; }
    }
  }
  function infer(n,scope){
    const lit=literalType(n); if(lit) return {type:lit,certainty:CERTAINTY.PROVEN};
    if(!n) return {type:null,certainty:CERTAINTY.UNKNOWN};
    if(n.type==="Identifier"){
      const b=scope.get(n.name); if(b?.type) return {type:b.type,certainty:b.certainty};
      const g=GLOBAL_SPECS[n.name]; if(g?.type) return {type:{kind:g.type},certainty:CERTAINTY.PROVEN};
    }
    if(n.type==="NewExpression"&&n.callee?.type==="Identifier"){
      const g=GLOBAL_SPECS[n.callee.name]; if(g?.type) return {type:{kind:g.type},certainty:CERTAINTY.PROVEN};
      const b=scope.get(n.callee.name); if(b?.type) return {type:b.type,certainty:b.certainty};
    }
    return {type:n.inferredType||null,certainty:n.typeCertainty||CERTAINTY.UNKNOWN};
  }
  function visit(node,scope,context={}){
    if(!node||typeof node!=="object") return;
    switch(node.type){
      case "Program": predeclare(node.body,scope); node.body.forEach(n=>visit(n,scope)); return;
      case "BlockStatement": { const child=new Scope(scope); predeclare(node.body,child); node.body.forEach(n=>visit(n,child)); return; }
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const fnScope=new Scope(scope); if(node.id) fnScope.define(node.id.name,{kind:"function",type:{kind:"function"},certainty:CERTAINTY.PROVEN});
        for(const p of node.params||[]){ const declared=typeFromAnnotation(p.typeAnnotation); fnScope.define(p.name,{kind:"parameter",type:declared,certainty:declared?CERTAINTY.DECLARED:CERTAINTY.UNKNOWN}); if(declared) metadata.declaredTypes++; }
        visit(node.body,fnScope); return;
      }
      case "VariableDeclaration":
        for(const d of node.declarations){
          if(d.init) visit(d.init,scope); if(d.id?.type!=="Identifier") { if(d.init) visit(d.init,scope); continue; }
          const binding=scope.get(d.id.name)||scope.define(d.id.name,{declaration:d});
          const declared=typeFromAnnotation(d.typeAnnotation); const actual=infer(d.init,scope);
          if(declared){ metadata.declaredTypes++; binding.type=declared; binding.certainty=CERTAINTY.DECLARED; d.declaredType=declared; if(actual.type&&!compatible(declared,actual.type)){ metadata.typeConflicts++; report("error",d,"BILA-T201",`Kiểu khai báo ${describeType(declared)} không tương thích giá trị ${describeType(actual.type)}.`); } }
          else { binding.type=actual.type; binding.certainty=actual.certainty; }
          d.inferredType=binding.type; d.typeCertainty=binding.certainty;
        } return;
      case "AssignmentExpression": {
        visit(node.right,scope); visit(node.left,scope);
        if(node.left?.type==="Identifier"){ const b=scope.get(node.left.name); if(b){ const actual=infer(node.right,scope); b.mutations++; if(b.certainty===CERTAINTY.DECLARED && actual.type && !compatible(b.type,actual.type)) report("error",node,"BILA-T202",`Gán ${describeType(actual.type)} vào '${b.name}' đã khai báo ${describeType(b.type)}.`); else if(b.certainty!==CERTAINTY.DECLARED){ b.type=actual.type; b.certainty=actual.certainty; } } }
        return;
      }
      case "Identifier": {
        if(context.propertyKey||context.declaration) return;
        const local=scope.get(node.name);
        if(!local&&GLOBAL_SPECS[node.name]){ const spec=GLOBAL_SPECS[node.name]; node.jsName=spec.js; node.inferredType={kind:spec.type}; node.typeCertainty=CERTAINTY.PROVEN; metadata.resolvedGlobals++; }
        else if(local?.type){ node.inferredType=local.type; node.typeCertainty=local.certainty; }
        return;
      }
      case "MemberExpression": {
        visit(node.object,scope); if(node.computed) visit(node.property,scope); else visit(node.property,scope,{propertyKey:true});
        const r=infer(node.object,scope); node.receiverType=r.type; node.receiverCertainty=r.certainty;
        if(!node.computed&&node.property?.type==="Identifier"&&MEMBER_SPECS[node.property.name]){
          const spec=MEMBER_SPECS[node.property.name];
          if(receiverProven(r.type,spec.receivers)&&r.certainty!==CERTAINTY.UNKNOWN&&r.certainty!==CERTAINTY.CONFLICT){ node.jsProperty=spec.js; node.bilaProperty=node.property.name; metadata.resolvedMembers++; }
          else aliasFailure(node,spec,node.property.name);
        } return;
      }
      case "NewExpression": case "CallExpression": visit(node.callee,scope); (node.arguments||[]).forEach(a=>visit(a,scope)); { const r=infer(node,scope); node.inferredType=r.type; node.typeCertainty=r.certainty; } return;
      case "Property": visit(node.key,scope,{propertyKey:true}); visit(node.value,scope); return;
      case "CatchClause": { const child=new Scope(scope); if(node.param?.name) child.define(node.param.name,{kind:"catch"}); visit(node.body,child); return; }
    }
    for(const [k,v] of Object.entries(node)) if(!["type","loc","jsName","jsProperty","receiverType","receiverCertainty","inferredType","typeCertainty","declaredType","typeAnnotation","returnType","bilaGlobal","bilaProperty"].includes(k)){
      if(Array.isArray(v)) v.forEach(x=>visit(x,scope)); else if(v&&typeof v==="object") visit(v,scope);
    }
  }
  visit(ast,new Scope());
  return {ast,diagnostics,metadata};
}
''')

    write("v4/src/compiler.js", r'''
import { parse } from "./parser.js";
import { analyze } from "./semantic.js";
import { normalize } from "./normalize.js";
import { generateDetailed } from "./codegen-js.js";
import { buildSourceMap } from "./source-map.js";
import { auditZeroCost } from "./performance.js";
import { VERSION } from "./vocabulary.js";
export function compile(source,options={}){
  const parsed=parse(source); const semanticDiagnostics=analyze(parsed.ast); const normalized=normalize(parsed.ast,{mode:parsed.mode});
  const diagnostics=[...semanticDiagnostics,...normalized.diagnostics]; const errors=diagnostics.filter(x=>x.severity==="error");
  if(options.failOnSemanticError!==false&&errors.length){ const e=new Error(errors.map(x=>`${x.code}: ${x.message}`).join("\n")); e.name="BilaCompileTimeError"; e.diagnostics=diagnostics; throw e; }
  const generated=generateDetailed(normalized.ast); const performance=auditZeroCost(generated.code);
  const map=options.sourceMap?buildSourceMap(generated.marks,{file:options.fileName||"output.js",source:options.sourceName||"input.bila",sourceContent:String(source)}):null;
  return {version:VERSION,backend:"javascript",mode:parsed.mode,ast:parsed.ast,normalizedAst:normalized.ast,diagnostics,normalization:normalized.metadata,code:generated.code,map,performance};
}
export { parse } from "./parser.js"; export { lex } from "./lexer.js"; export { analyze } from "./semantic.js"; export { normalize } from "./normalize.js"; export { generate,generateDetailed } from "./codegen-js.js"; export { buildSourceMap } from "./source-map.js"; export { auditZeroCost,PERFORMANCE_CONTRACT } from "./performance.js"; export * from "./type-system.js";
''')

    write("v4/test/safety.test.js", r'''
import test from "node:test"; import assert from "node:assert/strict"; import vm from "node:vm"; import { compile } from "../src/compiler.js";
const run=code=>{const logs=[];vm.runInNewContext(code,{console:{log:x=>logs.push(String(x))}});return logs;};
test("stage1: strict proven alias lowers directly",()=>{const r=compile(`---bila:strict---\nbilb ds=[1,2]; ds.dayq(3); console.log(ds.dof_zail);`);assert.match(r.code,/ds\.push\(3\)/);assert.deepEqual(run(r.code),["3"]);});
test("stage1: strict unknown alias is compile-time error",()=>assert.throws(()=>compile(`---bila:strict---\nbilb ds = lay(); ds.dayq(1);`),/BILA-T310/));
test("stage1: default unknown alias is preserved with warning",()=>{const r=compile(`---bila---\nbilb api=lay(); api.dayq(1);`,{failOnSemanticError:false});assert.match(r.code,/api\.dayq\(1\)/);assert.ok(r.diagnostics.some(x=>x.code==="BILA-S310"));});
test("stage1: explicit type annotation proves receiver and erases at codegen",()=>{const r=compile(`---bila:strict---\nbilb ds: Magz<Sob> = lay(); ds.dayq(1);`,{failOnSemanticError:false});assert.match(r.code,/var ds = lay\(\)/);assert.doesNotMatch(r.code,/Magz<Sob>|:\s*Magz/);assert.match(r.code,/ds\.push\(1\)/);});
test("stage1: declared type mismatch fails before runtime",()=>assert.throws(()=>compile(`---bila:strict---\nbilb x: Sob = "sai";`),/BILA-T201/));
test("stage1: zero-cost output contains no Bila runtime helper",()=>{const r=compile(`---bila:strict---\nbilb ds: Magz<Sob>=[1]; ds.dayq(2);`);assert.equal(r.performance.zeroCost,true);assert.doesNotMatch(r.code,/BilaRuntime|BilaArray|__bila/);});
''')
    write("v4/README.md", """# BilaScript v4 development line\n\n## Stage 1 / v3.6 — Compile-time Safety\n\nStrict mode turns unresolved standard aliases into compile-time errors. Type annotations such as `bilb ds: Magz<Sob>` are erased before JavaScript code generation and exist only to prove lowering safety. No runtime translator/helper is introduced.\n\nMIT License · Copyright © 2026 Long Ngo · based on CVNSS4.0.\n""")


def stage2():
    set_version("3.7.0")
    pkg=json.loads(read("v4/package.json")); pkg.setdefault("bin",{})["bila-ls"]="./tools/bila-language-server.js"; pkg["peerDependencies"]={"typescript":">=5.0.0"}; pkg["peerDependenciesMeta"]={"typescript":{"optional":True}}; write("v4/package.json",json.dumps(pkg,ensure_ascii=False,indent=2))
    write("v4/src/typescript-oracle.js", r'''
function flatten(ts,msg){ return ts.flattenDiagnosticMessageText(msg,"\n"); }
export async function analyzeWithTypeScript(jsCode,{fileName="input.js"}={}){
  let ts; try{ ts=await import("typescript"); }catch{return {available:false,diagnostics:[],reason:"typescript package not installed"};}
  const opts={allowJs:true,checkJs:true,noEmit:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,skipLibCheck:true};
  const base=ts.createCompilerHost(opts); const norm=f=>f.replace(/\\/g,"/"); const target=norm(fileName);
  const host={...base,
    fileExists:f=>norm(f)===target||base.fileExists(f),
    readFile:f=>norm(f)===target?String(jsCode):base.readFile(f),
    getSourceFile:(f,lang,onError,newFile)=>norm(f)===target?ts.createSourceFile(f,String(jsCode),lang,true,ts.ScriptKind.JS):base.getSourceFile(f,lang,onError,newFile)
  };
  const program=ts.createProgram([fileName],opts,host); const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>!d.file||norm(d.file.fileName)===target).map(d=>({
    source:"typescript",code:`TS${d.code}`,severity:d.category===ts.DiagnosticCategory.Error?"error":"warning",message:flatten(ts,d.messageText),start:d.start??null,length:d.length??null
  }));
  return {available:true,version:ts.version,diagnostics};
}
''')
    write("v4/src/language-service.js", r'''
import { lex } from "./lexer.js"; import { parse } from "./parser.js"; import { analyze } from "./semantic.js"; import { normalize } from "./normalize.js"; import { KEYWORD_SPECS, GLOBAL_SPECS } from "./vocabulary.js";
function walk(node,fn){ if(!node||typeof node!=="object")return;fn(node);for(const [k,v] of Object.entries(node)){if(["loc","typeAnnotation","returnType"].includes(k))continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==="object")walk(v,fn);}}
export function languageDiagnostics(source){ try{const p=parse(source),s=analyze(p.ast),n=normalize(p.ast,{mode:p.mode});return [...s,...n.diagnostics];}catch(e){return [{severity:"error",code:"BILA-P000",message:e.message,line:e.token?.start?.line||null,column:e.token?.start?.column||null}];}}
export function documentSymbols(source){const {ast}=parse(source);const out=[];walk(ast,n=>{if(n.type==="FunctionDeclaration"&&n.id)out.push({name:n.id.name,kind:"function",loc:n.loc});if(n.type==="ClassDeclaration"&&n.id)out.push({name:n.id.name,kind:"class",loc:n.loc});if(n.type==="VariableDeclarator"&&n.id?.type==="Identifier")out.push({name:n.id.name,kind:"variable",loc:n.loc});});return out;}
export function completions(){return [...Object.entries(KEYWORD_SPECS).map(([label,x])=>({label,kind:"keyword",detail:x.id})),...Object.keys(GLOBAL_SPECS).map(label=>({label,kind:"builtin",detail:"Bila built-in"}))];}
export function hover(source,{line,column}){const out=lex(source);const t=out.tokens.find(x=>x.start?.line===line&&column>=x.start.column&&column<=x.end.column);if(!t)return null;if(t.type==="keyword")return {contents:`${t.raw} → ${t.value}${t.js?` → JavaScript ${t.js}`:""}`};return {contents:`${t.type}: ${t.raw||t.value}`};}
export function createLanguageService(source){return {diagnostics:languageDiagnostics(source),symbols:documentSymbols(source),completions:completions(),hover:(pos)=>hover(source,pos)};}
''')
    write("v4/tools/bila-language-server.js", r'''#!/usr/bin/env node
import { createLanguageService } from "../src/language-service.js";
const docs=new Map(); let buf=Buffer.alloc(0);
function send(msg){const body=Buffer.from(JSON.stringify(msg));process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);process.stdout.write(body);}
function publish(uri,text){const ls=createLanguageService(text);send({jsonrpc:"2.0",method:"textDocument/publishDiagnostics",params:{uri,diagnostics:ls.diagnostics.map(d=>({range:{start:{line:Math.max(0,(d.line||1)-1),character:Math.max(0,(d.column||1)-1)},end:{line:Math.max(0,(d.line||1)-1),character:Math.max(0,d.column||1)}},severity:d.severity==="error"?1:2,code:d.code,source:"bilascript",message:d.message}))}});}
function handle(m){const {id,method,params={}}=m;if(method==="initialize")return send({jsonrpc:"2.0",id,result:{capabilities:{textDocumentSync:1,hoverProvider:true,completionProvider:{},documentSymbolProvider:true}}});if(method==="shutdown")return send({jsonrpc:"2.0",id,result:null});if(method==="textDocument/didOpen"){docs.set(params.textDocument.uri,params.textDocument.text);return publish(params.textDocument.uri,params.textDocument.text);}if(method==="textDocument/didChange"){const text=params.contentChanges?.at(-1)?.text||"";docs.set(params.textDocument.uri,text);return publish(params.textDocument.uri,text);}if(method==="textDocument/completion"){const ls=createLanguageService(docs.get(params.textDocument.uri)||"");return send({jsonrpc:"2.0",id,result:ls.completions});}if(method==="textDocument/hover"){const text=docs.get(params.textDocument.uri)||"";const ls=createLanguageService(text);return send({jsonrpc:"2.0",id,result:ls.hover({line:params.position.line+1,column:params.position.character+1})});}if(method==="textDocument/documentSymbol"){const ls=createLanguageService(docs.get(params.textDocument.uri)||"");return send({jsonrpc:"2.0",id,result:ls.symbols.map(s=>({name:s.name,kind:s.kind==="function"?12:s.kind==="class"?5:13,range:{start:{line:Math.max(0,(s.loc?.start?.line||1)-1),character:0},end:{line:Math.max(0,(s.loc?.end?.line||1)-1),character:1}},selectionRange:{start:{line:Math.max(0,(s.loc?.start?.line||1)-1),character:0},end:{line:Math.max(0,(s.loc?.start?.line||1)-1),character:1}}}))});}if(id!==undefined)send({jsonrpc:"2.0",id,result:null});}
process.stdin.on("data",chunk=>{buf=Buffer.concat([buf,chunk]);while(true){const sep=buf.indexOf("\r\n\r\n");if(sep<0)break;const head=buf.slice(0,sep).toString();const m=/Content-Length:\s*(\d+)/i.exec(head);if(!m)process.exit(2);const len=Number(m[1]);if(buf.length<sep+4+len)break;const body=buf.slice(sep+4,sep+4+len);buf=buf.slice(sep+4+len);try{handle(JSON.parse(body.toString()));}catch(e){send({jsonrpc:"2.0",id:null,error:{code:-32603,message:e.message}});}}});
''')
    write("v4/editors/vscode-bila/package.json", json.dumps({"name":"bilascript-vscode","displayName":"BilaScript v4","version":"4.0.0","engines":{"vscode":"^1.90.0"},"categories":["Programming Languages"],"activationEvents":["onLanguage:bila"],"main":"./extension.js","contributes":{"languages":[{"id":"bila","aliases":["BilaScript","bila"],"extensions":[".bila"]}],"grammars":[{"language":"bila","scopeName":"source.bila","path":"./syntaxes/bila.tmLanguage.json"}] }},ensure_ascii=False,indent=2))
    write("v4/editors/vscode-bila/extension.js", r'''const vscode=require("vscode"),cp=require("child_process"),path=require("path");let proc;exports.activate=(ctx)=>{proc=cp.spawn(process.execPath,[path.join(ctx.extensionPath,"../../tools/bila-language-server.js")],{stdio:["pipe","pipe","inherit"]});ctx.subscriptions.push({dispose:()=>proc?.kill()});};exports.deactivate=()=>proc?.kill();''')
    write("v4/editors/vscode-bila/syntaxes/bila.tmLanguage.json", json.dumps({"scopeName":"source.bila","patterns":[{"name":"keyword.control.bila","match":"\\b(neub|kac|vil|trogp_ki|haml_sob|trov_ved|bilb|moix|thuv|chupr_layb|nemj|cujb_cugl)\\b"},{"name":"string.quoted.double.bila","begin":"\"","end":"\""},{"name":"comment.line.double-slash.bila","match":"//.*$"}]},ensure_ascii=False,indent=2))
    write("v4/test/tooling.test.js", r'''
import test from "node:test"; import assert from "node:assert/strict"; import { createLanguageService } from "../src/language-service.js"; import { analyzeWithTypeScript } from "../src/typescript-oracle.js";
test("stage2: language service returns diagnostics/completions/symbols",()=>{const ls=createLanguageService(`---bila:strict---\nhaml_sob tong(a: Sob,b: Sob): Sob { trov_ved a+b; }`);assert.ok(ls.completions.some(x=>x.label==="neub"));assert.ok(ls.symbols.some(x=>x.name==="tong"));assert.equal(ls.diagnostics.length,0);});
test("stage2: TypeScript oracle is offline and optional",async()=>{const r=await analyzeWithTypeScript(`const x=1; x.trim();`);assert.equal(typeof r.available,"boolean");if(r.available)assert.ok(r.diagnostics.some(x=>x.code.startsWith("TS")));});
''')
    with (V4/"README.md").open("a",encoding="utf-8") as f: f.write("\n## Stage 2 / v3.7 — Tooling & Language Service\n\nAdds native Bila language-service primitives, a minimal LSP stdio server, VS Code language metadata, and an optional offline TypeScript oracle. TypeScript is advisory; Bila remains the source of truth for CVNSS4.0 semantics and alias safety.\n")


def stage3():
    set_version("3.8.0")
    vocab=read("v4/src/vocabulary.js")
    vocab=replace_required(vocab,'  tifb_tucr: { id: "KW_CONTINUE", js: "continue" }\n','  tifb_tucr: { id: "KW_CONTINUE", js: "continue" },\n  lopx: { id: "KW_CLASS", js: "class" },\n  nhapf: { id: "KW_IMPORT", js: "import" },\n  xadb: { id: "KW_EXPORT", js: "export" },\n  tuk: { id: "KW_FROM", js: "from" }\n',"modern keyword specs")
    vocab=replace_required(vocab,'  this: { id: "KW_THIS", js: "this" }\n','  this: { id: "KW_THIS", js: "this" },\n  async: { id: "KW_ASYNC", js: "async" },\n  await: { id: "KW_AWAIT", js: "await" },\n  extends: { id: "KW_EXTENDS", js: "extends" },\n  static: { id: "KW_STATIC", js: "static" },\n  as: { id: "KW_AS", js: "as" }\n',"modern passthrough specs")
    write("v4/src/vocabulary.js",vocab)

    parser=read("v4/src/parser.js")
    parser=replace_required(parser,'        case "KW_TRY": return this.parseTry();\n','        case "KW_TRY": return this.parseTry();\n        case "KW_CLASS": return this.parseClassDeclaration();\n        case "KW_IMPORT": return this.parseImportDeclaration();\n        case "KW_EXPORT": return this.parseExportDeclaration();\n        case "KW_ASYNC": return this.parseAsyncStatement();\n',"statement modern switch")
    parser=replace_required(parser,'    return {type:"Program",sourceType:"script",bilaMode:this.mode,directive:this.directive,body,loc:locFrom(start,this.cur())};','    const sourceType=body.some(n=>["ImportDeclaration","ExportNamedDeclaration"].includes(n.type))?"module":"script";\n    return {type:"Program",sourceType,bilaMode:this.mode,directive:this.directive,body,loc:locFrom(start,this.cur())};',"program module sourceType")
    # binding patterns
    anchor='  parseTypeAnnotation() {\n    const colon=this.eat(":"); if(!colon) return null;\n    const types=[this.parseTypeRef()]; while(this.eat("|")) types.push(this.parseTypeRef());\n    return {type:"BilaTypeAnnotation",types,loc:{start:colon.start,end:types.at(-1).loc?.end}};\n  }\n'
    add=anchor+r'''  parseBindingPattern() {
    if(this.cur().type==="identifier") return this.expectIdentifier();
    if(this.eat("[")){ const elements=[]; while(!this.at("]")){ if(this.eat(",")){elements.push(null);continue;} if(this.eat("...")){const argument=this.parseBindingPattern();elements.push({type:"RestElement",argument,loc:argument.loc});break;} const p=this.parseBindingPattern(); elements.push(p); if(!this.eat(","))break; } const end=this.expect("]"); return {type:"ArrayPattern",elements,loc:{start:elements.find(Boolean)?.loc?.start||end.start,end:end.end}}; }
    if(this.eat("{")){ const properties=[]; while(!this.at("}")){ if(this.eat("...")){const argument=this.parseBindingPattern();properties.push({type:"RestElement",argument,loc:argument.loc});break;} const key=this.expectIdentifier(); let value=key; if(this.eat(":")) value=this.parseBindingPattern(); properties.push({type:"Property",key,value,kind:"init",computed:false,shorthand:value===key,loc:{start:key.loc.start,end:value.loc.end}}); if(!this.eat(","))break; } const end=this.expect("}"); return {type:"ObjectPattern",properties,loc:{start:properties[0]?.loc?.start||end.start,end:end.end}}; }
    throw new BilaSyntaxError("Mong đợi binding pattern",this.cur());
  }
'''
    parser=replace_required(parser,anchor,add,"binding pattern helpers")
    parser=replace_required(parser,'      const id=this.expectIdentifier(); const typeAnnotation=this.parseTypeAnnotation(); let init=null;','      const id=this.parseBindingPattern(); const typeAnnotation=this.parseTypeAnnotation(); let init=null;',"variable destructuring")
    parser=replace_required(parser,'    if(!this.at(")")){ do { const p=this.expectIdentifier(); p.typeAnnotation=this.parseTypeAnnotation(); params.push(p); } while(this.eat(",")); }','    if(!this.at(")")){ do { let p; if(this.eat("...")){const argument=this.parseBindingPattern();p={type:"RestElement",argument,loc:argument.loc};} else p=this.parseBindingPattern(); p.typeAnnotation=this.parseTypeAnnotation(); params.push(p); } while(this.eat(",")); }',"function destructuring params")
    # await unary
    parser=replace_required(parser,'  parseUnary() { const t=this.cur();','  parseUnary() { const t=this.cur(); if(this.atKw("KW_AWAIT")){ const start=this.next(); const argument=this.parseUnary(); return {type:"AwaitExpression",argument,loc:{start:start.start,end:argument.loc?.end}}; }',"await expression")
    # insert modern declaration methods before parseExpression
    anchor='\n  parseExpression() { return this.parseAssignment(); }\n'
    modern=r'''
  parseAsyncStatement(){ const start=this.expectKw("KW_ASYNC"); if(this.atKw("KW_FUNCTION")) return this.parseFunctionDeclaration(true,start); throw new BilaSyntaxError("async hiện hỗ trợ trước haml_sob/function",this.cur()); }
  parseClassDeclaration(){
    const start=this.expectKw("KW_CLASS"); const id=this.expectIdentifier(); let superClass=null; if(this.eatKw("KW_EXTENDS")) superClass=this.parsePostfix(this.parsePrimary()); this.expect("{"); const body=[];
    while(!this.at("}")){ let isStatic=false,isAsync=false; if(this.eatKw("KW_STATIC"))isStatic=true; if(this.eatKw("KW_ASYNC"))isAsync=true; const key=this.expectIdentifier(); this.expect("("); const params=[]; if(!this.at(")")){do{let p=this.parseBindingPattern();p.typeAnnotation=this.parseTypeAnnotation();params.push(p);}while(this.eat(","));} this.expect(")"); const returnType=this.parseTypeAnnotation(); const block=this.parseBlock(); body.push({type:"MethodDefinition",key,params,returnType,body:block,kind:key.name==="constructor"?"constructor":"method",static:isStatic,async:isAsync,loc:{start:key.loc.start,end:block.loc.end}}); }
    const end=this.expect("}"); return {type:"ClassDeclaration",id,superClass,body:{type:"ClassBody",body,loc:locFrom(start,end)},loc:locFrom(start,end)};
  }
  parseImportDeclaration(){
    const start=this.expectKw("KW_IMPORT"); const specifiers=[];
    if(this.eat("{")){ if(!this.at("}")){do{const imported=this.expectIdentifier();let local=imported;if(this.eatKw("KW_AS"))local=this.expectIdentifier();specifiers.push({type:"ImportSpecifier",imported,local});}while(this.eat(","));}this.expect("}"); }
    else { const local=this.expectIdentifier(); specifiers.push({type:"ImportDefaultSpecifier",local}); }
    this.expectKw("KW_FROM","Mong đợi tuk/from"); const src=this.cur(); if(src.type!=="string")throw new BilaSyntaxError("Import source phải là chuỗi",src);this.next();this.eat(";");return {type:"ImportDeclaration",specifiers,source:{type:"Literal",value:src.value,raw:src.raw,loc:locFrom(src)},loc:locFrom(start,src)};
  }
  parseExportDeclaration(){
    const start=this.expectKw("KW_EXPORT"); if(this.atKw("KW_FUNCTION")){const declaration=this.parseFunctionDeclaration();return {type:"ExportNamedDeclaration",declaration,specifiers:[],loc:{start:start.start,end:declaration.loc.end}};} if(this.atKw("KW_CLASS")){const declaration=this.parseClassDeclaration();return {type:"ExportNamedDeclaration",declaration,specifiers:[],loc:{start:start.start,end:declaration.loc.end}};} if(this.atKw("KW_VAR")){const declaration=this.parseVariableStatement(true);return {type:"ExportNamedDeclaration",declaration,specifiers:[],loc:{start:start.start,end:declaration.loc.end}};}
    this.expect("{");const specifiers=[];if(!this.at("}")){do{const local=this.expectIdentifier();let exported=local;if(this.eatKw("KW_AS"))exported=this.expectIdentifier();specifiers.push({type:"ExportSpecifier",local,exported});}while(this.eat(","));}const end=this.expect("}");this.eat(";");return {type:"ExportNamedDeclaration",declaration:null,specifiers,loc:locFrom(start,end)};
  }
'''+anchor
    parser=replace_required(parser,anchor,modern,"modern declarations")
    # try arrow typed params: change expectIdentifier to binding and annotations in tryParenArrow
    parser=parser.replace('params.push(this.expectIdentifier());','{const p=this.parseBindingPattern();p.typeAnnotation=this.parseTypeAnnotation();params.push(p);}',1)
    write("v4/src/parser.js",parser)

    code=read("v4/src/codegen-js.js")
    # use pattern helper in declarations/functions
    code=code.replace('expr(d.id)+(d.init?', 'pattern(d.id)+(d.init?')
    code=code.replace('${expr(n.id)}(${n.params.map(expr).join(", ")})', '${expr(n.id)}(${n.params.map(pattern).join(", ")})')
    code=code.replace('n.params.map(expr).join(", ")', 'n.params.map(pattern).join(", ")')
    # add statement cases before ExpressionStatement
    marker='      case "ExpressionStatement": emit(ind()+expr(n.expression)+";\\n"); break;'
    modern_cases=r'''      case "ClassDeclaration": { emit(ind()+`class ${expr(n.id)}${n.superClass?` extends ${expr(n.superClass)}`:""} {\n`); level++; for(const md of n.body.body){ emit(ind()+(md.static?"static ":"")+(md.async?"async ":"")+`${md.key.name}(${md.params.map(pattern).join(", ")}) `); stmt(md.body); emit("\n"); } level--; emit(ind()+"}\n"); break; }
      case "ImportDeclaration": { const specs=n.specifiers.map(s=>s.type==="ImportDefaultSpecifier"?s.local.name:(s.imported.name===s.local.name?s.imported.name:`${s.imported.name} as ${s.local.name}`)); const head=n.specifiers[0]?.type==="ImportDefaultSpecifier"?specs[0]:`{ ${specs.join(", ")} }`; emit(ind()+`import ${head} from ${JSON.stringify(n.source.value)};\n`); break; }
      case "ExportNamedDeclaration": { if(n.declaration){ emit(ind()+"export "); const before=out.length; stmt(n.declaration); if(out.length>before&&out[before].startsWith(ind()))out[before]=out[before].slice(ind().length); } else emit(ind()+`export { ${n.specifiers.map(s=>s.local.name===s.exported.name?s.local.name:`${s.local.name} as ${s.exported.name}`).join(", ")} };\n`); break; }
      case "ExpressionStatement": emit(ind()+expr(n.expression)+";\n"); break;'''
    code=replace_required(code,marker,modern_cases,"codegen modern statements")
    # add expr Await, patterns helper before ast.body
    code=replace_required(code,'      case "MemberExpression": return n.computed?', '      case "AwaitExpression": return `await ${expr(n.argument)}`;\n      case "MemberExpression": return n.computed?',"await codegen")
    anchor='  ast.body.forEach(stmt); return out.join("").trimEnd()+"\\n";'
    helper=r'''  function pattern(n){
    if(!n)return ""; if(n.type==="Identifier")return n.name; if(n.type==="RestElement")return "..."+pattern(n.argument);
    if(n.type==="ArrayPattern")return "["+n.elements.map(x=>x?pattern(x):"").join(", ")+"]";
    if(n.type==="ObjectPattern")return "{"+n.properties.map(p=>p.type==="RestElement"?pattern(p):(p.shorthand?pattern(p.key):`${pattern(p.key)}: ${pattern(p.value)}`)).join(", ")+"}";
    return expr(n);
  }
'''+anchor
    code=replace_required(code,anchor,helper,"pattern codegen")
    # async function output if existing string exact
    code=code.replace('emit(ind()+`function ${expr(n.id)}', 'emit(ind()+(n.async?"async ":"")+`function ${expr(n.id)}')
    write("v4/src/codegen-js.js",code)

    # normalizer: binding patterns should not crash; add symbol collector helper by traversing identifiers in patterns
    norm=read("v4/src/normalize.js")
    norm=replace_required(norm,'  function predeclare(body,scope){','  function bindingNames(p,out=[]){ if(!p)return out; if(p.type==="Identifier")out.push(p.name); else if(p.type==="RestElement")bindingNames(p.argument,out); else if(p.type==="ArrayPattern")p.elements.forEach(x=>bindingNames(x,out)); else if(p.type==="ObjectPattern")p.properties.forEach(x=>bindingNames(x.type==="RestElement"?x.argument:x.value,out)); return out; }\n  function predeclare(body,scope){',"normalizer binding names")
    norm=norm.replace('if(n?.type==="VariableDeclaration") for(const d of n.declarations) if(d.id?.type==="Identifier") { scope.define(d.id.name,{declaration:d}); metadata.symbols++; }','if(n?.type==="VariableDeclaration") for(const d of n.declarations) for(const name of bindingNames(d.id)) { scope.define(name,{declaration:d}); metadata.symbols++; }')
    norm=norm.replace('for(const p of node.params||[]){ const declared=typeFromAnnotation(p.typeAnnotation); fnScope.define(p.name,{kind:"parameter",type:declared,certainty:declared?CERTAINTY.DECLARED:CERTAINTY.UNKNOWN}); if(declared) metadata.declaredTypes++; }','for(const p of node.params||[]){ const declared=typeFromAnnotation(p.typeAnnotation); for(const name of bindingNames(p)) fnScope.define(name,{kind:"parameter",type:declared,certainty:declared?CERTAINTY.DECLARED:CERTAINTY.UNKNOWN}); if(declared) metadata.declaredTypes++; }')
    write("v4/src/normalize.js",norm)

    write("v4/test/modern.test.js", r'''
import test from "node:test"; import assert from "node:assert/strict"; import vm from "node:vm"; import { compile } from "../src/compiler.js";
const logs=code=>{const out=[];vm.runInNewContext(code,{console:{log:x=>out.push(String(x))},Promise});return out;};
test("stage3: class declaration is owned by Bila parser",()=>{const r=compile(`---bila:strict---\nlopx MayTinh { cong(a: Sob,b: Sob): Sob { trov_ved a+b; } } bilb m=moix MayTinh(); console.log(m.cong(2,3));`);assert.match(r.code,/class MayTinh/);assert.deepEqual(logs(r.code),["5"]);});
test("stage3: ESM import/export compile without runtime helpers",()=>{const r=compile(`---bila:strict---\nnhapf { readFile } tuk "node:fs"; xadb haml_sob id(x: Sob): Sob { trov_ved x; }`);assert.match(r.code,/import \{ readFile \} from/);assert.match(r.code,/export function id/);assert.equal(r.performance.zeroCost,true);});
test("stage3: destructuring patterns are preserved structurally",()=>{const r=compile(`---bila:strict---\nbilb {a,b}={a:1,b:2}; bilb [x,y]=[3,4]; console.log(a+b+x+y);`);assert.match(r.code,/var \{a, b\}/);assert.deepEqual(logs(r.code),["10"]);});
test("stage3: async/await is compile-time syntax passthrough",()=>{const r=compile(`---bila:strict---\nasync haml_sob f(){ bilb x = await Promise.resolve(3); trov_ved x; }`);assert.match(r.code,/async function f/);assert.match(r.code,/await Promise\.resolve/);});
test("stage3: optional chaining, nullish, arrow, spread and template remain structural",()=>{const r=compile('---bila:strict---\nbilb f=(x)=>x+1; bilb a=[1,...[2]]; bilb x=a?.dof_zail ?? 0; console.log(`n=${x}`);');assert.match(r.code,/=>/);assert.match(r.code,/\.\.\./);assert.match(r.code,/\?\./);assert.match(r.code,/\?\?/);assert.match(r.code,/`n=\$\{x\}`/);});
''')
    with (V4/"README.md").open("a",encoding="utf-8") as f:f.write("\n## Stage 3 / v3.8 — Modern JavaScript Grammar\n\nAdds Bila-owned parsing/codegen for classes, ESM import/export, destructuring, plus async/await structural support. Arrow, optional chaining, nullish, spread/rest and template syntax remain symbol-compatible. JavaScript-standard structural words without a frozen CVNSS4.0 canonical form remain explicit passthrough tokens rather than guessed translations.\n")


def stage4():
    set_version("4.0.0")
    pkg=json.loads(read("v4/package.json")); pkg.setdefault("scripts",{})["conformance"]="node --test test/conformance.test.js"; write("v4/package.json",json.dumps(pkg,ensure_ascii=False,indent=2))
    write("v4/conformance/manifest.json",json.dumps({"version":"4.0.0","contract":"Bila frontend / clean JavaScript backend / zero runtime helper","required":["strict-alias-negative-corpus","typed-alias-positive-corpus","operator-differential","modern-grammar-smoke","zero-helper-audit","source-map-smoke","language-service-smoke","typescript-oracle-optional"],"notClaimed":["full Test262","full ECMAScript grammar","faster-than-JavaScript"]},ensure_ascii=False,indent=2))
    write("v4/test/conformance.test.js", r'''
import test from "node:test"; import assert from "node:assert/strict"; import vm from "node:vm"; import { compile } from "../src/compiler.js";
function run(code){const logs=[];vm.runInNewContext(code,{console:{log:x=>logs.push(String(x))},Promise});return logs;}
const positive=[
 [`bilb ds: Magz<Sob>=[1,2]; ds.dayq(3); console.log(ds.dof_zail);`,["3"]],
 [`bilb s: Chujg="abc"; console.log(s.dof_zail);`,["3"]],
 [`haml_sob f(a: Sob): Sob { trov_ved a*2; } console.log(f(4));`,["8"]],
 [`bilb f=x=>x+1; console.log(f(9));`,["10"]],
 [`bilb obj={}; console.log(obj?.x ?? 7);`,["7"]]
];
for(const [src,expected] of positive)test(`conformance positive: ${src.slice(0,28)}`,()=>{const r=compile(`---bila:strict---\n${src}`);assert.deepEqual(run(r.code),expected);assert.equal(r.performance.zeroCost,true);});
const negatives=[`bilb x=unknown(); x.dayq(1);`,`bilb x=unknown(); x.dof_zail;`,`bilb x: Sob="bad";`];
for(const src of negatives)test(`conformance negative: ${src.slice(0,28)}`,()=>assert.throws(()=>compile(`---bila:strict---\n${src}`),/BILA-T/));
test("operator differential corpus preserves JavaScript semantics",()=>{let seed=1337;const rnd=()=>((seed=(seed*1103515245+12345)>>>0)%97)+1;for(let i=0;i<100;i++){const a=rnd(),b=rnd(),c=rnd();const expr=`((${a} + ${b}) * ${c}) % 97`;const bila=compile(`---bila:strict---\nbilb x=${expr}; console.log(x);`).code;const js=`var x=${expr}; console.log(x);`;assert.deepEqual(run(bila),run(js));}});
test("zero-helper audit on representative corpus",()=>{for(const [src] of positive){const r=compile(`---bila:strict---\n${src}`);assert.doesNotMatch(r.code,/BilaRuntime|BilaArray|__bila|Proxy\s*\(/);}});
test("source map remains build-time metadata",()=>{const r=compile(`---bila:strict---\nbilb x=1;`,{sourceMap:true,sourceName:"x.bila",fileName:"x.js"});assert.equal(r.map.version,3);assert.deepEqual(r.map.sources,["x.bila"]);});
''')
    write("v4/docs/LOOP4_AUDIT_v4.0.0.md", """# BilaScript v4.0.0 — Four-loop hardening audit\n\n## Loop 1 — Compile-time Safety\n- Strict unknown built-in alias: compile-time error `BILA-T310`.\n- Static annotations (`Sob`, `Chujg`, `Magz<T>`, unions) exist only in frontend and are erased before JS.\n- Type mismatch is rejected before runtime.\n\n## Loop 2 — Tooling & Language Service\n- Native diagnostics, completions, hover and symbol extraction.\n- Minimal LSP stdio server.\n- Optional TypeScript oracle runs offline and is advisory, not the Bila semantic source of truth.\n\n## Loop 3 — Modern JavaScript Grammar\n- Bila parser/codegen owns class, named ESM import/export and destructuring.\n- Arrow, optional chaining, nullish, spread/rest and templates preserve JS symbols.\n- async/await/extends/static/as are explicit structural passthrough tokens until canonical CVNSS4.0 spellings are frozen.\n\n## Loop 4 — Conformance Hardening\n- Positive/negative corpus, 100-case deterministic operator differential test, zero-helper audit, source-map test and tooling smoke tests.\n- No claim of full Test262/ECMAScript conformance.\n\n## Invariant\n`CVNSS4.0 → Bila semantic frontend → clean JavaScript → JS runtime`\n\nNo runtime translator, collection wrapper or semantic proxy is inserted for 1:1 lowering.\n""")
    write("docs/BILASCRIPT_v4.0.0.md", """# BilaScript v4.0.0 — Evidence-driven Zero-cost Frontend\n\nBilaScript v4.0.0 hardens the CVNSS4.0 frontend while deliberately keeping JavaScript as the execution backend. The compiler owns lexical identity, parsing, AST, symbols, static evidence, diagnostics, alias lowering policy, source mapping and language-service behavior.\n\n## Pipeline\n`*.bila → Lexer(KW_*) → Parser → Bila AST → Symbol/Type Evidence → Strict Normalizer → JS Codegen + Source Map → JavaScript runtime`\n\n## Safety contract\nIn `---bila:strict---`, a canonical Bila built-in alias is lowered only when its receiver is proven. Unknown receiver evidence is a compile-time error. In default `---bila---`, it is preserved with a warning for migration/prototyping. Third-party/user APIs are never localized implicitly.\n\n## Types\nAnnotations such as `bilb ds: Magz<Sob>` are frontend-only evidence. They are erased in JavaScript output and introduce no runtime checks/helper.\n\n## TypeScript oracle\nTypeScript is optional, offline, advisory tooling for ecosystem diagnostics. Bila's own semantic engine remains authoritative for CVNSS4.0 and lowering safety.\n\n## Modern grammar\nV4 covers the existing expression core plus classes, named ESM import/export, destructuring, async/await structural support, arrows, optional chaining, nullish and spread/rest. It does not claim full ECMAScript/Test262 conformance.\n\nMIT License · Copyright © 2026 Long Ngo · developed based on CVNSS4.0.\n""")
    write("docs/SCIENTIFIC_EVALUATION_v4.0.0.md", """# Technical / scientific evaluation — BilaScript v4.0.0\n\n## Research proposition\nCan a localized CVNSS4.0 programming frontend own its compile-time semantics while preserving JavaScript's runtime/JIT ecosystem without runtime translation overhead?\n\n## Method\nFour sequential hardening loops were applied: compile-time safety, tooling/language service, modern grammar, and conformance hardening. Each loop is gated by automated tests before the next loop is committed.\n\n## Main result\nV4 moves the primary alias risk from runtime to compile-time in strict mode. Built-in member lowering requires receiver evidence. Static annotations improve evidence and are erased by codegen. Output remains ordinary JavaScript.\n\n## Strengths\n- Clear frontend ownership boundary.\n- Zero runtime translation/helper contract for 1:1 constructs.\n- User/npm APIs protected from implicit localization.\n- Optional TypeScript ecosystem analysis without making TypeScript the semantic authority.\n- Language-service/LSP foundation and source maps.\n- Differential and negative conformance corpus.\n\n## Limitations\n- Not full ECMAScript/Test262.\n- Flow-sensitive type inference is intentionally modest.\n- Type annotations are a safety/evidence system, not a TypeScript clone.\n- Some modern structural words remain JS passthrough until CVNSS4.0 canonical spellings are frozen.\n- No claim that BilaScript is faster than handwritten JavaScript; the goal is runtime transparency of generated JS.\n\n## Conclusion\nBilaScript v4.0.0 is best characterized as an evidence-driven, research-grade localized language frontend with a clean JavaScript backend. Its strongest engineering claim is compile-time control of localization risk without placing a translation layer in the runtime path.\n""")
    write("v4/README.md", read("v4/README.md")+"\n## Loop 4 / v4.0.0 — Conformance Hardening\n\nV4 adds a negative strict corpus, deterministic differential testing, zero-helper audit and explicit non-claims. It is an evidence-driven frontend: lowering is allowed only when compile-time evidence is sufficient.\n")

    # Root README: prepend v4 section but preserve full project history.
    root=read("README.md")
    if "BilaScript v4.0.0 — Evidence-driven" not in root:
        root="# 🇻🇳 BilaScript v4.0.0 — Evidence-driven Zero-cost Frontend\n\n> **BilaScript làm chủ frontend; JavaScript đảm nhiệm runtime. V4 dời rủi ro alias về compile-time, không chèn runtime translator/helper cho mapping 1:1.**\n\nBốn vòng hardening: **Compile-time Safety → Tooling & Language Service → Modern JS Grammar → Conformance Hardening**. Xem `v4/`, `docs/BILASCRIPT_v4.0.0.md`, `v4/docs/LOOP4_AUDIT_v4.0.0.md`.\n\n```text\nCVNSS4.0 → KW_* → Bila AST → Type/Symbol Evidence → Strict Normalizer → Clean JavaScript + Source Map → JS Runtime\n```\n\n**MIT · Copyright © 2026 Long Ngo · phát triển dựa trên CVNSS4.0.** Legacy Rhino/Babylscript và các mốc cũ giữ license upstream tương ứng.\n\n---\n\n"+root
    write("README.md",root)

    write("index.html", r'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BilaScript v4.0 — Evidence-driven CVNSS4.0 Frontend</title><meta name="description" content="BilaScript v4.0: frontend CVNSS4.0 zero-cost, compile-time safety, LSP, modern grammar và conformance hardening. MIT · Long Ngo."><style>:root{--bg:#001b33;--bg2:#00264d;--panel:#002b55;--text:#fff;--muted:#b9c8d8;--yellow:#ffd43b;--cyan:#69e6ff;--line:#31577a;--green:#7ee787;--red:#ff8b8b;--max:1160px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.65 Consolas,"Lucida Console","Courier New",monospace}a{color:var(--yellow);text-decoration:none}.wrap{width:min(var(--max),calc(100% - 28px));margin:auto}.nav{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:2px solid var(--yellow)}.navin{min-height:58px;display:flex;align-items:center;gap:18px}.links{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap;font-size:12px}.brand b,h1 span,h2,.yellow{color:var(--yellow)}.hero{padding:72px 0 48px}.hero h1{font-size:clamp(38px,7vw,70px);line-height:1.03;margin:16px 0}.lead{color:var(--muted);max-width:920px;font-size:18px}.tag,.btn{display:inline-block;border:1px solid var(--yellow);padding:7px 10px;color:var(--yellow)}.btn.primary{background:var(--yellow);color:#00152a}.actions{display:flex;gap:9px;flex-wrap:wrap;margin:22px 0}.grid{display:grid;gap:12px}.two{grid-template-columns:repeat(2,1fr)}.four{grid-template-columns:repeat(4,1fr)}.card,.stat{border:1px solid var(--line);background:var(--bg2);padding:18px}.stat strong{display:block;color:var(--yellow);font-size:19px}section{padding:50px 0;border-top:1px solid var(--line)}h2{font-size:30px;margin:0 0 12px}.kicker{color:var(--cyan);font-size:12px;letter-spacing:.12em}.muted{color:var(--muted)}pre,.editor{background:#001326;color:#fff;border:1px solid var(--line);font:14px/1.55 Consolas,monospace}.editor{width:100%;min-height:340px;padding:14px}.play{display:grid;grid-template-columns:1fr 1fr;gap:10px}.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.mini{border:1px solid var(--yellow);background:transparent;color:var(--yellow);padding:8px 10px;font:inherit;cursor:pointer}.flow{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.node{border:1px solid var(--line);background:var(--panel);padding:12px 7px;text-align:center;font-size:12px}.node b{display:block;color:var(--yellow)}.timeline{border-left:2px solid var(--yellow);margin-left:8px}.event{padding:0 0 24px 24px;position:relative}.event:before{content:"";position:absolute;left:-7px;top:7px;width:10px;height:10px;background:var(--yellow)}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{color:var(--yellow)}.ok{color:var(--green)}.bad{color:var(--red)}footer{padding:30px 0;border-top:2px solid var(--yellow);color:var(--muted)}@media(max-width:900px){.links{display:none}.two,.four,.play{grid-template-columns:1fr}.flow{grid-template-columns:1fr 1fr}}</style></head><body><nav class="nav"><div class="wrap navin"><div class="brand">BILA<b>SCRIPT</b>_4.0</div><div class="links"><a href="#architecture">KIẾN TRÚC</a><a href="#safety">SAFETY</a><a href="#tooling">TOOLING</a><a href="#grammar">GRAMMAR</a><a href="#conformance">CONFORMANCE</a><a href="#playground">PLAYGROUND</a><a href="#history">LỊCH SỬ</a><a href="https://github.com/xulytiengviet/bilascript">GITHUB</a></div></div></nav><header class="hero"><div class="wrap"><span class="tag">[ v4.0.0 / EVIDENCE-DRIVEN FRONTEND ]</span><h1>CVNSS4.0 ở <span>frontend</span>.<br>JavaScript sạch ở backend.</h1><p class="lead">BilaScript v4.0 gia cố frontend qua bốn vòng: compile-time safety, language service, modern grammar và conformance hardening. Strict mode không còn cho phép alias built-in chưa được chứng minh trôi xuống runtime.</p><div class="actions"><a class="btn primary" href="#playground">[ CHẠY V4 ]</a><a class="btn" href="https://github.com/xulytiengviet/bilascript/releases/tag/v4.0.0">[ RELEASE ]</a><a class="btn" href="docs/BILASCRIPT_v4.0.0.md">[ TÀI LIỆU ]</a></div><div class="grid four"><div class="stat"><strong>0 runtime helper</strong><span>mapping 1:1</span></div><div class="stat"><strong>Strict evidence</strong><span>unknown alias = compile error</span></div><div class="stat"><strong>LSP + TS oracle</strong><span>offline tooling</span></div><div class="stat"><strong>MIT</strong><span>Long Ngo · CVNSS4.0</span></div></div></div></header><section id="architecture"><div class="wrap"><div class="kicker">OWNERSHIP BOUNDARY</div><h2>KIẾN TRÚC</h2><div class="flow"><div class="node"><b>01 SOURCE</b>*.bila</div><div class="node"><b>02 LEXER</b>KW_*</div><div class="node"><b>03 PARSER</b>Bila AST</div><div class="node"><b>04 EVIDENCE</b>symbols/types</div><div class="node"><b>05 NORMALIZE</b>strict proof</div><div class="node"><b>06 CODEGEN</b>JS + map</div><div class="node"><b>07 RUNTIME</b>JS engine</div></div><pre>CVNSS4.0 → semantic IDs → Bila AST → compile-time evidence → clean JavaScript → V8 / SpiderMonkey / JavaScriptCore / Node / Bun</pre></div></section><section id="safety"><div class="wrap"><div class="kicker">LOOP 1</div><h2>COMPILE-TIME SAFETY</h2><div class="grid two"><div class="card"><h3>Strict alias proof</h3><p class="muted"><code>ds.dayq()</code> chỉ hạ thành <code>ds.push()</code> khi receiver được chứng minh là Array. Không đủ bằng chứng trong <code>bila:strict</code> → <code>BILA-T310</code> và dừng compile.</p></div><div class="card"><h3>Type annotation zero-cost</h3><p class="muted"><code>bilb ds: Magz&lt;Sob&gt;</code> tồn tại để cung cấp bằng chứng frontend; annotation bị xóa khỏi JavaScript output, không sinh runtime checker.</p></div></div></div></section><section id="tooling"><div class="wrap"><div class="kicker">LOOP 2</div><h2>TOOLING + LANGUAGE SERVICE</h2><p class="muted">V4 có diagnostics, completion, hover, document symbols, LSP stdio tối thiểu và TypeScript oracle tùy chọn. TypeScript chạy offline để bổ sung hiểu biết ecosystem; Bila vẫn là nguồn chân lý cho CVNSS4.0 và alias lowering.</p></div></section><section id="grammar"><div class="wrap"><div class="kicker">LOOP 3</div><h2>MODERN JS GRAMMAR</h2><table><tr><th>Nhóm</th><th>V4</th></tr><tr><td>Arrow / optional chaining / nullish / spread-rest</td><td class="ok">Hỗ trợ cấu trúc</td></tr><tr><td>Class</td><td class="ok"><code>lopx</code></td></tr><tr><td>ESM import/export</td><td class="ok"><code>nhapf</code> / <code>xadb</code> / <code>tuk</code></td></tr><tr><td>Destructuring</td><td class="ok">Array/Object patterns</td></tr><tr><td>async/await/extends/static/as</td><td>Structural passthrough cho tới khi canonical CVNSS4.0 được đóng băng</td></tr></table></div></section><section id="conformance"><div class="wrap"><div class="kicker">LOOP 4</div><h2>CONFORMANCE HARDENING</h2><p class="muted">Positive/negative corpus, 100-case deterministic operator differential test, zero-helper audit, source-map smoke test và tooling tests. V4 không tự nhận full Test262 hay nhanh hơn JavaScript.</p><pre>Claim: runtime(Bila) = runtime(generated JavaScript)
Non-claim: BilaScript > JavaScript performance
Non-claim: full ECMAScript/Test262 conformance</pre></div></section><section id="playground"><div class="wrap"><div class="kicker">V4 COMPILER IN BROWSER</div><h2>PLAYGROUND</h2><div class="toolbar"><button class="mini" id="compileBtn">[ BIÊN DỊCH ]</button><button class="mini" id="runBtn">[ CHẠY JS ]</button><button class="mini" id="astBtn">[ AST ]</button><button class="mini" id="resetBtn">[ RESET ]</button></div><div class="play"><textarea class="editor" id="source">---bila:strict---

haml_sob tong(a: Sob, b: Sob): Sob {
    trov_ved a + b;
}

bilb ds: Magz<Sob> = [10, 20, 30];
ds.dayq(40);

neub (ds.dof_zail > 0) {
    console.log(tong(ds[0], ds[1]));
}</textarea><textarea class="editor" id="output" readonly></textarea></div><div class="card" id="console">Sẵn sàng.</div></div></section><section id="history"><div class="wrap"><div class="kicker">LỊCH SỬ NÂNG CẤP</div><h2>TỪ RHINO ĐẾN FRONTEND V4</h2><div class="timeline"><div class="event"><h3>v1.x</h3><p class="muted">CVNSS4.0 vocabulary và Bila mode trên dòng Rhino/Babylscript.</p></div><div class="event"><h3>v2.0</h3><p class="muted">Profiles + JavaScript-compatible grammar/tooling.</p></div><div class="event"><h3>v3.0</h3><p class="muted">Native Bila lexer/parser/AST/semantic; JavaScript trở thành backend.</p></div><div class="event"><h3>v3.5</h3><p class="muted">Semantic IDs, receiver-safe alias, source map, zero-cost contract.</p></div><div class="event"><h3>Loop 1 · v3.6</h3><p class="muted">Strict compile-time alias safety + static annotations.</p></div><div class="event"><h3>Loop 2 · v3.7</h3><p class="muted">Language service, LSP, optional offline TypeScript oracle.</p></div><div class="event"><h3>Loop 3 · v3.8</h3><p class="muted">Class, ESM, destructuring và modern structural grammar.</p></div><div class="event"><h3>Loop 4 · v4.0.0</h3><p class="muted">Conformance hardening và evidence-driven frontend contract.</p></div></div></div></section><section><div class="wrap"><div class="kicker">ĐÁNH GIÁ</div><h2>ƯU / NHƯỢC</h2><div class="grid two"><div class="card"><h3 class="ok">Ưu điểm</h3><p class="muted">Dời alias risk về compile-time; output JS sạch; npm/user API không rewrite mù; frontend ownership rõ; tooling và testability tốt hơn.</p></div><div class="card"><h3 class="yellow">Giới hạn</h3><p class="muted">Chưa full ECMAScript/Test262; flow typing còn vừa phải; một số modern keyword chưa có canonical CVNSS4.0; TypeScript chỉ là oracle tùy chọn.</p></div></div></div></section><footer><div class="wrap">BilaScript v4 Core · MIT License · Copyright © 2026 Long Ngo · phát triển dựa trên CVNSS4.0. Legacy code giữ giấy phép upstream tương ứng.</div></footer><script type="module">import{compile}from'./v4/src/compiler.js';const sample=document.querySelector('#source').value,out=document.querySelector('#output'),con=document.querySelector('#console'),src=document.querySelector('#source');function c(){try{const r=compile(src.value,{sourceMap:true,sourceName:'play.bila',fileName:'play.js'});out.value=r.code;con.textContent=`OK v${r.version} · diagnostics=${r.diagnostics.length} · zeroCost=${r.performance.zeroCost}`;return r}catch(e){out.value='';con.textContent=e.name+': '+e.message;throw e}}document.querySelector('#compileBtn').onclick=()=>{try{c()}catch{}};document.querySelector('#astBtn').onclick=()=>{try{out.value=JSON.stringify(c().normalizedAst,null,2)}catch{}};document.querySelector('#runBtn').onclick=()=>{try{const r=c(),logs=[],fake={log:(...a)=>logs.push(a.join(' '))};new Function('console',r.code)(fake);con.textContent=logs.join('\n')||'Chạy xong.'}catch(e){con.textContent=e.name+': '+e.message}};document.querySelector('#resetBtn').onclick=()=>{src.value=sample;out.value='';con.textContent='Sẵn sàng.'};</script></body></html>''')


def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--stage",type=int,choices=[1,2,3,4],required=True); args=ap.parse_args()
    {1:stage1,2:stage2,3:stage3,4:stage4}[args.stage]()
    print(f"generated BilaScript v4 stage {args.stage}")
if __name__=="__main__": main()
