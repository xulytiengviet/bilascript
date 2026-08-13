
import test from "node:test"; import assert from "node:assert/strict"; import vm from "node:vm"; import { compile } from "../src/compiler.js";
function run(code){const logs=[];vm.runInNewContext(code,{console:{log:x=>logs.push(String(x))},Promise});return logs;}
const positive=[
 [`bilb ds: Magz<Sob>=[1,2]; ds.dayq(3); console.log(ds.dof_zail);`,["3"]],
 [`bilb s: Chujg="abc"; console.log(s.dof_zail);`,["3"]],
 [`haml_sob f(a: Sob): Sob { trov_ved a*2; } console.log(f(4));`,["8"]],
 [`bilb f=x=>x+1; console.log(f(9));`,["10"]],
 [`bilb obj={}; console.log(obj?.x ?? 7);`,["7"]]
];
for(const [src,expected] of positive)test(`conformance positive: ${src.slice(0,28)}`,()=>{const r=compile(`---bila:strict---\n${src}`);assert.deepEqual(run(r.code),expected);assert.equal(r.performance.zeroCost,true);});
const negatives=[`bilb x=unknown(); x.dayq(1);`,`bilb x=unknown(); x.dof_zail;`,`bilb x: Sob="bad";`];
for(const src of negatives)test(`conformance negative: ${src.slice(0,28)}`,()=>assert.throws(()=>compile(`---bila:strict---\n${src}`),/BILA-T/));
test("operator differential corpus preserves JavaScript semantics",()=>{let seed=1337;const rnd=()=>((seed=(seed*1103515245+12345)>>>0)%97)+1;for(let i=0;i<100;i++){const a=rnd(),b=rnd(),c=rnd();const expr=`((${a} + ${b}) * ${c}) % 97`;const bila=compile(`---bila:strict---\nbilb x=${expr}; console.log(x);`).code;const js=`var x=${expr}; console.log(x);`;assert.deepEqual(run(bila),run(js));}});
test("zero-helper audit on representative corpus",()=>{for(const [src] of positive){const r=compile(`---bila:strict---\n${src}`);assert.doesNotMatch(r.code,/BilaRuntime|BilaArray|__bila|Proxy\s*\(/);}});
test("source map remains build-time metadata",()=>{const r=compile(`---bila:strict---\nbilb x=1;`,{sourceMap:true,sourceName:"x.bila",fileName:"x.js"});assert.equal(r.map.version,3);assert.deepEqual(r.map.sources,["x.bila"]);});
