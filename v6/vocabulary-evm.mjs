/**
 * BilaScript v6.0.1 CVNSS4.0 EVM vocabulary proposal.
 * Semantic IDs are compiler-internal. Only primary CVNSS words should be used
 * in new sources. Older aliases remain readable, never guessed or auto-decoded.
 * PROVISIONAL: not a new frozen CVNSS4.0 standard.
 */
export const EVM_VOCABULARY=Object.freeze({
  version:"6.0.1",
  profile:"bila:evm",
  status:"PROVISIONAL_UNDER_AUDIT",
  records:Object.freeze([
    Object.freeze({id:"KW_CONTRACT",semantic:"contract",primary:"hoph_dogd",legacy:["hop_dong"]}),
    Object.freeze({id:"KW_FUNCTION",semantic:"function",primary:"haml_sob",legacy:[]}),
    Object.freeze({id:"KW_RETURN",semantic:"return",primary:"trov_ved",legacy:[]}),
    Object.freeze({id:"TYPE_UINT256",semantic:"uint256",primary:"sob_wyly_kogy_zaub_256",legacy:["uint256"]}),
    Object.freeze({id:"VIS_PUBLIC",semantic:"public",primary:"cogy_kai",legacy:["public"]}),
    Object.freeze({id:"EFFECT_VIEW",semantic:"view",primary:"chiz_docr",legacy:["view"]}),
    Object.freeze({id:"RETURNS_UINT256",semantic:"returns",primary:"traz_ved",legacy:["returns"]}),
    Object.freeze({id:"ACCESS_OWNER",semantic:"owner_only",primary:"chi_chu",legacy:[]})
  ])
});
export function makeVocabularyIndex(){
  const out=Object.create(null),idSet=new Set();
  for(const r of EVM_VOCABULARY.records){
    if(idSet.has(r.id))throw Error("Duplicate CVNSS semantic ID "+r.id);
    idSet.add(r.id);
    for(const alias of [r.primary,...r.legacy]){
      if(Object.prototype.hasOwnProperty.call(out,alias))
        throw Error("Collision in CVNSS4.0 EVM aliases: "+alias);
      out[alias]=r.semantic;
    }
  }
  return Object.freeze(out);
}
export const EVM_KEYWORDS=makeVocabularyIndex();
export const EVM_RESERVED=new Set([
  "contract","function","return","uint256","public","view","returns","owner_only","address"
]);
