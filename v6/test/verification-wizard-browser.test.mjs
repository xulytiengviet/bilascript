import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
const file=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const ROOT="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const ADDR="0xd4fc8f289c37a343b11617abee8fa7a2ad6b59a6";
const TX="0x0070f826e0e3a56e54360176e233332b0229c75662dcd5eb6852162e51b72a6d";
async function until(fn,label){
 for(let i=0;i<160;i++){
  if(fn())return;
  await new Promise(resolve=>setTimeout(resolve,20));
 }
 throw Error("XÁC THỰC UI timeout: "+label);
}
test("three-step source verifier checks REAL-shaped receipt, JSON and native runtime before enabling proof",async()=>{
 const html=file("../xac-thuc/index.html");
 const source=file("../contracts/Bila_CVNSS40_Native.bila");
 const build=JSON.parse(file("../contracts/Bila_CVNSS40_Native.build.json"));
 const dom=new JSDOM(html,{url:"https://bila.js.org/v6/xac-thuc/",
  runScripts:"outside-only"});
 const window=dom.window;
 const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 const rpc=[];
 globalThis.window=window;globalThis.document=window.document;
 globalThis.fetch=async(url,options)=>{
  if(String(url).includes("Bila_CVNSS40_Native.bila"))
   return {ok:true,text:async()=>source};
  if(String(url).includes("Bila_CVNSS40_Native.build.json"))
   return {ok:true,json:async()=>structuredClone(build)};
  const query=JSON.parse(options.body);rpc.push(query.method);
  const replies={
   eth_chainId:"0xaa36a7",
   eth_getTransactionByHash:{hash:TX,from:ROOT,to:null,
    input:build.creationBytecode,value:"0x0"},
   eth_getTransactionReceipt:{transactionHash:TX,status:"0x1",
    contractAddress:ADDR,blockNumber:"0xb6d12f",gasUsed:"0x35000"},
   eth_blockNumber:"0xb6d12f",eth_getCode:build.runtimeBytecode,
   eth_getStorageAt:"0x"+BigInt(ROOT).toString(16)
  };
  if(!(query.method in replies))throw Error("Unknown mock RPC "+query.method);
  return {ok:true,json:async()=>({jsonrpc:"2.0",id:query.id,result:replies[query.method]})};
 };
 try{
  await import("../contracts/verification-wizard.mjs?wizard_browser_20261024");
  const el=id=>window.document.getElementById(id);
  assert.equal(el("verify").disabled,true);
  assert.equal(el("download").disabled,true);
  assert.match(html,/STANDARD JSON-INPUT/);
  assert.match(html,/v0\.8\.30\+commit\.73712a01/);
  el("check-tx").click();
  await until(()=>el("s1-message").dataset.state==="ok","step1 tx");
  assert.equal(el("verify").disabled,true);
  assert.match(el("s1-message").textContent,/creation tx/);
  el("load-json").click();
  await until(()=>el("s2-message").dataset.state==="ok","step2 json");
  assert.equal(el("verify").disabled,false);
  el("verify").click();
  await until(()=>el("s3-message").dataset.state==="ok","step3 provenance");
  assert.equal(el("download").disabled,false);
  assert.equal(el("creation-result").textContent,"MATCH");
  assert.equal(el("runtime-result").textContent,"MATCH");
  assert.equal(el("owner-result").textContent,"MATCH");
  assert.match(el("evidence").textContent,/EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT/);
  assert.equal(rpc.includes("eth_sendTransaction"),false,
    "Read-only verification must never send a transaction");
  // Wrong address invalidates proof; mismatched tx must fail at step 1.
  el("contract-address").value="0x305eb44bb1ccd78618a79479270d113742dcb072";
  el("contract-address").dispatchEvent(new window.Event("input"));
  assert.equal(el("download").disabled,true);
  assert.equal(el("verify").disabled,true);
  el("check-tx").click();
  await until(()=>el("s1-message").dataset.state==="error","wrong contract pair");
  assert.match(el("s1-message").textContent,/Sai cặp địa chỉ/);
  assert.equal(el("download").disabled,true);
 }finally{
  dom.window.close();
  globalThis.window=old.window;globalThis.document=old.document;globalThis.fetch=old.fetch;
 }
});
