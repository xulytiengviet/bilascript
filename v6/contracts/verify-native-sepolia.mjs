/**
 * BilaScript native CVNSS4.0 reproducible on-chain verification.
 * No Solidity, no transaction signing. A passed bytecode check is NOT an
 * Etherscan "Verified Solidity Source" badge.
 */
import {compileBila,keccak256} from "../compiler.mjs";
export const NATIVE_ADDRESS="0x305eb44bb1ccd78618a79479270d113742dcb072";
export const NATIVE_ROOT_WALLET="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
export const NATIVE_PUBLIC_RPC=Object.freeze([
 "https://ethereum-sepolia-rpc.publicnode.com",
 "https://rpc.sepolia.org"
]);
const addr=/^0x[0-9a-fA-F]{40}$/,hex=/^0x(?:[0-9a-fA-F]{2})*$/;
const lower=x=>String(x||"").toLowerCase();
const asNumber=x=>{
 if(typeof x!=="string"||!/^0x[0-9a-fA-F]+$/.test(x))throw Error("RPC trả giá trị số không hợp lệ.");
 return BigInt(x);
};
export function reproduceNativeSource(source,artifact){
 if(!source||typeof source!=="string")throw Error("Thiếu nội dung nguồn .bila");
 if(!artifact||artifact.schema!=="bilascript.native.cvnss40.reference-build.v1")
  throw Error("File build không phải bản native CVNSS4.0 hợp lệ.");
 const result=compileBila(source);
 if(result.compiler!=="BilaScript-v6.0.1-native-evm"||
    artifact.compiler!==result.compiler||
    artifact.sourceTextKeccak256!==keccak256(source)||
    artifact.contractName!==result.ast.name||
    lower(artifact.creationBytecode)!==lower(result.creationBytecode)||
    lower(artifact.runtimeBytecode)!==lower(result.runtimeBytecode)||
    JSON.stringify(artifact.abi)!==JSON.stringify(result.abi)||
    JSON.stringify(artifact.storageLayout)!==JSON.stringify(result.storageLayout))
  throw Error("Từ chối xác minh: artifact JSON không tái biên dịch khớp 100% từ nguồn .bila.");
 if(result.ast.functions.length!==22||result.ast.state.length!==8)
  throw Error("Ngữ nghĩa CVNSS40 đang kiểm tra không phải bản hợp đồng gốc.");
 return result;
}
export async function publicSepoliaRpc({provider=null,fetcher=globalThis.fetch,endpoints=NATIVE_PUBLIC_RPC}={}){
 const errors=[];
 if(provider?.request){
  try{
   const c=await provider.request({method:"eth_chainId"});
   if(asNumber(c)===11155111n)
    return {source:"wallet-eip1193",request:(method,params=[])=>provider.request({method,params})};
   errors.push("Ví đang ở chain khác Sepolia; thử RPC công khai");
  }catch(e){errors.push("Ví: "+String(e?.message||e));}
 }
 for(const endpoint of endpoints){
  if(!/^https:\/\//.test(endpoint)){errors.push("Chỉ chấp nhận HTTPS RPC");continue;}
  try{
   const request=async(method,params=[])=>{
    const res=await fetcher(endpoint,{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),
     signal:typeof AbortSignal!=="undefined"&&typeof AbortSignal.timeout==="function"?
      AbortSignal.timeout(10000):undefined
    });
    if(!res.ok)throw Error("HTTP "+res.status);
    const data=await res.json();
    if(data.error)throw Error("JSON-RPC "+String(data.error.message||data.error.code));
    return data.result;
   };
   const chainId=await request("eth_chainId");
   if(asNumber(chainId)!==11155111n)throw Error("Sai chain ID");
   return {source:endpoint,request};
  }catch(e){errors.push(endpoint+": "+String(e?.message||e));}
 }
 throw Error("Không truy cập được Ethereum Sepolia RPC thật. "+errors.join(" | "));
}
export async function verifyNativeSepoliaAddress({
 address=NATIVE_ADDRESS,source,artifact,provider=null,
 fetcher=globalThis.fetch,endpoints=NATIVE_PUBLIC_RPC,
 transactionHash=null
}={}){
 if(!addr.test(address))throw Error("Địa chỉ hợp đồng không hợp lệ");
 const built=reproduceNativeSource(source,artifact);
 const {request,source:rpcSource}=await publicSepoliaRpc({provider,fetcher,endpoints});
 const [block,code,ownerHex]=await Promise.all([
  request("eth_blockNumber"),
  request("eth_getCode",[address,"latest"]),
  request("eth_getStorageAt",[address,"0x0","latest"])
 ]);
 if(!hex.test(code))throw Error("RPC trả runtime bytecode không hợp lệ");
 const codeExists=code.length>2;
 const bytecodeExact=codeExists&&lower(code)===lower(built.runtimeBytecode);
 const ownerExact=asNumber(ownerHex)===BigInt(NATIVE_ROOT_WALLET);
 const result={
  schema:"bilascript.native.sepolia.public-verification.v1",
  status:!codeExists?"NO_CONTRACT_CODE":bytecodeExact&&ownerExact?"EXACT_NATIVE_RUNTIME_AND_OWNER":
   bytecodeExact?"EXACT_RUNTIME_BUT_OWNER_MISMATCH":"BYTECODE_MISMATCH",
  network:"Ethereum Sepolia",chainId:11155111,
  address,blockNumber:asNumber(block).toString(),rpcSource,
  compiler:built.compiler,sourceLanguage:"BilaScript/CVNSS4.0",
  sourceTextKeccak256:keccak256(source),genesisWallet:NATIVE_ROOT_WALLET,
  contractName:built.ast.name,
  sourceRecompiledExactly:true,
  runtimeMatchesDeployed:bytecodeExact,ownerSlotMatches:ownerExact,
  expectedRuntimeBytes:(built.runtimeBytecode.length-2)/2,
  deployedRuntimeBytes:(code.length-2)/2,
  runtimeBytecodeOnChain:code,ownerSlot0:ownerHex,
  abi:built.abi,
  etherscanSolidityVerification:false,
  verificationScope:"Runtime bytecode and owner slot comparison; tx origin not proven unless transactionHash is provided and checked."
 };
 if(transactionHash){
  if(!/^0x[0-9a-fA-F]{64}$/.test(transactionHash))throw Error("Transaction hash không hợp lệ");
  const [tx,receipt]=await Promise.all([
   request("eth_getTransactionByHash",[transactionHash]),
   request("eth_getTransactionReceipt",[transactionHash])
  ]);
  if(!tx||!receipt)throw Error("Không tìm thấy transaction hoặc receipt trên Sepolia.");
  const validTx=asNumber(receipt.status)===1n&&lower(receipt.contractAddress)===lower(address)&&
   lower(tx.hash)===lower(transactionHash)&&
   lower(tx.from)===lower(NATIVE_ROOT_WALLET)&&tx.to===null&&
   lower(tx.input||tx.data)===lower(built.creationBytecode)&&
   asNumber(tx.value??"0x0")===0n&&bytecodeExact&&ownerExact;
  result.transactionHash=transactionHash;
  result.transactionMatchesCreation=validTx;
  result.transactionFrom=tx.from;
  result.transactionBlock=asNumber(receipt.blockNumber).toString();
  result.gasUsed=asNumber(receipt.gasUsed).toString();
  if(validTx)result.status="EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT";
 }
 return result;
}
