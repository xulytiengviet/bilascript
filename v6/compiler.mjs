import {EVM_KEYWORDS,EVM_RESERVED,EVM_VOCABULARY} from "./vocabulary-evm.mjs";
/* BilaScript v6.0.1 experimental EVM compiler. No Solidity, Solang, fake RPC or simulated receipts.
 * Checked uint256 subset: constructor owner, enforced chiz_chuz / chi_chu writes and nonpayable. Unsupported syntax is a hard error.
 * DO NOT use for assets or production contracts without an independent audit.
 */
const MASK = (1n << 64n) - 1n;
const ROT = [0,1,62,28,27,36,44,6,55,20,3,10,43,25,39,41,45,15,21,8,18,2,61,56,14];
const RC = [
  0x0000000000000001n,0x0000000000008082n,0x800000000000808an,0x8000000080008000n,
  0x000000000000808bn,0x0000000080000001n,0x8000000080008081n,0x8000000000008009n,
  0x000000000000008an,0x0000000000000088n,0x0000000080008009n,0x000000008000000an,
  0x000000008000808bn,0x800000000000008bn,0x8000000000008089n,0x8000000000008003n,
  0x8000000000008002n,0x8000000000000080n,0x000000000000800an,0x800000008000000an,
  0x8000000080008081n,0x8000000000008080n,0x0000000080000001n,0x8000000080008008n
];
function rol(v,n) {
  if (!n) return v & MASK;
  const s = BigInt(n);
  return ((v << s) | (v >> (64n-s))) & MASK;
}
function permute(a) {
  for (const rc of RC) {
    const c = Array.from({length:5},(_,x)=>a[x]^a[x+5]^a[x+10]^a[x+15]^a[x+20]);
    for(let x=0;x<5;x++){
      const d=c[(x+4)%5]^rol(c[(x+1)%5],1);
      for(let y=0;y<5;y++) a[x+5*y]^=d;
    }
    const b=Array(25).fill(0n);
    for(let y=0;y<5;y++) for(let x=0;x<5;x++)
      b[y+5*((2*x+3*y)%5)]=rol(a[x+5*y],ROT[x+5*y]);
    for(let y=0;y<5;y++) for(let x=0;x<5;x++)
      a[x+5*y]=(b[x+5*y]^((~b[(x+1)%5+5*y])&b[(x+2)%5+5*y]))&MASK;
    a[0]^=rc;
  }
}
export function keccak256(value) {
  const data=Array.from(new TextEncoder().encode(value));
  data.push(1);
  while(data.length%136!==135) data.push(0);
  data.push(128);
  const a=Array(25).fill(0n);
  for(let pos=0;pos<data.length;pos+=136){
    for(let i=0;i<136;i++) a[i>>3]^=BigInt(data[pos+i])<<BigInt((i%8)*8);
    permute(a);
  }
  let out="";
  for(let i=0;i<32;i++) out+=Number((a[i>>3]>>BigInt((i%8)*8))&255n).toString(16).padStart(2,"0");
  return "0x"+out;
}
function fail(message){ throw new Error("BILA-EVM6: "+message); }
const KEYWORDS=EVM_KEYWORDS;
const RESERVED=EVM_RESERVED;
function tokenize(source) {
  if (typeof source!=="string" || source.length>50000) fail("Nguồn không hợp lệ hoặc quá 50 KB");
  const rx=/\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|[a-zA-Z_][a-zA-Z_0-9]*|[0-9]+|[{}();=+]/y;
  const out=[]; let i=0;
  while(i<source.length){
    rx.lastIndex=i; const m=rx.exec(source);
    if(!m) fail("Ký tự/cú pháp không hỗ trợ ở offset "+i+": "+source.slice(i,i+12));
    i=rx.lastIndex;
    if(/^\s|^\/\//.test(m[0]) || m[0].startsWith("/*")) continue;
    out.push(KEYWORDS[m[0]]||m[0]);
  }
  return out;
}
function parse(source) {
  const t=tokenize(source); let p=0;
  const next=()=>t[p++], peek=()=>t[p];
  const expect=(v)=>{const actual=next();if(actual!==v)fail("Mong đợi '"+v+"', nhận '"+actual+"' tại token "+p);};
  const ident=()=>{
    const n=next();
    if(!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(n||"") || RESERVED.has(n))
      fail("Định danh không hợp lệ hoặc trùng từ khóa: "+n);
    return n;
  };
  const uintType=()=>{expect("uint256");return "uint256";};
  function valueExpression(){
    const v=next();
    if(/^[0-9]+$/.test(v||""))return {kind:"literal",value:v};
    if(!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(v||""))fail("Biểu thức không được hỗ trợ: "+v);
    const left={kind:"identifier",name:v};
    if(peek()==="+"){next();const right=next();if(!/^[0-9]+$/.test(right||""))fail("Vế cộng phải là số nguyên");return {kind:"add",left,right:{kind:"literal",value:right}};}
    return left;
  }
  expect("contract");const name=ident();expect("{");
  const state=[],functions=[];
  while(peek()!=="}" && peek()!==undefined) {
    if(peek()==="uint256"){
      uintType();const n=ident();
      if(state.includes(n))fail("Biến storage trùng: "+n);
      if(state.length>=32)fail("Tối đa 32 biến uint256");
      state.push(n);expect(";");
    }else if(peek()==="function"){
      next();const fname=ident();expect("(");
      let param=null;
      if(peek()!==")"){uintType();param=ident();}
      expect(")");expect("public");
      let ownerOnly=false,view=false,returns=false;
      // CVNSS chiz_chuz (legacy: chi_chu) is a compiler-enforced capability, not a Solidity modifier alias.
      if(peek()==="owner_only"){next();ownerOnly=true;}
      if(peek()==="view"){next();view=true;}
      if(peek()==="returns"){next();expect("(");uintType();expect(")");returns=true;}
      expect("{");
      const first=next();
      let statement;
      if(first==="return"){statement={kind:"return",expr:valueExpression()};expect(";");}
      else{
        if(!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(first||""))fail("Đích gán không hợp lệ");
        expect("=");statement={kind:"assign",target:first,expr:valueExpression()};expect(";");
      }
      expect("}");
      if(functions.some(f=>f.name===fname))fail("Hàm công khai trùng: "+fname);
      functions.push({name:fname,param,ownerOnly,view,returns,statement});
      if(functions.length>24)fail("Tối đa 24 hàm");
    }else fail("Cấu trúc chưa được hỗ trợ ở token "+p+": "+peek());
  }
  expect("}");
  if(p!==t.length)fail("Có token thừa sau hợp đồng");
  if(!state.length||!functions.length)fail("Cần ít nhất một biến uint256 và một hàm public");
  return {name,state,functions};
}
/** Typed semantic boundary: only proven uint256 state transitions enter codegen. */
function analyze(ast) {
  const layout=[{name:"__bila_owner",type:"address",slot:0,access:"deployment-caller"}];
  ast.state.forEach((name,i)=>layout.push({name,type:"uint256",slot:i+1}));
  for(const f of ast.functions){
    if(f.param && ast.state.includes(f.param))fail("Tham số trùng biến state: "+f.param);
    const vars=new Map(ast.state.map(n=>[n,{type:"uint256",location:"storage"}]));
    if(f.param)vars.set(f.param,{type:"uint256",location:"calldata"});
    function typeOf(expr){
      if(expr.kind==="literal"){
        const n=BigInt(expr.value);
        if(n<0n||n>=1n<<256n)fail("Số ngoài phạm vi uint256");
        return "uint256";
      }
      if(expr.kind==="identifier"){
        const info=vars.get(expr.name);
        if(!info)fail("Định danh chưa khai báo: "+expr.name);
        return info.type;
      }
      if(expr.kind==="add"){
        if(typeOf(expr.left)!=="uint256"||typeOf(expr.right)!=="uint256")fail("Toán hạng + phải là uint256");
        return "uint256";
      }
      fail("Biểu thức chưa hỗ trợ");
    }
    if(typeOf(f.statement.expr)!=="uint256")fail("Kiểu trả về/gán phải là uint256");
    if(f.statement.kind==="return"){
      const expr=f.statement.expr;
      if(!f.view||!f.returns||f.param||f.ownerOnly||expr.kind!=="identifier"||!ast.state.includes(expr.name))
        fail("Hàm đọc phải public view returns(uint256), chỉ đọc một biến state");
      f.op="get";f.variable=expr.name;
    }else{
      const {target,expr}=f.statement;
      if(!ast.state.includes(target))fail("Chỉ được ghi biến state uint256 đã khai báo");
      if(f.view||f.returns||!f.ownerOnly)fail("Hàm ghi yêu cầu public chiz_chuz (hoặc chi_chu cũ), không được view/returns");
      if(f.param && expr.kind==="identifier" && expr.name===f.param)f.op="set";
      else if(!f.param&&expr.kind==="add"&&expr.left.kind==="identifier"&&expr.left.name===target&&expr.right.value==="1")f.op="inc";
      else fail("Đã kiểm tra kiểu, nhưng codegen 6.0.1 chỉ hỗ trợ gán tham số hoặc tăng 1");
      f.variable=target;
    }
    f.slot=ast.state.indexOf(f.variable)+1;
    f.signature=f.name+"("+(f.param?"uint256":"")+")";
  }
  return {ast,storageLayout:layout,typeSystem:"checked-uint256-subset",effects:"owner-only-state-writes",defaultMutability:"nonpayable"};
}
const OPCODES={
  "00":"STOP","01":"ADD","03":"SUB","10":"LT","14":"EQ","15":"ISZERO",
  "1c":"SHR","33":"CALLER","34":"CALLVALUE","35":"CALLDATALOAD","36":"CALLDATASIZE","39":"CODECOPY",
  "50":"POP","51":"MLOAD","52":"MSTORE","54":"SLOAD","55":"SSTORE",
  "56":"JUMP","57":"JUMPI","5b":"JUMPDEST","f3":"RETURN","fd":"REVERT"
};
export function disassemble(hex) {
  if(!/^0x(?:[0-9a-f]{2})*$/i.test(hex)) fail("Bytecode phải là hex chẵn");
  const b=hex.slice(2).toLowerCase(); const result=[];
  for(let i=0;i<b.length;){
    const pc=i/2,n=parseInt(b.slice(i,i+2),16);i+=2;
    let name=OPCODES[n.toString(16).padStart(2,"0")]||"UNKNOWN";
    let immediate="";
    if(n>=0x60&&n<=0x7f){
      const size=n-0x5f; name="PUSH"+size;
      if(i+size*2>b.length) fail("Thiếu dữ liệu PUSH tại byte "+pc);
      immediate="0x"+b.slice(i,i+size*2);i+=size*2;
    } else if(n>=0x80&&n<=0x8f)name="DUP"+(n-0x7f);
    else if(n>=0x90&&n<=0x9f)name="SWAP"+(n-0x8f);
    result.push({pc,opcode:"0x"+n.toString(16).padStart(2,"0"),name,immediate});
  }
  return result;
}
function assemble(items) {
  let pc=0;const labels=new Map();
  for(const item of items){
    if(item.label!==undefined){if(labels.has(item.label))fail("Duplicate label");labels.set(item.label,pc);}
    else pc+=item.ref!==undefined?3:item.length;
  }
  if(pc>65535) fail("Runtime vượt PUSH2 offset");
  const bytes=[];
  for(const item of items){
    if(item.label!==undefined)continue;
    if(item.ref!==undefined) {
      const offset=labels.get(item.ref);if(offset===undefined)fail("Unresolved label: "+item.ref);
      bytes.push(0x61,(offset>>8)&255,offset&255);
    }else bytes.push(...item);
  }
  return bytes;
}
function hex(bytes){return bytes.map(v=>v.toString(16).padStart(2,"0")).join("");}
export function compileBila(source) {
  const {ast,storageLayout,typeSystem,effects,defaultMutability}=analyze(parse(source));
  const items=[];
  const op=(...v)=>items.push(v);
  const ref=(name)=>items.push({ref:name});
  const label=(name)=>items.push({label:name});
  const u8=(v)=>{if(v<0||v>255)fail("Giá trị PUSH1 ngoài phạm vi");op(0x60,v);};
  const abi=[], seenSelectors=new Set();
  // Solidity nonpayable semantics: a nonzero CALLVALUE reverts before dispatch.
  op(0x34,0x15);ref("no_value");op(0x57);
  u8(0);u8(0);op(0xfd);label("no_value");op(0x5b);
  u8(0);op(0x35);u8(224);op(0x1c);
  for(let i=0;i<ast.functions.length;i++){
    const f=ast.functions[i];
    const inputs=f.param?[{name:f.param,type:"uint256"}]:[];
    const outputs=f.returns?[{name:"",type:"uint256"}]:[];
    const selector=keccak256(f.signature).slice(2,10);
    if(seenSelectors.has(selector))fail("Va chạm function selector 4 byte: "+f.signature);
    seenSelectors.add(selector);
    f.selector="0x"+selector;
    abi.push({type:"function",name:f.name,inputs,outputs,stateMutability:f.view?"view":"nonpayable"});
    op(0x80,0x63,...selector.match(/../g).map(h=>parseInt(h,16)),0x14);
    ref("f"+i);op(0x57);
  }
  u8(0);u8(0);op(0xfd);
  for(let i=0;i<ast.functions.length;i++){
    const f=ast.functions[i],slot=f.slot;
    label("f"+i);op(0x5b,0x50);
    if(f.op!=="get"){
      // owner is the deployer's CALLER, stored at slot zero by the constructor.
      op(0x33);u8(0);op(0x54,0x14);
      ref("authorized"+i);op(0x57);
      u8(0);u8(0);op(0xfd);
      label("authorized"+i);op(0x5b);
    }
    if(f.op==="get"){
      u8(slot);op(0x54);u8(0);op(0x52);u8(32);u8(0);op(0xf3);
    }else if(f.op==="set"){
      u8(36);op(0x36,0x10);ref("bad");op(0x57);
      u8(4);op(0x35);u8(slot);op(0x55,0x00);
    }else if(f.op==="inc"){
      u8(slot);op(0x54,0x80);
      op(0x7f,...Array(32).fill(255),0x14);
      ref("bad");op(0x57);
      u8(1);op(0x01);u8(slot);op(0x55,0x00);
    }else fail("Codegen chưa triển khai cho "+f.op);
  }
  label("bad");op(0x5b);u8(0);u8(0);op(0xfd);
  const runtimeBytes=assemble(items),length=runtimeBytes.length;
  if(length>65535)fail("Runtime vượt 65535 bytes");
  // Nonpayable deployment; initialize immutable-by-language owner in slot 0.
  // Prefix length 16, copy/return stub length 15 -> runtime offset 31.
  const prefix=[0x34,0x15,0x61,0,11,0x57,0x60,0,0x60,0,0xfd,0x5b,0x33,0x60,0,0x55];
  const offset=prefix.length+15;
  const creation=[...prefix,0x61,length>>8,length&255,0x61,offset>>8,offset&255,
    0x60,0,0x39,0x61,length>>8,length&255,0x60,0,0xf3,...runtimeBytes];
  return {
    compiler:"BilaScript-v6.0.1-native-evm",
    experimental:true,vocabulary:EVM_VOCABULARY.profile+"@"+EVM_VOCABULARY.version,ast,storageLayout,typeSystem,effects,defaultMutability,
    abi,runtimeBytecode:"0x"+hex(runtimeBytes),creationBytecode:"0x"+hex(creation),
    opcodes:disassemble("0x"+hex(runtimeBytes)),
    methods:Object.fromEntries(ast.functions.map(f=>[f.name,{
      signature:f.signature,selector:f.selector,operation:f.op,slot:f.slot,
      parameter:f.param,ownerOnly:f.ownerOnly
    }]))
  };
}
export function encodeCall(method,arg) {
  if(!method||!/^0x[0-9a-f]{8}$/i.test(method.selector))fail("Selector chưa có");
  if(!method.parameter)return method.selector;
  let n;try{n=BigInt(arg);}catch{fail("Tham số uint256 không hợp lệ");}
  if(n<0n||n>(1n<<256n)-1n)fail("uint256 nằm ngoài miền giá trị");
  return method.selector+n.toString(16).padStart(64,"0");
}
export const EXAMPLE = [
  "hoph_dogd Bof_Demb {",
  "  sob_wyly_kogy_zaub_256 demb;",
  "  haml_sob ganj(sob_wyly_kogy_zaub_256 jaj_trir) cogy_kai chiz_chuz { demb = jaj_trir; }",
  "  haml_sob tago() cogy_kai chiz_chuz { demb = demb + 1; }",
  "  haml_sob docr() cogy_kai chiz_docr traz_ved(sob_wyly_kogy_zaub_256) { trov_ved demb; }",
  "}"
].join("\n");
