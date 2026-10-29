import test from "node:test";
import assert from "node:assert/strict";
import {EXAMPLE} from "../../v6/compiler.mjs";
import {lowerSource,verifyIR,compileVerified,executeIR,differentialIR} from "../core/ir.mjs";
import {encodeT27,decodeT27,encodeUtf8Trits,decodeUtf8Trits,toBalanced,fromBalanced,addU256Ternary,MAX_U256} from "../core/ternary.mjs";

test("BilaIR compiler retains v6 EVM identity and typed function operations",()=>{
 const result=compileVerified(EXAMPLE);
 assert.equal(result.verification.ok,true);
 assert.deepEqual(result.ir.functions.map(f=>f.operation),["set","inc","get"]);
 assert.equal(result.backend.bytecode,result.reference.runtimeBytecode);
 assert.equal(result.ir.storageLayout[0].slot,0);
});
test("Fail-closed: reject malformed and forged IR",()=>{
 const {ir}=lowerSource(EXAMPLE);
 const invalid=structuredClone(ir);
 invalid.functions[0].nodes[3].args=[3,1];
 assert.equal(verifyIR(invalid).ok,false);
 const unguarded=structuredClone(ir);
 unguarded.functions[0].nodes[3].kind="not-owner";
 assert.equal(verifyIR(unguarded).ok,false);
 const redirect=structuredClone(ir);
 redirect.functions[1].nodes[7].slot=2;
 assert.equal(verifyIR(redirect).ok,false);
});
test("T27 roundtrip includes spaces and rejects unsupported Unicode",()=>{
 for (const input of ["","abc xyz","abcdefghijklmnopqrstuvwxyz "])
  assert.equal(decodeT27(encodeT27(input)),input);
 assert.throws(()=>encodeT27("Tiếng Việt"),/T27/);
});
test("UTF-8 six trits per byte supports Unicode CVNSS and line breaks",()=>{
 const input="Tiếng Việt — BilaScript + tam phân\n🎓";
 const encoded=encodeUtf8Trits(input);
 assert.equal(encoded.length,new TextEncoder().encode(input).length*6);
 assert.equal(decodeUtf8Trits(encoded),input);
});
test("Balanced integer and uint256 exact arithmetic",()=>{
 for(const x of [-30n,-1n,0n,1n,42n])assert.equal(fromBalanced(toBalanced(x,6)),x);
 for(const [a,b] of [[0n,0n],[1n,2n],[42n,1n],[MAX_U256-1n,1n]])
  assert.equal(addU256Ternary(a,b).value,a+b);
 assert.throws(()=>addU256Ternary(MAX_U256,1n),/U256_OVERFLOW/);
});
test("Differential IR interpreter agrees on set, increment and view",()=>{
 const {ir}=lowerSource(EXAMPLE);
 const state=Array(ir.storageLayout.length).fill(0n);
 const base={caller:"0xabc",owner:"0xabc",param:42n};
 for(const f of ir.functions){
  const x=differentialIR(ir,f.name,state,base);
  assert.equal(x.match,true);
 }
 assert.throws(()=>executeIR(ir,ir.functions[1].name,state,{caller:"0x01",owner:"0x02"}),/owner guard/);
});
