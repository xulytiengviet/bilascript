/**
 * Read-only independent Ethereum Sepolia verification in GitHub Actions.
 * Emits a plain JSON report, never invents chain evidence or submits a transaction.
 */
import fs from "node:fs";
import {verifyNativeSepoliaAddress,NATIVE_ADDRESS} from "./verify-native-sepolia.mjs";
const source=fs.readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
const artifact=JSON.parse(fs.readFileSync("v6/contracts/Bila_CVNSS40_Native.build.json","utf8"));
const address=process.env.NATIVE_SEPOLIA_ADDRESS||NATIVE_ADDRESS;
const transactionHash=process.env.NATIVE_DEPLOY_TX_HASH||null;
let report,passed=false;
try{
 report=await verifyNativeSepoliaAddress({address,source,artifact,transactionHash});
 passed=(transactionHash?report.status==="EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT":
  report.status==="EXACT_NATIVE_RUNTIME_AND_OWNER");
}catch(e){
 report={schema:"bilascript.native.sepolia.public-verification.v1",
  address,status:"RPC_OR_VALIDATION_FAILED",error:String(e?.message||e),
  etherscanSolidityVerification:false,verified:false};
}
report.verified=passed;
report.checkedAt=new Date().toISOString();
fs.mkdirSync("v6/test-results",{recursive:true});
fs.writeFileSync("v6/test-results/native-sepolia-verification.json",JSON.stringify(report,null,2)+"\n");
console.log("NATIVE_SEPOLIA_PUBLIC_AUDIT "+JSON.stringify({
 status:report.status,address:report.address,passed,
 blockNumber:report.blockNumber,rpcSource:report.rpcSource,
 runtimeMatchesDeployed:report.runtimeMatchesDeployed,
 ownerSlotMatches:report.ownerSlotMatches,
 expectedRuntimeBytes:report.expectedRuntimeBytes,
 deployedRuntimeBytes:report.deployedRuntimeBytes,
 transactionMatchesCreation:report.transactionMatchesCreation,
 error:report.error
}));
if(!passed)process.exitCode=1;
