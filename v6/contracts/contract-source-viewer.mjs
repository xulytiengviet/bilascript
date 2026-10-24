/**
 * Client-side read-only BilaScript native source verifier.
 * No Solidity input, no Etherscan Source Verified badge claim, no wallet signer.
 */
import {verifyNativeSepoliaAddress,reproduceNativeSource,NATIVE_ADDRESS}
 from "./verify-native-sepolia.mjs";
import {keccak256} from "../compiler.mjs";
const $=id=>document.getElementById(id);
const SOURCE="../contracts/Bila_CVNSS40_Native.bila?v=1";
const BUILD="../contracts/Bila_CVNSS40_Native.build.json?v=1";
let source=null,artifact=null,report=null,busy=false;
const format=value=>JSON.stringify(value,(_,v)=>typeof v==="bigint"?v.toString():v,2);
function state(label,type="pending"){$("state").textContent=label;$("state").dataset.state=type;}
function information(s){$("info").textContent=s;}
function setText(id,value){$(id).textContent=String(value);}
function makeFile(name,obj){
 const blob=new Blob([JSON.stringify(obj,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");link.href=url;link.download=name;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function tabs(key){
 for(const name of ["source","abi","bytecode"]){
  $("pane-"+name).hidden=name!==key;
  $("tab-"+name).setAttribute("aria-selected",name===key?"true":"false");
 }
}
async function fetchInput(){
 const [a,b]=await Promise.all([
  fetch(SOURCE,{cache:"no-store"}),fetch(BUILD,{cache:"no-store"})
 ]);
 if(!a.ok||!b.ok)throw Error("Không tải được mã nguồn hoặc bản build native từ GitHub Pages.");
 const [src,obj]=await Promise.all([a.text(),b.json()]);
 reproduceNativeSource(src,obj);
 source=src;artifact=obj;
 setText("source-code",src);
 setText("bytecode",obj.runtimeBytecode);
 setText("source-hash",keccak256(src));
 const body=$("abi-table");body.replaceChildren();
 for(const v of obj.abi){
  const row=document.createElement("tr");
  const name=document.createElement("td");name.textContent=v.name;
  const sig=v.name+"("+(v.inputs||[]).map(x=>x.type).join(",")+")";
  const selector="0x"+obj.methods[v.name].selector.slice(-8);
  const sel=document.createElement("td");sel.textContent=selector;
  const mut=document.createElement("td");mut.textContent=v.stateMutability||"nonpayable";
  row.append(name,sel,mut);body.appendChild(row);
 }
 information("Đã tái biên dịch nguồn CVNSS4.0 và xác nhận trùng artifact chuẩn. Bấm Xác minh để đọc on-chain RPC.");
 state("Nguồn native tái lập thành công","pending");
}
async function verify(){
 if(busy)return;
 busy=true;$("verify").disabled=true;$("save-proof").disabled=true;report=null;
 state("Đang truy vấn Sepolia RPC…","pending");
 setText("code-status","Đang đọc");setText("owner-status","Đang đọc");
 try{
  if(!source||!artifact)await fetchInput();
  const address=$("address").value.trim();
  const result=await verifyNativeSepoliaAddress({address,source,artifact});
  report={
   schema:"bilascript.native.source-verification-public.v1",
   checkedAt:new Date().toISOString(),
   verificationLevel:result.status,
   sourceLanguage:"BilaScript/CVNSS4.0",
   engine:"BilaScript-v6.0.1-native-evm",
   etherscanSolidityVerified:false,
   sourceBila:source,
   artifact:artifact,
   rpcEvidence:result
  };
  const good=result.status==="EXACT_NATIVE_RUNTIME_AND_OWNER";
  state(good?"NATIVE RUNTIME VERIFIED":"CHƯA XÁC MINH",good?"ok":"error");
  setText("code-status",result.runtimeMatchesDeployed?"MATCH":"KHÔNG KHỚP");
  setText("owner-status",result.ownerSlotMatches?"MATCH":"KHÔNG KHỚP");
  setText("runtime-size",result.deployedRuntimeBytes.toLocaleString("vi-VN"));
  setText("block",result.blockNumber);
  setText("details",format({
   status:result.status,chainId:result.chainId,contract:result.address,
   compiler:result.compiler,sourceTextKeccak256:result.sourceTextKeccak256,
   blockNumber:result.blockNumber,rpcSource:result.rpcSource,
   bytecodeExactMatch:result.runtimeMatchesDeployed,
   ownerSlotExactMatch:result.ownerSlotMatches,
   expectedRuntimeBytes:result.expectedRuntimeBytes,
   deployedRuntimeBytes:result.deployedRuntimeBytes,
   etherscanSolidityVerified:false
  }));
  information(good?
   "Đã tái biên dịch từ CVNSS4.0 và đối chiếu toàn bộ runtime + owner slot bằng RPC Sepolia thật. Đây KHÔNG phải huy hiệu Solidity của Etherscan.":
   "Không thể xác minh khớp runtime và owner. Kiểm tra chính xác địa chỉ hợp đồng hoặc chọn lại bản build.");
  $("save-proof").disabled=!good;
 }catch(e){
  state("Xác minh không thành công","error");
  information("Lỗi: "+String(e?.message||e)+" · Không tự suy đoán trạng thái mạng.");
  setText("details",String(e?.stack||e));
  setText("code-status","—");setText("owner-status","—");
 }finally{busy=false;$("verify").disabled=false;}
}
$("verify").addEventListener("click",()=>verify());
$("copy-address").addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText($("address").value.trim());information("Đã sao chép địa chỉ hợp đồng.");}
 catch(e){information("Không sao chép được: "+String(e?.message||e));}
});
$("save-proof").addEventListener("click",()=>{
 if(report&&report.rpcEvidence?.status==="EXACT_NATIVE_RUNTIME_AND_OWNER")
  makeFile("BilaScript-native-source-proof-"+report.rpcEvidence.address+".json",report);
});
$("address").addEventListener("input",()=>{
 report=null;$("save-proof").disabled=true;
 state("Địa chỉ đã thay đổi · cần kiểm tra lại","pending");
 ["code-status","owner-status","runtime-size","block"].forEach(id=>setText(id,"—"));
});
for(const name of ["source","abi","bytecode"])
 $("tab-"+name).addEventListener("click",()=>tabs(name));
tabs("source");
const params=new URLSearchParams(location.search);
const addr=params.get("address");
if(addr)$("address").value=addr;
fetchInput().then(()=>verify()).catch(e=>{
 state("Lỗi nạp nguồn native","error");
 information(String(e?.message||e));
});
