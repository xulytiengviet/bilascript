import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyBytecode,probeSepoliaContract,hexFingerprint,describeBuildIdentity} from "../provenance.mjs";
import {compileBila,EXAMPLE} from "../compiler.mjs";
const ref=JSON.parse(readFileSync("v6/token/BilaBitlang.build.json","utf8"));
const A="0x2e12b7e0c0c0d937065679c033cbfdc3b0fd9758";
test("exact BILA reference runtime identifies Solidity and rejects false BilaScript native claim",()=>{
 const found=classifyBytecode({candidate:ref.runtimeBytecode,referenceBuild:ref});
 assert.equal(found.status,"EXACT_ARTIFACT_MATCH");
 assert.equal(found.classification,"solidity-reference");
 assert.equal(found.sourceLanguage,"Solidity");
 assert.equal(found.compiledByNativeBilaScript,false);
 assert.equal(found.bytecodeKind,"runtime");
 const identity=describeBuildIdentity({build:ref});
 assert.equal(identity.compiledByNativeBilaScript,false);
 assert.equal(identity.contractName,"BilaBitlang");
});
test("full creation bytes also identify reference, whereas a two-byte change is unknown",()=>{
 const creation=classifyBytecode({candidate:ref.creationBytecode,referenceBuild:ref});
 assert.equal(creation.exactMatch,true);
 assert.equal(creation.bytecodeKind,"creation");
 const flipped=ref.runtimeBytecode.slice(0,20)+"aa"+ref.runtimeBytecode.slice(22);
 assert.equal(classifyBytecode({candidate:flipped,referenceBuild:ref}).classification,"unknown");
 assert.throws(()=>hexFingerprint("0xabc"),/Bytecode không hợp lệ/);
});
test("native BilaScript is proven only with source recompilation exact bytecode",()=>{
 const native=compileBila(EXAMPLE);
 const result=classifyBytecode({candidate:native.runtimeBytecode,referenceBuild:ref,nativeBuild:native,nativeSource:EXAMPLE});
 assert.equal(result.classification,"native-bilascript");
 assert.equal(result.compiledByNativeBilaScript,true);
 assert.throws(()=>classifyBytecode({candidate:native.creationBytecode,referenceBuild:ref,nativeBuild:native,nativeSource:null}),/nguồn CVNSS/);
});
test("public Sepolia RPC probe verifies chain and reads real-shaped EVM code",async()=>{
 const methods=[];
 const fetcher=async(url,req)=>{
  const input=JSON.parse(req.body);
  methods.push(input.method);
  return {ok:true,json:async()=>({jsonrpc:"2.0",id:input.id,result:{
   eth_chainId:"0xaa36a7",eth_getCode:ref.runtimeBytecode,eth_blockNumber:"0x100"
  }[input.method]})};
 };
 const probed=await probeSepoliaContract({address:A,endpoints:["https://mock-sepolia.example"],fetcher});
 assert.equal(probed.status,"ONCHAIN_CODE_READ");
 assert.equal(probed.code,ref.runtimeBytecode);
 assert.equal(probed.blockNumber,"256");
 assert.deepEqual(methods,["eth_chainId","eth_getCode","eth_blockNumber"]);
 assert.equal(classifyBytecode({candidate:probed.code,referenceBuild:ref}).exactMatch,true);
});
test("unknown networks, missing onchain code, and invalid addresses fail closed",async()=>{
 const request=async(method)=>{
  return {eth_chainId:"0xaa36a7",eth_getCode:"0x",eth_blockNumber:"0x10"}[method];
 };
 const zero=await probeSepoliaContract({address:A,provider:{request:({method})=>request(method)}});
 assert.equal(zero.status,"NO_CONTRACT_CODE");
 await assert.rejects(()=>probeSepoliaContract({address:"0x1234"}),/Địa chỉ/);
 await assert.rejects(()=>probeSepoliaContract({address:A,provider:{
  request:async()=> "0x1"
 },endpoints:[],fetcher:async()=>{throw Error("No RPC")}}),/Không lấy được bytecode/);
});
