/** BilaScript v3 canonical vocabulary. MIT License. Copyright (c) 2026 Long Ngo. */
export const KEYWORDS = Object.freeze({
  haml_sob: "function",
  bilb: "var",
  neub: "if",
  kac: "else",
  vil: "for",
  trogp_ki: "while",
  trov_ved: "return",
  moix: "new",
  voy_jaj_trir: "null",
  thatf: "true",
  sai: "false",
  thuv: "try",
  chupr_layb: "catch",
  nemj: "throw",
  cujb_cugl: "finally",
  laml: "do",
  zugk: "break",
  tifb_tucr: "continue"
});

export const ENGLISH_KEYWORDS = new Set([
  "function", "var", "if", "else", "for", "while", "return", "new",
  "null", "true", "false", "try", "catch", "throw", "finally", "do",
  "break", "continue", "typeof", "void", "delete", "in", "instanceof"
]);

export const MAPPED_ENGLISH = new Set(Object.values(KEYWORDS));

export const GLOBALS = Object.freeze({
  Magz: "Array",
  Suh_vatf: "Object",
  Haml_sob: "Function",
  Wayl: "Date",
  mony_Tolj: "Math",
  Chujg: "String",
  Sob: "Number",
  Lalf_lij: "Boolean"
});

export const MEMBERS = Object.freeze({
  dof_zail: "length",
  dayq: "push",
  layb_cujb: "pop",
  sapx_xepb: "sort",
  daoz_wush: "reverse",
  ahj_xar: "map",
  locr: "filter",
  cho_moig: "forEach",
  motf_vail: "some",
  takj: "split",
  chujg_con: "substring",
  kopx: "match",
  timl_civb: "search",
  thay_theb: "replace",
  denb_chujg: "toString",
  goir: "call",
  ap_zugr: "apply",
  waug_nhily: "random",
  laml_tronl: "round",
  cano_bacf_hai: "sqrt",
  jaj_trir_tydf_doib: "abs",
  trand: "ceil",
  sanl: "floor",
  lys_thuak: "pow"
});

export function keywordOf(word, mode = "bila") {
  if (Object.prototype.hasOwnProperty.call(KEYWORDS, word)) return KEYWORDS[word];
  if (mode === "strict") {
    if (ENGLISH_KEYWORDS.has(word) && !MAPPED_ENGLISH.has(word)) return word;
    return null;
  }
  if (ENGLISH_KEYWORDS.has(word)) return word;
  return null;
}
