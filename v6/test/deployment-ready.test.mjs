import test from "node:test";
import assert from "node:assert/strict";
import {checkDeploymentReady,weiAsEth} from "../deployment-ready.mjs";
const owner="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
function makeProvider({chain="0xaa36a7",balance="0x16345785d8a0000",
 price="0x3b9aca00",gas="0x30000",accounts=[owner],failEstimate=false}={}){
 const called=[];
 return {called,async request({method}){
  called.push(method);
  switch(method){
   case "eth_chainId":return chain;
   case "eth_accounts":return accounts;
   case "eth_getBalance":return balance;
   case "eth_gasPrice":return price;
   case "eth_estimateGas":
    if(failEstimate)throw Error("execution reverted");
    return gas;
   default:throw Error("Unexpected method "+method);
  }
 }};
}
const params=(provider)=>({provider,from:owner,creationBytecode:"0x60006000f3"});
test("funded Sepolia wallet receives an exact positive gas readiness result",async()=>{
 const p=makeProvider();
 const result=await checkDeploymentReady(params(p));
 assert.equal(result.covered,true);
 assert.equal(result.chainId,11155111);
 assert.equal(result.balanceEth,"0.1");
 assert.equal(result.estimatedGas,BigInt("0x30000").toString());
 assert.equal(result.source,"REAL_EIP1193_RPC_NOT_A_RECEIPT");
 assert.ok(p.called.includes("eth_estimateGas"));
 assert.ok(p.called.includes("eth_getBalance"));
 assert.ok(!p.called.some(x=>x.startsWith("eth_send")));
});
test("mainnet is rejected BEFORE any gas or balance query",async()=>{
 const p=makeProvider({chain:"0x1"});
 await assert.rejects(checkDeploymentReady(params(p)),/Chỉ.*Sepolia|chưa ở Ethereum Sepolia/);
 assert.deepEqual(p.called,["eth_chainId"]);
});
test("wrong signing account and invalid creation bytecode fail closed",async()=>{
 const p=makeProvider({accounts:["0x1234567890123456789012345678901234567890"]});
 await assert.rejects(checkDeploymentReady(params(p)),/chưa cấp quyền/);
 await assert.rejects(checkDeploymentReady({...params(p),creationBytecode:"0x123"}),/creation bytecode/);
});
test("gas shortfall and estimate errors never show ready",async()=>{
 const insufficient=await checkDeploymentReady(params(makeProvider({balance:"0x0"})));
 assert.equal(insufficient.covered,false);
 assert.match(insufficient.reason,/Thiếu Sepolia ETH/);
 const reverted=await checkDeploymentReady(params(makeProvider({failEstimate:true})));
 assert.equal(reverted.covered,false);
 assert.equal(reverted.estimatedCostWei,null);
 assert.match(reverted.estimateFailure,/reverted/);
});
test("fee display preserves wei precision",()=>{
 assert.equal(weiAsEth("1"),"0.000000000000000001");
 assert.equal(weiAsEth("1000000000000000000"),"1.0");
});
