import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
const file=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const ROOT="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const ADDRESS="0xd4fc8f289c37a343b11617abee8fa7a2ad6b59a6";
const TX="0x"+"ab".repeat(32);
async function until(pred,message){
 for(let i=0;i<180;i++){
  if(pred())return;
  await new Promise(resolve=>setTimeout(resolve,25));
 }
 throw Error("BilaGuard UI timeout at "+message);
}
test("v7 dashboard refuses deployments until AST/storage and deterministic fuzz gates pass",async()=>{
 const dom=new JSDOM(file("../bilaguard/index.html"),{
  url:"https://bila.js.org/v7/bilaguard/",runScripts:"outside-only"
 });
 const w=dom.window,doc=w.document;
 const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 const source=file("../../v6/contracts/Bila_CVNSS40_Native.bila");
 const compiled=(await import("../../v6/compiler.mjs")).compileBila(source);
 let balance="0x0",sent=0,consents=0,chain="0xaa36a7";
 const requests=[];
 w.ethereum={
  isMetaMask:true,
  async request({method,params=[]}){
   requests.push(method);
   if(method==="eth_chainId")return chain;
   if(method==="eth_requestAccounts"||method==="eth_accounts")return [ROOT];
   if(method==="eth_getBalance")return balance;
   if(method==="eth_gasPrice")return "0x3b9aca00";
   if(method==="eth_estimateGas")return "0x180000";
   if(method==="eth_sendTransaction"){
    assert.equal(params[0].data,compiled.creationBytecode);
    sent++;return TX;
   }
   if(method==="eth_getTransactionReceipt")return {
    transactionHash:TX,status:"0x1",contractAddress:ADDRESS,blockNumber:"0x11",gasUsed:"0x10000"
   };
   if(method==="eth_getTransactionByHash")return {
    hash:TX,from:ROOT,to:null,input:compiled.creationBytecode,value:"0x0"
   };
   if(method==="eth_getCode")return compiled.runtimeBytecode;
   if(method==="eth_getStorageAt")return "0x"+BigInt(ROOT).toString(16);
   throw Error("Unexpected EIP-1193 call "+method);
  }
 };
 w.confirm=()=>{consents++;return true;};
 globalThis.window=w;globalThis.document=doc;
 globalThis.fetch=async(url)=>{
  assert.ok(String(url).includes("Bila_CVNSS40_Native.bila"));
  return {ok:true,text:async()=>source};
 };
 try{
  await import("../bilaguard/app.mjs?browser_guard_v01");
  const el=id=>doc.getElementById(id);
  await until(()=>el("source").value===source,"load source");
  assert.equal(el("deploy-send").disabled,true);
  assert.equal(el("preflight").disabled,true);
  assert.equal(sent,0);
  el("run-audit").click();
  await until(()=>el("audit-state").dataset.kind==="pass","audit");
  assert.equal(el("stat-methods").textContent,"22");
  assert.equal(el("stat-slots").textContent,"9");
  assert.equal(el("deploy-send").disabled,true);
  el("run-fuzz").click();
  await until(()=>el("fuzz-state").dataset.kind==="pass","fuzz");
  assert.equal(el("preflight").disabled,false);
  assert.equal(el("deploy-send").disabled,true);
  assert.equal(el("download-report").disabled,false);
  assert.equal(sent,0);
  el("preflight").click();
  await until(()=>el("deploy-state").dataset.kind==="fail","no Sepolia balance");
  assert.equal(sent,0);assert.equal(consents,0);
  balance="0x16345785d8a0000";
  el("preflight").click();
  await until(()=>el("deploy-send").disabled===false,"gas preflight");
  assert.equal(sent,0);
  el("deploy-send").click();
  await until(()=>el("receipt").textContent.includes('"verified": true'),"signed deployment and RPC proof");
  assert.equal(sent,1);assert.equal(consents,1);
  assert.match(el("receipt").textContent,/runtimeBytecodeMatches/);
  assert.equal(requests.filter(x=>x==="eth_sendTransaction").length,1);
  // A source edit must revoke previous permission including quote.
  el("source").value=source+"\n// Changed by user";
  el("source").dispatchEvent(new w.Event("input"));
  assert.equal(el("preflight").disabled,true);
  assert.equal(el("deploy-send").disabled,true);
  assert.equal(el("download-report").disabled,true);
 }finally{
  dom.window.close();globalThis.window=old.window;
  globalThis.document=old.document;globalThis.fetch=old.fetch;
 }
});
test("v7 source refuses stealth Unicode and never unlocks deployment",async()=>{
 const {analyzeBilaSource,isDeploymentEligible}=await import("../bilaguard/guard.mjs");
 const source=file("../../v6/contracts/Bila_CVNSS40_Native.bila");
 const analysis=analyzeBilaSource(source.replace("hoph_dogd","hoph\u202Edogd"));
 assert.equal(isDeploymentEligible(analysis),false);
 assert.ok(analysis.issues.some(v=>v.code==="UNICODE_INVISIBLE"));
});
