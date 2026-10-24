import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {analyzeBilaSource,isDeploymentEligible,BILAGUARD_VERSION} from "../bilaguard/guard.mjs";
import {runBilaFuzz,runTargetedFuzz,generateValidSource,injectFault,MUTATIONS} from "../bilaguard/fuzz.mjs";
import {EXAMPLE} from "../../v6/compiler.mjs";
const SOURCE=readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
test("real CVNSS4.0 native contract v6 is validated with independent semantic and EVM gates",()=>{
 const r=analyzeBilaSource(SOURCE);
 assert.equal(r.guard,BILAGUARD_VERSION);
 assert.equal(r.accepted,true,JSON.stringify(r.issues,null,2));
 assert.equal(isDeploymentEligible(r),true);
 assert.equal(r.stats.functions,22);
 assert.equal(r.stats.stateVariables,8);
 assert.equal(r.stats.storageSlots,9);
 assert.equal(r.stats.runtimeBytes,1027);
 assert.equal(r.stats.errors,0);
});
test("legacy aliases accepted by v6 compiler fail v7 strict CVNSS4.0 deployment gate",()=>{
 const r=analyzeBilaSource(EXAMPLE.replaceAll("sob_wyly_kogy_zaub_256","uint256"));
 assert.equal(isDeploymentEligible(r),false);
 assert.ok(r.issues.some(x=>x.code==="LEGACY_ALIAS"));
});
test("hidden directional control blocked including within comments, no auto rewrite",()=>{
 const modified=SOURCE.replace("Bila_CVNSS40_Native","Bila_\u202eCVNSS40_Native");
 const r=analyzeBilaSource(modified);
 assert.equal(isDeploymentEligible(r),false);
 assert.ok(r.issues.some(x=>x.code==="UNICODE_INVISIBLE"));
});
test("unauthorized storage writes, unknown symbols and state slot collision are rejected",()=>{
 const base=generateValidSource(20261024);
 for(const kind of MUTATIONS){
  const s=injectFault(base,kind);
  assert.notEqual(s,base,kind);
  const analyzed=analyzeBilaSource(s);
  assert.equal(isDeploymentEligible(analyzed),false,kind+" "+JSON.stringify(analyzed.issues));
 }
});
test("BilaFuzz deterministic results reproducible, with all 12 grammar/security mutants covered",()=>{
 const a=runBilaFuzz({seed:20261024,programs:12,mutationsPerProgram:12});
 const b=runBilaFuzz({seed:20261024,programs:12,mutationsPerProgram:12});
 assert.deepEqual(a,b);
 assert.equal(a.cases,156);
 assert.equal(a.validAccepted,12);
 assert.equal(a.expectedInvalidRejected,144);
 assert.equal(a.invalidAccepted,0);
 assert.equal(a.passed,true,JSON.stringify(a.failures.slice(0,3)));
});
test("targeted mutation against exact uploaded CVNSS contract detects all injected faults",()=>{
 const r=runTargetedFuzz(SOURCE);
 assert.equal(r.baselineAccepted,true);
 assert.ok(r.mutationCount>=5);
 assert.equal(r.passed,true,JSON.stringify(r.failures));
});
test("invalid program must never enable Sepolia pre-deployment",()=>{
 const bad=SOURCE.replace("cogy_kai chi_chu {","cogy_kai {");
 const r=analyzeBilaSource(bad);
 assert.equal(r.accepted,false);
 assert.equal(isDeploymentEligible(r),false);
});
