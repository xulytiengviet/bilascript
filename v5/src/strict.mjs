/**
 * BilaScript 5 alpha: canonical CVNSS4.0 strict frontend.
 * The legacy v4 compiler is intentionally not modified.
 */
import {compile as compileV4, lex as lexV4} from "../../v4/src/compiler.js";
import {KEYWORD_SPECS, JS_PASSTHROUGH, GLOBAL_SPECS, MEMBER_SPECS} from "../../v4/src/vocabulary.js";
import {VOCABULARY_LOCK} from "./vocabulary-lock.mjs";

export const VERSION="5.0.0-alpha.1";
const PROFILE=/^\uFEFF?\s*---bila:strict---\s*(?:\r?\n|$)/;
const JS_RESERVED_EXTRA=new Set([
  "let","const","super","yield","debugger","switch","case","default",
  "with","enum","implements","interface","package","private","protected","public"
]);
const canonical=new Map(VOCABULARY_LOCK.keywords.map(x=>[x.cvnss,x]));
const legacyPassthrough=new Set(VOCABULARY_LOCK.legacyJsPassThrough.map(x=>x.word));
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);

export function assertVocabularyLock(){
  const keys=Object.entries(KEYWORD_SPECS).map(([cvnss,{id,js}])=>({cvnss,id,js}));
  const forbidden=Object.entries(JS_PASSTHROUGH).map(([word,{id,js}])=>({word,id,js}));
  const globals=Object.entries(GLOBAL_SPECS).map(([cvnss,{js,type}])=>({cvnss,js,type}));
  const members=Object.entries(MEMBER_SPECS).map(([cvnss,{js,receivers}])=>({cvnss,js,receivers}));
  if(!same(keys,VOCABULARY_LOCK.keywords)||!same(forbidden,VOCABULARY_LOCK.legacyJsPassThrough)||
     !same(globals,VOCABULARY_LOCK.globals)||!same(members,VOCABULARY_LOCK.members))
    throw new Error("BILA-CV500: Từ vựng v4 thay đổi ngoài vocabulary lock; cần phiên bản lock mới.");
  if(canonical.size!==keys.length||legacyPassthrough.size!==forbidden.length)
    throw new Error("BILA-CV501: Từ khóa bị trùng hoặc thiếu trong frozen vocabulary.");
  if(keys.some(({cvnss})=>legacyPassthrough.has(cvnss)))
    throw new Error("BILA-CV502: Canonical CVNSS xung đột với JS_PASSTHROUGH.");
  return true;
}

function syntaxError(code,token,message){
  const p=token?.start||{};
  const e=new SyntaxError(code+": "+message+(p.line?" tại dòng "+p.line+", cột "+p.column:""));
  e.name="BilaStrictVocabularyError";
  e.code=code;
  e.token=token||null;
  return e;
}

export function validateStrictSource(input){
  assertVocabularyLock();
  const source=String(input);
  if(!PROFILE.test(source))
    throw syntaxError("BILA-CV400",null,
      "Compiler v5 chỉ nhận ---bila:strict---; mã cũ dùng compileLegacy hoặc v4 CLI.");
  const parsed=lexV4(source);
  for(const token of parsed.tokens){
    if(token.type==="keyword"&&
       (token.surface==="javascript-required"||legacyPassthrough.has(token.raw)))
      throw syntaxError("BILA-CV401",token,
        "Từ khóa JavaScript '"+token.raw+"' chưa có alias CVNSS4.0 được phê duyệt.");
    if(token.type==="identifier"&&JS_RESERVED_EXTRA.has(token.raw))
      throw syntaxError("BILA-CV402",token,
        "Từ khóa JS '"+token.raw+"' chưa có biểu diễn CVNSS4.0 được phê duyệt.");
    if(token.type==="template"&&token.raw.includes("$"+"{"))
      throw syntaxError("BILA-CV403",token,
        "Template interpolation chưa biên dịch ngữ nghĩa CVNSS; không cho passthrough.");
  }
  return parsed;
}

export function compileStrict(source,options={}){
  validateStrictSource(source);
  const r=compileV4(source,options);
  return {...r,version:VERSION,strictCVNSS:true,vocabularyLock:VOCABULARY_LOCK.schema};
}
/** Unmodified v4 compile path, including legacy 'bila:strict' passthrough. */
export function compileLegacy(source,options={}){
  return compileV4(source,options);
}
