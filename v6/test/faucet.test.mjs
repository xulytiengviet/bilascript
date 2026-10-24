import test from "node:test";
import assert from "node:assert/strict";
import {FAUCET_SOURCES,PUBLIC_READ_RPC,selectedRecipient,ethAmount,
        readFaucetBalance} from "../faucet.mjs";

const RECIPIENT="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const RESPONSES={
  eth_chainId:"0xaa36a7",
  eth_getBalance:"0x16345785d8a0000", // 0.1 ETH
  eth_getTransactionCount:"0x03",
  eth_blockNumber:"0x100",
};
function responseFor(values,watch=[]){
 return async(url,opts)=>{
  assert.equal(opts.method,"POST");
  const {jsonrpc,method,params}=JSON.parse(opts.body);
  assert.equal(jsonrpc,"2.0");
  watch.push({url,method,params});
  return {ok:true,json:async()=>({jsonrpc:"2.0",id:1,result:values[method]})};
 };
}
test("faucet entries have real distinct HTTPS pages and explicit eligibility notes",()=>{
 assert.equal(FAUCET_SOURCES.length,4);
 assert.equal(new Set(FAUCET_SOURCES.map(x=>x.url)).size,4);
 for(const item of FAUCET_SOURCES){
  assert.match(item.url,/^https:\/\//);
  assert.ok(item.name.length>5);
  assert.ok(item.note.length>20);
 }
 assert.equal(FAUCET_SOURCES.find(x=>x.id==="pow").url,"https://sepolia-faucet.pk910.de/");
 assert.equal(FAUCET_SOURCES.find(x=>x.id==="alchemy").url,"https://www.alchemy.com/faucets/ethereum-sepolia");
 assert.ok(PUBLIC_READ_RPC.every(x=>x.startsWith("https://")));
});
test("recipient is only a valid Ethereum public address, never a seed or private key",()=>{
 assert.equal(selectedRecipient(RECIPIENT),RECIPIENT);
 assert.equal(selectedRecipient(" "+RECIPIENT+" "),RECIPIENT);
 for(const invalid of ["","0x1","test","hello world","0x"+("f".repeat(64)),null])
  assert.throws(()=>selectedRecipient(invalid),/địa chỉ EVM/);
});
test("exact BigInt wei to ETH display, no floating point, no fake balance",()=>{
 assert.equal(ethAmount(0n),"0.0");
 assert.equal(ethAmount(1n),"0.0");
 assert.equal(ethAmount(1000000000000000000n),"1.0");
 assert.equal(ethAmount(100000000000000000n),"0.1");
 assert.equal(ethAmount("0x16345785d8a0000"),"0.1");
 assert.throws(()=>ethAmount(-1n),/không hợp lệ/);
});
test("public RPC confirms Sepolia chainId then returns actual balance/nonce/block",async()=>{
 const calls=[];
 const result=await readFaucetBalance(RECIPIENT,{
   fetcher:responseFor(RESPONSES,calls),endpoints:["https://mock-sepolia.example"]
 });
 assert.equal(result.chainId,11155111);
 assert.equal(result.eth,"0.1");
 assert.equal(result.wei,"100000000000000000");
 assert.equal(result.nonce,"3");
 assert.equal(result.blockNumber,"256");
 assert.equal(result.source,"PUBLIC_RPC_LIVE");
 assert.deepEqual(calls.map(x=>x.method),["eth_chainId","eth_getBalance","eth_getTransactionCount","eth_blockNumber"]);
 assert.equal(calls[1].params[0],RECIPIENT);
});
test("wrong chain refuses to display balance and failover to second valid RPC",async()=>{
 const calls=[];
 const result=await readFaucetBalance(RECIPIENT,{
  endpoints:["https://fake-mainnet.example","https://valid-sepolia.example"],
  fetcher:async(url,opts)=>{
    const query=JSON.parse(opts.body);
    calls.push({url,method:query.method});
    return {ok:true,json:async()=>({result:query.method==="eth_chainId"&&url.includes("mainnet")?"0x1":RESPONSES[query.method]})};
  }
 });
 assert.equal(result.rpc,"https://valid-sepolia.example");
 assert.ok(calls.some(x=>x.url.includes("mainnet")));
});
test("all RPC failures reject: never silently fabricate 0 Sepolia ETH",async()=>{
 await assert.rejects(()=>readFaucetBalance(RECIPIENT,{
  endpoints:["https://unavailable.example"],
  fetcher:async()=>{throw Error("CORS blocked");}
 }),/Không đọc được Sepolia RPC/);
 await assert.rejects(()=>readFaucetBalance(RECIPIENT,{
  endpoints:["https://wrong-chain.example"],
  fetcher:responseFor({...RESPONSES,eth_chainId:"0x1"})
 }),/không phải Sepolia/);
 await assert.rejects(()=>readFaucetBalance(RECIPIENT,{
  endpoints:["http://insecure.example"],
  fetcher:responseFor(RESPONSES)
 }),/HTTPS/);
});

test("wallet EIP-1193 is read-only fallback if all public RPC endpoints fail",async()=>{
 const methods=[];
 const walletProvider={
  async request({method,params}){
   methods.push(method);
   assert.ok(!method.startsWith("eth_send"),"Balance check cannot send a transaction");
   return RESPONSES[method];
  }
 };
 const result=await readFaucetBalance(RECIPIENT,{
  endpoints:["https://cors-blocked.example"],
  fetcher:async()=>{throw Error("CORS");},walletProvider
 });
 assert.equal(result.eth,"0.1");
 assert.equal(result.source,"WALLET_RPC_LIVE");
 assert.deepEqual(methods,["eth_chainId","eth_getBalance","eth_getTransactionCount","eth_blockNumber"]);
});
test("wallet fallback on mainnet must fail closed instead of presenting fake Sepolia funds",async()=>{
 await assert.rejects(()=>readFaucetBalance(RECIPIENT,{
  endpoints:["https://not-available.example"],
  fetcher:async()=>{throw Error("offline");},
  walletProvider:{request:async()=> "0x1"}
 }),/Ví chưa ở Ethereum Sepolia/);
});
