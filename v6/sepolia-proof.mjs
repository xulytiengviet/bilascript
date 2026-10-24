/**
 * Pure validation of PUBLIC Ethereum Sepolia deployment evidence.
 * Validates REAL RPC responses in browser. No signing, no private key.
 * Does not construct a transaction or invent receipt fields.
 */
export const SEPOLIA_CHAIN_ID="0xaa36a7";
export const STUDY_WALLET="0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
const addressPattern=/^0x[0-9a-fA-F]{40}$/;
function hexEq(a,b){return typeof a==="string"&&typeof b==="string"&&a.toLowerCase()===b.toLowerCase();}
export function validWallet(value){
 if(!addressPattern.test(value||""))throw Error("Cần một địa chỉ ví EVM gồm 40 chữ số hex");
 return value;
}
export function matchWallet(connected,required){
 validWallet(connected);validWallet(required);
 if(!hexEq(connected,required))throw Error("Ví được kết nối khác địa chỉ nghiên cứu: "+required);
 return connected;
}
export function verifySepoliaDeploy({expectedWallet,chainId,receipt,transaction,code,ownerSlot,compiled}){
 validWallet(expectedWallet);
 if(!hexEq(chainId,SEPOLIA_CHAIN_ID))throw Error("Không phải Ethereum Sepolia chain 11155111");
 if(!compiled?.runtimeBytecode||!compiled?.creationBytecode)throw Error("Thiếu bytecode nguồn do BilaScript biên dịch");
 if(!receipt||BigInt(receipt.status)!==1n||!addressPattern.test(receipt.contractAddress||""))
  throw Error("Không có receipt deploy thành công và contractAddress hợp lệ");
 if(!transaction||!hexEq(transaction.hash,receipt.transactionHash)||
    !hexEq(transaction.from,expectedWallet)||transaction.to!==null)
  throw Error("Giao dịch không được ký bởi ví đã chọn hoặc không phải giao dịch tạo hợp đồng");
 const payload=transaction.input??transaction.data;
 if(!hexEq(payload,compiled.creationBytecode))throw Error("Creation bytecode đã ký KHÁC nguồn BilaScript");
 if(BigInt(transaction.value??"0x0")!==0n)throw Error("Deploy không được gửi ETH kèm");
 if(!hexEq(code,compiled.runtimeBytecode))throw Error("Runtime bytecode trên Sepolia không khớp compiler");
 const owner=BigInt(ownerSlot??"0x0");
 if(owner!==BigInt(expectedWallet))throw Error("Storage slot 0 không chứa chủ sở hữu là địa chỉ yêu cầu");
 if(BigInt(receipt.gasUsed)<=0n)throw Error("Receipt thiếu gas thực tế");
 return Object.freeze({
   schema:"bilascript.v6.sepolia.deployment-proof.v1",
   status:"VERIFIED_FROM_PUBLIC_RPC",
   network:"Ethereum Sepolia",
   chainId:SEPOLIA_CHAIN_ID,
   sourceWallet:expectedWallet,
   contractAddress:receipt.contractAddress,
   transactionHash:receipt.transactionHash,
   blockHash:receipt.blockHash,
   blockNumber:BigInt(receipt.blockNumber).toString(),
   gasUsed:BigInt(receipt.gasUsed).toString(),
   compiler:compiled.compiler,
   vocabulary:compiled.vocabulary,
   creationBytecode:compiled.creationBytecode,
   runtimeBytecode:compiled.runtimeBytecode,
   deployedBytecode:code,
   abi:compiled.abi,
   ownerStorageSlot0:ownerSlot,
   explorerTransaction:"https://sepolia.etherscan.io/tx/"+receipt.transactionHash,
   explorerContract:"https://sepolia.etherscan.io/address/"+receipt.contractAddress,
   verificationChecks:[
     "chainId=11155111","transaction.from==selectedWallet",
     "transaction.input==compiledCreation","receipt.status==1",
     "eth_getCode==compiledRuntime","eth_getStorageAt(slot0)==selectedWallet"
   ]
 });
}
