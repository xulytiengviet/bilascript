/**
 * Reproducible manifest of HỢP ĐỒNG compiled directly with BilaScript EVM.
 * This step does NOT invoke solc or any Solidity compiler.
 */
import fs from "node:fs";
import {compileBila,keccak256} from "../compiler.mjs";
const FILE="v6/contracts/Bila_CVNSS40_Native.bila";
const BUILD="v6/contracts/Bila_CVNSS40_Native.build.json";
const source=fs.readFileSync(FILE,"utf8");
const compiled=compileBila(source);
if(compiled.compiler!=="BilaScript-v6.0.1-native-evm"||compiled.ast.state.length!==8||
   compiled.ast.functions.length!==22||compiled.storageLayout.length!==9)
 throw Error("Native compiler output and CVNSS test scenario disagree");
const obj={
 schema:"bilascript.native.cvnss40.reference-build.v1",
 warning:"Testnet research registry, NOT ERC20 and NOT compiled by Solc.",
 source:FILE,sourceTextKeccak256:keccak256(source),
 sourceLanguage:"BilaScript / CVNSS4.0 EVM profile (provisional)",
 compiler:compiled.compiler,vocabulary:compiled.vocabulary,
 codegen:"native EVMBYTECODE, no Solidity intermediate",
 contractName:compiled.ast.name,
 stateCount:compiled.ast.state.length,
 functionCount:compiled.ast.functions.length,
 storageLayout:compiled.storageLayout,
 abi:compiled.abi,methods:compiled.methods,
 creationBytecode:compiled.creationBytecode,
 runtimeBytecode:compiled.runtimeBytecode,
 creationBytes:(compiled.creationBytecode.length-2)/2,
 runtimeBytes:(compiled.runtimeBytecode.length-2)/2,
 opcodeCount:compiled.opcodes.length,
 opcodeSummary:compiled.opcodes.reduce((result,op)=>{
   result[op.name]=(result[op.name]||0)+1;return result;
 },{})
};
if(process.env.VERIFY_NATIVE_BUILD==="1"){
 const stored=JSON.parse(fs.readFileSync(BUILD,"utf8"));
 if(JSON.stringify(stored)!==JSON.stringify(obj))
  throw Error("Committed native CVNSS .bila build is not reproducible byte-for-byte");
}
if(process.env.WRITE_NATIVE_BUILD==="1")
 fs.writeFileSync(BUILD,JSON.stringify(obj,null,2)+"\n");
if(process.env.EMIT_NATIVE_BUILD==="1")
 console.log("BILA_NATIVE_CVNSS_BUILD_JSON="+JSON.stringify(obj));
console.log("BILA_NATIVE_CVNSS_BUILD_OK "+JSON.stringify({
  compiler:compiled.compiler,sourceTextKeccak256:obj.sourceTextKeccak256,
  contract:obj.contractName,creationBytes:obj.creationBytes,
  runtimeBytes:obj.runtimeBytes,stateCount:obj.stateCount,
  functionCount:obj.functionCount,opcodeCount:obj.opcodeCount
}));
