/**
 * BILA (Bitlang) FIXED SUPPLY reference ERC20 lab.
 * Solc + OpenZeppelin testnet reference, NOT compiled by BilaScript native.
 * Every live proof uses Ethereum Sepolia RPC via wallet; no fake transactions.
 */
import {keccak256} from "../compiler.mjs";
const ORIGIN="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const AMOUNT="1000000000000000000000000"; // 1m * 10^18
function equal(a,b){return String(a).toLowerCase()===String(b).toLowerCase();}
function assert(condition,message){if(!condition)throw Error(message);}
function checkHex(x){return typeof x==="string"&&/^0x[0-9a-fA-F]*$/.test(x);}
const word=(x)=>BigInt(x).toString(16).padStart(64,"0");
function calldata(sig,args=[]){return "0x"+keccak256(sig).slice(2,10)+args.map(word).join("");}
const uint=x=>BigInt(x);
function decodeString(raw){
 if(!checkHex(raw)||raw.length<130)throw Error("Chuỗi ABI không hợp lệ");
 const data=raw.slice(2);
 const pos=Number(BigInt("0x"+data.slice(0,64)))*2;
 if(!Number.isSafeInteger(pos)||pos+64>data.length)throw Error("ABI offset không hợp lệ");
 const length=Number(BigInt("0x"+data.slice(pos,pos+64)));
 if(!Number.isSafeInteger(length)||length>1000||pos+64+length*2>data.length)
  throw Error("ABI string không hợp lệ");
 const hex=data.slice(pos+64,pos+64+2*length);
 const bytes=Uint8Array.from(hex.match(/../g)||[],item=>parseInt(item,16));
 return new TextDecoder().decode(bytes);
}
export function checkBilaArtifact(obj){
 assert(obj?.schema==="bila.bitlang.erc20.reference-build.v1","Sai phiên bản build BILA");
 assert(obj.network==="ethereum-sepolia"&&obj.chainId===11155111,"Token chỉ dành cho Sepolia");
 assert(obj.backend==="solc-js-OpenZeppelin-reference-NOT-BilaScript-native","Không được đánh tráo backend Solc và BilaScript native");
 assert(equal(obj.genesisWallet,ORIGIN),"Ví gốc BILA không khớp");
 assert(obj.name==="Bila (Bitlang)"&&obj.symbol==="BILA"&&obj.decimals===18,"Thông số BILA không khớp");
 assert(obj.initialSupplyWei===AMOUNT&&obj.fixedSupply===true&&obj.canMint===false,"Tổng cung cố định không khớp");
 assert(checkHex(obj.creationBytecode)&&obj.creationBytecode.length>200,"Thiếu creation bytecode");
 assert(checkHex(obj.runtimeBytecode)&&obj.runtimeBytecode.length>100,"Thiếu runtime bytecode");
 for(const method of ["name","symbol","decimals","totalSupply","balanceOf",
  "transfer","approve","allowance","transferFrom","GENESIS_WALLET","GENESIS_TOKENS"])
  assert(Array.isArray(obj.abi)&&obj.abi.some(f=>f.type==="function"&&f.name===method),
    "Token ABI thiếu "+method);
 return obj;
}
export async function loadBilaArtifact(fetcher=fetch){
 const r=await fetcher("./token/BilaBitlang.build.json?v=ref-0.8.30-oz5.6.1",{cache:"no-store"});
 if(!r.ok)throw Error("Không nạp được artifact BILA chuẩn từ GitHub Pages: HTTP "+r.status);
 return checkBilaArtifact(await r.json());
}
const rpc=(p,method,params=[])=>p.request({method,params});
export async function verifyBilaToken({provider,build,transactionHash}){
 checkBilaArtifact(build);
 assert(provider?.request,"Cần ví EIP-1193 có RPC Sepolia");
 assert(/^0x[0-9a-fA-F]{64}$/.test(transactionHash),"Thiếu transaction hash hợp lệ");
 const chain=await rpc(provider,"eth_chainId");
 assert(uint(chain)===11155111n,"Sai chain! Chỉ kiểm chứng Sepolia 11155111");
 const [receipt,tx]=await Promise.all([
  rpc(provider,"eth_getTransactionReceipt",[transactionHash]),
  rpc(provider,"eth_getTransactionByHash",[transactionHash])
 ]);
 assert(receipt&&tx,"Chưa có giao dịch/receipt xác nhận trên Sepolia");
 assert(uint(receipt.status)===1n,"Giao dịch triển khai BILA không thành công");
 assert(/^0x[0-9a-fA-F]{40}$/.test(receipt.contractAddress||""),"Receipt chưa có địa chỉ hợp đồng");
 assert(equal(tx.from,ORIGIN),"BILA phải được triển khai bởi chính ví gốc");
 assert(tx.to===null,"Đây không phải giao dịch tạo hợp đồng");
 assert(equal(tx.input||tx.data,build.creationBytecode),"Bytecode triển khai không khớp bản build BILA đã kiểm chứng");
 assert(uint(tx.value??"0x0")===0n,"Deploy không được gửi ETH kèm");
 const address=receipt.contractAddress;
 const runtime=await rpc(provider,"eth_getCode",[address,"latest"]);
 assert(equal(runtime,build.runtimeBytecode),"Runtime bytecode trên Sepolia không khớp artifact BILA");
 const call=(signature,args=[])=>rpc(provider,"eth_call",[{to:address,data:calldata(signature,args)},"latest"]);
 const [name,symbol,decimals,supply,genesis,balance]=await Promise.all([
  call("name()"),call("symbol()"),call("decimals()"),call("totalSupply()"),
  call("GENESIS_WALLET()"),call("balanceOf(address)",[ORIGIN])
 ]);
 assert(decodeString(name)===build.name,"Tên token BILA không đúng");
 assert(decodeString(symbol)===build.symbol,"Ký hiệu BILA không đúng");
 assert(uint(decimals)===18n,"Decimals không đúng");
 assert(uint(supply)===BigInt(AMOUNT),"Total supply không đúng");
 assert(uint(genesis)===BigInt(ORIGIN),"Ví gốc trong token không đúng");
 // A later transfer can change wallet balance; only creation event proves genesis mint.
 const topic=keccak256("Transfer(address,address,uint256)");
 const mintEvent=(receipt.logs||[]).find(log=>
  equal(log.address,address)&&equal(log.topics?.[0],topic)&&
  uint(log.topics?.[1]??"0x0")===0n&&
  uint(log.topics?.[2]??"0x0")===BigInt(ORIGIN)&&
  uint(log.data||"0x0")===BigInt(AMOUNT)
 );
 assert(mintEvent,"Không thấy sự kiện mint 1.000.000 BILA tới ví gốc");
 return Object.freeze({
   status:"VERIFIED_REAL_SEPOLIA_RPC",
   chainId:11155111,tokenContract:address,
   genesisWallet:ORIGIN,transactionHash,blockNumber:uint(receipt.blockNumber).toString(),
   gasUsed:uint(receipt.gasUsed).toString(),symbol:"BILA",name:"Bila (Bitlang)",
   decimals:18,totalSupplyRaw:AMOUNT,totalSupply:"1000000 BILA",
   genesisBalanceNowRaw:uint(balance).toString(),
   mintEventVerified:true,creationBytecodeMatches:true,runtimeBytecodeMatches:true,
   backend:build.backend,compilerVersion:build.compilerVersion,
   sourceSha256:build.sourceSha256,
   tokenUrl:"https://sepolia.etherscan.io/token/"+address,
   contractUrl:"https://sepolia.etherscan.io/address/"+address,
   transactionUrl:"https://sepolia.etherscan.io/tx/"+transactionHash
 });
}
