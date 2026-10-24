/**
 * Ethereum Sepolia faucet discovery / funding-check module for static GitHub Pages.
 * All distributions happen on independent THIRD-PARTY websites.
 * No direct faucet API is claimed, no secrets or private keys, no mock balance.
 *
 * IMPORTANT: NEXT_PUBLIC_FAUCET_SERVER_URL belongs to an external Next.js faucet.
 * The BilaScript static frontend does not have a token-funded faucet backend.
 */
export const SEPOLIA_CHAIN="0xaa36a7";
export const FAUCET_SOURCES=Object.freeze([
 Object.freeze({id:"pow",name:"Sepolia PoW Faucet (pk910)",url:"https://sepolia-faucet.pk910.de/",
  note:"Không yêu cầu ETH mainnet. Nhập địa chỉ, hoàn thành PoW trên trình duyệt rồi nhận test ETH.",type:"Proof of Work"}),
 Object.freeze({id:"google",name:"Google Cloud Web3 Faucet",url:"https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
  note:"Đăng nhập Google để yêu cầu Sepolia ETH. Lượng cấp và giới hạn tùy dịch vụ.",type:"Đăng nhập"}),
 Object.freeze({id:"alchemy",name:"Alchemy Ethereum Sepolia Faucet",url:"https://www.alchemy.com/faucets/ethereum-sepolia",
  note:"Tối đa 0,1 ETH mỗi 24 giờ nếu ví có ≥0,001 ETH và lịch sử hoạt động trên Ethereum Mainnet.",type:"Điều kiện mainnet"}),
 Object.freeze({id:"quicknode",name:"QuickNode Ethereum Sepolia Faucet",url:"https://faucet.quicknode.com/ethereum/sepolia",
  note:"Nhập địa chỉ hoặc kết nối ví, có giới hạn 12 giờ; theo FAQ có điều kiện số dư mainnet.",type:"Có điều kiện"})
]);
export const PUBLIC_READ_RPC=Object.freeze([
 "https://ethereum-sepolia-rpc.publicnode.com",
 "https://rpc.sepolia.org"
]);
export function selectedRecipient(value){
 const s=String(value||"").trim();
 if(!/^0x[0-9a-fA-F]{40}$/.test(s))throw Error("Ví nhận Sepolia ETH phải là địa chỉ EVM 0x + 40 ký tự hex.");
 return s;
}
export function ethAmount(wei){
 const n=BigInt(wei);
 if(n<0n)throw Error("Số dư không hợp lệ");
 const whole=n/1000000000000000000n;
 const fractions=(n%1000000000000000000n).toString().padStart(18,"0").slice(0,9);
 return whole.toString()+"."+fractions.replace(/0+$/,"").padEnd(1,"0");
}
export function faucetUrl(id){
 const v=FAUCET_SOURCES.find(x=>x.id===id);
 if(!v)throw Error("Không tìm thấy dịch vụ cấp Sepolia ETH được hỗ trợ");
 return v.url;
}
function checkResponse(raw,method){
 if(raw?.error)throw Error("RPC "+method+": "+String(raw.error.message||raw.error.code));
 if(typeof raw?.result!=="string"||!/^0x[0-9a-fA-F]+$/.test(raw.result))
  throw Error("RPC "+method+" trả dữ liệu không hợp lệ");
 return raw.result;
}
async function queryPublicRpc(rpcUrl,recipient,fetcher,timeoutMs){
 let index=0;
 async function request(method,params=[]){
  const response=await fetcher(rpcUrl,{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:++index,method,params}),
    signal:typeof AbortSignal!=="undefined"&&typeof AbortSignal.timeout==="function"?AbortSignal.timeout(timeoutMs):undefined
  });
  if(!response?.ok)throw Error("RPC HTTP "+response?.status);
  return checkResponse(await response.json(),method);
 }
 const chain=await request("eth_chainId");
 if(BigInt(chain)!==11155111n)throw Error("RPC không phải Sepolia, dữ liệu bị từ chối");
 const balance=await request("eth_getBalance",[recipient,"latest"]);
 const nonce=await request("eth_getTransactionCount",[recipient,"latest"]);
 const block=await request("eth_blockNumber");
 return Object.freeze({network:"Ethereum Sepolia",chainId:11155111,address:recipient,
  wei:BigInt(balance).toString(),eth:ethAmount(balance),nonce:BigInt(nonce).toString(),
  blockNumber:BigInt(block).toString(),rpc:rpcUrl,source:"PUBLIC_RPC_LIVE"});
}
/**
 * Read-only RPC: the user need not connect a wallet simply to check funding.
 * Per-backend failures are reported, never replaced by a simulated 0 ETH.
 * Use only public Sepolia RPC endpoints and verify eth_chainId.
 */
export async function readFaucetBalance(address,{
 fetcher=globalThis.fetch,
 endpoints=PUBLIC_READ_RPC,timeoutMs=9000
}={}){
 const recipient=selectedRecipient(address);
 if(typeof fetcher!=="function")throw Error("Trình duyệt không hỗ trợ fetch để đọc RPC");
 const errors=[];
 for(const url of endpoints){
  if(!/^https:\/\//.test(url))throw Error("Chỉ chấp nhận RPC HTTPS");
  try{return await queryPublicRpc(url,recipient,fetcher,timeoutMs);}
  catch(e){errors.push(e?.message||String(e));}
 }
 throw Error("Không đọc được Sepolia RPC công khai; không suy đoán số dư. "+errors.join(" | "));
}
