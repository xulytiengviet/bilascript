import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {EXERCISES,CATEGORIES} from "../examples.mjs";
import {compileStrict} from "../src/strict.mjs";

test("exactly 50 CVNSS4.0 exercises in five balanced categories",()=>{
  assert.equal(EXERCISES.length,50);
  assert.equal(CATEGORIES.length,5);
  assert.equal(new Set(EXERCISES.map(x=>x.id)).size,50);
  assert.equal(new Set(EXERCISES.map(x=>x.title)).size,50);
  for(const category of CATEGORIES) assert.equal(EXERCISES.filter(x=>x.category===category).length,10);
});
for(const example of EXERCISES){
  test("bài "+String(example.id).padStart(2,"0")+" · "+example.title,()=>{
    assert.ok(example.code.startsWith("---bila:strict---\n"));
    assert.match(example.code,/haml_sob bai\(\)/);
    const result=compileStrict(example.code,{sourceMap:true});
    assert.equal(result.strictCVNSS,true);
    assert.ok(result.performance.zeroCost,"No Bila runtime helper allowed");
    assert.equal(result.map.version,3);
    const answer=vm.runInNewContext(result.code+"\nbai()",Object.create(null),{timeout:400});
    // Serializes cross-realm arrays as JSON without changing numeric/string values.
    assert.equal(JSON.stringify(answer),JSON.stringify(example.expected),
      "Kết quả khác mong đợi: "+JSON.stringify(answer));
  });
}
