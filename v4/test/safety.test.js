
import test from "node:test"; import assert from "node:assert/strict"; import vm from "node:vm"; import { compile } from "../src/compiler.js";
const run=code=>{const logs=[];vm.runInNewContext(code,{console:{log:x=>logs.push(String(x))}});return logs;};
test("stage1: strict proven alias lowers directly",()=>{const r=compile(`---bila:strict---\nbilb ds=[1,2]; ds.dayq(3); console.log(ds.dof_zail);`);assert.match(r.code,/ds\.push\(3\)/);assert.deepEqual(run(r.code),["3"]);});
test("stage1: strict unknown alias is compile-time error",()=>assert.throws(()=>compile(`---bila:strict---\nbilb ds = lay(); ds.dayq(1);`),/BILA-T310/));
test("stage1: default unknown alias is preserved with warning",()=>{const r=compile(`---bila---\nbilb api=lay(); api.dayq(1);`,{failOnSemanticError:false});assert.match(r.code,/api\.dayq\(1\)/);assert.ok(r.diagnostics.some(x=>x.code==="BILA-S310"));});
test("stage1: explicit type annotation proves receiver and erases at codegen",()=>{const r=compile(`---bila:strict---\nbilb ds: Magz<Sob> = lay(); ds.dayq(1);`,{failOnSemanticError:false});assert.match(r.code,/var ds = lay\(\)/);assert.doesNotMatch(r.code,/Magz<Sob>|:\s*Magz/);assert.match(r.code,/ds\.push\(1\)/);});
test("stage1: declared type mismatch fails before runtime",()=>assert.throws(()=>compile(`---bila:strict---\nbilb x: Sob = "sai";`),/BILA-T201/));
test("stage1: zero-cost output contains no Bila runtime helper",()=>{const r=compile(`---bila:strict---\nbilb ds: Magz<Sob>=[1]; ds.dayq(2);`);assert.equal(r.performance.zeroCost,true);assert.doesNotMatch(r.code,/BilaRuntime|BilaArray|__bila/);});
