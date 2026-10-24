/** Read-only public Sepolia contract bytecode attestation from GitHub Actions. */
import fs from "node:fs";
import {probeSepoliaContract,classifyBytecode} from "../provenance.mjs";
const contract=process.env.BILA_SEPOLIA_CONTRACT||
 "0x2e12b7e0c0c0d937065679c033cbfdc3b0fd9758";
const build=JSON.parse(fs.readFileSync("v6/token/BilaBitlang.build.json","utf8"));
const report={schema:"bila.bitlang.sepolia.runtime-attestation.v1",timestamp:new Date().toISOString(),
 target:contract,chainId:11155111,originWallet:build.genesisWallet,
 referenceCompiler:build.compilerVersion,sourceSha256:build.sourceSha256,
 publicRpcVerification:false,exactBytecodeMatch:false};
try{
 const snapshot=await probeSepoliaContract({address:contract});
 report.publicRpcVerification=true;
 report.rpcSource=snapshot.rpcSource;
 report.blockNumber=snapshot.blockNumber;
 report.runtimeBytes=(snapshot.code.length-2)/2;
 report.addressType=snapshot.status;
 if(snapshot.status==="ONCHAIN_CODE_READ"){
  const result=classifyBytecode({candidate:snapshot.code,referenceBuild:build});
  report.exactBytecodeMatch=result.exactMatch;
  report.compilerIdentity=result.classification;
  report.identityMessage=result.message;
 }
 fs.mkdirSync("v6/test-results",{recursive:true});
 fs.writeFileSync("v6/test-results/bila-sepolia-provenance.json",JSON.stringify(report,null,2)+"\n");
 console.log("BILA_SEPOLIA_PROVENANCE "+JSON.stringify(report));
 if(!report.exactBytecodeMatch)process.exitCode=1;
}catch(err){
 report.error=String(err?.message||err);
 fs.mkdirSync("v6/test-results",{recursive:true});
 fs.writeFileSync("v6/test-results/bila-sepolia-provenance.json",JSON.stringify(report,null,2)+"\n");
 console.error("BILA_SEPOLIA_PROVENANCE_FAILED "+JSON.stringify(report));
 process.exitCode=1;
}
