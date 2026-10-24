/**
 * TRUE Anvil EVM test of BilaScript's CVNSS4.0 source → native EVM contract.
 * No solc, no token artifacts, no simulated chain; chain ID 31337 only.
 */
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {compileBila,encodeCall} from "../compiler.mjs";
const source=readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
const build=compileBila(source);
let id=0;
async function rpc(method,params=[]){
 const resp=await fetch("http://127.0.0.1:8545",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id:++id,method,params})
 });
 if(!resp.ok)throw Error("RPC status "+resp.status);
 const data=await resp.json();
 if(data.error)throw Error(method+" "+JSON.stringify(data.error));
 return data.result;
}
const num=v=>BigInt(v??"0x0");
async function receipt(hash){
 for(let i=0;i<50;i++){
  const result=await rpc("eth_getTransactionReceipt",[hash]);
  if(result)return result;
  await new Promise(ok=>setTimeout(ok,90));
 }
 throw Error("Receipt timeout");
}
async function send(from,address,method,arg){
 const info=build.methods[method];
 const hash=await rpc("eth_sendTransaction",[{
  from,...(address?{to:address}:{}),
  data:address?encodeCall(info,arg):build.creationBytecode,
  gas:"0x7a1200",value:"0x0"
 }]);
 return receipt(hash);
}
async function view(contract,method){
 const raw=await rpc("eth_call",[{to:contract,data:encodeCall(build.methods[method])},"latest"]);
 return num(raw);
}
assert.equal(num(await rpc("eth_chainId")),31337n);
const [owner,other]=await rpc("eth_accounts");
const deployment=await send(owner,null);
assert.equal(num(deployment.status),1n);
assert.ok(deployment.contractAddress);
const addr=deployment.contractAddress;
assert.equal((await rpc("eth_getCode",[addr,"latest"])).toLowerCase(),build.runtimeBytecode.toLowerCase());
const ownerWord=await rpc("eth_getStorageAt",[addr,"0x0","latest"]);
assert.equal(num(ownerWord),num(owner));
const writes=[
 ["dat_phien_ban", "doc_phien_ban", 7n,1],
 ["dat_bo_du_lieu","doc_bo_du_lieu",20261024n,2],
 ["dat_so_mau","doc_so_mau",100n,3],
 ["dat_kiem_dinh","doc_kiem_dinh",55n,4],
 ["dat_xac_nhan","doc_xac_nhan",12n,5],
 ["dat_chat_luong","doc_chat_luong",98n,6],
 ["dat_phien_thu","doc_phien_thu",3n,7],
 ["dat_bang_chung","doc_bang_chung",998877n,8]
];
for(const [set,get,value,slot] of writes){
 const tx=await send(owner,addr,set,value);
 assert.equal(num(tx.status),1n,set);
 assert.equal(await view(addr,get),value,get);
 assert.equal(num(await rpc("eth_getStorageAt",[addr,"0x"+slot.toString(16),"latest"])),value);
}
const incr=[
 ["tang_phien_ban","doc_phien_ban"],
 ["tang_so_mau","doc_so_mau"],
 ["tang_kiem_dinh","doc_kiem_dinh"],
 ["tang_xac_nhan","doc_xac_nhan"],
 ["tang_phien_thu","doc_phien_thu"],
 ["tang_bang_chung","doc_bang_chung"]
];
for(const [inc,get] of incr){
 const before=await view(addr,get);
 const tx=await send(owner,addr,inc);
 assert.equal(num(tx.status),1n,inc);
 assert.equal(await view(addr,get),before+1n);
}
// No write permission for a different caller.
const rejectedCall=await rpc("eth_call",[{to:addr,data:encodeCall(build.methods.dat_so_mau,"500"),from:other},"latest"])
 .then(()=>false,()=>true);
assert.equal(rejectedCall,true,"Nonowner write must revert");
const sent=await rpc("eth_sendTransaction",[{
 from:other,to:addr,data:encodeCall(build.methods.dat_so_mau,"500"),gas:"0x25000"
}]);
assert.equal(num((await receipt(sent)).status),0n,"Unauthorized tx must revert");
assert.equal(await view(addr,"doc_so_mau"),101n);
// Non-payable and invalid calldata must revert.
assert.equal(await rpc("eth_call",[{to:addr,data:encodeCall(build.methods.doc_so_mau),value:"0x1"},"latest"])
 .then(()=>false,()=>true),true);
assert.equal(await rpc("eth_call",[{to:addr,data:"0xffffffff"},"latest"])
 .then(()=>false,()=>true),true);
// Invalid length parameter rejected.
assert.equal(await rpc("eth_call",[{to:addr,data:build.methods.dat_so_mau.selector},"latest"])
 .then(()=>false,()=>true),true);
// Explicit uint256 overflow guard.
const MAX=(1n<<256n)-1n;
assert.equal(num((await send(owner,addr,"dat_phien_ban",MAX)).status),1n);
assert.equal(await rpc("eth_call",[{to:addr,data:encodeCall(build.methods.tang_phien_ban)},"latest"])
 .then(()=>false,()=>true),true);
assert.equal(await view(addr,"doc_phien_ban"),MAX);
console.log("BILASCRIPT_NATIVE_CVNSS40_ANVIL_PASS "+JSON.stringify({
 localOnly:true,chainId:31337,
 contract:addr,compiler:build.compiler,vocabulary:build.vocabulary,
 stateVariables:8,functions:22,
 storageSlots:build.storageLayout.length,
 callsAndStorageMatch:true,ownerVerified:true,
 nonOwnerRevert:true,nonPayableRevert:true,
 unknownSelectorRevert:true,shortCalldataRevert:true,overflowRevert:true,
 creationBytes:(build.creationBytecode.length-2)/2,
 runtimeBytes:(build.runtimeBytecode.length-2)/2
}));
