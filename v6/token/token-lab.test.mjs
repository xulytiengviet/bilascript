import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkBilaArtifact,verifyBilaToken} from "./token-lab.mjs";
import {keccak256} from "../compiler.mjs";
const artifact=JSON.parse(readFileSync("v6/token/BilaBitlang.build.json","utf8"));
const root=artifact.genesisWallet;
const hash="0x"+"ab".repeat(32),address="0x1111111111111111111111111111111111111111";
const h=x=>BigInt(x).toString(16).padStart(64,"0");
const encodeString=text=>{
 const b=new TextEncoder().encode(text);
 const bytes=[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
 return "0x"+h(32)+h(b.length)+bytes.padEnd(Math.ceil(bytes.length/64)*64,"0");
};
function simulate({wrongChain=false,badCode=false,badMint=false,wrongSender=false}={}){
 const response={
 "name()":encodeString("Bila (Bitlang)"),"symbol()":encodeString("BILA"),
 "decimals()":"0x"+h(18),"totalSupply()":"0x"+h(artifact.initialSupplyWei),
 "GENESIS_WALLET()":"0x"+h(root),
 "balanceOf(address)":"0x"+h(artifact.initialSupplyWei)
 };
 const selectors=Object.fromEntries(Object.entries(response).map(([key,value])=>[keccak256(key).slice(0,10),value]));
 const minted={
   address,topics:[keccak256("Transfer(address,address,uint256)"),
     "0x"+h(0),"0x"+h(root)],data:"0x"+h(badMint?1:artifact.initialSupplyWei)
 };
 const receipt={status:"0x1",contractAddress:address,
   transactionHash:hash,blockNumber:"0x5",gasUsed:"0x52ff",logs:[minted]};
 const tx={from:wrongSender?"0x1234567890123456789012345678901234567890":root,
   to:null,hash,input:artifact.creationBytecode,value:"0x0"};
 return {request:async({method,params=[]})=>{
  switch(method){
   case "eth_chainId":return wrongChain?"0x1":"0xaa36a7";
   case "eth_getTransactionReceipt":return receipt;
   case "eth_getTransactionByHash":return tx;
   case "eth_getCode":return badCode?"0x6000":artifact.runtimeBytecode;
   case "eth_call":return selectors[params[0].data.slice(0,10)]||"0x";
   default:throw Error("Unexpected mock "+method);
  }
 }};
}
test("compiled OpenZeppelin token artifact is pinned, checksummed and not native BilaScript",()=>{
 const a=checkBilaArtifact(artifact);
 assert.equal(a.symbol,"BILA");
 assert.equal(a.genesisWallet,"0x879E22703E2E432257334Db400Fbf9115aeD93Cf");
 assert.equal(a.initialSupplyWei,"1000000000000000000000000");
 assert.match(a.backend,/NOT-BilaScript-native/);
 assert.equal(a.abi.find(x=>x.name==="balanceOf").inputs[0].type,"address");
 assert.equal(a.fixedSupply,true);
 assert.throws(()=>checkBilaArtifact({...a,backend:"BilaScript-native"}),/đánh tráo/);
 assert.throws(()=>checkBilaArtifact({...a,genesisWallet:"0x"+"1".repeat(40)}),/gốc/);
});
test("local MOCK proof verifier correctly checks actual-shaped token receipt and ERC20 reads",async()=>{
 const result=await verifyBilaToken({provider:simulate(),build:artifact,transactionHash:hash});
 assert.equal(result.status,"VERIFIED_REAL_SEPOLIA_RPC");
 assert.equal(result.totalSupply,"1000000 BILA");
 assert.equal(result.mintEventVerified,true);
 assert.equal(result.creationBytecodeMatches,true);
 assert.equal(result.runtimeBytecodeMatches,true);
});
test("missing evidence, wrong chain, mismatched bytecode and wrong sender fail closed",async()=>{
 for(const p of [
  simulate({wrongChain:true}),simulate({badCode:true}),
  simulate({badMint:true}),simulate({wrongSender:true})
 ]){
  await assert.rejects(
    verifyBilaToken({provider:p,build:artifact,transactionHash:hash}),
    Error
  );
 }
 await assert.rejects(verifyBilaToken({provider:simulate(),build:artifact,transactionHash:"0x123"}),/hash/);
});
