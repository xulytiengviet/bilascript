import test from "node:test";
import assert from "node:assert/strict";
import {compileBila,EXAMPLE} from "../compiler.mjs";
import {STUDY_WALLET,SEPOLIA_CHAIN_ID,matchWallet,verifySepoliaDeploy} from "../sepolia-proof.mjs";

const compiled=compileBila(EXAMPLE);
const receipt={
  status:"0x1",contractAddress:"0x1111111111111111111111111111111111111111",
  transactionHash:"0x"+"a".repeat(64),blockHash:"0x"+"b".repeat(64),
  blockNumber:"0xa",gasUsed:"0x5208"
};
const transaction={
  hash:receipt.transactionHash,from:STUDY_WALLET,to:null,
  input:compiled.creationBytecode,value:"0x0"
};
const evidence={
  expectedWallet:STUDY_WALLET,chainId:SEPOLIA_CHAIN_ID,receipt,transaction,
  code:compiled.runtimeBytecode,
  ownerSlot:"0x"+BigInt(STUDY_WALLET).toString(16).padStart(64,"0"),
  compiled
};
test("scope exactly provided signing wallet",()=>{
 assert.equal(matchWallet(STUDY_WALLET.toUpperCase().replace("0X","0x"),STUDY_WALLET).toLowerCase(),STUDY_WALLET.toLowerCase());
 assert.throws(()=>matchWallet("0x"+"1".repeat(40),STUDY_WALLET),/khác địa chỉ/);
});
test("proof validator requires chain/from/input/code/owner/receipt",()=>{
 const output=verifySepoliaDeploy(evidence);
 assert.equal(output.transactionHash,receipt.transactionHash);
 assert.equal(output.sourceWallet,STUDY_WALLET);
 assert.equal(output.status,"VERIFIED_FROM_PUBLIC_RPC");
 const changes=[
   {chainId:"0x1"},
   {transaction:{...transaction,from:"0x"+"2".repeat(40)}},
   {transaction:{...transaction,to:"0x"+"2".repeat(40)}},
   {transaction:{...transaction,input:"0x1234"}},
   {transaction:{...transaction,value:"0x1"}},
   {code:"0x"},
   {ownerSlot:"0x0"},
   {receipt:{...receipt,status:"0x0"}},
   {receipt:{...receipt,contractAddress:null}}
 ];
 for(const x of changes)assert.throws(()=>verifySepoliaDeploy({...evidence,...x}),Error);
});
