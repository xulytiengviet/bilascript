import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {compileStrict,compileLegacy,validateStrictSource,assertVocabularyLock} from "../src/strict.mjs";
import {VOCABULARY_LOCK} from "../src/vocabulary-lock.mjs";
import {JS_PASSTHROUGH} from "../../v4/src/vocabulary.js";

const HEADER="---bila:strict---\n";
const GOOD=HEADER+"haml_sob tong(a,b){ trov_ved a+b; } bilb ds: Magz<Sob>=[1,2]; ds.dayq(3);";

test("frozen lock module exactly matches machine-readable manifest",()=>{
  const manifest=JSON.parse(readFileSync(new URL("../vocabulary-lock.json",import.meta.url),"utf8"));
  assert.deepEqual(manifest,VOCABULARY_LOCK);
  assert.equal(manifest.keywords.length,22);
  assert.equal(manifest.globals.length,8);
  assert.equal(manifest.members.length,24);
  assert.equal(manifest.legacyJsPassThrough.length,11);
  assert.equal(manifest.status,"FROZEN");
  assert.equal(assertVocabularyLock(),true);
});
test("strict emits clean JS and source map without a Bila runtime",()=>{
  const result=compileStrict(GOOD,{sourceMap:true});
  assert.equal(result.strictCVNSS,true);
  assert.match(result.code,/function tong/);
  assert.match(result.code,/ds\.push\(3\)/);
  assert.equal(result.map.version,3);
  assert.doesNotMatch(result.code,/BilaRuntime|BilaArray|__bilaRuntime/);
});
for(const word of Object.keys(JS_PASSTHROUGH)){
  test("strict rejects JS_PASSTHROUGH '"+word+"'",()=>{
    assert.throws(()=>compileStrict(HEADER+"bilb x = "+word+";"),
      e=>e.code==="BILA-CV401"&&e.token.raw===word);
  });
}
for(const word of ["let","const","switch","super","debugger"]){
  test("strict rejects JS reserved word '"+word+"'",()=>{
    assert.throws(()=>compileStrict(HEADER+word+";"),e=>e.code==="BILA-CV402");
  });
}
test("keywords inside strings and comments remain untouched",()=>{
  const r=compileStrict(HEADER+'// async await typeof\nbilb x="async typeof";');
  assert.match(r.code,/async typeof/);
});
test("strict rejects hidden template interpolation",()=>{
  assert.throws(()=>compileStrict(HEADER+"bilb x = "+String.fromCharCode(96)+"hello "+String.fromCharCode(36,123)+"typeof x}"+String.fromCharCode(96)+";"),
    e=>e.code==="BILA-CV403");
});
test("strict requires explicit versioned profile",()=>{
  assert.throws(()=>validateStrictSource("bilb x=1;"),e=>e.code==="BILA-CV400");
});
test("legacy strict still compiles JS passthrough exactly as v4",()=>{
  const src=HEADER+"bilb x=typeof 42;";
  const r=compileLegacy(src);
  assert.equal(r.version,"4.0.0");
  assert.match(r.code,/typeof 42/);
  assert.throws(()=>compileStrict(src),e=>e.code==="BILA-CV401");
});
test("legacy default still compiles English-compatible source",()=>{
  const r=compileLegacy("function f(){ return 7; }");
  assert.match(r.code,/function f/);
});
test("strict keeps receiver-safe alias error BILA-T310",()=>{
  assert.throws(()=>compileStrict(HEADER+"bilb x=unknown(); x.dayq(1);"),/BILA-T310/);
});
test("strict retains canonical CVNSS mapped member",()=>{
  const r=compileStrict(HEADER+"bilb ds: Magz<Sob>=[1]; ds.dayq(2);");
  assert.match(r.code,/ds\.push\(2\)/);
});
