/**
 * Real Anvil ERC-20 deployment and state-conformance test.
 * LOCAL CHAIN 31337 ONLY; root wallet impersonation is Anvil-only, not a
 * live-wallet signature. Never use eth_sendTransaction from root on Sepolia.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {keccak256} from "../compiler.mjs";
const build=JSON.parse(fs.readFileSync("v6/token/BilaBitlang.build.json","utf8"));
const RPC="http://127.0.0.1:8545",root=build.genesisWallet;
let rid=0;
async function rpc(method,params=[]){
 const response=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({jsonrpc:"2.0",id:++rid,method,params})});
 if(!response.ok)throw Error("Anvil RPC HTTP "+response.status);
 const json=await response.json();
 if(json.error)throw Error("Anvil "+method+": "+JSON.stringify(json.error));
 return json.result;
}
function eq(x,y){assert.equal(String(x).toLowerCase(),String(y).toLowerCase());}
function word(value){
 const v=typeof value==="string"&&value.startsWith("0x")?BigInt(value):BigInt(value);
 return v.toString(16).padStart(64,"0");
}
function selector(signature){return keccak256(signature).slice(2,10);}
function data(signature,args=[]){return "0x"+selector(signature)+args.map(word).join("");}
async function call(to,signature,args=[]){
 return rpc("eth_call",[{to,data:data(signature,args)},"latest"]);
}
async function send(from,to,signature,args=[]){
 const tx={from,to,data:data(signature,args),gas:"0x18a880",value:"0x0"};
 const hash=await rpc("eth_sendTransaction",[tx]);
 return receipt(hash);
}
async function receipt(hash){
 for(let i=0;i<40;i++){
  const r=await rpc("eth_getTransactionReceipt",[hash]);
  if(r)return r;
  await new Promise(ok=>setTimeout(ok,80));
 }
 throw Error("Anvil transaction receipt timed out "+hash);
}
function abiString(result){
 const bytes=result.slice(2);
 const offset=Number(BigInt("0x"+bytes.slice(0,64)))*2;
 const length=Number(BigInt("0x"+bytes.slice(offset,offset+64)));
 return Buffer.from(bytes.slice(offset+64,offset+64+length*2),"hex").toString("utf8");
}
function uint(result){return BigInt(result||"0x0");}
assert.equal(uint(await rpc("eth_chainId")),31337n,"Must be local Anvil, never Sepolia");
const accounts=await rpc("eth_accounts");
assert.ok(accounts.length>=2);
const deployer=accounts[0];
const deploy=await rpc("eth_sendTransaction",[{from:deployer,data:build.creationBytecode,gas:"0x7a1200",value:"0x0"}]);
const first=await receipt(deploy);
assert.equal(uint(first.status),1n);
assert.ok(first.contractAddress);
const contract=first.contractAddress;
eq(await rpc("eth_getCode",[contract,"latest"]),build.runtimeBytecode);
assert.equal(abiString(await call(contract,"name()")),"Bila (Bitlang)");
assert.equal(abiString(await call(contract,"symbol()")),"BILA");
assert.equal(uint(await call(contract,"decimals()")),18n);
assert.equal(uint(await call(contract,"totalSupply()")),BigInt(build.initialSupplyWei));
assert.equal(uint(await call(contract,"GENESIS_TOKENS()")),1000000n);
assert.equal(uint(await call(contract,"GENESIS_WALLET()")),BigInt(root));
assert.equal(uint(await call(contract,"balanceOf(address)",[root])),BigInt(build.initialSupplyWei));
assert.equal(uint(await call(contract,"balanceOf(address)",[deployer])),0n);
const transferTopic=keccak256("Transfer(address,address,uint256)");
const mintLog=first.logs.find(l=>l.topics?.[0]?.toLowerCase()===transferTopic.toLowerCase());
assert.ok(mintLog,"Missing ERC20 mint Transfer event");
assert.equal(uint(mintLog.topics[1]),0n);
assert.equal(uint(mintLog.topics[2]),BigInt(root));
assert.equal(uint(mintLog.data),BigInt(build.initialSupplyWei));
// Only on LOCAL Anvil: impersonate and fund the genesis wallet for test transfers.
await rpc("anvil_impersonateAccount",[root]);
await rpc("anvil_setBalance",[root,"0x56bc75e2d63100000"]);
const unit=10n**18n;
const t=await send(root,accounts[1],"transfer(address,uint256)",[accounts[1],100n*unit]);
assert.equal(uint(t.status),1n);
assert.equal(uint(await call(contract,"balanceOf(address)",[accounts[1]])),100n*unit);
let app=await send(root,accounts[1],"approve(address,uint256)",[accounts[1],20n*unit]);
assert.equal(uint(app.status),1n);
assert.equal(uint(await call(contract,"allowance(address,address)",[root,accounts[1]])),20n*unit);
const x=await send(accounts[1],root,"transferFrom(address,address,uint256)",[root,accounts[1],20n*unit]);
assert.equal(uint(x.status),1n);
assert.equal(uint(await call(contract,"allowance(address,address)",[root,accounts[1]])),0n);
assert.equal(uint(await call(contract,"balanceOf(address)",[accounts[1]])),120n*unit);
assert.equal(uint(await call(contract,"totalSupply()")),BigInt(build.initialSupplyWei));
await rpc("anvil_stopImpersonatingAccount",[root]);
console.log("BILA_TOKEN_ANVIL_PASS "+JSON.stringify({
 localOnly:true,chainId:31337,token:contract,genesisWallet:root,
 name:"Bila (Bitlang)",symbol:"BILA",supply:build.initialSupplyWei,
 transfer:"100 BILA",approveAndTransferFrom:"20 BILA",
 mintTransferEvent:true,compiledWith:"Solc/OpenZeppelin reference NOT BilaScript native"
}));
