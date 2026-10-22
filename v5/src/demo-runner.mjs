/**
 * Demo-only isolated JavaScript executor.
 * Browser main window compiles CVNSS -> JS, but NEVER evaluates compiled code.
 * Execution uses an opaque-origin sandboxed iframe and a disposable Web Worker.
 * Not suitable as a hardened multi-tenant security boundary.
 */
const WORKER_SOURCE=String.raw\`
self.onmessage=async function(event) {
  const began=Date.now();
  const repr=(value)=>{
    if(value===undefined)return "(không có kết quả trả về)";
    if(typeof value==="string")return value;
    if(typeof value==="bigint")return String(value)+"n";
    try { const str=JSON.stringify(value,null,2); return str===undefined?String(value):str; }
    catch {return String(value);}
  };
  try {
    const code=event.data && event.data.code;
    if(typeof code!=="string" || code.length>200000) throw Error("Mã nguồn không hợp lệ hoặc quá dài.");
    const invoke=new Function('"use strict";\\n'+code+'\\nreturn bai();');
    const result=await invoke();
    self.postMessage({kind:"success",output:repr(result),ms:Date.now()-began});
  }catch(err){
    self.postMessage({kind:"error",output:String(err && (err.stack||err.message) || err),ms:Date.now()-began});
  }
};\`;

const FRAME_CODE=String.raw\`
const workerSource=__WORKER_SOURCE__;
let running=null;
window.addEventListener("message",event=>{
  if(event.source!==window.parent || !event.data || event.data.kind!=="bila:execute")return;
  const token=event.data.token;
  if(running){running.terminate();running=null;}
  let address;
  try{
    address=URL.createObjectURL(new Blob([workerSource],{type:"text/javascript"}));
    const worker=new Worker(address);
    running=worker;
    URL.revokeObjectURL(address);
    const relay=(kind,output,ms)=>{
      if(running!==worker)return;
      window.parent.postMessage({kind,token,output,ms},"*");
      worker.terminate();running=null;
    };
    worker.onmessage=event=>relay(event.data.kind,event.data.output,event.data.ms);
    worker.onerror=event=>relay("error",String(event.message||"Worker không thể chạy"),null);
    worker.postMessage({code:event.data.code});
  }catch(error){
    window.parent.postMessage({kind:"error",token,output:String(error),ms:null},"*");
    if(address)URL.revokeObjectURL(address);
  }
});
window.addEventListener("message",event=>{
  if(event.source===window.parent && event.data && event.data.kind==="bila:stop" && running) {
    running.terminate();running=null;
  }
});\`;

let counter=0;
export function runCompiled(code,{timeout=2500}={}){
  if(typeof code!=="string"||code.length>200000) return Promise.reject(new Error("Mã quá dài để chạy thử."));
  if(!globalThis.Worker || !globalThis.document) return Promise.reject(new Error("Trình duyệt này không hỗ trợ Web Worker."));
  return new Promise((resolve,reject)=>{
    const token="bila-demo-"+(++counter)+"-"+Math.random().toString(36).slice(2);
    const frame=document.createElement("iframe");
    frame.sandbox="allow-scripts"; // no allow-same-origin, no top navigation, no forms
    frame.setAttribute("aria-hidden","true");
    frame.referrerPolicy="no-referrer";
    frame.style.display="none";
    const frameCode=FRAME_CODE.replace("__WORKER_SOURCE__",JSON.stringify(WORKER_SOURCE));
    frame.srcdoc='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39; &#39;unsafe-eval&#39; blob:; worker-src blob:; connect-src &#39;none&#39;; img-src &#39;none&#39;; object-src &#39;none&#39;; form-action &#39;none&#39;"><script>'+
      frameCode.replaceAll("</script","<\\/script")+'</script>';
    let finished=false;
    let timer;
    const cleanup=()=>{
      if(finished)return false;
      finished=true;
      clearTimeout(timer);
      window.removeEventListener("message",receive);
      try{frame.contentWindow?.postMessage({kind:"bila:stop"},"*");}catch{}
      frame.remove();
      return true;
    };
    const receive=event=>{
      if(event.source!==frame.contentWindow || !event.data || event.data.token!==token)return;
      if(!["success","error"].includes(event.data.kind))return;
      if(!cleanup())return;
      if(event.data.kind==="error")reject(new Error(event.data.output));
      else resolve({output:String(event.data.output),ms:event.data.ms});
    };
    window.addEventListener("message",receive);
    frame.addEventListener("load",()=>{
      if(!finished) frame.contentWindow?.postMessage({kind:"bila:execute",token,code},"*");
    },{once:true});
    timer=setTimeout(()=>{
      if(cleanup())reject(new Error("Đã dừng: thời gian chạy vượt quá "+timeout+" ms."));
    },timeout);
    document.body.appendChild(frame);
  });
}
