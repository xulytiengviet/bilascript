/** BilaGuard v0.1 — browser orchestrator. Cannot send tx until static+fuzz gates pass. */
import {analyzeBilaSource,isDeploymentEligible,BILAGUARD_VERSION} from "./guard.mjs";
import {runBilaFuzz,runTargetedFuzz} from "./fuzz.mjs";
const $=id=>document.getElementById(id);
const ROOT="0x879E22703E2E432257334Db400Fbf9115aeD93Cf";
const SEPOLIA=11155111n;
const REFERENCE="../../v6/contracts/Bila_CVNSS40_Native.bila?v=1";
let analysis=null,fuzz=null,targeted=null,session=null,quote=null,epoch=0,signing=false;
let selectedProvider=null;
const same=(a,b)=>String(a||"").toLowerCase()===String(b||"").toLowerCase();
const text=(id,value)=>{$(id).textContent=String(value);};
const compact=v=>JSON.stringify(v,(_,x)=>typeof x==="bigint"?x.toString():x,2);
function mark(id,message,kind="pending"){
 const el=$(id);el.textContent=message;el.dataset.kind=kind;
}
function canDeploy(){
 return !signing&&analysis&&isDeploymentEligible(analysis)&&fuzz?.passed&&targeted?.passed&&
  session?.source===$("source").value&&
  session.seed===$("seed").value&&session.programs===$("programs").value&&
  session.sourceHash===analysis.sourceKeccak256;
}
function refreshGate(){
 const ok=canDeploy();
 $("preflight").disabled=!ok;
 $("deploy-send").disabled=!ok||!quote;
 text("gate-pill",ok?"GATE: SECURITY CHECK PASS":"GATE: LOCKED");
 text("deploy-badge",ok?"ĐỦ ĐIỀU KIỆN":"ĐÃ KHÓA");
 if(!ok)mark("deploy-state",
  "ĐÃ KHÓA: phải rà soát CVNSS/AST/storage và chạy fuzz cho đúng nguồn, seed và số ca hiện tại.","pending");
 else if($("deploy-state").dataset.kind!=="fail")
  mark("deploy-state",
   "Đạt phân tích/fuzz; cần kiểm tra gas Sepolia và ký xác nhận MetaMask.", "pass");
}
function invalidate({clearAudit=true}={}){
 epoch++;quote=null;session=null;fuzz=null;targeted=null;
 if(clearAudit)analysis=null;
 $("download-report").disabled=true;
 text("funding","Không có gas quote cho nguồn hiện tại.");
 text("stat-fuzz","—");
 mark("fuzz-state","Thay đổi đầu vào: cần chạy lại fuzz tự động.","pending");
 text("fuzz-preview","—");
 if(clearAudit){
  text("stat-issues","—");text("stat-methods","—");text("stat-slots","—");
  text("source-hash","Nguồn thay đổi, chưa được kiểm chứng.");
  text("ast-preview","—");text("storage-preview","—");
  text("audit-badge","CHƯA KIỂM TRA");
  mark("audit-state","Mã nguồn thay đổi: bắt buộc phân tích lại.","pending");
 }
 refreshGate();
}
function appendFindings(issues){
 const host=$("findings");host.replaceChildren();
 if(!issues.length){
  const p=document.createElement("p");p.className="finding ok";
  p.textContent="Không có lỗi được phát hiện trong các quy tắc BilaGuard v0.1.";
  host.appendChild(p);return;
 }
 for(const item of issues.slice(0,120)){
  const node=document.createElement("div");
  node.className="finding "+(item.severity==="error"?"error":"");
  const title=document.createElement("b");title.textContent=item.severity.toUpperCase()+" · "+item.code;
  const desc=document.createElement("div");desc.textContent=item.message+
   (item.offset!==null?" (offset "+item.offset+")":"");
  node.append(title,desc);host.appendChild(node);
 }
}
function audit(){
 const input=$("source").value;
 analysis=analyzeBilaSource(input);
 session=null;fuzz=null;targeted=null;quote=null;
 text("stat-issues",analysis.stats.errors);
 text("stat-methods",analysis.stats.functions);
 text("stat-slots",analysis.stats.storageSlots);
 text("source-hash",analysis.sourceKeccak256||"—");
 text("audit-badge",analysis.accepted?"SOURCE PASS":"SOURCE REJECTED");
 mark("audit-state",analysis.accepted?
  "PASS · CVNSS4.0 profile, AST, storage, ABI, dispatcher/opcode owner và overflow đạt các quy tắc v0.1.":
  "BLOCKED · "+analysis.stats.errors+" lỗi. Không thể triển khai bản nguồn này.",""+(analysis.accepted?"pass":"fail"));
 appendFindings(analysis.issues);
 const b=analysis.build;
 text("ast-preview",b?compact({
  contract:b.ast.name,functions:b.ast.functions.map(f=>({
   name:f.name,signature:f.signature,selector:f.selector,effect:f.op,
   ownerOnly:f.ownerOnly,slot:f.slot
  })),compiler:b.compiler}):"Không có AST hợp lệ.");
 text("storage-preview",b?compact({typeSystem:b.typeSystem,effects:b.effects,
  slots:b.storageLayout,runtimeBytes:analysis.stats.runtimeBytes}):"Không có layout hợp lệ.");
 text("stat-fuzz","—");
 mark("fuzz-state","Chưa chạy fuzz cho mã nguồn vừa được phân tích.","pending");
 text("fuzz-preview","—");
 $("download-report").disabled=true;
 refreshGate();
 return analysis;
}
function runFuzz(){
 const current=$("source").value;
 if(!analysis||analysis.source!==current)audit();
 if(!isDeploymentEligible(analysis)){
  mark("fuzz-state","Không chạy cổng fuzz trên nguồn không vượt BilaGuard AST/storage.","fail");
  refreshGate();return;
 }
 const seedValue=$("seed").value.trim();
 if(!/^\d{1,10}$/.test(seedValue)||BigInt(seedValue)>4294967295n)
  throw Error("Seed phải là số nguyên từ 0 đến 4294967295.");
 const count=Number($("programs").value);
 const seed=Number(seedValue);
 const next=runBilaFuzz({seed,programs:count,mutationsPerProgram:12});
 const targetedNext=runTargetedFuzz(current);
 fuzz=next;targeted=targetedNext;
 if(fuzz.passed&&targeted.passed){
  session={source:current,sourceHash:analysis.sourceKeccak256,
   seed:seedValue,programs:$("programs").value,build:analysis.build};
 }else session=null;
 text("stat-fuzz",fuzz.cases+targeted.mutationCount);
 mark("fuzz-state",fuzz.passed&&targeted.passed?
  "PASS · "+fuzz.cases+" ca sinh nguồn, "+targeted.mutationCount+
  " đột biến trực tiếp nguồn hiện tại. Các lỗi cố ý đều bị phát hiện.":
  "FAIL · Có chương trình hợp lệ bị từ chối hoặc mutant nguy hiểm không được chặn.",
  fuzz.passed&&targeted.passed?"pass":"fail");
 text("fuzz-preview",compact({
  seed:fuzz.seed,generation:fuzz.programs,cases:fuzz.cases,
  validAccepted:fuzz.validAccepted,negativeCaught:fuzz.expectedInvalidRejected,
  negativeAccepted:fuzz.invalidAccepted,targeted,failures:fuzz.failures,
  exampleDetections:fuzz.samples,scope:fuzz.scope
 }));
 $("download-report").disabled=!(fuzz.passed&&targeted.passed);
 quote=null;text("funding","Chưa kiểm tra gas thật cho nguồn/fuzz hiện tại.");
 refreshGate();
}
function report(){
 if(!fuzz?.passed||!targeted?.passed||!analysis?.accepted)throw Error("Chưa đủ bằng chứng");
 return {
  schema:"bilaguard.v0.1.predeploy-security-report",warning:
   "PASS is a limited static/compiler grammar fuzz gate, NOT a formal proof, professional audit or EVM runtime fuzz.",
  generatedAt:new Date().toISOString(),compiler:analysis.build.compiler,
  source:session?.source,sourceKeccak256:analysis.sourceKeccak256,
  profile:analysis.profile,guard:analysis.guard,issues:analysis.issues,
  stats:analysis.stats,fuzz,targeted,
  bytecode:{creation:analysis.build.creationBytecode,runtime:analysis.build.runtimeBytecode},
  abi:analysis.build.abi,storageLayout:analysis.build.storageLayout,
  eligible:canDeploy()
 };
}
function download(name,mime,content){
 const a=document.createElement("a"),url=URL.createObjectURL(new Blob([content],{type:mime}));
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let evmProviders=[];
if(typeof window.addEventListener==="function"){
 window.addEventListener("eip6963:announceProvider",event=>{
  const p=event?.detail?.provider;
  if(p&&!evmProviders.includes(p))evmProviders.push(p);
 });
 try{window.dispatchEvent(new Event("eip6963:requestProvider"));}catch{}
}
function wallet(){
 if(selectedProvider)return selectedProvider;
 selectedProvider=evmProviders.find(p=>p.isMetaMask)||window.ethereum?.providers?.find(p=>p.isMetaMask)||
  window.ethereum||evmProviders[0]||null;
 if(!selectedProvider?.request)throw Error("Không tìm thấy MetaMask/EIP-1193. Kết nối ví Sepolia trước.");
 return selectedProvider;
}
async function verifyAccount(p,{requestAccess=false}={}){
 const c=await p.request({method:"eth_chainId"});
 if(BigInt(c)!==SEPOLIA){
  if(!requestAccess)throw Error("Ví chưa ở Ethereum Sepolia chain 11155111.");
  await p.request({method:"wallet_switchEthereumChain",params:[{chainId:"0xaa36a7"}]});
 }
 const chain=await p.request({method:"eth_chainId"});
 if(BigInt(chain)!==SEPOLIA)throw Error("Sau chuyển mạng, ví không ở Sepolia.");
 const accounts=await p.request({method:requestAccess?"eth_requestAccounts":"eth_accounts"});
 if(!Array.isArray(accounts)||!accounts.some(a=>same(a,ROOT)))
  throw Error("MetaMask phải chọn đúng tài khoản "+ROOT+" để khởi tạo owner.");
 return ROOT;
}
async function verifyGas(p,creation){
 const [balance,price,estimate]=await Promise.all([
  p.request({method:"eth_getBalance",params:[ROOT,"latest"]}),
  p.request({method:"eth_gasPrice"}),
  p.request({method:"eth_estimateGas",params:[{from:ROOT,data:creation,value:"0x0"}]})
 ]);
 const need=BigInt(estimate)*BigInt(price)*13n/10n;
 if(BigInt(balance)<need)throw Error("Không đủ Sepolia ETH. Balance "+
  BigInt(balance).toString()+" wei; cần dự phòng "+need.toString()+" wei.");
 return {balanceWei:balance,gasPriceWei:price,gasEstimate:estimate,requiredWei:need.toString()};
}
function requireStable(snapshot,revision){
 // Do not depend on !signing; signing legitimately disables controls.
 if(!analysis||!fuzz?.passed||!targeted?.passed||!session||
    epoch!==revision||session.source!==$("source").value||
    session.sourceHash!==analysis.sourceKeccak256||
    session.seed!==$("seed").value||session.programs!==$("programs").value||
    snapshot!==analysis.build.creationBytecode)
  throw Error("Bản nguồn/fuzz/bytecode thay đổi trong khi chờ ví: khóa lại.");
}
async function preflight(){
 if(!canDeploy())throw Error("BilaGuard chưa cho phép triển khai.");
 const revision=epoch,creation=analysis.build.creationBytecode,p=wallet();
 await verifyAccount(p,{requestAccess:true});
 requireStable(creation,revision);
 const gas=await verifyGas(p,creation);
 requireStable(creation,revision);
 quote={revision,creation,gas};
 mark("deploy-state","Đã xác nhận ví và gas Sepolia qua RPC thật. Có thể yêu cầu MetaMask ký.", "pass");
 text("funding","Sepolia RPC thật · gas estimate "+BigInt(gas.gasEstimate)+
  " · price "+BigInt(gas.gasPriceWei)+" wei · balance "+BigInt(gas.balanceWei)+" wei.");
 text("receipt","Chưa gửi giao dịch. Cần bạn chủ động nhấn ký, sau đó xác nhận trong MetaMask.");
 refreshGate();
}
async function getReceipt(p,hash){
 for(let i=0;i<28;i++){
  const r=await p.request({method:"eth_getTransactionReceipt",params:[hash]});
  if(r)return r;
  await new Promise(ok=>setTimeout(ok,3500));
 }
 throw Error("Đã gửi tx nhưng chưa có receipt. Tra hash trên Sepolia Etherscan.");
}
async function deploy(){
 if(!canDeploy()||!quote||quote.revision!==epoch)throw Error("Cần chạy preflight Sepolia mới cho bản nguồn hiện tại.");
 const revision=epoch,creation=analysis.build.creationBytecode,runtime=analysis.build.runtimeBytecode,p=wallet();
 signing=true;$("deploy-send").disabled=true;$("preflight").disabled=true;
 try{
  await verifyAccount(p);
  requireStable(creation,revision);
 }catch(e){signing=false;refreshGate();throw e;}
 const message="Triển khai HỢP ĐỒNG THỬ NGHIỆM BilaScript v7 lên SEPOLIA?"+
  "\nCompiler: "+analysis.build.compiler+
  "\nGuard source: "+analysis.sourceKeccak256+
  "\nOwner: "+ROOT+
  "\nƯớc tính gas: "+BigInt(quote.gas.gasEstimate).toString()+
  "\nĐây KHÔNG phải audit và có thể mất Sepolia ETH (không có giá trị thật)."+
  "\nBạn còn cần phê duyệt giao dịch trong MetaMask.";
 if(!window.confirm(message)){signing=false;refreshGate();return;}
 let txHash="";
 try{
  const gas=await verifyGas(p,creation);
  requireStable(creation,revision);
  if(!gas.requiredWei)throw Error("Gas estimate không hợp lệ.");
  txHash=await p.request({method:"eth_sendTransaction",params:[{
   from:ROOT,data:creation,value:"0x0"
  }]});
  if(!/^0x[0-9a-fA-F]{64}$/.test(txHash))throw Error("RPC không trả về tx hash EVM hợp lệ.");
  mark("deploy-state","Giao dịch Sepolia đã gửi: "+txHash+". Chỉ công nhận sau receipt và đối chiếu code.","pending");
  text("receipt","Transaction hash: "+txHash+" · đang chờ receipt mạng...");
  const receipt=await getReceipt(p,txHash);
  if(BigInt(receipt.status)!==1n)throw Error("Transaction revert/failed.");
  const address=receipt.contractAddress;
  if(!/^0x[0-9a-fA-F]{40}$/.test(address||""))throw Error("Receipt không chứa contractAddress.");
  const [code,owner,tx,chain]=await Promise.all([
   p.request({method:"eth_getCode",params:[address,"latest"]}),
   p.request({method:"eth_getStorageAt",params:[address,"0x0","latest"]}),
   p.request({method:"eth_getTransactionByHash",params:[txHash]}),
   p.request({method:"eth_chainId"})
  ]);
  const valid=BigInt(chain)===SEPOLIA&&same(code,runtime)&&BigInt(owner)===BigInt(ROOT)&&
   same(tx?.from,ROOT)&&tx?.to===null&&same(tx?.input||tx?.data,creation)&&
   BigInt(tx?.value??"0x0")===0n&&same(tx?.hash,txHash)&&
   same(receipt.transactionHash,txHash)&&same(receipt.contractAddress,address);
  const evidence={schema:"bilaguard.v0.1.sepolia.deployment-proof",
   compiler:"BilaScript-v6.0.1-native-evm",sourceHash:analysis.sourceKeccak256,
   transactionHash:txHash,contract:address,owner:ROOT,chainId:Number(SEPOLIA),
   gasUsed:receipt.gasUsed,receiptBlock:receipt.blockNumber,
   runtimeBytecodeMatches: same(code,runtime),ownerSlotMatches:BigInt(owner)===BigInt(ROOT),
   creationInputMatches:same(tx?.input||tx?.data,creation),verified:valid,
   note:"Predeploy security gate is limited static/compiler fuzz; not audited safe."};
  text("receipt",compact(evidence));
  mark("deploy-state",valid?"TX SEPOLIA VERIFIED · "+address:
   "Không thể xác minh đầy đủ bằng chứng transaction/bytecode từ Sepolia.",valid?"pass":"fail");
 }finally{
  signing=false;quote=null;
  refreshGate();
 }
}
function safeClick(id,fn){
 $(id).addEventListener("click",async()=>{
  try{await fn();}catch(e){
   const m=String(e?.message||e);
   mark(id==="run-fuzz"?"fuzz-state":id==="run-audit"?"audit-state":"deploy-state",m,"fail");
   if(id==="deploy-send")text("receipt","Lỗi kiểm tra/giao dịch: "+m);
   quote=null;refreshGate();
  }
 });
}
async function initialize(){
 const response=await fetch(REFERENCE,{cache:"no-store"});
 if(!response.ok)throw Error("Không tải được hợp đồng mẫu v6 từ repository (HTTP "+response.status+")");
 $("source").value=await response.text();
 text("receipt","Chưa gửi giao dịch. Cần vượt BilaGuard trước.");
 invalidate();
}
$("source").addEventListener("input",()=>invalidate());
$("seed").addEventListener("input",()=>invalidate({clearAudit:false}));
$("programs").addEventListener("change",()=>invalidate({clearAudit:false}));
safeClick("run-audit",audit);
safeClick("run-fuzz",runFuzz);
safeClick("restore",initialize);
safeClick("preflight",preflight);
safeClick("deploy-send",deploy);
safeClick("download-source",()=>download("BilaGuard-source.bila","text/plain;charset=utf-8",$("source").value));
safeClick("download-report",()=>{
 if(!canDeploy())throw Error("BilaGuard đã khóa nguồn/báo cáo này.");
 download("BilaGuard-v0.1-"+analysis.sourceKeccak256.slice(2,10)+".json",
  "application/json",compact(report())+"\n");
});
initialize().catch(e=>{invalidate();mark("audit-state",String(e?.message||e),"fail");});
