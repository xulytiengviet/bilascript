import test from "node:test";
import assert from "node:assert/strict";
import {BrowserWallets,ensureSepolia,describeProviderError,SEPOLIA_PARAMS} from "../wallet-adapter.mjs";
const CURRENT="0xF4EeD1f0589E2Cd7cF29CCE5f6f45e1ed65594aB";
const OTHER="0x1234567890123456789012345678901234567890";
function wallet({chain="0x1",missing=false,accounts=[CURRENT],reject=false}={}){
 const state={chain,known:!missing,accounts,calls:[]};
 const p={
  on(){},removeListener(){},
  async request({method,params}){
   state.calls.push(method);
   if(method==="eth_chainId")return state.chain;
   if(method==="eth_requestAccounts"){
    if(reject)throw Object.assign(new Error("User rejected"),{code:4001});
    return state.accounts;
   }
   if(method==="eth_accounts")return state.accounts;
   if(method==="wallet_switchEthereumChain"){
    if(!state.known)throw Object.assign(new Error("Unrecognized chain"),{code:4902});
    state.chain=params[0].chainId;return null;
   }
   if(method==="wallet_addEthereumChain"){
    assert.equal(params[0].chainId,"0xaa36a7");
    assert.equal(params[0].rpcUrls[0],SEPOLIA_PARAMS.rpcUrls[0]);
    state.known=true;return null;
   }
   throw Error("Unexpected "+method);
  }
 };
 return {provider:p,state};
}
test("EIP-1193: switch existing network and recheck eth_chainId",async()=>{
 const w=wallet();
 assert.equal(await ensureSepolia(w.provider),"0xaa36a7");
 assert.deepEqual(w.state.calls,["eth_chainId","wallet_switchEthereumChain","eth_chainId"]);
});
test("EIP-1193 error 4902: add Sepolia and switch with explicit wallet approval",async()=>{
 const w=wallet({missing:true});
 assert.equal(await ensureSepolia(w.provider),"0xaa36a7");
 assert.deepEqual(w.state.calls,["eth_chainId","wallet_switchEthereumChain","wallet_addEthereumChain","wallet_switchEthereumChain","eth_chainId"]);
});
test("No mainnet transactions allowed when switchNetwork is false",async()=>{
 const w=wallet();
 await assert.rejects(ensureSepolia(w.provider,{switchNetwork:false}),/hãy bấm Chuyển/);
 assert.equal(w.state.chain,"0x1");
});
test("Reject wallet denial without falling through to wallet_addEthereumChain",async()=>{
 const w=wallet();
 const reject=async({method})=>{
  if(method==="eth_chainId")return "0x1";
  throw Object.assign(new Error("Denied"),{code:4001});
 };
 await assert.rejects(ensureSepolia({request:reject}),e=>e.code===4001);
 assert.match(describeProviderError({code:4001}),/từ chối/);
 assert.match(describeProviderError({code:-32002}),/đang chờ/);
});
test("EIP-6963: multiple announced providers retain separate identities",()=>{
 class TestWindow extends EventTarget{
   constructor(){super();this.Event=Event;this.ethereum=undefined;}
 }
 const host=new TestWindow(),catalog=new BrowserWallets(host);
 const a=wallet(),b=wallet();
 host.addEventListener("eip6963:requestProvider",()=>{
   const x=new Event("eip6963:announceProvider");
   x.detail={info:{uuid:"wallet-a",rdns:"io.metamask",name:"MetaMask"},provider:a.provider};
   host.dispatchEvent(x);
   const y=new Event("eip6963:announceProvider");
   y.detail={info:{uuid:"wallet-b",rdns:"io.rabby",name:"Rabby"},provider:b.provider};
   host.dispatchEvent(y);
 });
 catalog.start();
 assert.equal(catalog.list().length,2);
 assert.equal(catalog.current(),a.provider);
 catalog.select("wallet-b");assert.equal(catalog.current(),b.provider);
 catalog.dispose();
});
test("EIP-1193: use legacy window.ethereum fallback without EIP-6963",()=>{
 class TestWindow extends EventTarget{constructor(){super();this.Event=Event;this.ethereum=wallet().provider;}}
 const catalog=new BrowserWallets(new TestWindow());
 catalog.start();
 assert.equal(catalog.list().length,1);
 assert.equal(catalog.current(),catalog.list()[0].provider);
 catalog.dispose();
});
