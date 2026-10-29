/** BilaScript v7 Core: isolated, browser-native typed IR research backend.
 * Compatible source: accepted CVNSS4.0 v6 restricted subset. No v5/v6 writes.
 */
import {compileBila,keccak256} from "../../v6/compiler.mjs";
import {MAX_U256,addU256Ternary} from "./ternary.mjs";

const allowedOps=new Set(["nonpayable","caller","sload","require_eq","param","const","u256_add_checked","sstore","return","stop"]);
const MAX_NODES=4096;
export const IR_VERSION="bila-ir/0.1.0";
function assert(condition,message){if(!condition)throw Error("BILA-IR: "+message)}
function freezeResult(object){return Object.freeze(object)}
function node(nodes,op,extras={}){const n={id:nodes.length,op,...extras};nodes.push(n);return n.id}
function lowerFunction(fn) {
 const nodes=[], ownerSlot=0;
 node(nodes,"nonpayable");
 if(fn.op!=="get"){
   const caller=node(nodes,"caller",{type:"address"});
   const owner=node(nodes,"sload",{slot:ownerSlot,type:"address"});
   node(nodes,"require_eq",{args:[caller,owner],kind:"owner"});
 }
 if(fn.op==="get"){
   const x=node(nodes,"sload",{slot:fn.slot,type:"uint256"});
   node(nodes,"return",{args:[x]});
 } else if(fn.op==="set"){
   const x=node(nodes,"param",{name:fn.param,type:"uint256"});
   node(nodes,"sstore",{slot:fn.slot,args:[x],type:"uint256"});
   node(nodes,"stop");
 } else if(fn.op==="inc"){
   const x=node(nodes,"sload",{slot:fn.slot,type:"uint256"});
   const y=node(nodes,"const",{value:"1",type:"uint256"});
   const z=node(nodes,"u256_add_checked",{args:[x,y],type:"uint256"});
   node(nodes,"sstore",{slot:fn.slot,args:[z],type:"uint256"});
   node(nodes,"stop");
 } else throw Error("BILA-IR: thao tác chưa hỗ trợ "+fn.op);
 return {name:fn.name,signature:fn.signature,selector:fn.selector,operation:fn.op,slot:fn.slot,ownerOnly:fn.ownerOnly,view:fn.view,parameter:fn.param||null,nodes};
}
export function lowerSource(source){
 assert(typeof source==="string"&&source.length<=50000,"nguồn không hợp lệ hoặc quá 50 KB");
 const reference=compileBila(source);
 const ir={version:IR_VERSION,kind:"bila-contract",contract:reference.ast.name,
  vocabulary:reference.vocabulary,typeSystem:"checked-uint256-subset",
  storageLayout:reference.storageLayout.map(s=>({...s})),
  functions:reference.ast.functions.map(lowerFunction),
  limits:{contractCount:1,storageMax:32,functionMax:24},
  provenance:{sourceKeccak256:keccak256(source),referenceCompiler:reference.compiler}};
 return freezeResult({ir,reference});
}
function checkFunction(fn,layout){
 assert(fn&&typeof fn==="object"&&Array.isArray(fn.nodes)&&fn.nodes.length>0&&fn.nodes.length<=MAX_NODES,"danh sách nút không hợp lệ");
 assert(["get","set","inc"].includes(fn.operation),"thao tác không hỗ trợ");
 assert(Number.isInteger(fn.slot)&&fn.slot>0&&fn.slot<layout.length,"slot ngoài layout");
 assert(typeof fn.signature==="string"&&/^0x[0-9a-fA-F]{8}$/.test(fn.selector),"ABI selector lỗi");
 const nodes=fn.nodes;
 let guards=0, nonpayable=0,writes=0,returns=0;
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i];
  assert(n&&n.id===i&&allowedOps.has(n.op),"ID/opcode không hợp lệ tại nút "+i);
  if(n.args!==undefined){assert(Array.isArray(n.args)&&n.args.every(a=>Number.isInteger(a)&&a>=0&&a<i),"tham chiếu không topo tại nút "+i)}
  if(n.op==="nonpayable"){nonpayable++;assert(i===0,"nonpayable phải là nút đầu")}
  if(n.op==="require_eq"){
    guards++;assert(n.kind==="owner"&&n.args?.length===2,"owner guard sai");
    const a=nodes[n.args[0]], b=nodes[n.args[1]];
    assert(a.op==="caller"&&a.type==="address"&&b.op==="sload"&&b.slot===0&&b.type==="address","owner guard phải so CALLER với slot 0");
  }
  if(n.op==="sload"){assert(Number.isInteger(n.slot)&&n.slot>=0&&n.slot<layout.length,"đọc slot ngoài layout");assert(n.type===(n.slot===0?"address":"uint256"),"sload type không đúng")}
  if(n.op==="param"){assert(n.type==="uint256"&&n.name===fn.parameter,"tham số sai")}
  if(n.op==="const"){assert(n.type==="uint256"&&/^(0|[1-9][0-9]*)$/.test(n.value||"")&&BigInt(n.value)<=MAX_U256,"hằng số ngoài miền")}
  if(n.op==="u256_add_checked"){assert(n.type==="uint256"&&n.args?.length===2,"phép cộng thiếu operand");for(const a of n.args)assert(nodes[a].type==="uint256","toán hạng không phải uint256")}
  if(n.op==="sstore"){
    writes++;assert(n.slot===fn.slot&&n.type==="uint256"&&n.args?.length===1,"ghi storage không được phép");
    assert(nodes[n.args[0]].type==="uint256","giá trị ghi sai kiểu");
    assert(guards===1&&fn.ownerOnly===true&&!fn.view,"sstore thiếu owner guard");
  }
  if(n.op==="return"){returns++;assert(fn.operation==="get"&&n.args?.length===1&&nodes[n.args[0]].op==="sload"&&nodes[n.args[0]].slot===fn.slot,"giá trị getter sai")}
 }
 assert(nonpayable===1,"thiếu nonpayable");
 assert(fn.operation==="get"?(guards===0&&writes===0&&returns===1&&fn.view===true):(guards===1&&writes===1&&returns===0),"kiểm tra hiệu ứng thất bại");
 const expected=fn.operation==="get"?["nonpayable","sload","return"]:fn.operation==="set"?["nonpayable","caller","sload","require_eq","param","sstore","stop"]:["nonpayable","caller","sload","require_eq","sload","const","u256_add_checked","sstore","stop"];
 assert(nodes.length===expected.length&&nodes.every((n,i)=>n.op===expected[i]),"IR không thuộc tập con ngữ nghĩa được hỗ trợ");
 if(fn.operation==="inc"){
   assert(nodes[4].slot===fn.slot&&nodes[5].value==="1"&&nodes[6].args[0]===4&&nodes[6].args[1]===5&&nodes[7].args[0]===6,"increment phải checked +1 đúng slot");
 }
 if(fn.operation==="set")assert(nodes[5].args[0]===4,"setter phải ghi đúng tham số");
 if(fn.operation==="get")assert(nodes[1].slot===fn.slot&&nodes[2].args[0]===1,"getter sai phụ thuộc");
 return {function:fn.name,nodeCount:nodes.length,guards,writes,operation:fn.operation,ok:true};
}
export function verifyIR(ir){
 try{
  assert(ir?.version===IR_VERSION&&ir.kind==="bila-contract","schema/version không tương thích");
  const layout=ir.storageLayout;assert(Array.isArray(layout)&&layout.length>=2&&layout.length<=33,"storage layout ngoài giới hạn");
  assert(layout[0]?.slot===0&&layout[0]?.name==="__bila_owner"&&layout[0]?.type==="address","owner slot 0 sai");
  for(let i=1;i<layout.length;i++)assert(layout[i].slot===i&&layout[i].type==="uint256","storage layout không tuần tự");
  assert(Array.isArray(ir.functions)&&ir.functions.length>0&&ir.functions.length<=24,"số hàm không hợp lệ");
  let total=0;const seen=new Set();
  const details=ir.functions.map(f=>{assert(!seen.has(f.selector),"trùng function selector");seen.add(f.selector);let r=checkFunction(f,layout);total+=r.nodeCount;return r});
  return {ok:true,version:IR_VERSION,nodeCount:total,checks:details,diagnostics:[]};
 }catch(err){return {ok:false,version:IR_VERSION,nodeCount:0,checks:[],diagnostics:[String(err.message||err)]}}
}
export function compileVerified(source){
 const {ir,reference}=lowerSource(source);
 const verification=verifyIR(ir);
 assert(verification.ok,verification.diagnostics.join("; "));
 // v7 reuses v6 reference as an isolated JS backend for parity; no modified v6 code.
 const backend={name:"javascript-v6-reference",bytecode:reference.runtimeBytecode,creationBytecode:reference.creationBytecode,abi:reference.abi};
 return {ir,verification,backend,reference};
}
export function executeIR(ir,functionName,state,{caller,owner,param=0n,value=0n,backend="binary"}={}){
 const verification=verifyIR(ir);assert(verification.ok,verification.diagnostics.join("; "));
 const fn=ir.functions.find(f=>f.name===functionName);assert(fn,"hàm không tồn tại");
 assert(BigInt(value)===0n,"nonpayable: CALLVALUE không được khác 0");
 const slots=state.map(x=>BigInt(x));assert(slots.length===ir.storageLayout.length,"state không đúng layout");
 const result={state:slots.slice(),returnValue:null,trace:[],backend};
 if(fn.operation!=="get")assert(String(caller).toLowerCase()===String(owner).toLowerCase(),"owner guard thất bại");
 const x=slots[fn.slot];assert(x>=0n&&x<=MAX_U256,"storage ngoài miền uint256");
 if(fn.operation==="get")result.returnValue=x;
 else if(fn.operation==="set"){const v=BigInt(param);assert(v>=0n&&v<=MAX_U256,"tham số uint256 ngoài miền");result.state[fn.slot]=v}
 else {
  result.state[fn.slot]=backend==="ternary"?addU256Ternary(x,1n).value:x+1n;
  assert(result.state[fn.slot]<=MAX_U256,"U256_OVERFLOW");
 }
 result.trace=fn.nodes.map(n=>n.op);
 return result;
}
export function differentialIR(ir,fn,state,options={}){
 const a=executeIR(ir,fn,state,{...options,backend:"binary"});
 const b=executeIR(ir,fn,state,{...options,backend:"ternary"});
 assert(a.returnValue===b.returnValue&&a.state.every((x,i)=>x===b.state[i]),"binary/ternary mismatch");
 return {match:true,binary:a,ternary:b};
}
