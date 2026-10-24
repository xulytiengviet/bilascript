/**
 * Seeded, REAL EVM differential fuzzing on Anvil chain 31337.
 * Compare BilaScript native codegen with independent solc-js reference
 * for returned bytes, call reverts, tx status, storage and deployment behavior.
 * No mock, no public RPC, no private keys.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {compileBila,encodeCall,keccak256} from "../compiler.mjs";
const require=createRequire(import.meta.url);
const solc=require("solc");
const RPC="http://127.0.0.1:8545";
const MAX=(1n<<256n)-1n;
const SEEDS=Number(process.env.FUZZ_SEEDS??"24");
const STEPS=Number(process.env.FUZZ_STEPS??"14");
const START=Number(process.env.FUZZ_START??"20261024");
const OUT=process.env.FUZZ_REPORT||"v6/test-results/differential-fuzz.json";
if(!Number.isSafeInteger(START)||START<0||!Number.isInteger(SEEDS)||SEEDS<1||SEEDS>500||
 !Number.isInteger(STEPS)||STEPS<10||STEPS>200)throw Error("Invalid FUZZ_START/SEEDS/STEPS");
let rpcId=0;
async function rpc(method,params=[]){
 const response=await fetch(RPC,{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({jsonrpc:"2.0",id:++rpcId,method,params}),
  signal:AbortSignal.timeout(18000)});
 if(!response.ok)throw Error("Local RPC HTTP "+response.status);
 const json=await response.json();
 if(json.error)throw Error("RPC "+method+": "+JSON.stringify(json.error));
 return json.result;
}
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function receipt(hash){
 for(let i=0;i<50;i++){const x=await rpc("eth_getTransactionReceipt",[hash]);if(x)return x;await sleep(100);}
 throw Error("Anvil mining timeout: "+hash);
}
async function transact({from,to,data,value="0x0"}){
 const tx={from,data,value,gas:"0x0f4240"};
 if(to)tx.to=to;
 return receipt(await rpc("eth_sendTransaction",[tx]));
}
async function call(tx){
 try{return {ok:true,data:(await rpc("eth_call",[tx,"latest"])).toLowerCase()};}
 catch(e){if(String(e).includes("RPC eth_call:"))return {ok:false};throw e;}
}
function rng(seed){let x=(seed>>>0)||0x9e3779b9;return ()=>{
 x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};}
const asInt=x=>BigInt(x||"0x0");
const h=x=>"0x"+x.toString(16);
function randomUint(next){
 const kind=next()%11;
 if(kind===0)return 0n;if(kind===1)return 1n;
 if(kind===2)return MAX;if(kind===3)return MAX-1n;
 if(kind===4)return (1n<<64n)-1n;
 if(kind===5)return (1n<<128n);
 if(kind===6)return 42n;
 return (BigInt(next())<<224n)|(BigInt(next())<<160n)|
  (BigInt(next())<<96n)|(BigInt(next())<<32n)|BigInt(next());
}
function generate(seed,next){
 const count=1+next()%4,name="Bof_Demb_"+seed;
 const fields=Array.from({length:count},(_,i)=>"demb_"+i);
 const functions=[];
 for(let i=0;i<count;i++){
  functions.push({name:"ganj_"+i,op:"set",field:fields[i]});
  functions.push({name:"tago_"+i,op:"inc",field:fields[i]});
  functions.push({name:"docr_"+i,op:"get",field:fields[i]});
 }
 const bila=["hoph_dogd "+name+" {"];
 const solidity=["// SPDX-License-Identifier: MIT","pragma solidity ^0.8.20;","contract "+name+" {",
 "address private __bila_owner;"];
 for(const field of fields){bila.push("sob_wyly_kogy_zaub_256 "+field+";");
  solidity.push("uint256 private "+field+";");}
 solidity.push("constructor() { __bila_owner = msg.sender; }");
 solidity.push("modifier chi_chu() { require(msg.sender == __bila_owner, 'owner'); _; }");
 for(const f of functions){
  if(f.op==="set"){
   bila.push("haml_sob "+f.name+"(sob_wyly_kogy_zaub_256 jaj_trir) cogy_kai chi_chu { "+f.field+" = jaj_trir; }");
   solidity.push("function "+f.name+"(uint256 jaj_trir) public chi_chu { "+f.field+" = jaj_trir; }");
  }else if(f.op==="inc"){
   bila.push("haml_sob "+f.name+"() cogy_kai chi_chu { "+f.field+" = "+f.field+" + 1; }");
   solidity.push("function "+f.name+"() public chi_chu { "+f.field+" = "+f.field+" + 1; }");
  }else{
   bila.push("haml_sob "+f.name+"() cogy_kai chiz_docr traz_ved(sob_wyly_kogy_zaub_256) { trov_ved "+f.field+"; }");
   solidity.push("function "+f.name+"() public view returns(uint256) { return "+f.field+"; }");
  }
 }
 bila.push("}");solidity.push("}");
 return {name,fields,functions,bila:bila.join("\n"),solidity:solidity.join("\n")};
}
function reference(source,name){
 const input={language:"Solidity",sources:{"Reference.sol":{content:source}},
 settings:{optimizer:{enabled:false},outputSelection:{"*":{"*":[
  "abi","evm.bytecode.object","evm.methodIdentifiers","storageLayout"]}}}};
 const out=JSON.parse(solc.compile(JSON.stringify(input)));
 const errors=(out.errors||[]).filter(x=>x.severity==="error");
 if(errors.length)throw Error(errors.map(x=>x.formattedMessage).join("\n"));
 return out.contracts["Reference.sol"][name];
}
async function storage(addr,length){
 const xs=[];
 for(let i=0;i<length;i++)xs.push(asInt(await rpc("eth_getStorageAt",[addr,h(BigInt(i)),"latest"])).toString());
 return xs;
}
const report={
 schema:"bilascript.evm.differential-fuzz.v1",
 network:"LOCAL_ANVIL_31337_NOT_SEPOLIA",compiler:"BilaScript v6.0.1 native",
 solc:solc.version(),settings:{start:START,seeds:SEEDS,steps:STEPS},
 status:"RUNNING",counts:{programs:0,operations:0,callReverts:0,txReverts:0},
 cases:[],failures:[]
};
function save(){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(report,null,2)+"\n");}
let active=null;
try{
 assert.equal(asInt(await rpc("eth_chainId")),31337n,"Refuse nonlocal EVM chain");
 const accounts=await rpc("eth_accounts");
 assert.ok(accounts.length>=2,"Need Anvil with 2 unlocked accounts");
 const owner=accounts[0],other=accounts[1];
 for(let i=0;i<SEEDS;i++){
  const seed=START+i,next=rng(seed),p=generate(seed,next);
  active={seed,step:-1,bila:p.bila,solidity:p.solidity};
  const bila=compileBila(p.bila),ref=reference(p.solidity,p.name);
  assert.equal(bila.storageLayout.length,p.fields.length+1);
  assert.equal(ref.storageLayout.storage.length,p.fields.length+1);
  for(const f of p.functions){
   const sig=f.name+(f.op==="set"?"(uint256)":"()");
   assert.equal(bila.methods[f.name].selector,"0x"+ref.evm.methodIdentifiers[sig]);
   assert.equal(bila.methods[f.name].selector,keccak256(sig).slice(0,10));
  }
  const a=await transact({from:owner,data:bila.creationBytecode});
  const b=await transact({from:owner,data:"0x"+ref.evm.bytecode.object});
  assert.equal(asInt(a.status),1n);assert.equal(asInt(b.status),1n);
  const A=a.contractAddress,B=b.contractAddress;
  assert.ok(A&&B);
  assert.equal((await rpc("eth_getCode",[A,"latest"])).toLowerCase(),bila.runtimeBytecode.toLowerCase());
  const record={seed,fields:p.fields,contracts:{bila:A,solc:B},steps:[],constructorNonpayable:null};
  const sameStorage=async()=>{
   const x=await storage(A,p.fields.length+1);
   const y=await storage(B,p.fields.length+1);
   assert.deepEqual(x,y,"Storage divergence including owner slot");
   assert.equal(BigInt(x[0]),BigInt(owner));
   return x;
  };
  await sameStorage();
  for(let step=0;step<STEPS;step++){
   active.step=step;
   const idx=next()%p.fields.length,choice=step<10?step:next()%10;
   const field=p.fields[idx];
   const set=p.functions.find(f=>f.field===field&&f.op==="set");
   const inc=p.functions.find(f=>f.field===field&&f.op==="inc");
   const get=p.functions.find(f=>f.field===field&&f.op==="get");
   const from=(choice===3||choice===6)?other:owner;
   let data="",action="",value="0x0",read=false;
   if([0,3,5,8].includes(choice)){
    action=choice===3?"unauthorized-set":"set";
    data=encodeCall(bila.methods[set.name],choice===5?MAX:randomUint(next));
   }else if([1,4,6,9].includes(choice)){
    action=choice===6?"unauthorized-increment":"increment";
    data=encodeCall(bila.methods[inc.name]);
   }else if(choice===2){
    action="getter";read=true;data=encodeCall(bila.methods[get.name]);
   }else if(choice===7){
    action="nonpayable-callvalue";read=true;value="0x1";
    data=encodeCall(bila.methods[get.name]);
   }else{
    action="unknown-selector";read=true;data="0xdeadbeef";
   }
   if(step===STEPS-1){
    action="short-uint256-calldata";data=bila.methods[set.name].selector;read=true;
   }
   const ca=await call({from,to:A,data,value});
   const cb=await call({from,to:B,data,value});
   assert.equal(ca.ok,cb.ok,action+" call status divergence");
   if(ca.ok)assert.equal(ca.data,cb.data,action+" return-data divergence");
   const e={step,action,field,caller:from===owner?"owner":"other",
    calldata:data,value,call:ca.ok?"ok":"revert"};
   if(!ca.ok)report.counts.callReverts++;
   if(!read){
    const txA=await transact({from,to:A,data,value});
    const txB=await transact({from,to:B,data,value});
    e.statusBila=asInt(txA.status).toString();
    e.statusSolc=asInt(txB.status).toString();
    e.gasUsedBila=asInt(txA.gasUsed).toString();
    e.gasUsedSolc=asInt(txB.gasUsed).toString();
    assert.equal(e.statusBila,e.statusSolc,action+" transaction result divergence");
    if(e.statusBila==="0")report.counts.txReverts++;
   }
   e.storage=await sameStorage();
   record.steps.push(e);report.counts.operations++;
  }
  // Explicit overflow oracle: set MAX, then increment must revert on BOTH EVMs.
  // This ensures every seed checks the boundary, not just probability of random operations.
  const target=p.functions.find(f=>f.op==="set"&&f.field===p.fields[0]);
  const incr=p.functions.find(f=>f.op==="inc"&&f.field===p.fields[0]);
  const setMax=encodeCall(bila.methods[target.name],MAX);
  const incrMax=encodeCall(bila.methods[incr.name]);
  const setA=await transact({from:owner,to:A,data:setMax});
  const setB=await transact({from:owner,to:B,data:setMax});
  assert.equal(asInt(setA.status),1n);assert.equal(asInt(setB.status),1n);
  assert.deepEqual(await sameStorage(),await storage(B,p.fields.length+1));
  const overflowCallA=await call({from:owner,to:A,data:incrMax});
  const overflowCallB=await call({from:owner,to:B,data:incrMax});
  assert.equal(overflowCallA.ok,false,"Bila must REVERT on uint256 MAX + 1");
  assert.equal(overflowCallB.ok,false,"Solc must REVERT on uint256 MAX + 1");
  report.counts.callReverts+=2;
  const overA=await transact({from:owner,to:A,data:incrMax});
  const overB=await transact({from:owner,to:B,data:incrMax});
  assert.equal(asInt(overA.status),0n);assert.equal(asInt(overB.status),0n);
  report.counts.txReverts+=2;
  record.steps.push({step:STEPS,action:"boundary_set_max",field:p.fields[0],call:"success",
    transaction:"both_success",storage:await sameStorage()});
  record.steps.push({step:STEPS+1,action:"boundary_overflow_checked",field:p.fields[0],
    call:"both_revert",transaction:"both_revert",storage:await sameStorage()});
  report.counts.operations+=2;
  // Constructor must revert if ETH is provided, for both compilers.
  const badA=await transact({from:owner,data:bila.creationBytecode,value:"0x1"});
  const badB=await transact({from:owner,data:"0x"+ref.evm.bytecode.object,value:"0x1"});
  assert.equal(asInt(badA.status),0n);
  assert.equal(asInt(badB.status),0n);
  record.constructorNonpayable="both_reverted";
  report.cases.push(record);report.counts.programs++;
  if(i%8===7){save();console.log("DIFF PROGRESS",i+1,"/",SEEDS,report.counts.operations);}
 }
 report.status="PASS";save();
 console.log("DIFF PASS",JSON.stringify({programs:report.counts.programs,operations:report.counts.operations,
  callReverts:report.counts.callReverts,txReverts:report.counts.txReverts,report:OUT}));
}catch(e){
 report.status="FAIL";
 report.failures.push({seed:active?.seed,step:active?.step,
  bila:active?.bila,solidity:active?.solidity,message:String(e?.stack||e)});
 save();
 console.error("DIFF FAIL",String(e?.stack||e),"repro FUZZ_START="+active?.seed+" FUZZ_SEEDS=1");
 process.exitCode=1;
}
