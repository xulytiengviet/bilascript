import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
const file=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const ORIGIN="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
async function waitFor(predicate){
 for(let i=0;i<130;i++){
  if(predicate())return;
  await new Promise(ok=>setTimeout(ok,15));
 }
 throw Error("Browser native lab state timed out");
}
test("native HỢP ĐỒNG page actually compiles .bila and enables only funded correct-wallet deploy",async()=>{
 const html=file("../hop-dong/index.html"),source=file("../contracts/Bila_CVNSS40_Native.bila");
 const dom=new JSDOM(html,{url:"https://bila.js.org/v6/hop-dong/",runScripts:"outside-only"});
 const {window}=dom;
 const prev={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 let chain="0x1",balance="0x16345785d8a0000";
 const called=[];
 const provider={
  isMetaMask:true,
  on(){},removeListener(){},
  async request({method,params}){
   called.push(method);
   if(method==="eth_requestAccounts"||method==="eth_accounts")return [ORIGIN];
   if(method==="eth_chainId")return chain;
   if(method==="wallet_switchEthereumChain"){chain=params[0].chainId;return null;}
   if(method==="eth_getBalance")return balance;
   if(method==="eth_gasPrice")return "0x3b9aca00";
   if(method==="eth_estimateGas")return "0x100000";
   if(method==="eth_getCode")return "0x";
   throw Error("Unexpected fake browser RPC "+method);
  }
 };
 window.ethereum=provider;
 globalThis.window=window;
 globalThis.document=window.document;
 globalThis.fetch=async(url)=>{
  if(String(url).includes("Bila_CVNSS40_Native.bila"))
   return {ok:true,text:async()=>source};
  throw Error("Unexpected URL "+url);
 };
 try{
  await import("../contracts/native-lab.mjs?native_browser_smoke");
  await waitFor(()=>window.document.getElementById("metric-func").textContent==="22");
  assert.equal(window.document.getElementById("metric-storage").textContent,"9");
  assert.equal(window.document.getElementById("native-source").value,source);
  assert.ok(window.document.getElementById("creation").value.startsWith("0x"));
  assert.ok(window.document.getElementById("runtime").value.startsWith("0x"));
  assert.ok(window.document.getElementById("source-hash").textContent.startsWith("0x"));
  assert.equal(window.document.querySelectorAll("#opcode-rows tr").length,
    Number(window.document.getElementById("metric-ops").textContent.replaceAll(".","")));
  assert.equal(window.document.getElementById("deploy-native").disabled,true);
  assert.equal(window.document.getElementById("wallet-provider").disabled,false);
  window.document.getElementById("wallet-connect").click();
  try{
   await waitFor(()=>window.document.getElementById("wallet-state").textContent.includes("Đã kết nối"));
  }catch(e){
   throw Error("Wallet state: "+window.document.getElementById("wallet-state").textContent+
    " | Status: "+window.document.getElementById("state").textContent+
    " | Log: "+window.document.getElementById("logs").textContent.slice(0,550)+
    " | RPC: "+called.join(",")+" | Cause: "+e.message);
  }
  assert.equal(chain,"0xaa36a7");
  assert.ok(called.indexOf("eth_requestAccounts")<called.indexOf("eth_chainId"));
  window.document.getElementById("check-gas").click();
  await waitFor(()=>window.document.getElementById("deploy-native").disabled===false);
  assert.match(window.document.getElementById("gas-info").textContent,/Đã đủ Sepolia ETH/);
  assert.equal(called.includes("eth_sendTransaction"),false,
   "compile/funding can never send a transaction without user confirmation");
  balance="0x0";
  window.document.getElementById("check-gas").click();
  await waitFor(()=>window.document.getElementById("gas-info").textContent.includes("Thiếu Sepolia ETH"));
  assert.equal(window.document.getElementById("deploy-native").disabled,true);
  const area=window.document.getElementById("native-source");
  area.value+="\n// Kiểm thử thay đổi mã nguồn";
  area.dispatchEvent(new window.Event("input"));
  assert.equal(window.document.getElementById("deploy-native").disabled,true);
  assert.equal(window.document.getElementById("method-run").disabled,true);
  assert.match(window.document.getElementById("state").textContent,/biên dịch lại/);
  window.document.getElementById("native-compile").click();
  await waitFor(()=>window.document.getElementById("metric-func").textContent==="22"&&
   window.document.getElementById("method-run").disabled===false);
  assert.equal(window.document.getElementById("deploy-native").disabled,true);
 }finally{
  dom.window.close();
  globalThis.window=prev.window;globalThis.document=prev.document;globalThis.fetch=prev.fetch;
 }
});
