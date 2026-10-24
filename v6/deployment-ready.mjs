/**
 * Actual deployment readiness for Ethereum Sepolia.
 * No transaction signing, no fake balances, no provider secret.
 */
export const CHAIN_ID="0xaa36a7";
const uint=value=>BigInt(value);
export function weiAsEth(v){
 const n=uint(v);
 if(n<0n)throw Error("Negative amount");
 const raw=(n%1000000000000000000n).toString().padStart(18,"0").replace(/0+$/,"");
 return (n/1000000000000000000n).toString()+"."+(raw||"0");
}
export async function checkDeploymentReady({provider,from,creationBytecode}){
 if(!provider?.request)throw Error("Chưa có MetaMask/provider EIP-1193.");
 if(!/^0x[0-9a-fA-F]{40}$/.test(from||""))throw Error("Thiếu địa chỉ ví triển khai hợp lệ.");
 if(!/^0x(?:[a-f0-9]{2})+$/i.test(creationBytecode||""))throw Error("Chưa có creation bytecode hợp lệ.");
 const chain=await provider.request({method:"eth_chainId"});
 if(typeof chain!=="string"||uint(chain)!==11155111n)
  throw Error("Ví chưa ở Ethereum Sepolia (11155111). Không được gửi mainnet.");
 const accounts=await provider.request({method:"eth_accounts"});
 if(!Array.isArray(accounts)||!accounts.some(v=>v.toLowerCase()===from.toLowerCase()))
  throw Error("Ví chưa cấp quyền cho tài khoản triển khai đã chọn. Hãy Kết nối ví Sepolia.");
 const [balanceHex,gasPriceHex]=await Promise.all([
  provider.request({method:"eth_getBalance",params:[from,"latest"]}),
  provider.request({method:"eth_gasPrice"})
 ]);
 const balance=uint(balanceHex),gasPrice=uint(gasPriceHex);
 let estimatedGas=null,estimateFailure="";
 try{
  const out=await provider.request({method:"eth_estimateGas",
    params:[{from,data:creationBytecode,value:"0x0"}]});
  estimatedGas=uint(out);
 }catch(e){estimateFailure=String(e?.message||e);}
 const required=estimatedGas===null?null:estimatedGas*gasPrice;
 const ok=required!==null&&balance>=required;
 return Object.freeze({
  network:"Ethereum Sepolia",chainId:11155111,address:from,
  balanceWei:balance.toString(),balanceEth:weiAsEth(balance),
  estimatedGas:estimatedGas===null?null:estimatedGas.toString(),
  gasPriceWei:gasPrice.toString(),
  estimatedCostWei:required===null?null:required.toString(),
  estimatedCostEth:required===null?null:weiAsEth(required),
  covered:ok,estimateFailure,
  reason:estimatedGas===null?
   "Không ước tính được gas từ RPC: "+estimateFailure:
   !ok?"Thiếu Sepolia ETH để trả gas dự kiến; nhận ETH từ Faucet rồi kiểm tra lại.":
   "Đã đủ Sepolia ETH theo ước tính hiện tại. Gas price vẫn có thể thay đổi trước khi ký.",
  source:"REAL_EIP1193_RPC_NOT_A_RECEIPT"
 });
}
