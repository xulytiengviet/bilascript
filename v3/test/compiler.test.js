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
