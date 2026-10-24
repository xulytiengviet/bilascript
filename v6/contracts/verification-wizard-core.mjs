/**
 * The three-step Native BilaScript Sepolia attestation workflow.
 * Native .bila artifacts are NOT Solidity Standard JSON Input.
 * Pure helpers used by browser and Node regression tests.
 */
import {reproduceNativeSource,NATIVE_ROOT_WALLET} from "./verify-native-sepolia.mjs";
const lower=x=>String(x||"").toLowerCase();
const eq=(a,b)=>lower(a)===lower(b);
const address=/^0x[0-9a-fA-F]{40}$/;
const hash=/^0x[0-9a-fA-F]{64}$/;
export const ETHERSCAN_SOLIDITY_REFERENCE=Object.freeze({
 compilerType:"STANDARD JSON-INPUT",
 compilerVersion:"v0.8.30+commit.73712a01",
 applicableToNativeBilaScript:false,
 purpose:"Solidity/Solc reference on Etherscan only; never feed a BilaScript native artifact to Solc."
});
export const NATIVE_DEPLOYMENT_EXAMPLE=Object.freeze({
 address:"0xd4fc8f289c37a343b11617abee8fa7a2ad6b59a6",
 txHash:"0x0070f826e0e3a56e54360176e233332b0229c75662dcd5eb6852162e51b72a6d",
 wallet:NATIVE_ROOT_WALLET
});
export function validateDeploymentPair({address:contract,hash:txHash,transaction,receipt}){
 if(!address.test(contract||""))throw Error("Địa chỉ hợp đồng không hợp lệ");
 if(!hash.test(txHash||""))throw Error("Transaction hash phải là 0x + 64 ký tự hex");
 if(!transaction||!receipt)throw Error("Chưa tìm thấy transaction/receipt thật trên Sepolia");
 const checks={
  receiptSuccessful:receipt.status!=null&&BigInt(receipt.status)===1n,
  txHashMatches:eq(transaction.hash,txHash)&&eq(receipt.transactionHash,txHash),
  contractAddressMatches:eq(receipt.contractAddress,contract),
  deployerMatches:eq(transaction.from,NATIVE_ROOT_WALLET),
  contractCreation:transaction.to===null,
  nonpayableDeploy:BigInt(transaction.value??"0x0")===0n,
  creationInputPresent:/^0x(?:[a-fA-F0-9]{2})+$/.test(transaction.input||transaction.data||"")
 };
 return {
  checks,passed:Object.values(checks).every(Boolean),address:contract,txHash,
  receiptContractAddress:receipt.contractAddress??null,
  transactionFrom:transaction.from??null,
  transactionInputBytes:(transaction.input||transaction.data||"").startsWith("0x")?
   Math.max(0,((transaction.input||transaction.data).length-2)/2):null,
  blockNumber:receipt.blockNumber!=null?BigInt(receipt.blockNumber).toString():null,
  gasUsed:receipt.gasUsed!=null?BigInt(receipt.gasUsed).toString():null,
  wrongPair:!checks.contractAddressMatches,
  firstFailure:Object.entries(checks).find(([,ok])=>!ok)?.[0]||null
 };
}
/** Only canonical compiler output or an exactly reproducible old UI artifact is accepted. */
export function normalizeNativeUpload(data,source,canonical){
 if(!data||typeof data!=="object"||Array.isArray(data))
  throw Error("Tệp tải lên không phải đối tượng JSON hợp lệ");
 reproduceNativeSource(source,canonical);
 let candidate=data,format="canonical-native-build";
 if(data.schema==="bilascript.native.cvnss40.reference-build.v1"){
  reproduceNativeSource(source,data);
 }else if(data?.artifact?.schema==="bilascript.native.cvnss40.reference-build.v1"){
  candidate=data.artifact;format="native-evidence-embedded-build";
  reproduceNativeSource(source,candidate);
 }else if(data?.build?.schema==="bilascript.native.cvnss40.reference-build.v1"){
  // Support exactly the 3-step proof JSON exported by this app.
  // Its previous "verified" status is never trusted: step 3 re-queries Sepolia.
  if(data.sourceBila!==source||
     data.compiler!==canonical.compiler||
     data.sourceTextKeccak256!==canonical.sourceTextKeccak256)
   throw Error("JSON chứng cứ ba bước có nguồn .bila, compiler hoặc hash khác bản chuẩn.");
  candidate=data.build;format="native-three-step-attestation-json";
  reproduceNativeSource(source,candidate);
 }else if(data?.compilation?.creationBytecode&&data?.compilation?.runtimeBytecode&&data?.sourceBila){
  format="legacy-native-proof-json";
  if(data.sourceBila!==source)throw Error("JSON chứng cứ dùng mã nguồn .bila khác bản chính thức.");
  candidate=data.compilation;
 }else if(data?.creationBytecode&&data?.runtimeBytecode&&data?.source){
  format="legacy-native-ui-build-json";
  if(data.source!==source)throw Error("Bản JSON cũ chứa mã .bila khác nguồn chuẩn.");
  candidate=data;
 }else{
  throw Error('JSON không phải BilaScript native. "STANDARD JSON-INPUT" của Solc chỉ dành cho Solidity, không nhận .bila hoặc proof.json.');
 }
 if(!eq(candidate.creationBytecode,canonical.creationBytecode)||
    !eq(candidate.runtimeBytecode,canonical.runtimeBytecode)||
    JSON.stringify(candidate.abi)!==JSON.stringify(canonical.abi)||
    JSON.stringify(candidate.storageLayout)!==JSON.stringify(canonical.storageLayout))
  throw Error("JSON không tái lập đúng creation/runtime/ABI/storage của compiler BilaScript native.");
 if(candidate.compiler&&candidate.compiler!==canonical.compiler)
  throw Error("JSON khai báo compiler khác BilaScript Native được khóa trong bản build.");
 return Object.freeze({artifact:canonical,format,
  sourceRecompiled:true,abiFunctions:canonical.abi.length,
  runtimeBytes:canonical.runtimeBytes,sourceHash:canonical.sourceTextKeccak256});
}
export function buildThreeStepProof({pair,normalized,onchain,source,canonical}){
 if(!pair?.passed)throw Error("Bước 1 chưa xác nhận đúng transaction + receipt Sepolia");
 if(!normalized?.sourceRecompiled)throw Error("Bước 2 chưa xác nhận JSON compiler native");
 reproduceNativeSource(source,canonical);
 if(onchain?.status!=="EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT"||
    !onchain.transactionMatchesCreation||
    !eq(onchain.address,pair.address)||!eq(onchain.transactionHash,pair.txHash)||
    !onchain.ownerSlotMatches||!onchain.runtimeMatchesDeployed)
  throw Error("Bước 3 chưa khớp toàn bộ creation/runtime/owner/receipt với RPC");
 return Object.freeze({
  schema:"bilascript.native.sepolia.three-step-attestation.v1",
  verificationLevel:"NATIVE_CREATION_RUNTIME_OWNER_RECEIPT_VERIFIED",
  etherscanSolidityVerified:false,
  compiler:"BilaScript-v6.0.1-native-evm",
  sourceLanguage:"BilaScript/CVNSS4.0",
  solidityCompilerReference:ETHERSCAN_SOLIDITY_REFERENCE,
  warning:"Independent BilaScript proof; NOT an Etherscan Solidity Source Verified badge.",
  sourceBila:source,sourceTextKeccak256:canonical.sourceTextKeccak256,
  jsonFormat:normalized.format,build:canonical,
  sepReceiptPair:pair,onchain,
  verifiedAt:new Date().toISOString()
 });
}
