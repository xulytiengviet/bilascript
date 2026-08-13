#!/usr/bin/env python3
from pathlib import Path
p=Path('v4/src/typescript-oracle.js')
p.write_text(r'''import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
function flatten(ts,msg){ return ts.flattenDiagnosticMessageText(msg,"\n"); }
export async function analyzeWithTypeScript(jsCode,{fileName="input.js"}={}){
  let ts; try{ ts=require("typescript"); }catch{return {available:false,diagnostics:[],reason:"typescript package not installed"};}
  const opts={allowJs:true,checkJs:true,noEmit:true,target:ts.ScriptTarget.ES2022??ts.ScriptTarget.Latest,module:ts.ModuleKind.ESNext,skipLibCheck:true};
  const base=ts.createCompilerHost(opts); const norm=f=>f.replace(/\\/g,"/"); const target=norm(fileName);
  const host={...base,
    fileExists:f=>norm(f)===target||base.fileExists(f),
    readFile:f=>norm(f)===target?String(jsCode):base.readFile(f),
    getSourceFile:(f,lang,onError,newFile)=>norm(f)===target?ts.createSourceFile(f,String(jsCode),lang,true,ts.ScriptKind.JS):base.getSourceFile(f,lang,onError,newFile)
  };
  const program=ts.createProgram([fileName],opts,host);
  const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>!d.file||norm(d.file.fileName)===target).map(d=>({
    source:"typescript",code:`TS${d.code}`,severity:d.category===ts.DiagnosticCategory.Error?"error":"warning",message:flatten(ts,d.messageText),start:d.start??null,length:d.length??null
  }));
  return {available:true,version:ts.version,diagnostics};
}
''',encoding='utf-8')
print('rewrote TypeScript oracle with createRequire loader')
