import {compileBila,encodeCall,EXAMPLE} from "./compiler.mjs";
import {PUBLIC_TEST_VECTOR_ADDRESS,SELECTED_SEPOLIA_WALLET,assertSafeSepoliaWallet,matchWallet,verifySepoliaDeploy} from "./sepolia-proof.mjs?v=6.0.2-wallet-879e";
import {BrowserWallets,ensureSepolia,describeProviderError} from "./wallet-adapter.mjs";
import {selectedRecipient,readFaucetBalance} from "./faucet.mjs";
import {checkDeploymentReady} from "./deployment-ready.mjs";
import {loadBilaArtifact,verifyBilaToken} from "./token/token-lab.mjs";

const $=id=>document.getElementById(id);
const source=$("source"), output=$("output"), opcodes=$("opcodes"), abi=$("abi"), ast=$("ast");
const logBox=$("events"), report=$("evidence"), status=$("status");
const addressInput=$("address"), methodSelect=$("method"), inputArg=$("argument");
let compiled=null,account="",provider=null,lastTx="",lastReceipt=null,deployEvidence=null;
let bilaBuild=null,bilaTokenProof=null;
const walletCatalog=new BrowserWallets(window);
let providerSubscription=null;
function resetDeploymentChecks(){
  $("deploy").disabled=true;
  $("deploy-eth").textContent="Chưa kiểm tra";
  $("deploy-cost").textContent="—";
  $("deploy-readiness").textContent="Cần kiểm tra số dư và gas từ Sepolia trước khi ký.";
  $("bila-deploy").disabled=true;
  $("bila-eth").textContent="Chưa kiểm tra";
  $("bila-estimate").textContent="—";
}
function clearAccount(message){
  resetDeploymentChecks();
  account="";
  $("wallet").textContent="Chưa kết nối";
  if(message)setStatus(message,"neutral");
}
function listenProvider(p){
  if(providerSubscription){
    const previous=providerSubscription;
    if(typeof previous.provider.removeListener==="function"){
      previous.provider.removeListener("chainChanged",previous.chainHandler);
      previous.provider.removeListener("accountsChanged",previous.accountHandler);
    }
  }
  const chainHandler=()=>clearAccount("Mạng đã thay đổi · cần kết nối lại");
  const accountHandler=()=>clearAccount("Tài khoản đã thay đổi · cần kết nối lại");
  if(typeof p.on==="function"){
    p.on("chainChanged",chainHandler);
    p.on("accountsChanged",accountHandler);
  }
  providerSubscription={provider:p,chainHandler,accountHandler};
}
const SEPOLIA="0xaa36a7";
const expectedWallet=$("expected-wallet");
expectedWallet.value=new URLSearchParams(location.search).get("deployer")||SELECTED_SEPOLIA_WALLET;
if(expectedWallet.value.toLowerCase()===PUBLIC_TEST_VECTOR_ADDRESS.toLowerCase()){
  setTimeout(()=>writeLog("error","Địa chỉ từ URL là test vector công khai — bị chặn triển khai Sepolia"),0);
}
function assertSigner(){return matchWallet(account,expectedWallet.value.trim());}
function syncFaucetRecipient(){
  resetDeploymentChecks();
  const recipient=expectedWallet.value.trim();
  $("faucet-recipient").textContent=recipient||"Chưa có địa chỉ nhận";
  $("faucet-eth").textContent="Chưa kiểm tra";
  $("faucet-block").textContent="—";
  $("faucet-feedback").textContent="Số dư chỉ hiển thị sau khi xác minh với RPC của Ethereum Sepolia.";
}
async function copyFaucetRecipient(){
  const recipient=selectedRecipient(expectedWallet.value);
  if(!navigator.clipboard||typeof navigator.clipboard.writeText!=="function")
    throw Error("Trình duyệt chưa cấp quyền sao chép. Hãy chọn và sao chép địa chỉ nhận ETH hiển thị.");
  await navigator.clipboard.writeText(recipient);
  $("faucet-feedback").textContent="Đã sao chép "+recipient+". Dán chính xác địa chỉ này vào trang faucet bạn chọn.";
  writeLog("ok","Đã sao chép địa chỉ nhận Sepolia ETH (không gửi giao dịch): "+recipient);
}
async function checkFaucetBalance(){
  const recipient=selectedRecipient(expectedWallet.value);
  const btn=$("faucet-balance");
  btn.disabled=true;
  $("faucet-feedback").textContent="Đang đọc Sepolia RPC công khai; không sử dụng dữ liệu mô phỏng…";
  try{
    let walletProvider=null;
    try{walletProvider=walletCatalog.current();}catch{}
    const result=await readFaucetBalance(recipient,{walletProvider});
    if(expectedWallet.value.trim().toLowerCase()!==recipient.toLowerCase())
      throw Error("Địa chỉ nhận đã thay đổi khi truy vấn. Kiểm tra lại số dư.");
    $("faucet-eth").textContent=result.eth+" ETH";
    $("faucet-block").textContent=result.blockNumber;
    $("faucet-feedback").textContent="Đã xác minh "+result.network+" (chain 11155111), RPC "+
      result.rpc+". Số dư: "+result.eth+" Sepolia ETH. Nonce: "+result.nonce+
      ". Nếu faucet đã cấp tiền, số dư ở block mới sẽ phản ánh khoản nhận.";
    writeLog("ok","Faucet kiểm tra số dư từ RPC thật: "+recipient+" · "+result.eth+" Sepolia ETH · block "+result.blockNumber);
  }catch(err){
    $("faucet-eth").textContent="Chưa xác minh";
    $("faucet-block").textContent="—";
    $("faucet-feedback").textContent="Chưa xác minh được số dư. "+
      (err?.message||String(err))+"; hãy thử lại hoặc xem Etherscan.";
    throw err;
  }finally{btn.disabled=false;}
}

function saveJSON(filename,value){
  const blob=new Blob([pretty(value)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function writeLog(kind,message){
  const date=new Date().toLocaleTimeString("vi-VN",{hour12:false});
  const el=document.createElement("div");el.className="log "+kind;
  el.textContent="["+date+"] "+kind.toUpperCase()+" · "+message;
  logBox.prepend(el);
  while(logBox.children.length>70)logBox.lastChild.remove();
}
function setStatus(message,tone="neutral"){status.textContent=message;status.dataset.tone=tone;}
function pretty(obj){return JSON.stringify(obj,(k,v)=>typeof v==="bigint"?String(v):v,2);}
function toBig(hex){return BigInt(hex||"0x0");}
function inputAddress(){
  const s=addressInput.value.trim();
  if(!/^0x[0-9a-fA-F]{40}$/.test(s))throw Error("Địa chỉ EVM không hợp lệ (40 hex)");
  return s;
}
function selectedMethod(){
  if(!compiled)throw Error("Hãy biên dịch nguồn trước");
  const name=methodSelect.value;
  const m=compiled.methods[name];if(!m)throw Error("Phương thức không tồn tại");
  return {name,...m};
}
function renderMethods(){
  methodSelect.replaceChildren();
  for(const f of compiled.ast.functions){
    const opt=document.createElement("option");
    opt.value=f.name;opt.textContent=f.name+" · "+f.op+" · "+f.selector;
    methodSelect.appendChild(opt);
  }
  changeMethod();
}
function changeMethod(){
  if(!compiled)return;
  const m=selectedMethod();
  inputArg.disabled=!m.parameter;
  inputArg.hidden=!m.parameter;
  $("argument-label").hidden=!m.parameter;
  $("method-description").textContent="Signature "+m.signature+" · slot "+m.slot+" · "+(m.operation==="get"?"eth_call (không ghi)":m.operation==="set"?"SSTORE từ tham số":"SLOAD + kiểm tra tràn + ADD + SSTORE");
}
function compile(){
  try{
    compiled=compileBila(source.value);
    resetDeploymentChecks();
    deployEvidence=null;
    $("download-proof").disabled=true;
    output.value=compiled.creationBytecode;
    $("runtime").value=compiled.runtimeBytecode;
    abi.value=pretty(compiled.abi);
    ast.value=pretty(compiled.ast);
    const trs=compiled.opcodes.map(x=>"<tr><td>"+x.pc+"</td><td>"+x.opcode+"</td><td>"+x.name+"</td><td>"+(x.immediate||"—")+"</td></tr>").join("");
    opcodes.innerHTML=trs;
    $("n-opcodes").textContent=compiled.opcodes.length;
    $("n-bytes").textContent=(compiled.creationBytecode.length-2)/2;
    $("n-methods").textContent=compiled.ast.functions.length;
    renderMethods();
    setStatus("Đã biên dịch 6.0.1 · CHƯA xác minh on-chain","neutral");
    writeLog("ok","Native bytecode và ABI đã sinh từ BilaScript; chưa có chứng nhận triển khai");
    report.textContent="Chưa có bằng chứng mạng. Bytecode tĩnh không chứng minh runtime thực thi đúng.";
  }catch(err){
    compiled=null;output.value="";$("runtime").value="";abi.value="";ast.value="";opcodes.replaceChildren();
    methodSelect.replaceChildren();setStatus("Lỗi biên dịch","error");
    writeLog("error",err.message);
  }
}
function getProvider(){
  const p=walletCatalog.current();
  if(p!==provider){
    if(provider)clearAccount("Ví được chọn đã thay đổi · hãy kết nối lại");
    provider=p;listenProvider(p);
  }
  return p;
}
async function rpc(method,params=[]){
  const p=provider||getProvider();
  return p.request({method,params});
}
async function assertSepolia(){
  return ensureSepolia(getProvider(),{switchNetwork:false});
}
async function assertLiveSigner(){
  const p=getProvider();
  const connected=await p.request({method:"eth_accounts"});
  if(!Array.isArray(connected)||!connected[0])throw Error("Ví chưa cấp quyền tài khoản, hãy Kết nối lại.");
  matchWallet(connected[0],expectedWallet.value.trim());
  if(connected[0].toLowerCase()!==account.toLowerCase())throw Error("Tài khoản ví đã thay đổi, vui lòng kết nối lại.");
  await ensureSepolia(p,{switchNetwork:false});
}
async function connect(){
  assertSafeSepoliaWallet(expectedWallet.value.trim());
  const p=getProvider();
  setStatus("Đang mở yêu cầu cấp quyền trong ví…","pending");
  const accounts=await p.request({method:"eth_requestAccounts"});
  if(!Array.isArray(accounts)||!accounts[0])throw Error("Ví không trả về tài khoản, hãy mở khóa và cấp quyền cho bila.js.org.");
  setStatus("Đã cấp quyền tài khoản · đang chuyển sang Sepolia…","pending");
  await ensureSepolia(p,{switchNetwork:true});
  const fresh=await p.request({method:"eth_accounts"});
  if(!Array.isArray(fresh)||!fresh[0])throw Error("Ví không còn cấp quyền tài khoản sau khi đổi mạng");
  const expected=expectedWallet.value.trim();
  if(!fresh.some(a=>a.toLowerCase()===expected.toLowerCase()))
    throw Error("Ví đang mở "+fresh[0]+", chưa cấp quyền tài khoản "+expected+". Hãy chọn tài khoản phù hợp trong ví và kết nối lại.");
  const matched=fresh.find(a=>a.toLowerCase()===expected.toLowerCase());
  account=matchWallet(matched,expected);
  $("wallet").textContent=account.slice(0,8)+"…"+account.slice(-6);
  setStatus("Kết nối thành công · Sepolia đã xác minh","ok");
  writeLog("ok","Kết nối ví "+account+" trên Sepolia 11155111");
}
async function checkWalletOnSepolia(){
  const expected=assertSafeSepoliaWallet(expectedWallet.value.trim());
  provider=getProvider();
  await assertSepolia();
  const [wei,txCount,code,block]=await Promise.all([
    rpc("eth_getBalance",[expected,"latest"]),
    rpc("eth_getTransactionCount",[expected,"latest"]),
    rpc("eth_getCode",[expected,"latest"]),
    rpc("eth_blockNumber")
  ]);
  const amount=Number(BigInt(wei))/1e18;
  $("wallet-balance").textContent=amount.toFixed(6)+" Sepolia ETH";
  $("wallet-nonce").textContent=BigInt(txCount).toString();
  $("wallet-check-block").textContent=BigInt(block).toString();
  const codeType=(code==="0x")?"EOA hoặc chưa có mã":"Có bytecode ở địa chỉ";
  writeLog("ok","Sepolia RPC: "+expected+" · "+amount.toFixed(6)+" Sepolia ETH, nonce="+BigInt(txCount)+" · "+codeType);
  if(amount===0)writeLog("error","Ví không có Sepolia ETH theo RPC này; cần testnet faucet để triển khai");
}
async function changeChain(){
  const p=getProvider();
  setStatus("Đang yêu cầu ví chuyển/thêm Ethereum Sepolia…","pending");
  await ensureSepolia(p,{switchNetwork:true});
  setStatus("Đã chuyển sang Sepolia · nhấn Kết nối ví","ok");
  writeLog("ok","Ví đã xác nhận chain 11155111");
}
function requireReady(){
  if(!compiled)throw Error("Hãy biên dịch trước");
  if(!account)throw Error("Hãy kết nối ví Sepolia");
  assertSigner();
}
async function receipt(txHash){
  const started=Date.now();
  for(;;){
    const r=await rpc("eth_getTransactionReceipt",[txHash]);
    if(r)return r;
    if(Date.now()-started>120000)throw Error("Chưa nhận receipt sau 120 giây. Tx vẫn có thể đang chờ; kiểm tra trên explorer.");
    await new Promise(resolve=>setTimeout(resolve,4000));
  }
}
function linkTransaction(hash){
  const a=$("explorer-tx");a.href="https://sepolia.etherscan.io/tx/"+hash;
  a.textContent=hash.slice(0,12)+"…"+hash.slice(-8);a.hidden=false;
}
function linkContract(address){
  const a=$("explorer-contract");a.href="https://sepolia.etherscan.io/address/"+address;
  a.textContent=address.slice(0,12)+"…"+address.slice(-8);a.hidden=false;
}
async function checkNativeDeployment(){
  requireReady();
  await assertSepolia();
  await assertLiveSigner();
  const result=await checkDeploymentReady({
    provider:getProvider(),from:account,creationBytecode:compiled.creationBytecode
  });
  $("deploy-eth").textContent=result.balanceEth+" Sepolia ETH";
  $("deploy-cost").textContent=result.estimatedCostEth===null?"Không ước tính được":result.estimatedCostEth+" ETH";
  $("deploy-readiness").textContent=result.reason+
    (result.estimatedGas?" · gas="+result.estimatedGas+" · gasPrice="+result.gasPriceWei+" wei":"");
  $("deploy").disabled=!result.covered;
  if(result.covered)writeLog("ok","Preflight ETH/gas đạt qua RPC Sepolia thật. Đã mở nút deploy.");
  else writeLog("error","Preflight chưa đạt: "+result.reason);
  return result;
}
async function loadTokenBuild(){
  bilaBuild=await loadBilaArtifact();
  bilaTokenProof=null;
  $("bila-proof").disabled=true;
  $("bila-deploy").disabled=true;
  $("bila-backend").textContent="Solc 0.8.30 · OZ 5.6.1";
  $("bila-stage").textContent="Đã nạp artifact BILA gồm creation/runtime EVM, ABI và mã băm source. Kết nối ví gốc và kiểm tra gas để tiếp tục. Backend: Solc/OpenZeppelin, CHƯA phải native BilaScript.";
  writeLog("ok","BILA artifact nạp thành công: "+bilaBuild.symbol+" · "+bilaBuild.initialTokens+" · "+bilaBuild.backend);
}
async function checkTokenDeployment(){
  if(!bilaBuild)throw Error("Chưa nạp build BILA; bấm Nạp creation bytecode ERC-20 trước.");
  if(!account)throw Error("Chưa kết nối ví. Cần ví gốc để ký token.");
  await assertLiveSigner();
  if(account.toLowerCase()!==bilaBuild.genesisWallet.toLowerCase())
    throw Error("Chỉ cho phép ví gốc BILA ký triển khai.");
  const ready=await checkDeploymentReady({
    provider:getProvider(),from:account,creationBytecode:bilaBuild.creationBytecode
  });
  $("bila-eth").textContent=ready.balanceEth+" ETH";
  $("bila-estimate").textContent=ready.estimatedCostEth===null?"Không tính được":ready.estimatedCostEth+" ETH";
  $("bila-stage").textContent=(ready.covered?"Đã đủ Sepolia ETH để thử deploy. ":"Chưa đủ điều kiện. ")+ready.reason+
    ". Build Solc/OZ tham chiếu; ví gốc nhận 1.000.000 BILA.";
  $("bila-deploy").disabled=!ready.covered;
  writeLog(ready.covered?"ok":"error","BILA preflight: "+ready.reason);
  return ready;
}
async function verifyBilaFromInput(){
  if(!bilaBuild)await loadTokenBuild();
  const hash=$("bila-tx").value.trim();
  const proof=await verifyBilaToken({provider:getProvider(),build:bilaBuild,transactionHash:hash});
  bilaTokenProof=proof;
  $("bila-evidence").textContent=pretty(proof);
  $("bila-proof").disabled=false;
  $("bila-stage").textContent="ĐÃ XÁC MINH trên Sepolia: "+proof.tokenContract+
    " · toàn bộ 1.000.000 BILA ban đầu thuộc ví gốc; không có chức năng mint thêm.";
  writeLog("ok","BILA ERC-20 được xác minh độc lập: "+proof.contractUrl);
  return proof;
}
async function deployBilaToken(){
  if(!bilaBuild)throw Error("Cần nạp bản build BILA đã biên dịch trước");
  requireReady();
  await assertLiveSigner();
  const ready=await checkTokenDeployment();
  if(!ready.covered)throw Error("Chưa đủ Sepolia ETH hoặc không ước tính được phí triển khai.");
  const msg="Triển khai token thử nghiệm Bila (Bitlang) BILA trên Ethereum Sepolia?"+
    "\nBackend: Solidity 0.8.30 + OpenZeppelin 5.6.1 (KHÔNG phải compiler native BilaScript)."+
    "\nTổng cung cố định: 1.000.000 BILA; 18 decimals; ví gốc "+bilaBuild.genesisWallet+
    ".\nPhí tối đa ước tính hiện tại: "+ready.estimatedCostEth+" Sepolia ETH. MetaMask sẽ yêu cầu ký.";
  if(!window.confirm(msg))return;
  $("bila-stage").textContent="Đang yêu cầu chữ ký MetaMask để triển khai ERC-20 trên Sepolia…";
  const tx=await rpc("eth_sendTransaction",[{from:account,
    data:bilaBuild.creationBytecode,value:"0x0"}]);
  $("bila-tx").value=tx;
  linkTransaction(tx);
  $("bila-stage").textContent="Đã phát tx thật "+tx+". Đang kiểm tra receipt…";
  const result=await receipt(tx);
  if(BigInt(result.status)!==1n)throw Error("Triển khai BILA revert: "+tx);
  await verifyBilaFromInput();
  resetDeploymentChecks();
}

async function deploy(){
  requireReady();await assertSepolia();
  await assertLiveSigner();
  const readiness=await checkNativeDeployment();
  if(!readiness.covered)throw Error("Ví chưa đủ ETH hoặc chưa xác minh gas trên Sepolia. Hãy nhận test ETH và kiểm tra lại.");
  const build=compiled;
  const creation=build.creationBytecode;
  const estimated=await rpc("eth_estimateGas",[{from:account,data:creation}]);
  $("gas-estimate").textContent=toBig(estimated).toLocaleString("vi-VN")+" gas · eth_estimateGas";
  if(!window.confirm("Triển khai BYTECODE THẬT trên Sepolia bằng ví "+account+"?\nGas thanh toán bằng Sepolia ETH thử nghiệm, không dùng mainnet."))return;
  const hash=await rpc("eth_sendTransaction",[{from:account,data:creation,value:"0x0"}]);
  lastTx=hash;linkTransaction(hash);writeLog("ok","Deploy đã phát tx: "+hash);
  setStatus("Đang xác nhận deploy trên Sepolia","pending");
  const r=await receipt(hash);lastReceipt=r;
  if(toBig(r.status)!==1n)throw Error("Deploy bị revert: "+hash);
  if(!r.contractAddress)throw Error("Receipt thành công nhưng không có contractAddress");
  addressInput.value=r.contractAddress;linkContract(r.contractAddress);
  const [chainCode,chainId,transaction,ownerSlot]=await Promise.all([
    rpc("eth_getCode",[r.contractAddress,"latest"]),
    assertSepolia(),
    rpc("eth_getTransactionByHash",[hash]),
    rpc("eth_getStorageAt",[r.contractAddress,"0x0","latest"])
  ]);
  deployEvidence=verifySepoliaDeploy({
    expectedWallet:assertSigner(),chainId,receipt:r,transaction,
    code:chainCode,ownerSlot,compiled:build
  });
  $("gas-used").textContent=toBig(r.gasUsed).toLocaleString("vi-VN")+" gas · receipt";
  report.textContent=pretty(deployEvidence);
  $("download-proof").disabled=false;
  setStatus("Sepolia đã xác minh: ví · receipt · bytecode · chủ sở hữu","ok");
  writeLog("ok","Đã xác minh thực: "+r.contractAddress+" từ "+account+"; gas="+toBig(r.gasUsed));
  await refreshState();
}
async function runCall(){
  requireReady();await assertSepolia();
  await assertLiveSigner();
  const contract=inputAddress(),m=selectedMethod();
  const data=encodeCall(m,inputArg.value);
  const tx={from:account,to:contract,data};
  if(m.operation==="get"){
    const response=await rpc("eth_call",[tx,"latest"]);
    if(!/^0x[0-9a-fA-F]{64}$/.test(response))throw Error("Return data không đủ 32 byte: "+response);
    $("return-data").textContent=toBig(response).toString()+" · "+response;
    writeLog("ok","eth_call "+m.name+" trả "+toBig(response).toString()+" (dữ liệu thực từ node)");
    await refreshState();
    return;
  }
  const estimate=await rpc("eth_estimateGas",[tx]);
  $("gas-estimate").textContent=toBig(estimate).toLocaleString("vi-VN")+" gas · eth_estimateGas";
  if(!window.confirm("Gửi giao dịch "+m.signature+" tới "+contract+" trên SEPOLIA?\nVí sẽ yêu cầu xác nhận và trả phí Sepolia ETH."))return;
  const hash=await rpc("eth_sendTransaction",[tx]);
  lastTx=hash;linkTransaction(hash);setStatus("Đang chờ xác nhận giao dịch","pending");
  writeLog("ok","Đã phát tx "+hash);
  const r=await receipt(hash);lastReceipt=r;
  $("gas-used").textContent=toBig(r.gasUsed).toLocaleString("vi-VN")+" gas · receipt";
  report.textContent=pretty({chainId:SEPOLIA,txHash:hash,contract,blockNumber:toBig(r.blockNumber).toString(),gasUsed:toBig(r.gasUsed).toString(),status:r.status,logs:r.logs});
  if(toBig(r.status)!==1n)throw Error("Giao dịch thất bại/revert: "+hash);
  setStatus("Giao dịch xác nhận trên Sepolia","ok");
  writeLog("ok","Receipt status=1, gasUsed="+toBig(r.gasUsed));
  await refreshState();
}
async function refreshState(){
  if(!account)throw Error("Hãy kết nối ví trước");
  assertSigner();
  await assertSepolia();
  const a=inputAddress();
  const code=await rpc("eth_getCode",[a,"latest"]);
  const exists=code&&code!=="0x";
  $("chain-code").textContent=exists?code.length/2-1+" byte runtime":"KHÔNG CÓ mã EVM tại địa chỉ này";
  const match=compiled&&code.toLowerCase()===compiled.runtimeBytecode.toLowerCase();
  $("bytecode-match").textContent=exists?(match?"KHỚP compiler hiện tại":"KHÁC/CHƯA XÁC MINH"):"KHÔNG CÓ CONTRACT";
  const layout=compiled?.storageLayout||[{name:"__bila_owner",type:"address",slot:0}];
  const values=[];
  for(const entry of layout){
    const val=await rpc("eth_getStorageAt",[a,"0x"+entry.slot.toString(16),"latest"]);
    const owner=entry.type==="address"?"0x"+toBig(val).toString(16).padStart(40,"0").slice(-40):undefined;
    values.push({name:entry.name,slot:entry.slot,type:entry.type,hex:val,decimal:toBig(val).toString(),owner});
  }
  $("storage").textContent=pretty(values);
  $("last-block").textContent=toBig(await rpc("eth_blockNumber")).toString();
  writeLog("ok","Đọc eth_getCode, eth_getStorageAt và eth_blockNumber từ Sepolia");
}
async function estimateOnly(){
  requireReady();await assertSepolia();
  await assertLiveSigner();
  const target=addressInput.value.trim();
  const m=selectedMethod(),tx=target?{from:account,to:inputAddress(),data:encodeCall(m,inputArg.value)}
    :{from:account,data:compiled.creationBytecode};
  const v=await rpc("eth_estimateGas",[tx]);
  $("gas-estimate").textContent=toBig(v).toLocaleString("vi-VN")+" gas · estimate hiện tại";
  writeLog("ok","eth_estimateGas trả "+toBig(v).toString()+" gas");
}
async function verifyPublicDeployment(){
  if(!compiled)throw Error("Cần biên dịch chính xác source BilaScript trước khi đối chiếu");
  const expected=assertSafeSepoliaWallet(expectedWallet.value.trim());
  provider=getProvider();
  const chainId=await assertSepolia();
  const txHash=$("public-tx").value.trim();
  if(!/^0x[0-9a-fA-F]{64}$/.test(txHash))throw Error("Transaction hash phải có 64 chữ số hex");
  const [receipt,transaction]=await Promise.all([
    rpc("eth_getTransactionReceipt",[txHash]),
    rpc("eth_getTransactionByHash",[txHash])
  ]);
  if(!receipt||!transaction)throw Error("Chưa có transaction đã xác nhận trên Sepolia; kiểm tra explorer");
  if(!receipt.contractAddress)throw Error("Đây không phải giao dịch triển khai hợp đồng");
  const [code,ownerSlot]=await Promise.all([
    rpc("eth_getCode",[receipt.contractAddress,"latest"]),
    rpc("eth_getStorageAt",[receipt.contractAddress,"0x0","latest"])
  ]);
  deployEvidence=verifySepoliaDeploy({
    expectedWallet:expected,chainId,receipt,transaction,code,ownerSlot,
    compiled
  });
  addressInput.value=receipt.contractAddress;
  linkContract(receipt.contractAddress);linkTransaction(txHash);
  $("gas-used").textContent=toBig(receipt.gasUsed).toLocaleString("vi-VN")+" gas · receipt";
  report.textContent=pretty(deployEvidence);
  $("download-proof").disabled=false;
  setStatus("Đã xác minh giao dịch Sepolia độc lập từ RPC","ok");
  writeLog("ok","Bằng chứng Sepolia đã kiểm tra từ tx "+txHash);
}
async function verifyTransaction(){
  if(!lastTx)throw Error("Chưa có transaction hash từ phiên này");
  assertSigner();
  await assertSepolia();
  const r=await rpc("eth_getTransactionReceipt",[lastTx]);
  if(!r)throw Error("Chưa tìm được transaction receipt");
  report.textContent=pretty({txHash:lastTx,receipt:r});
  writeLog("ok","Đọc receipt thật; trạng thái "+r.status);
}
function guard(action){return async()=>{
  try{await action();}catch(err){
    setStatus("Thao tác thất bại · xem Nhật ký ví","error");
    writeLog("error",describeProviderError(err));
  }
};}
$("compile").addEventListener("click",compile);
$("reset").addEventListener("click",()=>{source.value=EXAMPLE;compile();});
$("connect").addEventListener("click",guard(async()=>{
  const button=$("connect");
  button.disabled=true;
  try{await connect();}finally{button.disabled=false;}
}));
$("switch").addEventListener("click",guard(changeChain));
$("wallet-check").addEventListener("click",guard(checkWalletOnSepolia));
$("deploy-check").addEventListener("click",guard(checkNativeDeployment));
$("deploy").addEventListener("click",guard(deploy));
$("bila-load").addEventListener("click",guard(loadTokenBuild));
$("bila-check").addEventListener("click",guard(checkTokenDeployment));
$("bila-deploy").addEventListener("click",guard(deployBilaToken));
$("bila-verify").addEventListener("click",guard(verifyBilaFromInput));
$("bila-proof").addEventListener("click",()=>{
  if(bilaTokenProof)saveJSON("bila-bitlang-sepolia-proof-"+bilaTokenProof.transactionHash+".json",bilaTokenProof);
});
$("run").addEventListener("click",guard(runCall));
$("estimate").addEventListener("click",guard(estimateOnly));
$("refresh").addEventListener("click",guard(refreshState));
$("verify").addEventListener("click",guard(verifyTransaction));
$("verify-public").addEventListener("click",guard(verifyPublicDeployment));
methodSelect.addEventListener("change",changeMethod);
$("copy").addEventListener("click",guard(async()=>{
  if(!compiled)throw Error("Chưa biên dịch");
  await navigator.clipboard.writeText(compiled.creationBytecode);
  writeLog("ok","Đã sao chép creation bytecode");
}));
$("download").addEventListener("click",()=>{
  if(compiled)saveJSON("bilascript-v6-evm-build.json",{
    compiler:compiled.compiler,abi:compiled.abi,
    creationBytecode:compiled.creationBytecode,runtimeBytecode:compiled.runtimeBytecode
  });
});
$("download-proof").addEventListener("click",()=>{
  if(deployEvidence)saveJSON("bilascript-v6-sepolia-proof-"+deployEvidence.transactionHash+".json",deployEvidence);
});
const providerDropdown=$("wallet-provider");
const providerInfo=$("wallet-detector");
let chosenManually=false;
walletCatalog.onChange(items=>{
  const previous=providerDropdown.value||walletCatalog.selected;
  providerDropdown.replaceChildren();
  for(const entry of items){
    const option=document.createElement("option");
    option.value=entry.id;
    option.textContent=entry.name+(entry.id.startsWith("injected:")?" · dự phòng":" · EIP-6963");
    providerDropdown.appendChild(option);
  }
  const metaMask=items.find(x=>!x.id.startsWith("injected:")&&/metamask/i.test(x.name));
  const selected=chosenManually&&items.some(x=>x.id===previous)?previous:
    (metaMask?.id||(items.some(x=>x.id===previous)?previous:walletCatalog.selected));
  if(items.length){
    providerDropdown.value=selected;
    walletCatalog.selected=selected;
    providerInfo.textContent="Đã phát hiện "+items.length+" lựa chọn. Hãy kiểm tra đúng tiện ích ví trước khi kết nối.";
  }else providerInfo.textContent="Chưa tìm thấy ví EVM. Bật/cấp quyền MetaMask trong phần tiện ích của trình duyệt rồi quét lại.";
  providerDropdown.disabled=!items.length;
});
providerDropdown.addEventListener("change",()=>{
  chosenManually=true;
  try{
    walletCatalog.select(providerDropdown.value);
    const selected=walletCatalog.current();
    if(provider!==selected){
      provider=selected;
      clearAccount("Đã đổi nhà cung cấp ví · hãy kết nối lại");
      listenProvider(selected);
    }
  }catch(error){writeLog("error",describeProviderError(error));}
});
$("wallet-refresh").addEventListener("click",()=>walletCatalog.refresh());
$("faucet-copy").addEventListener("click",guard(copyFaucetRecipient));
$("faucet-balance").addEventListener("click",guard(checkFaucetBalance));
expectedWallet.addEventListener("input",syncFaucetRecipient);
syncFaucetRecipient();
walletCatalog.start();
source.value=EXAMPLE;
compile();
window.addEventListener("unhandledrejection",event=>{
  writeLog("error","Lỗi chưa xử lý: "+describeProviderError(event.reason));
});
