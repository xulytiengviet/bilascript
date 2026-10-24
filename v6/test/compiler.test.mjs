import test from "node:test";
import assert from "node:assert/strict";
import {compileBila,encodeCall,keccak256,disassemble,EXAMPLE} from "../compiler.mjs";

test("Ethereum Keccak-256 reference vectors",()=>{
  assert.equal(keccak256(""),"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
  assert.equal(keccak256("transfer(address,uint256)").slice(2,10),"a9059cbb");
});
test("CVNSS4.0 native source and original bilingual source share canonical ABI semantics",()=>{
  const c=compileBila(EXAMPLE);
  const legacy=compileBila("hop_dong B { uint256 dem; haml_sob gan(uint256 n) public chi_chu { dem = n; } haml_sob tang() public chi_chu { dem = dem + 1; } haml_sob doc() public view returns(uint256) { trov_ved dem; } }");
  assert.equal(c.ast.name,"Bof_Demb");
  assert.deepEqual(Object.keys(c.methods),["ganj","tago","docr"]);
  assert.equal(c.compiler,"BilaScript-v6.0.1-native-evm");
  assert.equal(legacy.methods.gan.operation,c.methods.ganj.operation);
  assert.ok(c.abi.every(f=>f.inputs.every(a=>a.type==="uint256")));
  assert.equal(c.abi[2].stateMutability,"view");
});
test("typed semantic analysis, disassembly, ABI and storage layout",()=>{
  const c=compileBila(EXAMPLE);
  assert.equal(c.typeSystem,"checked-uint256-subset");
  assert.equal(c.storageLayout[0].name,"__bila_owner");
  assert.equal(c.storageLayout[0].slot,0);
  assert.equal(c.storageLayout[1].slot,1);
  assert.equal(c.methods.ganj.slot,1);
  assert.equal(c.methods.tago.ownerOnly,true);
  assert.equal(c.methods.ganj.selector,keccak256("ganj(uint256)").slice(0,10));
  assert.equal(encodeCall(c.methods.ganj,"42"),c.methods.ganj.selector+"0".repeat(62)+"2a");
  assert.equal(encodeCall(c.methods.docr),c.methods.docr.selector);
  assert.ok(c.opcodes.some(x=>x.name==="CALLVALUE"));
  assert.ok(c.opcodes.some(x=>x.name==="CALLER"));
  assert.ok(c.opcodes.some(x=>x.name==="SSTORE"));
  assert.ok(c.opcodes.some(x=>x.name==="REVERT"));
  assert.equal(c.opcodes.filter(x=>x.name==="UNKNOWN").length,0);
});
test("constructor deployer slot0, nonpayable initcode and exact runtime offset",()=>{
  const c=compileBila(EXAMPLE),b=c.creationBytecode.slice(2),rt=c.runtimeBytecode.slice(2);
  const prefix="341561000b5760006000fd5b33600055";
  assert.ok(b.startsWith(prefix));
  assert.equal(parseInt(b.slice(32+2,32+6),16),rt.length/2);
  assert.equal(parseInt(b.slice(32+8,32+12),16),31);
  assert.equal(b.slice(62),rt);
  assert.match(c.creationBytecode,/^0x(?:[0-9a-f]{2})+$/);
});
test("all jumps land on JUMPDEST including owner/nonpayable gates",()=>{
  const c=compileBila(EXAMPLE),ops=disassemble(c.runtimeBytecode);
  const dest=new Set(ops.filter(o=>o.name==="JUMPDEST").map(o=>o.pc));
  for(let i=1;i<ops.length;i++)if(ops[i].name==="JUMPI"){
    assert.equal(ops[i-1].name,"PUSH2");
    assert.ok(dest.has(Number.parseInt(ops[i-1].immediate,16)));
  }
});
test("reject unguarded writes, view writes, unknown vars, unsupported types and operations",()=>{
  const invalid=[
   "hop_dong X { uint256 a; haml_sob f(uint256 v) public { a = v; } }",
   "hop_dong X { uint256 a; haml_sob f() public { a = a + 1; } }",
   "hop_dong X { uint256 a; haml_sob f() public chi_chu view { a = a + 1; } }",
   "hop_dong X { uint256 a; haml_sob f(uint256 v) public chi_chu { b = v; } }",
   "hop_dong X { uint256 a; haml_sob f(uint256 a) public chi_chu { a = a; } }",
   "hop_dong X { uint256 a; haml_sob f() public chi_chu { a = a + 2; } }",
   "hop_dong X { address a; haml_sob f() public view returns(uint256) { trov_ved a; } }",
   "hop_dong X { uint256 a; haml_sob f() public chi_chu { a = a + 1; a = a + 1; } }",
   "hop_dong X { uint256 a; haml_sob f() public view returns(uint256) { trov_ved missing; } }"
  ];
  for(const s of invalid)assert.throws(()=>compileBila(s),/BILA-EVM6/,s);
  assert.throws(()=>encodeCall(compileBila(EXAMPLE).methods.ganj,"-1"),/BILA-EVM6/);
  assert.throws(()=>encodeCall(compileBila(EXAMPLE).methods.ganj,1n<<256n),/BILA-EVM6/);
});
