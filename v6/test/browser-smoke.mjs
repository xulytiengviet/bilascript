/**
 * Browser DOM smoke test (jsdom). The injected provider below is a STUB only
 * for button/event wiring. This test NEVER claims chain transactions or receipts.
 * Real contract semantics remain tested on actual Anvil in differential-fuzz.mjs.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
const html=fileURLToPath(new URL("../index.html",import.meta.url));
const EXPECTED="0xF4EeD1f0589E2Cd7cF29CCE5f6f45e1ed65594aB";
const waitFor=async(predicate)=>{
  for(let i=0;i<90;i++){
    if(predicate())return;
    await new Promise(resolve=>setTimeout(resolve,15));
  }
  throw Error("DOM state timed out");
};
test("v6 browser: discover wallet, connect first, switch Sepolia, reject account mismatch",async()=>{
 const dom=new JSDOM(readFileSync(html,"utf8"),{
  url:"https://bila.js.org/v6/",runScripts:"outside-only",pretendToBeVisual:true
 });
 const {window}=dom;
 const events=new Map();
 const state={chain:"0x1",accounts:[EXPECTED],calls:[]};
 window.ethereum={
  isMetaMask:true,
  on(name,fn){events.set(name,fn);},
  removeListener(name,fn){if(events.get(name)===fn)events.delete(name);},
  async request({method,params}){
    state.calls.push(method);
    if(method==="eth_requestAccounts")return state.accounts;
    if(method==="eth_accounts")return state.accounts;
    if(method==="eth_chainId")return state.chain;
    if(method==="wallet_switchEthereumChain"){state.chain=params[0].chainId;return null;}
    if(method==="wallet_addEthereumChain"){throw Error("Not needed");}
    throw Error("Unexpected stub RPC "+method);
  }
 };
 globalThis.window=window;
 globalThis.document=window.document;
 globalThis.location=window.location;
 try{
  await import("../app.mjs?browser_smoke_v6");
  assert.match(window.document.getElementById("source").value,/hoph_dogd/);
  assert.ok(window.document.getElementById("output").value.startsWith("0x"));
  assert.equal(window.document.getElementById("wallet-provider").disabled,false);
  assert.equal(window.document.getElementById("wallet-provider").options.length,1);
  window.document.getElementById("connect").click();
  await waitFor(()=>window.document.getElementById("status").dataset.tone==="ok");
  assert.equal(window.document.getElementById("wallet").textContent,EXPECTED.slice(0,8)+"…"+EXPECTED.slice(-6));
  assert.ok(state.calls.indexOf("eth_requestAccounts")<state.calls.indexOf("eth_chainId"),
    "permission request must happen BEFORE chain check");
  assert.ok(state.calls.includes("wallet_switchEthereumChain"));
  assert.equal(state.chain,"0xaa36a7");
  const select=window.document.getElementById("expected-wallet");
  select.value="0x1234567890123456789012345678901234567890";
  window.document.getElementById("connect").click();
  await waitFor(()=>window.document.getElementById("status").dataset.tone==="error");
  assert.match(window.document.getElementById("events").textContent,/chưa cấp quyền tài khoản/);
 }finally{
  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.location;
 }
});
