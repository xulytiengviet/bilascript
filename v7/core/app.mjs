import {compileVerified,differentialIR} from "./ir.mjs";
import {encodeT27,decodeT27,encodeUtf8Trits,decodeUtf8Trits,addU256Ternary,formatTrits} from "./ternary.mjs";
import {EXAMPLE} from "../../v6/compiler.mjs";
const $=id=>document.getElementById(id);
const text=(id,value)=>{$(id).textContent=String(value)};
let current=null,lastSource="";
const pretty=x=>JSON.stringify(x,(_,v)=>typeof v==="bigint"?v.toString():ArrayBuffer.isView(v)?Array.from(v):v,2);
function status(message,ok=false){text("status",message);$("status").dataset.kind=ok?"ok":"error"}
function invalidate(){current=null;lastSource="";text("metric-nodes","—");text("metric-functions","—");text("metric-verification","CHƯA");text("metric-time","—");status("Nguồn đã thay đổi. Cần hạ IR và kiểm chứng lại.");text("output","Chưa có artifact IR hợp lệ.");$("ir-function").replaceChildren()}
function render(){if(!current)return;const tab=document.querySelector("[data-tab][aria-selected=true]").dataset.tab;
if(tab==="ir")text("output",pretty(current.ir));
else if(tab==="proof")text("output",pretty(current.verification));
else if(tab==="evm")text("output",pretty(current.backend));
else text("output",current.ir.functions.flatMap(f=>[f.name+" ("+f.signature+")",...f.nodes.map(n=>"  #"+n.id+" "+n.op+" "+(n.args?"["+n.args.join(",")+"] ":"")+(n.slot!==undefined?"slot="+n.slot:""))]).join("\n"));
}
function compile(){try{const begin=performance.now();const result=compileVerified($("source").value);const took=performance.now()-begin;if(!result.verification.ok)throw Error(result.verification.diagnostics.join("; "));current=result;lastSource=$("source").value;text("metric-nodes",result.verification.nodeCount);text("metric-functions",result.ir.functions.length);text("metric-verification","PASS");text("metric-time",took.toFixed(2));status("BilaIR đã vượt các bất biến tập con được hỗ trợ. Chưa phải chứng nhận an toàn EVM.",true);
const sel=$("ir-function");sel.replaceChildren();for(const f of result.ir.functions){const opt=document.createElement("option");opt.value=f.name;opt.textContent=f.name+" · "+f.operation;sel.append(opt)}render()}catch(e){invalidate();status(e.message)}}
function assertCurrent(){if(!current||$("source").value!==lastSource)throw Error("IR đã cũ hoặc chưa kiểm chứng. Hãy biên dịch lại.");}
function save(filename,obj){const a=document.createElement("a");const url=URL.createObjectURL(new Blob([pretty(obj)],{type:"application/json"}));a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function trit(){try{let result,mode=$("ternary-mode").value;if(mode==="t27"){const src=$("ternary-input").value;const encoded=encodeT27(src);result={mode,characters:src.length,trits:encoded.length,tritPreview:formatTrits(encoded),decoded:decodeT27(encoded),roundTrip:decodeT27(encoded)===src}}
else if(mode==="utf8"){const src=$("ternary-input").value;const encoded=encodeUtf8Trits(src);result={mode,utf8Bytes:new TextEncoder().encode(src).length,trits:encoded.length,tritPreview:formatTrits(encoded),decoded:decodeUtf8Trits(encoded),roundTrip:decodeUtf8Trits(encoded)===src}}
else {const a=BigInt($("a").value),b=BigInt($("b").value),t=addU256Ternary(a,b);result={mode,binaryBigInt:(a+b).toString(),ternaryValue:t.value.toString(),tritWidth:t.trits.length,trits:formatTrits(t.trits),match:(a+b)===t.value}}text("ternary-output",pretty(result))}catch(e){text("ternary-output","LỖI: "+e.message)}}
function compare(){try{assertCurrent();const fn=current.ir.functions.find(f=>f.name===$("ir-function").value);const state=Array(current.ir.storageLayout.length).fill(0n);state[fn.slot]=BigInt($("test-state").value);const opts={caller:"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",owner:"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",param:BigInt($("test-param").value)};const result=differentialIR(current.ir,fn.name,state,opts);text("comparison",pretty({match:result.match,function:fn.name,operation:fn.operation,binaryResult:result.binary.returnValue?.toString()??result.binary.state[fn.slot].toString(),ternaryResult:result.ternary.returnValue?.toString()??result.ternary.state[fn.slot].toString(),scope:"IR-level reference only; not Anvil EVM test"}))}catch(e){text("comparison","LỖI: "+e.message)}}
$("source").addEventListener("input",invalidate);
$("compile").addEventListener("click",compile);
$("reset").addEventListener("click",()=>{$("source").value=EXAMPLE;invalidate();compile()});
$("export").addEventListener("click",()=>{try{assertCurrent();save("bilascript-v7-verified-ir.json",{ir:current.ir,verification:current.verification,backend:current.backend})}catch(e){status(e.message)}});
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.setAttribute("aria-selected",String(x===b)));render()}));
$("ternary-mode").addEventListener("change",()=>{const u=$("ternary-mode").value==="u256";$("text-fields").hidden=u;$("num-fields").hidden=!u;});
$("ternary-run").addEventListener("click",trit);
$("ternary-source").addEventListener("click",()=>{$("ternary-mode").value="utf8";$("text-fields").hidden=false;$("num-fields").hidden=true;$("ternary-input").value=$("source").value;trit()});
$("compare").addEventListener("click",compare);
$("source").value=EXAMPLE;compile();trit();
