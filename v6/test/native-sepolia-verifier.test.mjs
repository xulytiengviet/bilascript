import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {compileBila} from "../compiler.mjs";
import {reproduceNativeSource,verifyNativeSepoliaAddress,
 NATIVE_ADDRESS,NATIVE_ROOT_WALLET} from "../contracts/verify-native-sepolia.mjs";
const source=readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
const build=JSON.parse(readFileSync("v6/contracts/Bila_CVNSS40_Native.build.json","utf8"));
const buildAgain=compileBila(source);
const hash="0x"+"ab".repeat(32);
const num=v=>"0x"+BigInt(v).toString(16);
function rpc({wrongChain=false,badRuntime=false,badOwner=false,
 absent=false,wrongTx=false}={}){
 const called=[];
 const provider={
  request:async({method,params})=>{
   called.push(method);
   if(method==="eth_chainId")return wrongChain?"0x1":"0xaa36a7";
   if(method==="eth_blockNumber")return "0xb6d12f";
   if(method==="eth_getCode")return absent?"0x":badRuntime?"0x6000":build.runtimeBytecode;
   if(method==="eth_getStorageAt")return num(badOwner?0n:BigInt(NATIVE_ROOT_WALLET));
   if(method==="eth_getTransactionByHash")return {
    hash,from:wrongTx?"0x1234567890123456789012345678901234567890":NATIVE_ROOT_WALLET,
    to:null,input:build.creationBytecode,value:"0x0"};
   if(method==="eth_getTransactionReceipt")return {
    transactionHash:hash,contractAddress:NATIVE_ADDRESS,status:"0x1",
    blockNumber:"0x10",gasUsed:"0x1530"};
   throw Error("unexpected "+method);
  }
 };
 return {provider,called};
}
test("native build recompiled exactly and ABI/storage match source",()=>{
 const result=reproduceNativeSource(source,build);
 assert.equal(result.runtimeBytecode,build.runtimeBytecode);
 assert.equal(result.creationBytecode,build.creationBytecode);
 assert.equal(result.ast.functions.length,22);
 assert.equal(result.storageLayout.length,9);
 assert.throws(()=>reproduceNativeSource(source,{...build,compiler:"solc"}),/từ chối xác minh/i);
 assert.throws(()=>reproduceNativeSource(source,{...build,abi:[]}),/từ chối xác minh/i);
 assert.throws(()=>reproduceNativeSource(source,{...build,runtimeBytecode:"0x6000"}),/từ chối xác minh/i);
 assert.throws(()=>reproduceNativeSource(source+"// edited",build),/từ chối xác minh/i);
});
test("actual-shaped Sepolia RPC proves bytecode exactly and owner storage on selected account",async()=>{
 const p=rpc();
 const out=await verifyNativeSepoliaAddress({address:NATIVE_ADDRESS,source,artifact:build,
   provider:p.provider,endpoints:[]});
 assert.equal(out.status,"EXACT_NATIVE_RUNTIME_AND_OWNER");
 assert.equal(out.runtimeMatchesDeployed,true);
 assert.equal(out.ownerSlotMatches,true);
 assert.equal(out.expectedRuntimeBytes,1027);
 assert.equal(out.deployedRuntimeBytes,1027);
 assert.equal(out.etherscanSolidityVerification,false);
 assert.equal(p.called.includes("eth_sendTransaction"),false);
 assert.deepEqual(p.called,["eth_chainId","eth_blockNumber","eth_getCode","eth_getStorageAt"]);
});
test("optional transaction hash enables full creation + receipt proof only when all facts match",async()=>{
 const good=rpc();
 const out=await verifyNativeSepoliaAddress({address:NATIVE_ADDRESS,source,artifact:build,
   provider:good.provider,endpoints:[],transactionHash:hash});
 assert.equal(out.status,"EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT");
 assert.equal(out.transactionMatchesCreation,true);
 const wrong=rpc({wrongTx:true});
 const bad=await verifyNativeSepoliaAddress({address:NATIVE_ADDRESS,source,artifact:build,
   provider:wrong.provider,endpoints:[],transactionHash:hash});
 assert.equal(bad.transactionMatchesCreation,false);
 assert.equal(bad.status,"EXACT_NATIVE_RUNTIME_AND_OWNER");
});
test("wrong owner/code/empty code never gets native verification",async()=>{
 for(const [opts,status] of [
  [{badRuntime:true},"BYTECODE_MISMATCH"],
  [{badOwner:true},"EXACT_RUNTIME_BUT_OWNER_MISMATCH"],
  [{absent:true},"NO_CONTRACT_CODE"]
 ]){
  const p=rpc(opts);
  const out=await verifyNativeSepoliaAddress({source,artifact:build,
   provider:p.provider,endpoints:[]});
  assert.equal(out.status,status);
 }
});
test("wrong network / invalid contract address reject, not silently use mainnet",async()=>{
 const bad=rpc({wrongChain:true});
 await assert.rejects(()=>verifyNativeSepoliaAddress({
  source,artifact:build,provider:bad.provider,endpoints:[]
 }),/Không truy cập được Ethereum Sepolia RPC/);
 assert.deepEqual(bad.called,["eth_chainId"]);
 await assert.rejects(()=>verifyNativeSepoliaAddress({
  address:"0x1",source,artifact:build,provider:rpc().provider
 }),/Địa chỉ hợp đồng/);
});
test("read-only RPC rejects forged result errors rather than inventing a match",async()=>{
 await assert.rejects(()=>verifyNativeSepoliaAddress({
  source,artifact:build,endpoints:["https://rpc.invalid"],
  fetcher:async()=>({ok:true,json:async()=>({error:{message:"outage"}})})
 }),/Không truy cập được Ethereum Sepolia RPC/);
});
