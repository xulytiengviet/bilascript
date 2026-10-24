/* BilaScript v6 experimental EVM compiler. No Solidity, Solang, fake RPC or simulated receipts.
 * Grammar is intentionally narrow: uint256 storage, one-statement public functions,
 * get, set and checked increment by 1. Unsupported syntax is a hard error.
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
const KEYWORDS = Object.freeze({hop_dong:"contract",haml_sob:"function",trov_ved:"return"});
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
  const peek=()=>t[p], next=()=>t[p++];
  const expect=(v)=>{if(next()!==v) fail("Mong đợi '"+v+"' tại token "+p);};
  const ident=()=>{const n=next();if(!/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(n||""))fail("Tên định danh sai ở token "+p);return n;};
  expect("contract");const name=ident();expect("{");
  const state=[],functions=[];
  while(peek()!=="}" && peek()!==undefined) {
    if(peek()==="uint256") {
      next(); const n=ident();if(state.includes(n))fail("Biến storage trùng: "+n);
      if(state.length>=32)fail("Tối đa 32 biến state uint256 trong v6.0");
      state.push(n);expect(";");
    } else if(peek()==="function"){
      next();const fname=ident();expect("(");
      let param=null;
      if(peek()!==")"){expect("uint256");param=ident();}
      expect(")");expect("public");
      let view=false, returns=false;
      if(peek()==="view"){next();view=true;}
      if(peek()==="returns"){next();expect("(");expect("uint256");expect(")");returns=true;}
      expect("{");
      let op=null, variable=null;
      const target=next();
      if(target==="return") {
        variable=ident();expect(";");op="get";
        if(!returns||!view||param) fail("Hàm return phải public view returns(uint256), không tham số");
      } else {
        variable=target;if(!state.includes(variable))fail("Biến storage không tồn tại: "+variable);
        expect("=");
        const sourceName=next();
        if(param && sourceName===param && peek()===";") op="set";
        else if(!param && sourceName===variable && peek()==="+"){
          next();expect("1");op="inc";
        } else fail("v6.0 chỉ cho phép gán từ tham số uint256 hoặc tăng đúng 1");
        expect(";");
        if(returns||view) fail("Hàm thay đổi state không thể view/returns");
      }
      expect("}");
      if(!state.includes(variable)) fail("Không đọc được biến state: "+variable);
      if(functions.some(f=>f.name===fname)) fail("Tên hàm trùng trong v6.0: "+fname);
      functions.push({name:fname,op,variable,param,view,returns});
    } else fail("Cấu trúc không hỗ trợ ở token "+p+": "+peek());
  }
  expect("}");
  if(p!==t.length) fail("Có token dư sau hợp đồng");
  if(!state.length||!functions.length) fail("Yêu cầu ít nhất 1 uint256 state và 1 public function");
  if(functions.length>24) fail("Tối đa 24 hàm");
  return {name,state,functions};
}
const OPCODES={
  "00":"STOP","01":"ADD","03":"SUB","10":"LT","14":"EQ","15":"ISZERO",
  "1c":"SHR","35":"CALLDATALOAD","36":"CALLDATASIZE","39":"CODECOPY",
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
  const ast=parse(source),items=[];
  const op=(...v)=>items.push(v);
  const ref=(name)=>items.push({ref:name});
  const label=(name)=>items.push({label:name});
  const u8=(v)=>{if(v<0||v>255)fail("Slot overflow");op(0x60,v);};
  const abi=[];
  // Selector dispatch. Calls shorter than 4 bytes are rejected unless selectors match.
  u8(0);op(0x35);u8(224);op(0x1c);
  for(let i=0;i<ast.functions.length;i++){
    const f=ast.functions[i];
    const inputs=f.param?[{name:f.param,type:"uint256"}]:[];
    const outputs=f.returns?[{name:"",type:"uint256"}]:[];
    const signature=f.name+"("+(f.param?"uint256":"")+")";
    const selector=keccak256(signature).slice(2,10);
    f.selector="0x"+selector;
    abi.push({type:"function",name:f.name,inputs,outputs,stateMutability:f.view?"view":"nonpayable"});
    op(0x80,0x63,...selector.match(/../g).map(h=>parseInt(h,16)),0x14);
    ref("f"+i);op(0x57);
  }
  u8(0);u8(0);op(0xfd);
  for(let i=0;i<ast.functions.length;i++) {
    const f=ast.functions[i],slot=ast.state.indexOf(f.variable);
    label("f"+i);op(0x5b,0x50); // JUMPDEST, discard selector
    if(f.op==="get"){
      u8(slot);op(0x54);u8(0);op(0x52);u8(32);u8(0);op(0xf3);
    } else if(f.op==="set") {
      u8(36);op(0x36,0x10);ref("bad");op(0x57); // calldatasize < 36
      u8(4);op(0x35);u8(slot);op(0x55,0x00);
    } else if(f.op==="inc") {
      u8(slot);op(0x54,0x80); // load old, keep a copy
      op(0x7f,...Array(32).fill(255),0x14); // old == maxuint256
      ref("bad");op(0x57);
      u8(1);op(0x01);u8(slot);op(0x55,0x00);
    }
  }
  label("bad");op(0x5b);u8(0);u8(0);op(0xfd);
  const runtimeBytes=assemble(items);
  const length=runtimeBytes.length;
  if(length>65535)fail("Runtime quá dài");
  const creation=[0x61,length>>8,length&255,0x61,0,15,0x60,0,0x39,0x61,length>>8,length&255,0x60,0,0xf3,...runtimeBytes];
  const result={
    compiler:"BilaScript-v6.0-native-evm-subset",
    experimental:true,
    ast, abi, runtimeBytecode:"0x"+hex(runtimeBytes),
    creationBytecode:"0x"+hex(creation),
    opcodes:disassemble("0x"+hex(runtimeBytes)),
    methods:Object.fromEntries(ast.functions.map(f=>[f.name,{signature:f.name+"("+(f.param?"uint256":"")+")",selector:f.selector,operation:f.op,slot:ast.state.indexOf(f.variable),parameter:f.param}]))
  };
  return result;
}
export function encodeCall(method,arg) {
  if(!method||!/^0x[0-9a-f]{8}$/i.test(method.selector))fail("Selector chưa có");
  if(!method.parameter)return method.selector;
  let n;try{n=BigInt(arg);}catch{fail("Tham số uint256 không hợp lệ");}
  if(n<0n||n>(1n<<256n)-1n)fail("uint256 nằm ngoài miền giá trị");
  return method.selector+n.toString(16).padStart(64,"0");
}
export const EXAMPLE = [
  "hop_dong BoDem {",
  "  uint256 dem;",
  "  haml_sob gan(uint256 giaTri) public { dem = giaTri; }",
  "  haml_sob tang() public { dem = dem + 1; }",
  "  haml_sob doc() public view returns (uint256) { trov_ved dem; }",
  "}"
].join("\n");
