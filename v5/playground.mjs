import {EXERCISES,CATEGORIES} from "./examples.mjs";
import {compileStrict,compileLegacy} from "./src/strict.mjs";
import {runCompiled} from "./src/demo-runner.mjs";

const get=id=>document.getElementById(id);
const input=get("source"),output=get("result"),jsView=get("jsoutput"),expected=get("expected");
const desc=get("exercise-description"),exerciseTitle=get("exercise-title"),runStatus=get("status");
const picker=get("exercise-list"),search=get("search"),filter=get("category"),count=get("count");
const editorNote=get("editor-note"),executionTime=get("elapsed"),compileStatus=get("compile-status");
let selected=EXERCISES[0],generated="",revision=0,busy=false;
const groups=["Tất cả",...CATEGORIES];
const asText=x=>typeof x==="string"?x:JSON.stringify(x,null,2);
const resultState=(kind,message)=>{
  output.textContent=message;
  output.className="terminal "+kind;
  runStatus.textContent=kind==="bad"?"Có lỗi":kind==="good"?"Đã chạy":"Sẵn sàng";
  runStatus.dataset.state=kind;
};
function make(tag,className,text){
  const x=document.createElement(tag);
  if(className)x.className=className;
  if(text!==undefined)x.textContent=text;
  return x;
}
function draw(){
  const term=search.value.trim().toLocaleLowerCase("vi");
  const selectedGroup=filter.value;
  const visible=EXERCISES.filter(x=>
    (selectedGroup==="Tất cả"||x.category===selectedGroup)&&
    (x.title+" "+x.description+" "+x.category+" "+x.id).toLocaleLowerCase("vi").includes(term));
  picker.replaceChildren();
  visible.forEach(x=>{
    const button=make("button","exercise"+(x.id===selected.id?" active":""),"");
    button.type="button";
    button.setAttribute("aria-current",String(x.id===selected.id));
    button.append(make("span","num",String(x.id).padStart(2,"0")));
    const detail=make("span","exercise-detail");
    detail.append(make("strong","",x.title));
    detail.append(make("small","",x.category));
    button.append(detail);
    button.addEventListener("click",()=>selectExercise(x));
    picker.append(button);
  });
  if(!visible.length)picker.append(make("p","muted","Không tìm thấy bài toán phù hợp."));
  count.textContent=visible.length+"/50 bài";
}
function compile(){
  generated="";
  jsView.textContent="Chưa biên dịch.";
  compileStatus.textContent="Chưa biên dịch";
  try{
    const source=input.value;
    const r=compileStrict(source,{sourceMap:true});
    generated=r.code;
    jsView.textContent=generated;
    compileStatus.textContent="CVNSS Strict · OK · "+generated.length+" ký tự";
    editorNote.textContent=source===selected.code?"Đang xem mã mẫu":"Mã đã được chỉnh sửa";
    return true;
  }catch(e){
    compileStatus.textContent="Lỗi cú pháp / semantic";
    editorNote.textContent="Chỉnh sửa và biên dịch lại.";
    resultState("bad",String(e.message||e));
    return false;
  }
}
function selectExercise(x){
  selected=x;
  revision++;
  exerciseTitle.textContent=String(x.id).padStart(2,"0")+". "+x.title;
  desc.textContent=x.description;
  input.value=x.code;
  expected.textContent=asText(x.expected);
  executionTime.textContent="—";
  compile();
  resultState("idle","Mã mẫu đã nạp. Nhấn ▶ Chạy để xem kết quả thực thi.");
  draw();
  input.scrollTop=0;
}
async function execute(){
  if(busy){resultState("idle","Đang chạy bài trước; vui lòng đợi hoặc thử lại sau.");return;}
  if(!compile())return;
  const current=++revision;
  busy=true;
  get("run").disabled=true;
  executionTime.textContent="Đang chạy…";
  resultState("idle","Đang chạy JavaScript đã biên dịch trong Web Worker cô lập…");
  try{
    const r=await runCompiled(generated,{timeout:2500});
    if(current!==revision)return;
    resultState("good",r.output);
    const orig=input.value===selected.code;
    const match=r.output===asText(selected.expected);
    const label=orig?(match?" · Trùng kết quả mẫu":" · Khác kết quả mẫu"):" · Mã đã chỉnh sửa";
    executionTime.textContent=String(r.ms??"—")+" ms"+label;
  }catch(err){
    if(current!==revision)return;
    resultState("bad",String(err.message||err));
    executionTime.textContent="Không hoàn thành";
  }finally{
    busy=false;
    get("run").disabled=false;
  }
}
for(const cat of groups){
  const item=make("option","",cat);
  item.value=cat;
  filter.append(item);
}
filter.addEventListener("change",draw);
search.addEventListener("input",draw);
input.addEventListener("input",()=>{
  revision++;
  generated="";
  jsView.textContent="Đã sửa mã nguồn. Biên dịch lại để cập nhật JavaScript.";
  compileStatus.textContent="Cần biên dịch lại";
  editorNote.textContent="Mã đã được chỉnh sửa";
  resultState("idle","Nhấn ▶ Chạy để xem kết quả của mã đã chỉnh sửa.");
});
get("compile").addEventListener("click",()=>{
  if(compile())resultState("idle","Biên dịch thành công. Nhấn ▶ Chạy để thực thi.");
});
get("run").addEventListener("click",execute);
get("reset").addEventListener("click",()=>selectExercise(selected));
get("copy").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(input.value);editorNote.textContent="Đã sao chép mã nguồn.";}
  catch{editorNote.textContent="Trình duyệt chặn clipboard; hãy chọn mã và sao chép.";}
});
get("download").addEventListener("click",()=>{
  if(!generated&&!compile())return;
  const url=URL.createObjectURL(new Blob([generated],{type:"text/javascript"}));
  const link=document.createElement("a");
  link.href=url;link.download="bila-bai-"+String(selected.id).padStart(2,"0")+".mjs";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
});
get("legacy").addEventListener("click",()=>{
  try{
    const r=compileLegacy(input.value,{sourceMap:true});
    jsView.textContent=r.code;
    generated=r.code;
    compileStatus.textContent="Legacy v4 · "+generated.length+" ký tự";
    resultState("idle","Đã dùng compiler v4. Nhấn ▶ Chạy sẽ biên dịch lại bằng strict v5.");
  }catch(e){resultState("bad",String(e.message||e));}
});
document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();execute();}
});
selectExercise(EXERCISES[0]);
// First-load demonstration: actually run one supported CVNSS exercise, not a canned string.
execute();

