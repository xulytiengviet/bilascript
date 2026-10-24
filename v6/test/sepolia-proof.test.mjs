import test from "node:test";
import assert from "node:assert/strict";
import {compileBila,EXAMPLE} from "../compiler.mjs";
import {PUBLIC_TEST_VECTOR_ADDRESS,SELECTED_SEPOLIA_WALLET,SEPOLIA_CHAIN_ID,assertSafeSepoliaWallet,matchWallet,verifySepoliaDeploy} from "../sepolia-proof.mjs";
const FRESH_FIXTURE="0x1234567890123456789012345678901234567890";

const compiled=compileBila(EXAMPLE);
const receipt={
  status:"0x1",contractAddress:"0x1111111111111111111111111111111111111111",
  transactionHash:"0x"+"a".repeat(64),blockHash:"0x"+"b".repeat(64),
  blockNumber:"0xa",gasUsed:"0x5208"
};
const transaction={
  hash:receipt.transactionHash,from:FRESH_FIXTURE,to:null,
  input:compiled.creationBytecode,value:"0x0"
};
const evidence={
  expectedWallet:FRESH_FIXTURE,chainId:SEPOLIA_CHAIN_ID,receipt,transaction,
  code:compiled.runtimeBytecode,
  ownerSlot:"0x"+BigInt(FRESH_FIXTURE).toString(16).padStart(64,"0"),
  compiled
};
test("reject known public BIP39 test-vector wallet, and validate fresh wallet format",()=>{
 assert.throws(()=>assertSafeSepoliaWallet(PUBLIC_TEST_VECTOR_ADDRESS),/test vector/);
 assert.throws(()=>matchWallet(PUBLIC_TEST_VECTOR_ADDRESS,PUBLIC_TEST_VECTOR_ADDRESS),/test vector/);
 assert.throws(()=>verifySepoliaDeploy({...evidence,expectedWallet:PUBLIC_TEST_VECTOR_ADDRESS}),/test vector/);
 assert.equal(assertSafeSepoliaWallet(FRESH_FIXTURE),FRESH_FIXTURE);
});
test("scope exactly selected non-public signer",()=>{
 assert.equal(matchWallet(FRESH_FIXTURE.toUpperCase().replace("0X","0x"),FRESH_FIXTURE).toLowerCase(),FRESH_FIXTURE.toLowerCase());
 assert.throws(()=>matchWallet("0x"+"1".repeat(40),FRESH_FIXTURE),/khác địa chỉ/);
});
test("proof validator requires chain/from/input/code/owner/receipt",()=>{
 const output=verifySepoliaDeploy(evidence);
 assert.equal(output.transactionHash,receipt.transactionHash);
 assert.equal(output.sourceWallet,FRESH_FIXTURE);
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

test("user-selected Sepolia wallet is accepted; another signer cannot impersonate it",()=>{
 assert.equal(SELECTED_SEPOLIA_WALLET,"0x879E22703E2E432257334Db400Fbf9115aeD93Cf");
 assert.equal(SELECTED_SEPOLIA_WALLET.toLowerCase(),"0x879e22703e2e432257334db400fbf9115aed93cf");
 assert.equal(matchWallet(SELECTED_SEPOLIA_WALLET,SELECTED_SEPOLIA_WALLET),SELECTED_SEPOLIA_WALLET);
 assert.throws(()=>matchWallet(FRESH_FIXTURE,SELECTED_SEPOLIA_WALLET),/khác địa chỉ/);
 assert.throws(()=>verifySepoliaDeploy({...evidence,expectedWallet:SELECTED_SEPOLIA_WALLET}),/không được ký/);
});
