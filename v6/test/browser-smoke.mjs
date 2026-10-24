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
const EXPECTED="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
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
 const originalFetch=globalThis.fetch;
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
  assert.equal(window.document.getElementById("expected-wallet").value,EXPECTED);

  assert.equal(window.document.getElementById("faucet-recipient").textContent,EXPECTED);
  assert.equal(window.document.getElementById("faucet-eth").textContent,"Chưa kiểm tra");
  const recipients=[...window.document.querySelectorAll('#faucet a[href^="https://"]')];
  assert.ok(recipients.length>=4);
  globalThis.fetch=async(url,request)=>{
    const {method}=JSON.parse(request.body);
    const data={
      eth_chainId:"0xaa36a7",eth_getBalance:"0x16345785d8a0000",
      eth_getTransactionCount:"0x1",eth_blockNumber:"0x100"
    };
    assert.ok(String(url).startsWith("https://"));
    return {ok:true,json:async()=>({result:data[method]})};
  };
  window.document.getElementById("faucet-balance").click();
  await waitFor(()=>window.document.getElementById("faucet-eth").textContent==="0.1 ETH");
  assert.equal(window.document.getElementById("faucet-block").textContent,"256");

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
  select.dispatchEvent(new window.Event("input"));
  assert.equal(window.document.getElementById("faucet-recipient").textContent,select.value);
  assert.equal(window.document.getElementById("faucet-eth").textContent,"Chưa kiểm tra");
  window.document.getElementById("connect").click();
  await waitFor(()=>window.document.getElementById("status").dataset.tone==="error");
  assert.match(window.document.getElementById("events").textContent,/chưa cấp quyền tài khoản/);
 }finally{
  globalThis.fetch=originalFetch;
  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.location;
 }
});
