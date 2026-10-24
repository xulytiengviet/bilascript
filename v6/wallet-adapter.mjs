/**
 * EIP-6963 discovery with EIP-1193 backwards compatibility.
 * Providers are injected by installed wallets; this module never handles secrets.
 * Public RPC used only if wallet explicitly approves adding Sepolia.
 */
export const SEPOLIA_CHAIN_ID="0xaa36a7";
export const SEPOLIA_PARAMS=Object.freeze({
  chainId:SEPOLIA_CHAIN_ID,
  chainName:"Ethereum Sepolia",
  nativeCurrency:{name:"Sepolia ETH",symbol:"ETH",decimals:18},
  rpcUrls:["https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls:["https://sepolia.etherscan.io"]
});
export function describeProviderError(error){
  const code=Number(error?.code??error?.data?.originalError?.code);
  const detail=String(error?.shortMessage||error?.message||"Lỗi từ tiện ích ví").slice(0,260);
  if(code===4001)return "Bạn đã từ chối yêu cầu trong ví. Mở lại ví và bấm Kết nối/Chuyển mạng.";
  if(code===4100)return "Trang chưa được cấp quyền truy cập ví. Mở ví, cho phép bila.js.org truy cập, rồi thử lại.";
  if(code===4900||code===4901)return "Ví đang mất kết nối mạng RPC. Kiểm tra kết nối và cấu hình Sepolia trong ví.";
  if(code===-32002)return "Ví đang có yêu cầu cấp quyền đang chờ. Mở cửa sổ MetaMask và xác nhận hoặc hủy yêu cầu trước.";
  if(code===-32603)return "Ví báo lỗi RPC nội bộ: "+detail;
  return (Number.isFinite(code)?"["+code+"] ":"")+detail;
}
export function isMissingChain(error){
  const code=Number(error?.code??error?.data?.originalError?.code);
  return code===4902;
}
function validProvider(p){return !!p&&typeof p.request==="function";}
export class BrowserWallets{
  constructor(host=window){
    this.host=host;
    this.items=new Map();
    this.selected="";
    this.listeners=new Set();
    this.started=false;
    this.announce=(event)=>{
      const {provider,info}=event?.detail||{};
      if(!validProvider(provider))return;
      const rdns=typeof info?.rdns==="string"?info.rdns:"";
      const uuid=typeof info?.uuid==="string"?info.uuid:"";
      const id=uuid||("eip6963:"+rdns);
      if(!id||id==="eip6963:")return;
      this.register(id,typeof info?.name==="string"?info.name:"Ví EIP-6963",provider);
    };
  }
  register(id,name,provider){
    if(!validProvider(provider))return;
    const existing=this.items.get(id);
    if(existing?.provider===provider&&existing?.name===name)return;
    this.items.set(id,{id,name,provider});
    if(!this.selected)this.selected=id;
    this.notify();
  }
  notify(){for(const cb of this.listeners)cb(this.list());}
  onChange(cb){
    this.listeners.add(cb);
    cb(this.list());
    return ()=>this.listeners.delete(cb);
  }
  start(){
    if(!this.started){
      this.started=true;
      if(typeof this.host.addEventListener==="function")
        this.host.addEventListener("eip6963:announceProvider",this.announce);
    }
    this.refresh();
  }
  refresh(){
    // A fallback is always offered, but an announced EIP-6963 wallet is preferred.
    const injected=this.host.ethereum;
    if(validProvider(injected)){
      const providers=Array.isArray(injected.providers)?injected.providers:[injected];
      providers.forEach((p,i)=>{
        if(!validProvider(p))return;
        const name=p.isMetaMask?"MetaMask":p.isRabby?"Rabby":p.isCoinbaseWallet?"Coinbase Wallet":"Ví trình duyệt";
        this.register("injected:"+i,name,p);
      });
    }
    if(typeof this.host.dispatchEvent==="function"&&typeof this.host.Event==="function")
      this.host.dispatchEvent(new this.host.Event("eip6963:requestProvider"));
    // EIP-6963 re-announcements arrive asynchronously.
  }
  list(){
    const entries=[...this.items.values()];
    return [...entries.filter(x=>!x.id.startsWith("injected:")),
            ...entries.filter(x=>x.id.startsWith("injected:"))];
  }
  select(id){
    if(!this.items.has(id))throw Error("Ví được chọn không còn khả dụng; hãy làm mới danh sách.");
    this.selected=id;
    this.notify();
  }
  current(){
    const entry=this.items.get(this.selected);
    if(!entry)throw Error("Không tìm thấy tiện ích ví EVM. Hãy cài/mở MetaMask hoặc ví EIP-6963, cấp quyền cho bila.js.org và tải lại trang.");
    return entry.provider;
  }
  dispose(){
    if(this.started&&typeof this.host.removeEventListener==="function")
      this.host.removeEventListener("eip6963:announceProvider",this.announce);
    this.started=false;
    this.listeners.clear();
  }
}
export async function ensureSepolia(provider,{switchNetwork=true}={}){
  if(!validProvider(provider))throw Error("Thiếu ví EIP-1193");
  const chain=await provider.request({method:"eth_chainId"});
  if(typeof chain==="string"&&chain.toLowerCase()===SEPOLIA_CHAIN_ID)return SEPOLIA_CHAIN_ID;
  if(!switchNetwork)throw Error("Ví đang ở chain "+chain+"; hãy bấm Chuyển sang Sepolia (11155111).");
  try{
    await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:SEPOLIA_CHAIN_ID}]});
  }catch(error){
    if(!isMissingChain(error))throw error;
    await provider.request({method:"wallet_addEthereumChain",params:[SEPOLIA_PARAMS]});
    await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:SEPOLIA_CHAIN_ID}]});
  }
  const after=await provider.request({method:"eth_chainId"});
  if(typeof after!=="string"||after.toLowerCase()!==SEPOLIA_CHAIN_ID)
    throw Error("Ví chưa chuyển sang Ethereum Sepolia, giao dịch đã bị khóa.");
  return SEPOLIA_CHAIN_ID;
}
