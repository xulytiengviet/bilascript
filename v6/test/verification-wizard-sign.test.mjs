import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {fileURLToPath} from "node:url";
const file=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8");
const wallet="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const addr="0xd4fc8f289c37a343b11617abee8fa7a2ad6b59a6";
const hash="0x0070f826e0e3a56e54360176e233332b0229c75662dcd5eb6852162e51b72a6d";
async function until(fn){for(let i=0;i<160;i++){if(fn())return;await new Promise(ok=>setTimeout(ok,20));}throw Error("Signed deploy smoke timeout");}
test("deploy button signs only after correct Sepolia wallet and funded estimated gas",async()=>{
 const s=file("../contracts/Bila_CVNSS40_Native.bila");
 const b=JSON.parse(file("../contracts/Bila_CVNSS40_Native.build.json"));
 const dom=new JSDOM(file("../xac-thuc/index.html"),{url:"https://bila.js.org/v6/xac-thuc/",runScripts:"outside-only"});
 const w=dom.window;
 const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 let active="0x1",balance="0x0",signatures=0,confirmations=0;
 const receipt={transactionHash:hash,status:"0x1",contractAddress:addr,blockNumber:"0x12",gasUsed:"0x70000"};
 const transaction={hash,to:null,from:wallet,input:b.creationBytecode,value:"0x0"};
 const p={isMetaMask:true,on(){},removeListener(){},async request({method,params=[]}){
  switch(method){
   case "eth_requestAccounts":case "eth_accounts":return [wallet];
   case "eth_chainId":return active;
   case "wallet_switchEthereumChain":active=params[0].chainId;return null;
   case "eth_getBalance":return balance;
   case "eth_gasPrice":return "0x3b9aca00";
   case "eth_estimateGas":return "0x40000";
   case "eth_sendTransaction":
    signatures++;
    assert.equal(active,"0xaa36a7");
    assert.equal(params[0].from.toLowerCase(),wallet.toLowerCase());
    assert.equal(params[0].data,b.creationBytecode);
    return hash;
   case "eth_getTransactionReceipt":return receipt;
   default:throw Error("Unexpected wallet RPC "+method);
  }
 }};
 w.ethereum=p;
 w.confirm=()=>{confirmations++;return true;};
 globalThis.window=w;globalThis.document=w.document;
 const publicMethods=[];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes("Bila_CVNSS40_Native.bila"))return {ok:true,text:async()=>s};
  if(String(url).includes("Bila_CVNSS40_Native.build.json"))return {ok:true,json:async()=>structuredClone(b)};
  const q=JSON.parse(opts.body);publicMethods.push(q.method);
  const response={
   eth_chainId:"0xaa36a7",eth_getTransactionReceipt:receipt,
   eth_getTransactionByHash:transaction,eth_blockNumber:"0x12",
   eth_getCode:b.runtimeBytecode,eth_getStorageAt:"0x"+BigInt(wallet).toString(16)
  };
  return {ok:true,json:async()=>({result:response[q.method]})};
 };
 try{
  await import("../contracts/verification-wizard.mjs?signed_deployment_smoke");
  const el=id=>w.document.getElementById(id);
  assert.equal(signatures,0);
  // Fail-closed on zero ETH, no confirmation and no signed TX.
  el("deploy").click();
  await until(()=>el("s1-message").dataset.state==="error");
  assert.equal(signatures,0);assert.equal(confirmations,0);
  assert.match(el("s1-message").textContent,/Thiếu Sepolia ETH/);
  // User funds wallet, retries, approves in MetaMask and obtains real-shaped receipt.
  balance="0x16345785d8a0000";
  el("deploy").click();
  await until(()=>el("s1-message").dataset.state==="ok");
  assert.equal(signatures,1);assert.equal(confirmations,1);
  assert.equal(el("contract-address").value,addr);
  assert.equal(el("tx-hash").value,hash);
  el("load-json").click();await until(()=>el("s2-message").dataset.state==="ok");
  el("verify").click();await until(()=>el("s3-message").dataset.state==="ok");
  assert.equal(el("download").disabled,false);
  assert.match(el("evidence").textContent,/EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT/);
  assert.ok(publicMethods.includes("eth_getCode"));
 }finally{
  dom.window.close();globalThis.window=old.window;globalThis.document=old.document;globalThis.fetch=old.fetch;
 }
});
