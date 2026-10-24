/**
 * BilaGuard v0.1 — conservative, independently checked predeploy security gate.
 * Works with the current experimental CVNSS4.0 EVM subset only.
 * Pure and deterministic; no RPC, wallet, Solidity, secrets or network access.
 */
import {compileBila,keccak256,disassemble} from "../../v6/compiler.mjs";
import {EVM_VOCABULARY} from "../../v6/vocabulary-evm.mjs";

export const BILAGUARD_VERSION="0.1.0";
export const BILAGUARD_PROFILE="cvnss4:evm-strict@0.1";
const banned=/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/u;
const reserved=new Set(["contract","function","return","uint256","public","view","returns","owner_only","address"]);
const syntax=/\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|[a-zA-Z_][a-zA-Z_0-9]*|[0-9]+|[{}();=+]/y;
const fullUint=(1n<<256n)-1n;
const normalize=x=>String(x||"").toLowerCase();
function issue(out,severity,code,message,at=null,phase="source",detail=null){
 out.push({severity,code,message,offset:at,phase,...(detail?{detail}:{})});
}
function scanLexical(source,issues){
 if(typeof source!=="string"||source.length===0||source.length>50000){
  issue(issues,"error","SOURCE_SIZE","Nguồn CVNSS4.0 phải dài 1–50.000 ký tự.",null,"lexical");
  return [];
 }
 const bad=source.search(banned);
 if(bad>=0)issue(issues,"error","UNICODE_INVISIBLE",
  "Ký tự định hướng/vô hình không được cho phép trong mã nguồn hay bình luận.",bad,"lexical");
 if(source.includes("\u0000"))issue(issues,"error","NUL_BYTE","Nguồn chứa byte NUL.",source.indexOf("\u0000"),"lexical");
 const toks=[];
 for(let at=0;at<source.length;){
  syntax.lastIndex=at;const m=syntax.exec(source);
  if(!m){issue(issues,"error","UNSUPPORTED_CHARACTER","Ký tự/cú pháp chưa hỗ trợ trong profile EVM hiện tại.",at,"lexical",source.slice(at,at+16));break;}
  const word=m[0];at=syntax.lastIndex;
  if(/^\s/.test(word)||word.startsWith("//")||word.startsWith("/*"))continue;
  toks.push({text:word,offset:m.index});
 }
 for(const record of EVM_VOCABULARY.records){
  for(const legacy of record.legacy){
   for(const token of toks)if(token.text===legacy)
    issue(issues,"error","LEGACY_ALIAS",
     "Nguồn triển khai nghiêm ngặt phải dùng "+record.primary+" thay cho alias "+legacy+".",
     token.offset,"cvnss");
  }
  for(const token of toks)if(token.text===record.semantic&&!record.legacy.includes(record.semantic))
   issue(issues,"error","ENGLISH_KEYWORD",
    "Dùng từ khóa CVNSS4.0 chính thức "+record.primary+" thay cho "+record.semantic+".",
    token.offset,"cvnss");
 }
 // Detect visually confusable user-defined names independent of selector case-sensitivity.
 const known=new Map();
 for(let i=0;i<toks.length-1;i++){
  const t=toks[i].text;
  if(!["hoph_dogd","haml_sob","sob_wyly_kogy_zaub_256"].includes(t))continue;
  const next=toks[i+1];
  if(next?.text&&!/^[a-zA-Z_][\w]*$/.test(next.text))continue;
  if(t==="sob_wyly_kogy_zaub_256"&&next?.text===")")continue;
  if(!next||reserved.has(next.text))continue;
  const lowered=next.text.toLowerCase();
  if(known.has(lowered)&&known.get(lowered)!==next.text)
   issue(issues,"error","IDENTIFIER_CASEFOLD_COLLISION",
    "Hai định danh chỉ khác chữ hoa/thường: "+known.get(lowered)+" và "+next.text,
    next.offset,"cvnss");
  else known.set(lowered,next.text);
 }
 return toks;
}
function verifyAstAndLayout(build,issues){
 const ast=build.ast,layout=build.storageLayout;
 if(!ast||!Array.isArray(ast.state)||!Array.isArray(ast.functions)||!Array.isArray(layout)){
  issue(issues,"error","AST_MISSING","Compiler thiếu AST hoặc storage layout.",null,"ast");return;
 }
 if(!ast.state.length||ast.state.length>32||!ast.functions.length||ast.functions.length>24)
  issue(issues,"error","AST_LIMIT","Vượt giới hạn hợp đồng v6: tối đa 32 biến và 24 hàm.",null,"ast");
 if(layout.length!==ast.state.length+1||layout[0]?.name!=="__bila_owner"||
   layout[0]?.type!=="address"||layout[0]?.slot!==0)
  issue(issues,"error","OWNER_LAYOUT","Slot 0 phải là owner địa chỉ của người triển khai.",null,"storage");
 const slots=new Set(),names=new Set();
 for(let i=0;i<layout.length;i++){
  const v=layout[i];
  if(!v||!Number.isInteger(v.slot)||v.slot!==i||slots.has(v.slot))
   issue(issues,"error","SLOT_COLLISION","Storage slot không liên tiếp hoặc trùng: vị trí "+i,null,"storage");
  if(v?.name==null||names.has(v.name))
   issue(issues,"error","DUP_STORAGE","Trùng tên trong storage layout.",null,"storage");
  if(i>0&&(v?.type!=="uint256"||v?.name!==ast.state[i-1]))
   issue(issues,"error","STATE_LAYOUT_MISMATCH","Tên/kiểu biến state không khớp slot "+i,null,"storage");
  slots.add(v?.slot);names.add(v?.name);
 }
 const selectorSet=new Set(),funcNames=new Set();
 for(const f of ast.functions){
  if(!f||funcNames.has(f.name))
   issue(issues,"error","DUP_FUNCTION","Tên hàm không hợp lệ hoặc trùng.",null,"ast");
  funcNames.add(f?.name);
  const expects=f?.name+"("+(f?.param?"uint256":"")+")";
  if(f?.signature!==expects||f.selector!==keccak256(expects).slice(0,10)||
    !/^0x[0-9a-f]{8}$/i.test(f?.selector||""))
   issue(issues,"error","ABI_SIGNATURE","Selector/ABI signature sai với Keccak-256.",null,"abi");
  if(selectorSet.has(f?.selector))
   issue(issues,"error","SELECTOR_COLLISION","Hai hàm có selector EVM trùng nhau.",null,"abi");
  selectorSet.add(f?.selector);
  if(!ast.state.includes(f?.variable)||f?.slot!==ast.state.indexOf(f.variable)+1)
   issue(issues,"error","FUNCTION_SLOT","Tham chiếu storage trong AST bị lệch.",null,"storage");
  if(f?.op==="get"){
   if(!f.view||!f.returns||f.ownerOnly||f.param||f.statement?.kind!=="return")
    issue(issues,"error","VIEW_EFFECT","Hàm đọc không được ghi storage hay có capability chi_chu.",null,"ast");
  }else if(f?.op==="set"||f?.op==="inc"){
   if(!f.ownerOnly||f.view||f.returns||f.statement?.kind!=="assign")
    issue(issues,"error","WRITE_UNGUARDED","Hàm ghi bắt buộc dùng chi_chu và không được view.",null,"ast");
   if(f.op==="inc"&&(f.param||f.statement?.expr?.kind!=="add"||
    f.statement.expr.right?.value!=="1"))
    issue(issues,"error","INC_SEMANTICS","Increment phải đúng biểu thức state = state + 1.",null,"ast");
  }else issue(issues,"error","UNKNOWN_EFFECT","Loại hiệu ứng hàm chưa được kiểm chứng.",null,"ast");
 }
 if(build.abi?.length!==ast.functions.length||Object.keys(build.methods||{}).length!==ast.functions.length)
  issue(issues,"error","ABI_COUNT","Số hàm ABI không khớp với AST.",null,"abi");
 return true;
}
function verifyOpcodeGuard(build,issues){
 let ops;
 try{ops=disassemble(build.runtimeBytecode);}catch(e){
  issue(issues,"error","INVALID_EVM",String(e.message),null,"evm");return;
 }
 if(ops.some(o=>o.name==="UNKNOWN"))
  issue(issues,"error","UNKNOWN_OPCODE","Có opcode chưa được BilaGuard hỗ trợ.",null,"evm");
 const jumps=new Set(ops.filter(o=>o.name==="JUMPDEST").map(o=>o.pc));
 for(let i=1;i<ops.length;i++)if(ops[i].name==="JUMPI"){
  if(ops[i-1]?.name!=="PUSH2"||!jumps.has(Number.parseInt(ops[i-1].immediate,16)))
   issue(issues,"error","JUMP_TARGET","JUMPI không đi tới JUMPDEST hợp lệ.",ops[i].pc,"evm");
 }
 const dispatch=new Map();
 for(let i=0;i<ops.length-3;i++){
  const op=ops[i];
  if(op.name==="PUSH4"&&ops[i+1]?.name==="EQ"&&
    ops[i+2]?.name==="PUSH2"&&ops[i+3]?.name==="JUMPI")
   dispatch.set(op.immediate.toLowerCase(),Number.parseInt(ops[i+2].immediate,16));
 }
 const methods=build.ast.functions,allStarts=methods.map(f=>dispatch.get(f.selector?.toLowerCase()));
 for(let i=0;i<methods.length;i++){
  const f=methods[i],start=allStarts[i],end=i+1<methods.length?allStarts[i+1]:ops.at(-1)?.pc+1;
  if(start===undefined||!jumps.has(start)||!(end>start)){
   issue(issues,"error","DISPATCH","Không tìm thấy đường thực thi ABI tương ứng hàm "+f.name,null,"evm");continue;
  }
  const region=ops.filter(o=>o.pc>=start&&o.pc<end);
  const codes=region.map(x=>x.name);
  if(codes[0]!=="JUMPDEST"||codes[1]!=="POP")
   issue(issues,"error","METHOD_ENTRY","Sai điểm vào EVM của hàm "+f.name,start,"evm");
  if(f.op==="get"){
   if(codes.includes("SSTORE")||!codes.includes("SLOAD")||!codes.includes("RETURN"))
    issue(issues,"error","VIEW_OPCODE","Hàm đọc không được SSTORE và phải SLOAD/RETURN.",start,"evm");
  }else{
   // Every state write must start with the exact compiler-generated owner check:
   // JUMPDEST, POP, CALLER, PUSH1 0, SLOAD, EQ, PUSH2, JUMPI,
   // PUSH1 0, PUSH1 0, REVERT, JUMPDEST.
   const expected=["JUMPDEST","POP","CALLER","PUSH1","SLOAD","EQ",
     "PUSH2","JUMPI","PUSH1","PUSH1","REVERT","JUMPDEST"];
   if(expected.some((name,k)=>codes[k]!==name)||
       region[3]?.immediate!=="0x00"||
       !codes.includes("SSTORE"))
    issue(issues,"error","OWNER_OPCODE","Thiếu hoặc sai kiểm tra owner EVM ở "+f.name,start,"evm");
   if(f.op==="inc"&&!codes.includes("PUSH32"))
    issue(issues,"error","OVERFLOW_GUARD","Thiếu nhánh kiểm tra tràn uint256.",start,"evm");
  }
 }
 if(!ops.some(o=>o.name==="CALLVALUE")||!ops.some(o=>o.name==="REVERT"))
  issue(issues,"error","NONPAYABLE_OPCODE","Runtime không chặn CALLVALUE không hợp lệ.",null,"evm");
}
export function analyzeBilaSource(source,{strict=true}={}){
 const issues=[],tokens=scanLexical(source,issues);
 let build=null;
 if(typeof source==="string"&&source.length>0&&source.length<=50000){
  try{build=compileBila(source);}catch(e){
   issue(issues,"error","COMPILE_REJECTED",String(e.message),null,"compiler");
  }
 }
 if(build){
  verifyAstAndLayout(build,issues);
  verifyOpcodeGuard(build,issues);
  if(build.vocabulary!=="bila:evm@6.0.1"||EVM_VOCABULARY.status!=="PROVISIONAL_UNDER_AUDIT")
   issue(issues,"error","VOCAB_PROFILE","Compiler dùng từ điển CVNSS chưa được khóa đúng phiên bản.",null,"cvnss");
  if(!source.includes("chi_chu"))
   issue(issues,"warning","READ_ONLY","Hợp đồng không có owner-only write; kiểm tra mục tiêu nghiệp vụ.",null,"security");
 }
 if(!strict){
  for(const x of issues)if(x.code==="LEGACY_ALIAS"||x.code==="ENGLISH_KEYWORD")x.severity="warning";
 }
 const errors=issues.filter(x=>x.severity==="error");
 const warnings=issues.filter(x=>x.severity==="warning");
 return {
  schema:"bilaguard.analysis.v0.1",guard:BILAGUARD_VERSION,profile:BILAGUARD_PROFILE,
  sourceKeccak256:typeof source==="string"?keccak256(source):null,
  accepted:!!build&&errors.length===0,
  stats:{sourceChars:source?.length||0,tokens:tokens.length,errors:errors.length,warnings:warnings.length,
   functions:build?.ast.functions.length||0,stateVariables:build?.ast.state.length||0,
   storageSlots:build?.storageLayout.length||0,creationBytes:build?(build.creationBytecode.length-2)/2:0,
   runtimeBytes:build?(build.runtimeBytecode.length-2)/2:0},
  issues,source,build
 };
}
export function isDeploymentEligible(result){
 return result?.schema==="bilaguard.analysis.v0.1"&&result.accepted===true&&
  result.issues?.every(x=>x.severity!=="error")&&!!result.build?.creationBytecode;
}
