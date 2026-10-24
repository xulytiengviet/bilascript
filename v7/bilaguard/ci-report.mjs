import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {analyzeBilaSource,isDeploymentEligible} from "./guard.mjs";
import {runBilaFuzz,runTargetedFuzz} from "./fuzz.mjs";
const source=readFileSync("v6/contracts/Bila_CVNSS40_Native.bila","utf8");
const analysis=analyzeBilaSource(source);
const fuzz=runBilaFuzz({seed:20261024,programs:12,mutationsPerProgram:12});
const targeted=runTargetedFuzz(source);
const passed=isDeploymentEligible(analysis)&&fuzz.passed&&targeted.passed;
const report={
 schema:"bilaguard.ci.security-evidence.v0.1",
 note:"Compiler/source/static/grammar fuzz, NOT a smart-contract audit or onchain EVM fuzz.",
 profile:analysis.profile,guardVersion:analysis.guard,sourceKeccak256:analysis.sourceKeccak256,
 compiler:analysis.build?.compiler||null,
 sourceSecurity:{accepted:analysis.accepted,issues:analysis.issues,stats:analysis.stats},
 fuzz,targeted,eligibleForUserControlledSepoliaDeployment:passed
};
mkdirSync("v7/test-results",{recursive:true});
writeFileSync("v7/test-results/bilaguard-report.json",JSON.stringify(report,null,2)+"\n");
console.log("BILAGUARD_V01_GATE "+JSON.stringify({
 passed,sourceHash:report.sourceKeccak256,compiler:report.compiler,
 errors:analysis.stats.errors,tests:fuzz.cases,targeted:targeted.mutationCount,
 negativeMutationsCaught:fuzz.expectedInvalidRejected,
 eligibleForUserControlledSepoliaDeployment:passed
}));
if(!passed)process.exitCode=1;
