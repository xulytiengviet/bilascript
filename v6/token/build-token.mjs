/**
 * Deterministic reference backend build for Bila (Bitlang) fixed-supply ERC20.
 * Not produced by BilaScript native compiler. Source: BilaBitlang.sol.
 * Dependencies pinned in GitHub Actions: solc 0.8.30, OpenZeppelin 5.6.1.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const solc=require("solc");
const ROOT="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const SOURCE="v6/token/BilaBitlang.sol";
const BUILD="v6/token/BilaBitlang.build.json";
const STANDARD_INPUT="v6/token/BilaBitlang.standard-json.json";
const expandedSources={};
const source=fs.readFileSync(SOURCE,"utf8");
if(!solc.version().startsWith("0.8.30+"))throw Error("Require pinned solc 0.8.30");
function findImports(name){
  if(typeof name!=="string"||!name.startsWith("@openzeppelin/contracts/")||name.includes(".."))
    return {error:"Unsafe import path: "+name};
  try{
    const contents=fs.readFileSync(path.join("node_modules",name),"utf8");
    expandedSources[name]={content:contents};
    return {contents};
  }
  catch(err){return {error:"Missing pinned OpenZeppelin import "+name+": "+err.message};}
}
const input={language:"Solidity",sources:{[SOURCE]:{content:source}},settings:{
 optimizer:{enabled:true,runs:200},evmVersion:"cancun",
 metadata:{bytecodeHash:"none"},
 outputSelection:{"*":{"*":["abi","evm.bytecode.object","evm.deployedBytecode.object","evm.methodIdentifiers"]}}
}};
const output=JSON.parse(solc.compile(JSON.stringify(input),{import:findImports}));
const errors=(output.errors||[]).filter(e=>e.severity==="error");
if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join("\n"));
// Rebuild using ONLY a complete self-contained Standard JSON Input, without import callbacks.
const completeInput={...input,sources:{...input.sources,...expandedSources}};
const standardOutput=JSON.parse(solc.compile(JSON.stringify(completeInput)));
const standardErrors=(standardOutput.errors||[]).filter(x=>x.severity==="error");
if(standardErrors.length)throw Error("Standard JSON compile failed:\n"+
  standardErrors.map(x=>x.formattedMessage).join("\n"));
const contract=output.contracts?.[SOURCE]?.BilaBitlang;
const standardContract=standardOutput.contracts?.[SOURCE]?.BilaBitlang;
if(!standardContract||standardContract.evm.bytecode.object!==contract?.evm.bytecode.object||
   standardContract.evm.deployedBytecode.object!==contract?.evm.deployedBytecode.object)
  throw Error("Self-contained Standard JSON bytecode differs from originally deployed build");
if(!contract||!contract.evm.bytecode.object||!contract.evm.deployedBytecode.object)
  throw Error("No generated EVM bytecode");
if(contract.evm.bytecode.linkReferences &&
   Object.keys(contract.evm.bytecode.linkReferences).length)throw Error("Unlinked libraries");
const abi=contract.abi;
for(const method of ["name","symbol","decimals","totalSupply","balanceOf","transfer",
 "approve","allowance","transferFrom","GENESIS_WALLET","GENESIS_TOKENS"]){
 if(!abi.some(a=>a.type==="function"&&a.name===method))throw Error("Missing ERC20 ABI "+method);
}
const artifact={
 schema:"bila.bitlang.erc20.reference-build.v1",
 network:"ethereum-sepolia",chainId:11155111,
 backend:"solc-js-OpenZeppelin-reference-NOT-BilaScript-native",
 compilerVersion:solc.version(),openzeppelinVersion:"5.6.1",
 source:SOURCE,sourceSha256:crypto.createHash("sha256").update(source).digest("hex"),
 contractName:"BilaBitlang",name:"Bila (Bitlang)",symbol:"BILA",decimals:18,
 genesisWallet:ROOT,initialTokens:"1000000",
 initialSupplyWei:"1000000000000000000000000",
 fixedSupply:true,canMint:false,abi,
 creationBytecode:"0x"+contract.evm.bytecode.object,
 runtimeBytecode:"0x"+contract.evm.deployedBytecode.object
};
if(!/^0x[0-9a-f]+$/.test(artifact.creationBytecode)||!/^0x[0-9a-f]+$/.test(artifact.runtimeBytecode))
 throw Error("Malformed creation/runtime bytes");
if(fs.existsSync(BUILD)&&process.env.VERIFY_COMMITTED_TOKEN_BUILD==="1"){
 const stored=JSON.parse(fs.readFileSync(BUILD,"utf8"));
 if(JSON.stringify(stored)!==JSON.stringify(artifact))throw Error("Committed build artifact differs from pinned solc output");
}
if(process.env.VERIFY_COMMITTED_TOKEN_BUILD==="1" && fs.existsSync(STANDARD_INPUT)){
 const storedInput=JSON.parse(fs.readFileSync(STANDARD_INPUT,"utf8"));
 if(JSON.stringify(storedInput)!==JSON.stringify(completeInput))
   throw Error("Committed self-contained Standard JSON differs from pinned source inputs");
}
if(process.env.WRITE_TOKEN_BUILD==="1"){
 fs.writeFileSync(BUILD,JSON.stringify(artifact,null,2)+"\n");
 fs.writeFileSync(STANDARD_INPUT,JSON.stringify(completeInput,null,2)+"\n");
}
if(process.env.EMIT_TOKEN_BUILD_JSON==="1"){
 // Tooling can fetch the GitHub Actions text logs and commit this exact verified build.
 console.log("BILA_TOKEN_BUILD_JSON_BEGIN");
 console.log(JSON.stringify(artifact));
 console.log("BILA_TOKEN_BUILD_JSON_END");
}
console.log("BILA_STANDARD_JSON_OK "+JSON.stringify({
  sourceFiles:Object.keys(completeInput.sources).length,
  compiler:solc.version(),contractName:SOURCE+":BilaBitlang",
  optimizer:completeInput.settings.optimizer,evmVersion:completeInput.settings.evmVersion,
  metadata:completeInput.settings.metadata,
  matchesExistingBytecode:true,standardJsonFile:STANDARD_INPUT
}));
console.log("BILA_REFERENCE_BUILD_OK "+JSON.stringify({
 compiler:artifact.compilerVersion,backend:artifact.backend,
 sourceSha256:artifact.sourceSha256,genesisWallet:ROOT,
 bytes:(artifact.creationBytecode.length-2)/2,runtimeBytes:(artifact.runtimeBytecode.length-2)/2
}));
