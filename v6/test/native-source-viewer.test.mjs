import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
const file=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const ROOT="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const ADDRESS="0x305eb44bb1ccd78618a79479270d113742dcb072";
async function until(predicate){
 for(let i=0;i<150;i++){
  if(predicate())return;
  await new Promise(ok=>setTimeout(ok,15));
 }
 throw Error("Standalone BilaScript native verification UI timed out");
}
test("standalone source verifier recompiles CVNSS and uses Sepolia read-only bytecode/owner RPC",async()=>{
 const source=file("../contracts/Bila_CVNSS40_Native.bila");
 const artifact=JSON.parse(file("../contracts/Bila_CVNSS40_Native.build.json"));
 const dom=new JSDOM(file("../verify/index.html"),{
  url:"https://bila.js.org/v6/verify/?address="+ADDRESS,
  runScripts:"outside-only"
 });
 const prev={
  document:globalThis.document,window:globalThis.window,
  location:globalThis.location,fetch:globalThis.fetch
 };
 const {window}=dom;
 const rpc=[];
 globalThis.document=window.document;
 globalThis.window=window;globalThis.location=window.location;
 globalThis.fetch=async(url,config)=>{
  if(url.includes("Bila_CVNSS40_Native.bila"))return {ok:true,text:async()=>source};
  if(url.includes("Bila_CVNSS40_Native.build.json"))return {ok:true,json:async()=>structuredClone(artifact)};
  assert.ok(url.startsWith("https://"),"RPC must be HTTPS");
  const msg=JSON.parse(config.body);rpc.push(msg.method);
  const responses={
   eth_chainId:"0xaa36a7",eth_getCode:artifact.runtimeBytecode,
   eth_getStorageAt:"0x"+BigInt(ROOT).toString(16),eth_blockNumber:"0xb6d12f"
  };
  return {ok:true,json:async()=>({result:responses[msg.method]})};
 };
 try{
  await import("../contracts/contract-source-viewer.mjs?verify_browser_regression");
  await until(()=>window.document.getElementById("state").dataset.state==="ok");
  assert.equal(window.document.getElementById("code-status").textContent,"MATCH");
  assert.equal(window.document.getElementById("owner-status").textContent,"MATCH");
  assert.equal(window.document.getElementById("runtime-size").textContent,"1.027");
  assert.equal(window.document.querySelectorAll("#abi-table tr").length,22);
  assert.equal(window.document.getElementById("save-proof").disabled,false);
  assert.match(window.document.getElementById("source-code").textContent,/hoph_dogd Bila_CVNSS40_Native/);
  assert.match(window.document.getElementById("details").textContent,/"etherscanSolidityVerified": false/);
  assert.deepEqual(rpc,["eth_chainId","eth_blockNumber","eth_getCode","eth_getStorageAt"]);
  assert.equal(rpc.includes("eth_sendTransaction"),false);
  window.document.getElementById("tab-abi").click();
  assert.equal(window.document.getElementById("pane-abi").hidden,false);
  assert.equal(window.document.getElementById("pane-source").hidden,true);
  const address=window.document.getElementById("address");
  address.value="0x0000000000000000000000000000000000000000";
  address.dispatchEvent(new window.Event("input"));
  assert.equal(window.document.getElementById("save-proof").disabled,true,
   "Any changed address must invalidate previous verified JSON");
 }finally{
  dom.window.close();
  globalThis.document=prev.document;globalThis.window=prev.window;
  globalThis.location=prev.location;globalThis.fetch=prev.fetch;
 }
});
test("verification page never offers unsupported Solidity Standard JSON confirmation",()=>{
 const html=file("../verify/index.html");
 assert.match(html,/Không phải Etherscan Verified Source/);
 assert.match(html,/Unknown key/);
 assert.doesNotMatch(html,/sepolia\.etherscan\.io\/verifyContract/);
});
