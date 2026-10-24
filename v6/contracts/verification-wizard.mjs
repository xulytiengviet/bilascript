/**
 * BilaScript v6 · XÁC THỰC in three steps.
 * 1 Read an existing receipt OR ask MetaMask to sign a NEW native deployment.
 * 2 Upload JSON (or load canonical JSON) and reproducibly compile .bila.
 * 3 Independently check source/creation/receipt/runtime/owner on real Sepolia.
 * No Solc for native creation, no server signing, no invented chain state.
 */
import {compileBila} from "../compiler.mjs";
import {BrowserWallets,ensureSepolia,describeProviderError} from "../wallet-adapter.mjs";
import {checkDeploymentReady} from "../deployment-ready.mjs";
import {publicSepoliaRpc,verifyNativeSepoliaAddress,NATIVE_ROOT_WALLET,reproduceNativeSource} from "./verify-native-sepolia.mjs";
import {validateDeploymentPair,normalizeNativeUpload,buildThreeStepProof,
 ETHERSCAN_SOLIDITY_REFERENCE,NATIVE_DEPLOYMENT_EXAMPLE} from "./verification-wizard-core.mjs?v=2-reimport-native-proof";
const $=id=>document.getElementById(id);
const ROOT=NATIVE_ROOT_WALLET;
const SOURCE="../contracts/Bila_CVNSS40_Native.bila?v=1";
const BUILD="../contracts/Bila_CVNSS40_Native.build.json?v=1";
const wallets=new BrowserWallets(window);
let source=null,canonical=null,transactionPair=null,normalized=null,finalProof=null,busy=false;
const same=(a,b)=>String(a||"").toLowerCase()===String(b||"").toLowerCase();
const dump=x=>JSON.stringify(x,(_,v)=>typeof v==="bigint"?v.toString():v,2);
function setStatus(step,msg,state="pending"){
 const el=$("s"+step+"-message");el.textContent=msg;el.dataset.state=state;
 $("s"+step+"-badge").textContent=state==="ok"?"ĐÃ ĐẠT":state==="error"?"CHƯA ĐẠT":"ĐANG CHỜ";
}
function overall(){ $("overall").textContent=finalProof?"ĐÃ XÁC THỰC 3/3":
 transactionPair&&normalized?"Sẵn sàng bước 3":transactionPair?"Hoàn tất bước 1":normalized?"Hoàn tất bước 2":"Chưa bắt đầu"; }
function resetProof(){
 finalProof=null;$("download").disabled=true;
 ["runtime-result","creation-result","owner-result","block-result"].forEach(id=>$(id).textContent="—");
 $("evidence").textContent="CHƯA XÁC MINH · Nạp JSON và đối chiếu dữ liệu mạng bằng RPC thật.";
 setStatus(3,"Bước 3 cần đối chiếu lại toàn bộ dữ liệu hiện tại.");
 $("verify").disabled=!(transactionPair?.passed&&normalized?.sourceRecompiled);
 overall();
}
function clearPair(){
 transactionPair=null;
 setStatus(1,"Địa chỉ hoặc transaction đã thay đổi: cần kiểm tra lại receipt Sepolia.");
 resetProof();
}
function showTxLinks(){
 const a=$("contract-address").value.trim(),t=$("tx-hash").value.trim();
 if(/^0x[0-9a-fA-F]{40}$/.test(a))$("contract-link").href="https://sepolia.etherscan.io/address/"+a;
 if(/^0x[0-9a-fA-F]{64}$/.test(t))$("transaction-link").href="https://sepolia.etherscan.io/tx/"+t;
}
function showError(step,e){
 const message=describeProviderError(e);
 setStatus(step,message,"error");
 $("evidence").textContent="Không thể hoàn tất bước "+step+": "+message;
 overall();
}
async function ensureSources(){
 if(source&&canonical)return {source,canonical};
 const [sr,br]=await Promise.all([
  fetch(SOURCE,{cache:"no-store"}),fetch(BUILD,{cache:"no-store"})
 ]);
 if(!sr.ok||!br.ok)throw Error("Không tải được nguồn .bila hoặc build JSON chuẩn từ GitHub Pages");
 const [s,b]=await Promise.all([sr.text(),br.json()]);
 reproduceNativeSource(s,b);
 source=s;canonical=b;
 return {source,canonical};
}
async function checkTransaction(){
 const address=$("contract-address").value.trim();
 const txHash=$("tx-hash").value.trim();
 clearPair();
 setStatus(1,"Đang đọc transaction và receipt trực tiếp trên Ethereum Sepolia…");
 const {request}=await publicSepoliaRpc();
 const [transaction,receipt]=await Promise.all([
  request("eth_getTransactionByHash",[txHash]),
  request("eth_getTransactionReceipt",[txHash])
 ]);
 const p=validateDeploymentPair({address,hash:txHash,transaction,receipt});
 $("evidence").textContent=dump({schema:"bilascript.sepolia.creation.transaction-check.v1",network:"Ethereum Sepolia",...p});
 showTxLinks();
 if(!p.passed){
  setStatus(1,p.wrongPair?"Sai cặp địa chỉ và transaction. Receipt thực sự tạo "+p.receiptContractAddress+". Hãy thay địa chỉ đúng hoặc dùng hash khác.":"Receipt chưa đạt điều kiện "+p.firstFailure+".","error");
  return p;
 }
 transactionPair=p;
 setStatus(1,"Sepolia đã xác nhận creation tx từ ví gốc. Block "+p.blockNumber+
  ", creation input "+p.transactionInputBytes+" byte. Bước 3 sẽ kiểm tra bytecode có đúng compiler BilaScript hay không.","ok");
 resetProof();
 return p;
}
async function pollReceipt(p,txHash){
 for(let i=0;i<28;i++){
  const r=await p.request({method:"eth_getTransactionReceipt",params:[txHash]});
  if(r)return r;
  await new Promise(ok=>setTimeout(ok,4000));
 }
 throw Error("Giao dịch đã gửi nhưng chưa có receipt. Hash vẫn còn trong ô để kiểm tra lại.");
}
async function deployNative(){
 const {source:s,canonical:b}=await ensureSources();
 const compiled=compileBila(s);
 if(!same(compiled.creationBytecode,b.creationBytecode)||!same(compiled.runtimeBytecode,b.runtimeBytecode))
  throw Error("Nguồn CVNSS không khớp creation/runtime của JSON chuẩn");
 const p=wallets.current();
 const accounts=await p.request({method:"eth_requestAccounts"});
 if(!Array.isArray(accounts)||!accounts.some(v=>same(v,ROOT)))
  throw Error("Phải chọn ví gốc 0x879E2270…D93Cf trong MetaMask.");
 await ensureSepolia(p,{switchNetwork:true});
 const active=await p.request({method:"eth_accounts"});
 if(!active?.some(v=>same(v,ROOT)))throw Error("Ví nguồn đã đổi sau khi chuyển Sepolia.");
 const ready=await checkDeploymentReady({provider:p,from:ROOT,creationBytecode:compiled.creationBytecode});
 if(!ready.covered)throw Error(ready.reason);
 const confirmMessage="Triển khai HỢP ĐỒNG NATIVE BilaScript trên Ethereum Sepolia?"+
  "\nNguồn: Bila_CVNSS40_Native.bila, 22 hàm ABI, không dùng Solidity/Solc."+
  "\nVí ký: "+ROOT+
  "\nPhí ước tính: "+ready.estimatedCostEth+" Sepolia ETH."+
  "\nMetaMask sẽ xin xác nhận một lần nữa.";
 if(!window.confirm(confirmMessage))return;
 clearPair();
 setStatus(1,"Đang yêu cầu MetaMask ký creation bytecode BilaScript native…");
 const txHash=await p.request({method:"eth_sendTransaction",params:[{
  from:ROOT,data:compiled.creationBytecode,value:"0x0"
 }]});
 if(!/^0x[0-9a-fA-F]{64}$/.test(txHash))throw Error("MetaMask không trả về tx hash hợp lệ");
 $("tx-hash").value=txHash;showTxLinks();
 setStatus(1,"Đã gửi giao dịch thật "+txHash+". Đang chờ receipt Sepolia…");
 const rec=await pollReceipt(p,txHash);
 if(BigInt(rec.status)!==1n||!/^0x[0-9a-fA-F]{40}$/.test(rec.contractAddress||""))
  throw Error("Triển khai bị revert hoặc receipt không chứa địa chỉ hợp đồng.");
 $("contract-address").value=rec.contractAddress;showTxLinks();
 await checkTransaction();
}
async function selectJSON(data,origin){
 const {source:s,canonical:b}=await ensureSources();
 const result=normalizeNativeUpload(data,s,b);
 normalized={...result,origin};
 setStatus(2,"JSON "+result.format+" từ "+origin+" · ABI "+result.abiFunctions+
  " hàm · runtime "+result.runtimeBytes+" byte. Source .bila và EVM bytes tái lập chính xác.","ok");
 resetProof();
 return normalized;
}
async function loadCanonical(){
 const {canonical:b}=await ensureSources();
 return selectJSON(b,"GitHub / bản build chuẩn");
}
async function loadUploaded(){
 const file=$("json-file").files?.[0];
 if(!file)return;
 if(file.size>3_000_000)throw Error("JSON vượt giới hạn 3 MB");
 const data=JSON.parse(await file.text());
 return selectJSON(data,"Tệp "+file.name+" ("+file.size+" byte)");
}
async function verify(){
 if(!transactionPair?.passed)throw Error("Bước 1 chưa xác nhận đúng transaction/receipt");
 if(!normalized?.sourceRecompiled)throw Error("Bước 2 chưa nạp và kiểm chứng JSON");
 resetProof();
 setStatus(3,"Đang tái biên dịch native và đọc runtime/owner/creation từ Sepolia…");
 const result=await verifyNativeSepoliaAddress({
  address:transactionPair.address,
  transactionHash:transactionPair.txHash,
  source,artifact:normalized.artifact
 });
 $("runtime-result").textContent=result.runtimeMatchesDeployed?"MATCH":"FAIL";
 $("creation-result").textContent=result.transactionMatchesCreation?"MATCH":"FAIL";
 $("owner-result").textContent=result.ownerSlotMatches?"MATCH":"FAIL";
 $("block-result").textContent=result.blockNumber;
 $("evidence").textContent=dump({
  status:result.status,contract:result.address,txHash:result.transactionHash,
  txConditions:result.transactionChecks,
  compiler:result.compiler,sourceHash:result.sourceTextKeccak256,
  RPC:result.rpcSource,block:result.blockNumber,SolidityVerified:false
 });
 if(result.status!=="EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT"){
  setStatus(3,"Chưa xác thực được đầy đủ: "+result.status+
   ". Kiểm tra từng txConditions trong báo cáo.","error");
  return;
 }
 finalProof=buildThreeStepProof({
  pair:transactionPair,normalized,onchain:result,source,canonical
 });
 setStatus(3,"ĐÃ XÁC THỰC: bytecode native, nguồn CVNSS4.0, creation tx, receipt và owner đều trùng RPC Sepolia.","ok");
 $("download").disabled=false;overall();
}
function saveProof(){
 if(!finalProof)throw Error("Chưa có chứng cứ để xuất");
 const blob=new Blob([JSON.stringify(finalProof,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download="BilaScript-Native-Sepolia-"+finalProof.onchain.address+".json";
 a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function wire(id,step,fn){
 $(id).addEventListener("click",async()=>{
  if(busy)return;
  busy=true;$(id).disabled=true;
  try{await fn();}catch(e){showError(step,e);}
  finally{busy=false;$(id).disabled=false;
   $("verify").disabled=!(transactionPair?.passed&&normalized?.sourceRecompiled);
   $("download").disabled=!finalProof;
   overall();}
 });
}
function updateWallets(entries){
 const s=$("wallet");const previous=s.value;
 s.replaceChildren();
 for(const item of entries){
  const o=document.createElement("option");
  o.value=item.id;o.textContent=item.name;s.appendChild(o);
 }
 const preferred=entries.find(v=>/MetaMask/i.test(v.name));
 const id=entries.some(v=>v.id===previous)?previous:preferred?.id||wallets.selected;
 if(id&&entries.some(v=>v.id===id)){s.value=id;wallets.selected=id;}
 s.disabled=!entries.length;
 if(!entries.length){
  const o=document.createElement("option");o.textContent="Không có ví EVM";s.appendChild(o);
 }
}
$("contract-address").addEventListener("input",()=>{clearPair();showTxLinks();});
$("tx-hash").addEventListener("input",()=>{clearPair();showTxLinks();});
$("json-file").addEventListener("change",async()=>{
 normalized=null;resetProof();
 try{await loadUploaded();}catch(e){showError(2,e);}
});
wallets.onChange(updateWallets);
$("wallet").addEventListener("change",()=>wallets.select($("wallet").value));
wallets.start();
wire("check-tx",1,checkTransaction);
wire("deploy",1,deployNative);
wire("load-json",2,loadCanonical);
wire("verify",3,verify);
wire("download",3,saveProof);
const params=new URLSearchParams(window.location.search);
const add=params.get("address"),txn=params.get("tx");
if(add)$("contract-address").value=add;
if(txn)$("tx-hash").value=txn;
showTxLinks();
overall();
