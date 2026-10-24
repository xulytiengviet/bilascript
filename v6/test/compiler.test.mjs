import test from "node:test";
import assert from "node:assert/strict";
import {compileBila,encodeCall,keccak256,disassemble,EXAMPLE} from "../compiler.mjs";

test("keccak256 uses Ethereum Keccak, not NIST SHA3",()=>{
  assert.equal(keccak256(""),"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
  assert.equal(keccak256("transfer(address,uint256)").slice(2,10),"a9059cbb");
  assert.equal(keccak256("set(uint256)").slice(2,10),"60fe47b1");
});
test("native compiler emits real creation/runtime hex and ABI selectors",()=>{
  const r=compileBila(EXAMPLE);
  assert.match(r.creationBytecode,/^0x(?:[0-9a-f]{2})+$/);
  assert.match(r.runtimeBytecode,/^0x(?:[0-9a-f]{2})+$/);
  assert.equal(r.compiler,"BilaScript-v6.0-native-evm-subset");
});
test("creation prelude length and code offset are exact",()=>{
  const r=compileBila(EXAMPLE);
  const b=r.creationBytecode.slice(2),runtime=r.runtimeBytecode.slice(2),len=runtime.length/2;
  assert.equal(parseInt(b.slice(2,6),16),len);
  assert.equal(parseInt(b.slice(8,12),16),15);
  assert.equal(b.slice(30),runtime);
});
test("selectors, slots, calldata and supported grammar",()=>{
  const r=compileBila(EXAMPLE);
  assert.deepEqual(Object.keys(r.methods),["gan","tang","doc"]);
  assert.equal(r.methods.gan.selector,keccak256("gan(uint256)").slice(0,10));
  assert.equal(r.methods.doc.signature,"doc()");
  assert.equal(r.methods.tang.operation,"inc");
  assert.equal(encodeCall(r.methods.gan,"42"),r.methods.gan.selector+"0".repeat(62)+"2a");
  assert.equal(encodeCall(r.methods.doc),r.methods.doc.selector);
  assert.equal(r.abi[2].stateMutability,"view");
  assert.ok(r.opcodes.some(x=>x.name==="SSTORE"));
  assert.ok(r.opcodes.some(x=>x.name==="SLOAD"));
  assert.ok(r.opcodes.some(x=>x.name==="REVERT"));
});
test("fail closed on unsupported logic, extra tokens and invalid uint256",()=>{
  for(const src of [
    "hop_dong X { uint256 a; haml_sob f() public { a = a + 2; } }",
    "hop_dong X { uint256 a; haml_sob f() public { a = a + 1; a = a + 1; } }",
    "hop_dong X { uint256 a; haml_sob f() public { a = b; } }",
    "hop_dong X { uint256 a; haml_sob f() public view returns(uint256) { trov_ved a; } } !",
    "hop_dong X { uint256 a; haml_sob f() public { delete a; } }"
  ])assert.throws(()=>compileBila(src),/BILA-EVM6/);
  const m=compileBila(EXAMPLE).methods.gan;
  assert.throws(()=>encodeCall(m,"-1"),/BILA-EVM6/);
  assert.throws(()=>encodeCall(m,1n<<256n),/BILA-EVM6/);
});
test("assembler disassembly has only known opcodes and valid jump destinations",()=>{
  const r=compileBila(EXAMPLE);
  const ops=disassemble(r.runtimeBytecode);
  assert.ok(ops.length>20);
  assert.equal(ops.filter(o=>o.name==="UNKNOWN").length,0);
  const dest=new Set(ops.filter(o=>o.name==="JUMPDEST").map(o=>o.pc));
  for(let i=0;i<ops.length;i++)if(ops[i].name==="JUMPI"){
    assert.equal(ops[i-1].name,"PUSH2");
    assert.ok(dest.has(Number.parseInt(ops[i-1].immediate,16)));
  }
});
