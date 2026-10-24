import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {compileBila,encodeCall,keccak256,EXAMPLE} from "../compiler.mjs";
const source=readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
const main=()=>compileBila(source);
test("native CVNSS4.0 research contract is truly compiled by BilaScript without Solidity",()=>{
 assert.match(source,/hoph_dogd Bila_CVNSS40_Native/);
 for(const syntax of ["sob_wyly_kogy_zaub_256","haml_sob","cogy_kai","chi_chu","chiz_docr","traz_ved","trov_ved"])
  assert.ok(source.includes(syntax),"missing CVNSS4.0 primary token "+syntax);
 assert.doesNotMatch(source,/^\s*(?:pragma\s+solidity|import\s+"|contract\s+\w)/m);
 const b=main();
 assert.equal(b.compiler,"BilaScript-v6.0.1-native-evm");
 assert.equal(b.ast.name,"Bila_CVNSS40_Native");
 assert.equal(b.ast.state.length,8);
 assert.equal(b.ast.functions.length,22);
 assert.equal(b.abi.length,22);
 assert.equal(b.storageLayout.length,9);
 assert.equal(b.storageLayout[0].name,"__bila_owner");
 assert.equal(b.storageLayout[0].slot,0);
 assert.equal(b.storageLayout.at(-1).slot,8);
 assert.equal(b.ast.functions.filter(f=>f.op==="set").length,8);
 assert.equal(b.ast.functions.filter(f=>f.op==="get").length,8);
 assert.equal(b.ast.functions.filter(f=>f.op==="inc").length,6);
 assert.ok(b.ast.functions.filter(f=>f.op!=="get").every(f=>f.ownerOnly));
 assert.ok(b.ast.functions.filter(f=>f.op==="get").every(f=>f.view&&f.returns));
 assert.equal(b.opcodes.filter(op=>op.name==="UNKNOWN").length,0);
 assert.ok(b.opcodes.filter(op=>op.name==="CALLER").length>=14);
 assert.ok(b.opcodes.some(op=>op.name==="REVERT"));
 assert.ok(b.opcodes.some(op=>op.name==="SLOAD"));
 assert.ok(b.opcodes.some(op=>op.name==="SSTORE"));
});
test("bytecode creation/runtime are deterministic, same compiler and CVNSS vocabulary profile",()=>{
 const a=main(),b=main();
 assert.equal(a.creationBytecode,b.creationBytecode);
 assert.equal(a.runtimeBytecode,b.runtimeBytecode);
 assert.equal(a.vocabulary,b.vocabulary);
 assert.ok(a.creationBytecode.startsWith("0x341561000b57"));
 assert.ok(a.creationBytecode.endsWith(a.runtimeBytecode.slice(2)));
 assert.match(keccak256(source),/^0x[0-9a-f]{64}$/);
 assert.notEqual(a.creationBytecode,compileBila(EXAMPLE).creationBytecode);
});
test("all 22 selectors are collision-free and ABI decodes uint256 parameters",()=>{
 const b=main();
 const ids=new Set();
 for(const f of b.ast.functions){
  const expected=keccak256(f.signature).slice(0,10);
  assert.equal(f.selector,expected);
  assert.ok(!ids.has(expected),"function selector collision");
  ids.add(expected);
  assert.equal(f.signature,f.name+"("+(f.param?"uint256":"")+")");
  assert.equal(f.slot,b.ast.state.indexOf(f.variable)+1);
  if(f.op==="set"){
   const calldata=encodeCall(b.methods[f.name],"42");
   assert.equal(calldata,expected+"0".repeat(62)+"2a");
  }
 }
});
test("reject unsupported CVNSS semantics: no false ERC20 event, mapping, or arbitrary expressions",()=>{
 const invalid=source.replace("ma_bang_chung = gia_tri;","ma_bang_chung = ma_bang_chung + 5;");
 assert.throws(()=>compileBila(invalid),/chỉ hỗ trợ/);
 assert.doesNotMatch(source,/\bmapping\s*\(|\bemits?\s+Transfer\s*\(/);
});
