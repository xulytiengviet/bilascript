import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateDeploymentPair,normalizeNativeUpload,buildThreeStepProof,
 NATIVE_DEPLOYMENT_EXAMPLE,ETHERSCAN_SOLIDITY_REFERENCE}
 from "../contracts/verification-wizard-core.mjs";
import {compileBila} from "../compiler.mjs";
const SOURCE=readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
const BUILD=JSON.parse(readFileSync("v6/contracts/Bila_CVNSS40_Native.build.json","utf8"));
const addr=NATIVE_DEPLOYMENT_EXAMPLE.address,hash=NATIVE_DEPLOYMENT_EXAMPLE.txHash;
const trans={hash,from:NATIVE_DEPLOYMENT_EXAMPLE.wallet,to:null,input:BUILD.creationBytecode,value:"0x0"};
const receipt={transactionHash:hash,contractAddress:addr,status:"0x1",blockNumber:"0x10",gasUsed:"0x90000"};
const check=()=>validateDeploymentPair({address:addr,hash,transaction:trans,receipt});
test("step 1: authentic shaped Sepolia deployment receipt correct pairing and signer",()=>{
 const p=check();assert.equal(p.passed,true);
 assert.equal(p.blockNumber,"16");
 assert.equal(p.transactionInputBytes,1058);
 assert.equal(p.firstFailure,null);
});
test("step 1: mismatched contract address is shown as failure instead of verification",()=>{
 const p=validateDeploymentPair({address:"0x305eb44bb1ccd78618a79479270d113742dcb072",
  hash,transaction:trans,receipt});
 assert.equal(p.passed,false);assert.equal(p.wrongPair,true);
 assert.equal(p.firstFailure,"contractAddressMatches");
 assert.equal(p.receiptContractAddress,addr);
});
test("step 1: deny false signer, wrong tx hash and non-creation",()=>{
 for(const tx of [{...trans,from:"0x"+"1".repeat(40)},{...trans,to:addr},
  {...trans,value:"0x1"},{...trans,input:"0x"}]){
  assert.equal(validateDeploymentPair({address:addr,hash,transaction:tx,receipt}).passed,false);
 }
 assert.throws(()=>validateDeploymentPair({address:"0xabc",hash,transaction:trans,receipt}),/Địa chỉ/);
 assert.throws(()=>validateDeploymentPair({address:addr,hash:"0xabc",transaction:trans,receipt}),/hash/);
});
test("step 2: native official, historical UI JSON, and exported proof normalize only exact EVM",()=>{
 const canonical=normalizeNativeUpload(BUILD,SOURCE,BUILD);
 assert.equal(canonical.format,"canonical-native-build");
 assert.equal(canonical.runtimeBytes,1027);
 const built=compileBila(SOURCE);
 const legacy={source:SOURCE,compiler:BUILD.compiler,creationBytecode:built.creationBytecode,
  runtimeBytecode:built.runtimeBytecode,abi:built.abi,storageLayout:built.storageLayout};
 const restored=normalizeNativeUpload(legacy,SOURCE,BUILD);
 assert.equal(restored.format,"legacy-native-ui-build-json");
 const proof={schema:"bilascript.native.source-and-chain-verifier.v1",
  sourceBila:SOURCE,artifactOrigin:"github-pages",compilation:{
   creationBytecode:built.creationBytecode,runtimeBytecode:built.runtimeBytecode,
   abi:built.abi,storageLayout:built.storageLayout,compiler:BUILD.compiler
  }};
 assert.equal(normalizeNativeUpload(proof,SOURCE,BUILD).format,"legacy-native-proof-json");
 assert.equal(normalizeNativeUpload({artifact:BUILD},SOURCE,BUILD).format,
 "native-evidence-embedded-build");
});
test("step 2: Solidity JSON never pretends to be native artifact; reject corrupted bytecode",()=>{
 assert.throws(()=>normalizeNativeUpload({
  language:"Solidity",sources:{"BilaBitlang.sol":{content:"pragma solidity 0.8.30;"}},
  settings:{}},SOURCE,BUILD),/không phải BilaScript native/);
 assert.throws(()=>normalizeNativeUpload({...BUILD,runtimeBytecode:"0x6000"},SOURCE,BUILD),/không tái biên dịch|không tái lập|khớp/);
 assert.throws(()=>normalizeNativeUpload({
  source:SOURCE,creationBytecode:BUILD.creationBytecode,runtimeBytecode:BUILD.runtimeBytecode,
  abi:[],storageLayout:BUILD.storageLayout},SOURCE,BUILD),/không tái lập/);
});
test("reference compiler dropdown defaults are explicit and never attributed to native bytecode",()=>{
 assert.equal(ETHERSCAN_SOLIDITY_REFERENCE.compilerType,"STANDARD JSON-INPUT");
 assert.equal(ETHERSCAN_SOLIDITY_REFERENCE.compilerVersion,"v0.8.30+commit.73712a01");
 assert.equal(ETHERSCAN_SOLIDITY_REFERENCE.applicableToNativeBilaScript,false);
});
test("step 3: proven native chain results permit JSON proof, never Solidity badge",()=>{
 const normalized=normalizeNativeUpload(BUILD,SOURCE,BUILD);
 const onchain={status:"EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT",
  transactionMatchesCreation:true,ownerSlotMatches:true,runtimeMatchesDeployed:true,
  address:addr,transactionHash:hash,chainId:11155111,blockNumber:"11981871"};
 const proof=buildThreeStepProof({pair:check(),normalized,onchain,source:SOURCE,canonical:BUILD});
 assert.equal(proof.verificationLevel,"NATIVE_CREATION_RUNTIME_OWNER_RECEIPT_VERIFIED");
 assert.equal(proof.etherscanSolidityVerified,false);
 assert.equal(proof.compiler,"BilaScript-v6.0.1-native-evm");
 assert.equal(proof.build.runtimeBytecode,BUILD.runtimeBytecode);
 assert.throws(()=>buildThreeStepProof({pair:check(),normalized,onchain:{
  ...onchain,transactionHash:"0x"+"1".repeat(64)},source:SOURCE,canonical:BUILD}),/chưa khớp/);
});
