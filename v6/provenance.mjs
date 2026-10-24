/**
 * BilaScript EVM Provenance Inspector v1.
 * Separates exact bytecode identity from source/compiler attribution.
 * NEVER infers "compiled by BilaScript" from ERC20 selectors or address alone.
 */
import {compileBila} from "./compiler.mjs";
const SEPOLIA=11155111n;
const ADDRESS=/^0x[0-9a-fA-F]{40}$/;
const HEX=/^0x(?:[a-fA-F0-9]{2})+$/;
const LOCAL_BACKEND="BilaScript v6 native compiler";
const REFERENCE_BACKEND="Solidity 0.8.30 / solc-js + OpenZeppelin 5.6.1";
const rpcEndpoints=[
 "https://ethereum-sepolia-rpc.publicnode.com",
 "https://rpc.sepolia.org"
];
const norm=value=>String(value||"").toLowerCase();
export function hexFingerprint(bytecode){
 if(!HEX.test(bytecode||""))throw Error("Bytecode không hợp lệ: yêu cầu 0x và đầy đủ các cặp byte.");
 return {bytes:(bytecode.length-2)/2,prefix:bytecode.slice(0,22),suffix:"0x"+bytecode.slice(-32)};
}
export function describeBuildIdentity({build,sourceBila=null}){
 if(!build||!HEX.test(build.runtimeBytecode)||!HEX.test(build.creationBytecode))
  throw Error("Artifact không chứa bytecode EVM hợp lệ");
 if(build.backend==="solc-js-OpenZeppelin-reference-NOT-BilaScript-native"){
  if(build.symbol!=="BILA"||build.genesisWallet?.toLowerCase()!=="0x879e22703e2e432257334db400fbf9115aed93cf")
   throw Error("Không phải bản build BILA chính thức từ repository");
  return {class:"solidity-reference",displayCompiler:REFERENCE_BACKEND,
   sourceLanguage:"Solidity",filename:"v6/token/BilaBitlang.sol",
   compiledByNativeBilaScript:false,contractName:"BilaBitlang",
   sourceSha256:build.sourceSha256,compilerVersion:build.compilerVersion,
   genesisWallet:build.genesisWallet,symbol:"BILA",
   verificationFormat:"Solidity Standard JSON Input",tag:"Solc / OpenZeppelin"};
 }
 if(sourceBila!==null){
  const local=compileBila(sourceBila);
  if(norm(local.creationBytecode)===norm(build.creationBytecode)&&
     norm(local.runtimeBytecode)===norm(build.runtimeBytecode))
   return {class:"native-bilascript",displayCompiler:LOCAL_BACKEND,
    sourceLanguage:"BilaScript / CVNSS4.0",
    compiledByNativeBilaScript:true,tag:"BilaScript native",
    verificationFormat:"BilaScript source + deterministic compiler build attestation"};
 }
 throw Error("Không chứng minh được ngôn ngữ biên dịch chỉ từ artifact này");
}
export function classifyBytecode({candidate,referenceBuild,nativeBuild=null,nativeSource=null}){
 const input=String(candidate||"").trim();
 const fingerprint=hexFingerprint(input);
 if(!referenceBuild||!HEX.test(referenceBuild.runtimeBytecode)||!HEX.test(referenceBuild.creationBytecode))
  throw Error("Cần nạp bản build BILA tham chiếu trước");
 const compare=[
  {label:"runtime",code:referenceBuild.runtimeBytecode,kind:"solidity-reference"},
  {label:"creation",code:referenceBuild.creationBytecode,kind:"solidity-reference"}
 ];
 if(nativeBuild?.runtimeBytecode)compare.push({label:"runtime",code:nativeBuild.runtimeBytecode,kind:"native-bilascript"});
 if(nativeBuild?.creationBytecode)compare.push({label:"creation",code:nativeBuild.creationBytecode,kind:"native-bilascript"});
 const match=compare.find(x=>norm(x.code)===norm(input));
 if(!match)return {
  status:"UNKNOWN_BYTECODE",exactMatch:false,classification:"unknown",fingerprint,
  message:"Không trùng nguyên vẹn bytecode nguồn đã biết. ABI/selector giống nhau không chứng minh cùng hợp đồng hay compiler."
 };
 if(match.kind==="solidity-reference"){
  return {
   status:"EXACT_ARTIFACT_MATCH",exactMatch:true,bytecodeKind:match.label,
   classification:"solidity-reference",fingerprint,
   compiler:REFERENCE_BACKEND,sourceLanguage:"Solidity",
   compiledByNativeBilaScript:false,
   artifactContract:"BilaBitlang",token:"BILA",
   sourceSha256:referenceBuild.sourceSha256,
   message:"Bytecode trùng toàn bộ bản build BILA tham chiếu: Solc/OpenZeppelin. Không được gắn nhãn compiler BilaScript native."
  };
 }
 if(nativeSource===null||!nativeBuild)
  throw Error("Cần nguồn CVNSS4.0 để xác minh compiler BilaScript native");
 const native=compileBila(nativeSource);
 if(norm(native.runtimeBytecode)!==norm(nativeBuild.runtimeBytecode)||
    norm(native.creationBytecode)!==norm(nativeBuild.creationBytecode))
  throw Error("Native build khác kết quả biên dịch lại nguồn BilaScript");
 return {
  status:"EXACT_ARTIFACT_MATCH",exactMatch:true,bytecodeKind:match.label,
  classification:"native-bilascript",fingerprint,
  compiler:LOCAL_BACKEND,sourceLanguage:"BilaScript/CVNSS4.0",compiledByNativeBilaScript:true,
  message:"Bytecode trùng nguồn BilaScript vừa tái biên dịch bằng compiler native."
 };
}
export async function probeSepoliaContract({
 address,provider=null,fetcher=globalThis.fetch,endpoints=rpcEndpoints
}){
 if(!ADDRESS.test(address||""))throw Error("Địa chỉ contract không hợp lệ.");
 let result,endpoint="",errors=[];
 const verify=async(request)=>{
  const chain=await request("eth_chainId");
  if(BigInt(chain)!==SEPOLIA)throw Error("Endpoint không phải Ethereum Sepolia 11155111.");
  const [code,block]=await Promise.all([
   request("eth_getCode",[address,"latest"]),
   request("eth_blockNumber")
  ]);
  if(typeof code!=="string"||!/^0x(?:[0-9a-fA-F]{2})*$/.test(code))
   throw Error("RPC trả bytecode không hợp lệ");
  return {code,blockNumber:BigInt(block).toString()};
 };
 if(provider?.request){
  try{
   result=await verify((method,params=[])=>provider.request({method,params}));
   endpoint="Ví EIP-1193";
  }catch(e){errors.push("Ví: "+String(e?.message||e));}
 }
 if(!result){
  if(typeof fetcher!=="function")throw Error("Không có fetch hoặc ví EVM phù hợp");
  for(const url of endpoints){
   try{
    if(!url.startsWith("https://"))throw Error("Chỉ RPC HTTPS");
    let n=0;
    result=await verify(async(method,params=[])=>{
     const resp=await fetcher(url,{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",method,params,id:++n}),
      signal:typeof AbortSignal?.timeout==="function"?AbortSignal.timeout(9000):undefined});
     if(!resp.ok)throw Error("HTTP "+resp.status);
     const body=await resp.json();
     if(body.error)throw Error("RPC "+body.error.message);
     return body.result;
    });
    endpoint=url;break;
   }catch(e){errors.push(url+": "+String(e?.message||e));}
  }
 }
 if(!result)throw Error("Không lấy được bytecode Sepolia: "+errors.join(" | "));
 if(result.code==="0x")return {status:"NO_CONTRACT_CODE",address,chainId:11155111,
  blockNumber:result.blockNumber,rpcSource:endpoint,code:"0x"};
 return {status:"ONCHAIN_CODE_READ",address,chainId:11155111,
  blockNumber:result.blockNumber,rpcSource:endpoint,code:result.code};
}
