/**
 * BilaGuard v0.1 deterministic grammar/semantic mutation fuzzing.
 * SOURCE/compiler fuzz only, not live EVM transaction fuzz.
 */
import {analyzeBilaSource,isDeploymentEligible} from "./guard.mjs";
const uint="sob_wyly_kogy_zaub_256",fn="haml_sob",pub="cogy_kai",own="chi_chu",view="chiz_docr",ret="traz_ved",returnWord="trov_ved";
function rng(seed){let n=seed>>>0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
function choose(r,n){return Math.floor(r()*n);}
export function generateValidSource(seed){
 const rand=rng(seed),n=2+choose(rand,3);
 let lines=["hoph_dogd Chz_Nghiem_"+(seed>>>0)+" {"];
 for(let i=0;i<n;i++)lines.push("  "+uint+" gia_tri_"+i+";");
 for(let i=0;i<n;i++){
  const v="gia_tri_"+i;
  lines.push("  "+fn+" ghi_"+i+"("+uint+" dau_vao_"+i+") "+pub+" "+own+" { "+v+" = dau_vao_"+i+"; }");
  lines.push("  "+fn+" doc_"+i+"() "+pub+" "+view+" "+ret+"("+uint+") { "+returnWord+" "+v+"; }");
  lines.push("  "+fn+" tang_"+i+"() "+pub+" "+own+" { "+v+" = "+v+" + 1; }");
 }
 lines.push("}");
 return lines.join("\n");
}
export function injectFault(source,kind){
 const first="gia_tri_0",p="dau_vao_0";
 switch(kind){
  case "unguarded-write":return source.replace(" "+pub+" "+own+" { "+first+" = "+p+"; }",
   " "+pub+" { "+first+" = "+p+"; }");
  case "view-write":return source.replace(pub+" "+own+" { "+first+" = "+p+"; }",
   pub+" "+view+" { "+first+" = "+p+"; }");
  case "missing-variable":return source.replace(first+" = "+p+";","gia_tri_khong_ton_tai = "+p+";");
  case "storage-collision":return source.replace("  "+uint+" gia_tri_1;",
   "  "+uint+" gia_tri_0;");
  case "overflow-semantics":return source.replace(first+" = "+first+" + 1;",first+" = "+first+" + 2;");
  case "legacy-syntax":return source.replaceAll(uint,"uint256");
  case "unicode-invisible":return source.replace("ghi_0","ghi_\u200B0");
  case "foreign-keyword":return source.replace("hoph_dogd","contract");
  case "unknown-type":return source.replace(uint,"address");
  case "bad-literal":return source.replace(first+" = "+first+" + 1;",first+" = "+first+" + 999;");
  case "duplicate-function":return source.replace("ghi_1","ghi_0");
  case "multiple-statements":return source.replace(first+" = "+p+";",
   first+" = "+p+"; "+first+" = "+p+";");
  default:throw Error("Unknown mutation type: "+kind);
 }
}
export const MUTATIONS=Object.freeze([
 "unguarded-write","view-write","missing-variable","storage-collision",
 "overflow-semantics","legacy-syntax","unicode-invisible","foreign-keyword",
 "unknown-type","bad-literal","duplicate-function","multiple-statements"
]);
export function runBilaFuzz({seed=20261024,programs=12,mutationsPerProgram=5}={}){
 if(!Number.isInteger(seed)||seed<0||!Number.isInteger(programs)||programs<1||programs>128||
   !Number.isInteger(mutationsPerProgram)||mutationsPerProgram<1||mutationsPerProgram>12)
  throw Error("Seed/programs/mutations nằm ngoài giới hạn BilaGuard");
 const failures=[],samples=[];
 let validPassed=0,rejected=0,invalidAccepted=0;
 for(let i=0;i<programs;i++){
  const subSeed=(seed+i*2654435761)>>>0;
  const valid=generateValidSource(subSeed),ok=analyzeBilaSource(valid);
  if(!isDeploymentEligible(ok)){
   failures.push({case:"valid-program-rejected",seed:subSeed,source:valid,issues:ok.issues});
  }else validPassed++;
  for(let j=0;j<mutationsPerProgram;j++){
   const kind=MUTATIONS[(i*mutationsPerProgram+j)%MUTATIONS.length];
   const mutant=injectFault(valid,kind);
   if(mutant===valid){
    failures.push({case:"mutation-not-applied",seed:subSeed,mutation:kind,source:valid});continue;
   }
   const verdict=analyzeBilaSource(mutant);
   if(isDeploymentEligible(verdict)){
    invalidAccepted++;
    failures.push({case:"dangerous-mutation-accepted",seed:subSeed,
      mutation:kind,source:mutant,issues:verdict.issues});
   }else{
    rejected++;
    if(samples.length<15)samples.push({seed:subSeed,mutation:kind,
      firstDetection:verdict.issues.find(x=>x.severity==="error")?.code||"COMPILER_REJECTED"});
   }
  }
 }
 const total=programs*mutationsPerProgram;
 return {
  schema:"bilaguard.deterministic.fuzz.v0.1",seed,programs,mutationsPerProgram,cases:programs+total,
  validAccepted:validPassed,expectedInvalidRejected:rejected,
  invalidAccepted,totalExpectedInvalid:total,
  passed:validPassed===programs&&rejected===total&&failures.length===0,
  scope:"Source/grammar/semantic/static compiler mutation fuzz only. No live EVM state transitions or formal proof.",
  samples,failures
 };
}

/** Mutation tests against EXACT user source. Each applicable mutation must be rejected. */
export function runTargetedFuzz(source){
 const baseline=analyzeBilaSource(source);
 const candidates=[
  ["replace-contract-keyword",source.replace(/hoph_dogd(?=\\s+[a-zA-Z_][a-zA-Z_0-9]*\\s*\\{)/,"contract")],
  ["replace-cvnss-type",source.replace(/sob_wyly_kogy_zaub_256(?=\\s+[a-zA-Z_][a-zA-Z_0-9]*\\s*;)/,"uint256")],
  ["insert-bidi-override",source.replace(/hoph_dogd(?=\\s+[a-zA-Z_][a-zA-Z_0-9]*\\s*\\{)/,"hoph\u202Edogd")],
  ["remove-first-owner-guard",source.replace("cogy_kai chi_chu","cogy_kai")],
  ["replace-first-public",source.replace("cogy_kai","public")],
  ["inject-unknown-op",source.replace(/hoph_dogd(?=\\s+[a-zA-Z_][a-zA-Z_0-9]*\\s*\\{)/,"foo_keyword hoph_dogd")]
 ];
 const cases=[],failures=[];
 for(const [mutation,mutant] of candidates){
  if(mutant===source)continue;
  const analysis=analyzeBilaSource(mutant);
  const caught=!isDeploymentEligible(analysis);
  cases.push({mutation,caught,detector:analysis.issues.find(x=>x.severity==="error")?.code||null});
  if(!caught)failures.push({mutation,source:mutant,issues:analysis.issues});
 }
 return {schema:"bilaguard.targeted-mutations.v0.1",baselineAccepted:isDeploymentEligible(baseline),
  mutationCount:cases.length,caught:cases.filter(x=>x.caught).length,
  passed:isDeploymentEligible(baseline)&&cases.length>=4&&failures.length===0,
  cases,failures,scope:"Targeted negative compiler/source mutations. Not EVM runtime execution."};
}
