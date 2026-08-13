import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
function flatten(ts,msg){ return ts.flattenDiagnosticMessageText?ts.flattenDiagnosticMessageText(msg,"\n"):String(msg); }
export async function analyzeWithTypeScript(jsCode,{fileName="input.js"}={}){
  let ts;
  try {
    const loaded=require("typescript");
    ts=loaded?.default||loaded;
  } catch {
    return {available:false,diagnostics:[],reason:"typescript package not installed"};
  }
  if(typeof ts?.createProgram!=="function"||typeof ts?.createCompilerHost!=="function"){
    return {available:false,diagnostics:[],reason:"typescript compiler API unavailable"};
  }
  const target=ts.ScriptTarget?.ES2022 ?? ts.ScriptTarget?.ES2020 ?? ts.ScriptTarget?.Latest;
  const moduleKind=ts.ModuleKind?.ESNext ?? ts.ModuleKind?.NodeNext ?? ts.ModuleKind?.CommonJS;
  const opts={allowJs:true,checkJs:true,noEmit:true,skipLibCheck:true};
  if(target!==undefined) opts.target=target;
  if(moduleKind!==undefined) opts.module=moduleKind;
  const base=ts.createCompilerHost(opts); const norm=f=>f.replace(/\\/g,"/"); const targetFile=norm(fileName);
  const host={...base,
    fileExists:f=>norm(f)===targetFile||base.fileExists(f),
    readFile:f=>norm(f)===targetFile?String(jsCode):base.readFile(f),
    getSourceFile:(f,lang,onError,newFile)=>norm(f)===targetFile?ts.createSourceFile(f,String(jsCode),lang,true,ts.ScriptKind?.JS):base.getSourceFile(f,lang,onError,newFile)
  };
  const program=ts.createProgram([fileName],opts,host);
  const all=typeof ts.getPreEmitDiagnostics==="function"?ts.getPreEmitDiagnostics(program):[
    ...program.getSyntacticDiagnostics(),...program.getSemanticDiagnostics()
  ];
  const diagnostics=all.filter(d=>!d.file||norm(d.file.fileName)===targetFile).map(d=>({
    source:"typescript",code:`TS${d.code}`,severity:d.category===ts.DiagnosticCategory?.Error?"error":"warning",message:flatten(ts,d.messageText),start:d.start??null,length:d.length??null
  }));
  return {available:true,version:ts.version||"unknown",diagnostics};
}
