import {compileBila,encodeCall,disassemble,EXAMPLE} from "./compiler.mjs";

const $=id=>document.getElementById(id);
const source=$("source"), output=$("output"), opcodes=$("opcodes"), abi=$("abi"), ast=$("ast");
const logBox=$("events"), report=$("evidence"), status=$("status");
const addressInput=$("address"), methodSelect=$("method"), inputArg=$("argument");
let compiled=null,account="",provider=null,lastTx="",lastReceipt=null,deployEvidence=null;
const SEPOLIA="0xaa36a7";
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
  const p=window.ethereum;
  if(!p||typeof p.request!=="function")throw Error("Không phát hiện ví EIP-1193. Cài/mở MetaMask hoặc ví tương thích trong trình duyệt.");
  return p;
}
async function rpc(method,params=[]){
  const p=provider||getProvider();
  return p.request({method,params});
}
async function assertSepolia(){
  const actual=await rpc("eth_chainId");
  if(actual.toLowerCase()!==SEPOLIA)throw Error("Sai mạng "+actual+"; chỉ cho phép Sepolia (11155111). Không triển khai mainnet.");
  return actual;
}
async function connect(){
  provider=getProvider();
  await assertSepolia();
  const accounts=await rpc("eth_requestAccounts");
  if(!accounts||!accounts[0])throw Error("Ví không trả về tài khoản");
  account=accounts[0];
  $("wallet").textContent=account.slice(0,8)+"…"+account.slice(-6);
  setStatus("Đã kết nối Sepolia — chưa triển khai","neutral");
  writeLog("ok","Đã xác minh chain ID 11155111, ví "+account);
}
async function changeChain(){
  const p=getProvider();
  await p.request({method:"wallet_switchEthereumChain",params:[{chainId:SEPOLIA}]});
  writeLog("ok","Đã yêu cầu ví chuyển sang Sepolia");
}
function requireReady(){
  if(!compiled)throw Error("Hãy biên dịch trước");
  if(!account)throw Error("Hãy kết nối ví Sepolia");
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
async function deploy(){
  requireReady();await assertSepolia();
  const creation=compiled.creationBytecode;
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
  const chainCode=await rpc("eth_getCode",[r.contractAddress,"latest"]);
  const codeMatch=chainCode.toLowerCase()===compiled.runtimeBytecode.toLowerCase();
  const chainId=await assertSepolia();
  deployEvidence={chainId,txHash:hash,contract:r.contractAddress,gasUsed:toBig(r.gasUsed).toString(),
    blockNumber:toBig(r.blockNumber).toString(),status:r.status,bytecodeMatches:codeMatch,
    deployedBytecode:chainCode,compiler:compiled.compiler,creationBytecode:creation};
  $("gas-used").textContent=toBig(r.gasUsed).toLocaleString("vi-VN")+" gas · receipt";
  report.textContent=pretty(deployEvidence);
  setStatus(codeMatch?"Deploy thành công · bytecode khớp":"Deploy thành công · bytecode KHÔNG khớp",codeMatch?"ok":"error");
  writeLog(codeMatch?"ok":"error","Receipt "+r.status+" · runtime bytecode "+(codeMatch?"TRÙNG":"KHÁC")+" nguồn · "+r.contractAddress);
  await refreshState();
}
async function runCall(){
  requireReady();await assertSepolia();
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
  const target=addressInput.value.trim();
  const m=selectedMethod(),tx=target?{from:account,to:inputAddress(),data:encodeCall(m,inputArg.value)}
    :{from:account,data:compiled.creationBytecode};
  const v=await rpc("eth_estimateGas",[tx]);
  $("gas-estimate").textContent=toBig(v).toLocaleString("vi-VN")+" gas · estimate hiện tại";
  writeLog("ok","eth_estimateGas trả "+toBig(v).toString()+" gas");
}
async function verifyTransaction(){
  if(!lastTx)throw Error("Chưa có transaction hash từ phiên này");
  await assertSepolia();
  const r=await rpc("eth_getTransactionReceipt",[lastTx]);
  if(!r)throw Error("Chưa tìm được transaction receipt");
  report.textContent=pretty({txHash:lastTx,receipt:r});
  writeLog("ok","Đọc receipt thật; trạng thái "+r.status);
}
function guard(action){return async()=>{
  try{await action();}catch(err){setStatus("Thao tác thất bại","error");writeLog("error",err?.message||String(err));}
};}
$("compile").addEventListener("click",compile);
$("reset").addEventListener("click",()=>{source.value=EXAMPLE;compile();});
$("connect").addEventListener("click",guard(connect));
$("switch").addEventListener("click",guard(changeChain));
$("deploy").addEventListener("click",guard(deploy));
$("run").addEventListener("click",guard(runCall));
$("estimate").addEventListener("click",guard(estimateOnly));
$("refresh").addEventListener("click",guard(refreshState));
$("verify").addEventListener("click",guard(verifyTransaction));
methodSelect.addEventListener("change",changeMethod);
$("copy").addEventListener("click",guard(async()=>{if(!compiled)throw Error("Chưa biên dịch");await navigator.clipboard.writeText(compiled.creationBytecode);writeLog("ok","Đã sao chép creation bytecode");}));
$("download").addEventListener("click",()=>{if(!compiled)return;const blob=new Blob([pretty({compiler:compiled.compiler,abi:compiled.abi,creationBytecode:compiled.creationBytecode,runtimeBytecode:compiled.runtimeBytecode})],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="bilascript-v6-evm-build.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
source.value=EXAMPLE;compile();
if(window.ethereum?.on){
  window.ethereum.on("chainChanged",()=>{account="";$("wallet").textContent="Chưa kết nối";setStatus("Mạng thay đổi · kết nối lại","neutral");});
  window.ethereum.on("accountsChanged",()=>{account="";$("wallet").textContent="Chưa kết nối";setStatus("Tài khoản thay đổi · kết nối lại","neutral");});
}
