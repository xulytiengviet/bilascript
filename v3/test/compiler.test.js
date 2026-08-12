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
