/**
 * BilaScript Native EVM HỢP ĐỒNG laboratory on GitHub Pages.
 * No Solidity frontend/compiler, no private keys, no server signer.
 * All chain data MUST come from EIP-1193 Ethereum Sepolia RPC.
 */
import {compileBila,keccak256,encodeCall} from "../compiler.mjs";
import {BrowserWallets,ensureSepolia,describeProviderError} from "../wallet-adapter.mjs";
import {checkDeploymentReady} from "../deployment-ready.mjs";
import {verifySepoliaDeploy,SELECTED_SEPOLIA_WALLET} from "../sepolia-proof.mjs";
import {verifyNativeSepoliaAddress,reproduceNativeSource,NATIVE_ADDRESS} from "./verify-native-sepolia.mjs";
const $=id=>document.getElementById(id);
const ROOT=SELECTED_SEPOLIA_WALLET;
const SOURCE_URL="../contracts/Bila_CVNSS40_Native.bila?v=1";
const explorer="https://sepolia.etherscan.io";
const wallets=new BrowserWallets(window);
let wallet=null,account="",compiled=null,compiledSource="",lastProof=null;
let canonicalBuild=null,buildToVerify=null,buildOrigin="chưa nạp";
const CANONICAL_BUILD_URL="../contracts/Bila_CVNSS40_Native.build.json?v=20261024-native";
let watcher=null,manualProvider=false,busy=false;
const j=v=>JSON.stringify(v,(_,x)=>typeof x==="bigint"?x.toString():x,2);
const same=(a,b)=>String(a||"").toLowerCase()===String(b||"").toLowerCase();
function status(message,tone="neutral"){$("state").textContent=message;$("state").dataset.state=tone;}
function log(message,kind="ok"){
 const item=document.createElement("div");item.className="log "+kind;
 item.textContent=new Date().toLocaleTimeString("vi-VN",{hour12:false})+" · "+message;
 const host=$("logs");
 if(host.textContent==="Chưa thực hiện thao tác.")host.replaceChildren();
 host.prepend(item);while(host.children.length>80)host.lastChild.remove();
}
function fail(e){status("Lỗi · xem nhật ký","error");log(describeProviderError(e),"error");}
function guarded(action){return async()=>{try{await action();}catch(e){fail(e);}};}
function selectedProvider(){
 const p=wallets.current();
 if(wallet!==p){wallet=p;setAccountDisconnected("Đã đổi nhà cung cấp ví · kết nối lại");watchWallet(p);}
 return p;
}
function watchWallet(p){
 if(watcher&&typeof watcher.provider.removeListener==="function"){
  watcher.provider.removeListener("accountsChanged",watcher.change);
  watcher.provider.removeListener("chainChanged",watcher.change);
 }
 const change=()=>setAccountDisconnected("Ví đã đổi mạng/tài khoản · kết nối lại.");
 if(typeof p.on==="function"){p.on("accountsChanged",change);p.on("chainChanged",change);}
 watcher={provider:p,change};
}
function invalidateFunding(){
 $("deploy-native").disabled=true;
 $("balance").textContent="—";$("cost").textContent="—";
 $("gas-info").textContent="Chưa kiểm tra gas cho build/source hiện tại.";
}
function setAccountDisconnected(message){
 account="";
 $("wallet-state").textContent=message;
 invalidateFunding();
}
function assertCompileCurrent(){
 if(!compiled||compiledSource!==$("native-source").value)
  throw Error("Nguồn đã thay đổi hoặc chưa biên dịch. Hãy biên dịch lại bản mã .bila trước.");
 return compiled;
}
async function assertSigner(){
 if(!same(account,ROOT))throw Error("Chỉ ví gốc "+ROOT+" được phép ký nghiên cứu.");
 const p=selectedProvider();
 await ensureSepolia(p,{switchNetwork:false});
 const connected=await p.request({method:"eth_accounts"});
 if(!Array.isArray(connected)||!connected.some(a=>same(a,ROOT)))
  throw Error("MetaMask chưa cấp quyền hoặc đang mở tài khoản khác "+ROOT+".");
 return p;
}
function providerRPC(method,params=[]){
 return selectedProvider().request({method,params});
}
function exportFile(name,mime,content){
 const blob=new Blob([content],{type:mime});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function blockFrom(name,address){
 const a=$(name);a.href=explorer+"/address/"+address;
 a.textContent="Hợp đồng "+address.slice(0,10)+"…"+address.slice(-6)+" ↗";a.hidden=false;
}
function txFrom(name,hash){
 const a=$(name);a.href=explorer+"/tx/"+hash;
 a.textContent="Giao dịch "+hash.slice(0,12)+"…"+hash.slice(-8)+" ↗";a.hidden=false;
}
function newProofState(){
 lastProof=null;$("download-proof").disabled=true;
 $("proof").textContent="CHƯA XÁC MINH · Cần receipt Sepolia và bytecode khớp nguồn native hiện tại.";
}
function compileSource(){
 const source=$("native-source").value;
 let result;
 try{result=compileBila(source);}
 catch(e){
  compiled=null;compiledSource="";$("method-run").disabled=true;
  invalidateFunding();status("Biên dịch thất bại","error");throw e;
 }
 compiled=result;compiledSource=source;
 invalidateFunding();newProofState();
 $("metric-source").textContent=source.split(/\r?\n/).length.toString();
 $("metric-func").textContent=compiled.ast.functions.length.toString();
 $("metric-storage").textContent=compiled.storageLayout.length.toString();
 $("metric-bytes").textContent=((compiled.creationBytecode.length-2)/2).toLocaleString("vi-VN");
 $("metric-ops").textContent=compiled.opcodes.length.toLocaleString("vi-VN");
 $("source-hash").textContent=keccak256(source);
 $("compiler-name").textContent=compiled.compiler+" · "+compiled.vocabulary+
   "\n"+compiled.typeSystem+" · "+compiled.effects;
 $("creation").value=compiled.creationBytecode;
 $("runtime").value=compiled.runtimeBytecode;
 $("abi").textContent=j(compiled.abi);
 $("layout").textContent=j(compiled.storageLayout);
 const fragment=document.createDocumentFragment();
 for(const op of compiled.opcodes){
  const tr=document.createElement("tr");
  for(const val of [op.pc,op.opcode,op.name,op.immediate||"—"]){
   const td=document.createElement("td");td.textContent=String(val);tr.appendChild(td);
  }
  fragment.appendChild(tr);
 }
 $("opcode-rows").replaceChildren(fragment);
 const m=$("method");m.replaceChildren();
 for(const func of compiled.ast.functions){
  const option=document.createElement("option");
  option.value=func.name;option.textContent=func.signature+" · "+func.op+" · "+func.selector;
  m.appendChild(option);
 }
 $("method-run").disabled=false;
 $("native-refresh").disabled=false;
 showMethod();
 status("Đã biên dịch Native CVNSS4.0","ok");
 log("Native compile: "+compiled.ast.name+" · "+compiled.ast.functions.length+
   " hàm · "+compiled.storageLayout.length+" slots · "+
   ((compiled.creationBytecode.length-2)/2)+" creation bytes.");
 return compiled;
}
function showMethod(){
 const b=compiled?.methods?.[$("method").value];if(!b)return;
 $("method-value").disabled=!b.parameter;
 $("method-info").textContent=b.signature+" · "+b.selector+" · slot "+b.slot+
  " · "+(b.operation==="get"?"eth_call, không ghi":"chỉ chủ sở hữu, yêu cầu giao dịch thực");
}
async function fetchSource(){
 const r=await fetch(SOURCE_URL,{cache:"no-store"});
 if(!r.ok)throw Error("Không tải được nguồn CVNSS4.0 từ repository (HTTP "+r.status+").");
 const source=await r.text();
 if(!source.includes("hoph_dogd Bila_CVNSS40_Native"))
  throw Error("Nguồn tải về không phải hợp đồng CVNSS4.0 đã chọn.");
 $("native-source").value=source;compileSource();
}

function rejectIfInvalidBuild(source,file){
 if(!file||typeof file!=="object")throw Error("Không đọc được build JSON.");
 if(file.schema==="bilascript.native.cvnss40.reference-build.v1"){
  reproduceNativeSource(source,file);
  return {artifact:file,format:"canonical"};
 }
 // Backwards compatibility: early UI exported a 25KB session snapshot
 // (source+AST+ABI) without a schema. Never feed it to Etherscan as Solidity.
 if(file.compiler==="BilaScript-v6.0.1-native-evm"&&
   typeof file.source==="string"&&file.creationBytecode&&file.runtimeBytecode){
  if(file.source!==source)throw Error("JSON cũ chứa nguồn CVNSS4.0 khác file đang mở. Nạp đúng bản .bila rồi so khớp.");
  const build=compileBila(source);
  if(!same(file.creationBytecode,build.creationBytecode)||
     !same(file.runtimeBytecode,build.runtimeBytecode)||
     JSON.stringify(file.abi)!==JSON.stringify(build.abi)||
     JSON.stringify(file.storageLayout)!==JSON.stringify(build.storageLayout))
   throw Error("JSON phiên làm việc không khớp bytecode/ABI/storage biên dịch lại từ .bila.");
  if(!canonicalBuild)throw Error("Chưa nạp artifact chuẩn để xác định nguồn gốc của JSON cũ.");
  reproduceNativeSource(source,canonicalBuild);
  return {artifact:canonicalBuild,format:"legacy-ui-export-reproduced-and-matched-canonical"};
 }
 throw Error("Không phải BilaScript Native JSON hợp lệ. Không thể đưa JSON này vào Solidity verifier.");
}
async function loadCanonicalBuild(){
 const b=assertCompileCurrent();
 const response=await fetch(CANONICAL_BUILD_URL,{cache:"no-store"});
 if(!response.ok)throw Error("Không tải được artifact chuẩn từ GitHub Pages: HTTP "+response.status);
 const obj=await response.json();
 reproduceNativeSource(compiledSource,obj);
 canonicalBuild=obj;
 buildToVerify=obj;
 buildOrigin="canonical-github-pages";
 $("local-build").value="";
 $("verify-build-state").textContent="Đã nạp artifact chuẩn và tái biên dịch trùng 100%: "+
  obj.contractName+" · "+obj.runtimeBytes+" runtime bytes · "+
  obj.functionCount+" hàm. Đây là BilaScript JSON, KHÔNG phải Solidity Standard JSON.";
 log("Artifact native chuẩn tái lập khớp nguồn: "+obj.sourceTextKeccak256);
 return obj;
}
async function loadLocalBuild(){
 assertCompileCurrent();
 const file=$("local-build").files?.[0];
 if(!file)return;
 if(file.size>3_000_000)throw Error("File JSON lớn bất thường, tối đa 3MB.");
 if(!canonicalBuild)await loadCanonicalBuild();
 // Do not auto-reset a user-selected local file in loadCanonicalBuild.
 const data=JSON.parse(await file.text());
 const checked=rejectIfInvalidBuild(compiledSource,data);
 buildToVerify=checked.artifact;
 buildOrigin=checked.format+" · "+file.name+" · "+file.size+" bytes";
 $("verify-build-state").textContent=
  checked.format==="canonical"?
   "Tệp "+file.name+" đã trùng source/ABI/bytecode compiler native. Có thể xác minh Sepolia.":
   "Tệp cũ "+file.name+" ("+file.size+" byte) có cấu trúc xuất từ UI đời trước; đã tái biên dịch khớp nguồn và artifact chuẩn. Dùng nút Tải build JSON để lấy tệp chuẩn.";
 log("Đã kiểm tra tệp JSON tải lên: "+buildOrigin);
}
async function verifyAddressOnly(){
 assertCompileCurrent();
 newProofState();
 const address=assertAddress($("contract-address").value.trim());
 const artifact=buildToVerify||await loadCanonicalBuild();
 reproduceNativeSource(compiledSource,artifact);
 let provider=null;
 try{provider=wallets.current();}catch{}
 status("Đang xác minh Sepolia RPC…","pending");
 const result=await verifyNativeSepoliaAddress({
   address,source:compiledSource,artifact,provider,
   transactionHash:$("tx-hash").value.trim()||null
 });
 const success=(result.status==="EXACT_NATIVE_RUNTIME_AND_OWNER"||
  result.status==="EXACT_NATIVE_CREATION_RUNTIME_OWNER_AND_RECEIPT");
 const report={
  schema:"bilascript.native.source-and-chain-verifier.v1",
  status:result.status,verified:success,
  warning:"Đây KHÔNG phải Etherscan Solidity Verified Source. Để kiểm chứng creation transaction phải có hash xác thực.",
  canonicalArtifactName:"Bila_CVNSS40_Native.build.json",artifactOrigin:buildOrigin,
  sourceBila:compiledSource,
  compilation:{compiler:compiled.compiler,vocabulary:compiled.vocabulary,
   sourceHash:keccak256(compiledSource),abi:compiled.abi,
   creationBytecode:compiled.creationBytecode,runtimeBytecode:compiled.runtimeBytecode,
   storageLayout:compiled.storageLayout},
  onchain:result,verifiedAt:new Date().toISOString()
 };
 $("proof").textContent=j(report);
 $("verify-build-state").textContent=success?
  "ĐÃ XÁC MINH: "+result.deployedRuntimeBytes+" runtime byte trùng compiler native, owner đúng ví gốc. "+
  (result.transactionMatchesCreation?"Đã kiểm tra cả creation transaction.":"Chưa có creation transaction để xác minh.") :
  "KHÔNG KHỚP: "+result.status+" · kiểm tra lại địa chỉ/source/build.json.";
 $("download-proof").disabled=!success;
 lastProof=success?report:null;
 $("native-storage").textContent=j({ownerSlot0:result.ownerSlot0,
  onchainCodeBytes:result.deployedRuntimeBytes,block:result.blockNumber,
  rpcSource:result.rpcSource});
 if(success)blockFrom("contract-link",address);
 if(result.transactionMatchesCreation)txFrom("tx-link",result.transactionHash);
 status(success?"Native code khớp Sepolia RPC":"Không khớp bản build",""+(success?"ok":"error"));
 log("Xác minh địa chỉ "+address+": "+result.status+" · block "+result.blockNumber+
  " · runtime byte "+result.deployedRuntimeBytes,success?"ok":"error");
 return report;
}

function refreshProviders(entries){
 const select=$("wallet-provider");
 const before=select.value||wallets.selected;
 select.replaceChildren();
 for(const entry of entries){
  const option=document.createElement("option");option.value=entry.id;
  option.textContent=entry.name+(entry.id.startsWith("injected:")?" · legacy":" · EIP-6963");
  select.appendChild(option);
 }
 const preferred=entries.find(e=>!e.id.startsWith("injected:")&&/metamask/i.test(e.name));
 const id=manualProvider&&entries.some(e=>e.id===before)?before:
  (preferred?.id||(entries.some(e=>e.id===before)?before:wallets.selected));
 if(id){select.value=id;wallets.selected=id;}
 select.disabled=!entries.length;
 if(!entries.length)$("wallet-state").textContent="Chưa phát hiện ví EVM. Bật MetaMask rồi bấm Quét lại ví.";
}
async function connect(){
 const b=$("wallet-connect");b.disabled=true;
 try{
  status("Đang xin quyền ví…","pending");
  const p=selectedProvider();
  const list=await p.request({method:"eth_requestAccounts"});
  if(!Array.isArray(list)||!list.some(x=>same(x,ROOT)))
   throw Error("Ví chưa cấp quyền cho "+ROOT+". Chọn đúng tài khoản này trong MetaMask.");
  await ensureSepolia(p,{switchNetwork:true});
  const active=await p.request({method:"eth_accounts"});
  if(!Array.isArray(active)||!active.some(x=>same(x,ROOT)))
   throw Error("Sau khi chuyển mạng, ví không còn quyền dùng "+ROOT+".");
  account=ROOT;
  $("wallet-state").textContent="Đã kết nối "+ROOT+" · Ethereum Sepolia chain 11155111.";
  status("MetaMask Sepolia đã kết nối","ok");log("Ví gốc hợp lệ và chain Sepolia đã được xác nhận.");
 }finally{b.disabled=false;}
}
async function checkGas(){
 const built=assertCompileCurrent();
 const p=await assertSigner();
 invalidateFunding();
 status("Đang ước tính gas từ Sepolia…","pending");
 const quote=await checkDeploymentReady({
  provider:p,from:ROOT,creationBytecode:built.creationBytecode
 });
 $("balance").textContent=quote.balanceEth+" ETH";
 $("cost").textContent=quote.estimatedCostEth===null?"Chưa có":quote.estimatedCostEth+" ETH";
 $("gas-info").textContent=quote.reason+
  (quote.estimatedGas?" · gas="+quote.estimatedGas+" · gasPrice="+quote.gasPriceWei+" wei":"");
 $("deploy-native").disabled=!quote.covered;
 status(quote.covered?"Đủ ETH thử nghiệm · sẵn sàng ký":"Chưa đủ điều kiện deploy",quote.covered?"ok":"error");
 log("Preflight: "+quote.reason,quote.covered?"ok":"error");
 return quote;
}
async function receipt(hash){
 for(let i=0;i<30;i++){
  const r=await providerRPC("eth_getTransactionReceipt",[hash]);
  if(r)return r;
  await new Promise(resolve=>setTimeout(resolve,4000));
 }
 throw Error("Chưa có receipt sau khoảng 120 giây. Tx có thể đang chờ: "+hash+". Dán lại hash để xác minh sau.");
}
function assertAddress(a){if(!/^0x[0-9a-fA-F]{40}$/.test(a||""))throw Error("Địa chỉ hợp đồng EVM không hợp lệ.");return a;}
function assertHash(s){if(!/^0x[0-9a-fA-F]{64}$/.test(s||""))throw Error("Cần transaction hash 0x + 64 hex.");return s;}
async function verifyDeploy(){
 const built=assertCompileCurrent(),p=selectedProvider();
 await ensureSepolia(p,{switchNetwork:false});
 const hash=assertHash($("tx-hash").value.trim());
 const [tx,rec]=await Promise.all([
  p.request({method:"eth_getTransactionByHash",params:[hash]}),
  p.request({method:"eth_getTransactionReceipt",params:[hash]})
 ]);
 if(!tx||!rec)throw Error("Giao dịch chưa xác nhận trên Ethereum Sepolia.");
 const address=assertAddress(rec.contractAddress);
 const entered=$("contract-address").value.trim();
 if(entered&&!same(entered,address))throw Error("Contract nhập tay khác địa chỉ trong receipt!");
 const [code,ownerSlot]=await Promise.all([
  p.request({method:"eth_getCode",params:[address,"latest"]}),
  p.request({method:"eth_getStorageAt",params:[address,"0x0","latest"]})
 ]);
 const verified=verifySepoliaDeploy({
  expectedWallet:ROOT,chainId:await p.request({method:"eth_chainId"}),
  receipt:rec,transaction:tx,code,ownerSlot,compiled:built
 });
 const slots=[];
 for(const slot of built.storageLayout){
  const raw=await p.request({method:"eth_getStorageAt",params:[address,
   "0x"+slot.slot.toString(16),"latest"]});
  slots.push({name:slot.name,type:slot.type,slot:slot.slot,hex:raw,
   value:BigInt(raw).toString()});
 }
 const proof={
  schema:"bilascript.native.cvnss40.sepolia.reproducible-proof.v1",
  provenance:"NATIVE_BILASCRIPT_EVM_NO_SOLC",
  warning:"CVNSS4.0 EVM vocabulary provisional; not ERC20 and not Etherscan verified Solidity source.",
  sourceBila:compiledSource,sourceTextKeccak256:keccak256(compiledSource),
  contractName:built.ast.name,vocabulary:built.vocabulary,semanticProfile:built.typeSystem,
  compiler:built.compiler,
  abi:built.abi,storageLayout:built.storageLayout,
  bytecode:{creation:built.creationBytecode,runtime:built.runtimeBytecode},
  verified,liveStorage:slots,checkedAt:new Date().toISOString(),
  reproducibility:"Use this exact .bila source with the repository v6/compiler.mjs and compare both bytecodes."
 };
 lastProof=proof;$("proof").textContent=j(proof);
 $("download-proof").disabled=false;
 $("contract-address").value=address;
 blockFrom("contract-link",address);
 txFrom("tx-link",hash);
 $("native-storage").textContent=j(slots);
 status("Native CVNSS4.0 xác minh Sepolia thành công","ok");
 log("RPC VERIFIED · tx "+hash+" · owner slot0="+ROOT);
 return proof;
}
async function deploy(){
 const built=assertCompileCurrent();
 const p=await assertSigner();
 const ready=await checkGas();
 if(!ready.covered)throw Error("Gas chưa đủ. Nhận Sepolia ETH từ faucet.");
 const summary="Ký TRIỂN KHAI hợp đồng BilaScript CVNSS4.0 native trên Sepolia?"+
  "\nTên: "+built.ast.name+" · "+built.ast.functions.length+" hàm · "+
  ((built.creationBytecode.length-2)/2)+" bytes."+
  "\nNguồn gốc: BilaScript compiler native (KHÔNG Solidity/Solc)."+
  "\nVí deploy: "+ROOT+
  "\nPhí ước tính: "+ready.estimatedCostEth+" Sepolia ETH. Bạn xác nhận lần cuối trong MetaMask.";
 if(!window.confirm(summary))return;
 const button=$("deploy-native");button.disabled=true;
 status("Đang yêu cầu chữ ký MetaMask…","pending");
 const hash=await p.request({method:"eth_sendTransaction",params:[{
  from:ROOT,data:built.creationBytecode,value:"0x0"
 }]});
 if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw Error("Ví không trả về tx hash đúng định dạng.");
 $("tx-hash").value=hash;txFrom("tx-link",hash);
 log("Đã gửi giao dịch Sepolia: "+hash);
 status("Đang đợi Sepolia mining…","pending");
 const mined=await receipt(hash);
 if(BigInt(mined.status)!==1n)throw Error("Receipt deploy bị revert: "+hash);
 $("contract-address").value=assertAddress(mined.contractAddress);
 blockFrom("contract-link",mined.contractAddress);
 await verifyDeploy();
 invalidateFunding();
}
async function refreshStorage(){
 const b=assertCompileCurrent();
 const a=assertAddress($("contract-address").value.trim());
 const p=selectedProvider();
 await ensureSepolia(p,{switchNetwork:false});
 const code=await p.request({method:"eth_getCode",params:[a,"latest"]});
 if(!same(code,b.runtimeBytecode))throw Error("Runtime code không khớp bản build BilaScript hiện tại. Không đọc nhầm hợp đồng.");
 const slots=[];
 for(const v of b.storageLayout){
  const raw=await p.request({method:"eth_getStorageAt",params:[a,
   "0x"+v.slot.toString(16),"latest"]});
  slots.push({name:v.name,slot:v.slot,type:v.type,hex:raw,value:BigInt(raw).toString()});
 }
 $("native-storage").textContent=j(slots);
 log("eth_getStorageAt: "+slots.length+" slots từ Sepolia.");
 return slots;
}
async function runMethod(){
 const b=assertCompileCurrent();
 const a=assertAddress($("contract-address").value.trim());
 const m=b.methods[$("method").value];
 if(!m)throw Error("Hàm ABI không tồn tại");
 const p=selectedProvider();
 await ensureSepolia(p,{switchNetwork:false});
 const code=await p.request({method:"eth_getCode",params:[a,"latest"]});
 if(!same(code,b.runtimeBytecode))throw Error("Hợp đồng đang chọn có bytecode khác native compiler.");
 const data=encodeCall(m,$("method-value").value);
 const tx={to:a,data,from:ROOT};
 if(m.operation==="get"){
  const raw=await p.request({method:"eth_call",params:[tx,"latest"]});
  if(!/^0x[0-9a-fA-F]{64}$/.test(raw))throw Error("eth_call trả dữ liệu sai ABI uint256");
  $("method-result").textContent=j({signature:m.signature,operation:"eth_call",
   returnWei:BigInt(raw).toString(),returnHex:raw,source:"SEPOLIA_RPC_LIVE"});
  log(m.signature+" trả "+BigInt(raw)+" qua eth_call");
 }else{
  await assertSigner();
  const gas=await p.request({method:"eth_estimateGas",params:[tx]});
  if(!window.confirm("Gửi "+m.signature+" đến "+a+"? Ước tính "+BigInt(gas)+" gas bằng Sepolia ETH."))return;
  const hash=await p.request({method:"eth_sendTransaction",params:[tx]});
  $("method-result").textContent="Tx đã gửi: "+hash+" · đang chờ receipt...";
  txFrom("tx-link",hash);
  const result=await receipt(hash);
  $("method-result").textContent=j({method:m.signature,hash,receipt:result});
  if(BigInt(result.status)!==1n)throw Error("Lệnh "+m.signature+" đã revert: "+hash);
  log("Ghi trạng thái thành công "+m.signature+" · gasUsed="+BigInt(result.gasUsed));
 }
 await refreshStorage();
}
function startup(){
 $("native-source").addEventListener("input",()=>{
  compiled=null;compiledSource="";canonicalBuild=null;buildToVerify=null;buildOrigin="nguồn đã thay đổi";newProofState();invalidateFunding();
  $("method-run").disabled=true;$("native-refresh").disabled=true;
  status("Mã nguồn đã sửa · cần biên dịch lại","neutral");
 });
 $("native-compile").addEventListener("click",guarded(compileSource));
 $("native-restore").addEventListener("click",guarded(fetchSource));
 $("native-download").addEventListener("click",guarded(()=>{
  exportFile("Bila_CVNSS40_Native.bila","text/plain;charset=utf-8",$("native-source").value);
 }));
 $("download-build").addEventListener("click",guarded(async()=>{
  const artifact=canonicalBuild||await loadCanonicalBuild();
  exportFile("Bila_CVNSS40_Native.build.json","application/json",
    JSON.stringify(artifact,null,2)+"\n");
  log("Đã tải đúng file build chuẩn (không phải session snapshot hoặc Solidity JSON).");
 }));
 $("copy-creation").addEventListener("click",guarded(async()=>{
  await navigator.clipboard.writeText(assertCompileCurrent().creationBytecode);
  log("Đã sao chép bytecode creation native.");
 }));
 $("method").addEventListener("change",showMethod);
 $("method-run").addEventListener("click",guarded(runMethod));
 $("native-refresh").addEventListener("click",guarded(refreshStorage));
 wallets.onChange(refreshProviders);
 $("wallet-provider").addEventListener("change",()=>{
  manualProvider=true;wallets.select($("wallet-provider").value);
  selectedProvider();
 });
 $("wallet-scan").addEventListener("click",()=>wallets.refresh());
 $("wallet-connect").addEventListener("click",guarded(connect));
 $("check-gas").addEventListener("click",guarded(checkGas));
 $("deploy-native").addEventListener("click",guarded(deploy));
 $("load-canonical-build").addEventListener("click",guarded(loadCanonicalBuild));
 $("local-build").addEventListener("change",guarded(loadLocalBuild));
 $("verify-address").addEventListener("click",guarded(verifyAddressOnly));
 $("verify-native").addEventListener("click",guarded(verifyDeploy));
 $("download-proof").addEventListener("click",guarded(()=>{
  if(!lastProof)throw Error("Chưa có bằng chứng Sepolia đã xác minh.");
  const hash=lastProof?.verified?.transactionHash||
    lastProof?.onchain?.transactionHash||"address-"+$("contract-address").value.trim();
  exportFile("BilaScript-native-Sepolia-"+hash+".json",
   "application/json",j(lastProof));
 }));
 wallets.start();
 fetchSource().catch(fail);
}
startup();
