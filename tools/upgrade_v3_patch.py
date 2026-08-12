from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

v = ROOT / 'v3/src/vocabulary.js'
s = v.read_text(encoding='utf-8')
s = s.replace('export const GLOBALS = Object.freeze({', 'export const MAPPED_ENGLISH = new Set(Object.values(KEYWORDS));\n\nexport const GLOBALS = Object.freeze({')
s = s.replace('  if (mode !== "strict" && ENGLISH_KEYWORDS.has(word)) return word;\n  return null;', '  if (mode === "strict") {\n    if (ENGLISH_KEYWORDS.has(word) && !MAPPED_ENGLISH.has(word)) return word;\n    return null;\n  }\n  if (ENGLISH_KEYWORDS.has(word)) return word;\n  return null;')
v.write_text(s, encoding='utf-8')

p = ROOT / 'v3/src/lexer.js'
s = p.read_text(encoding='utf-8')
s = s.replace('import { keywordOf } from "./vocabulary.js";', 'import { keywordOf, MAPPED_ENGLISH } from "./vocabulary.js";')
s = s.replace('      const kw = keywordOf(raw, profile.mode);\n      add(kw ? "keyword" : "identifier", kw || raw, raw, sl, sc);', '      if (profile.mode === "strict" && MAPPED_ENGLISH.has(raw)) {\n        throw new BilaSyntaxError(`Từ khóa English \'${raw}\' bị cấm trong bila:strict; hãy dùng canonical CVNSS4.0`, { line: sl, column: sc });\n      }\n      const kw = keywordOf(raw, profile.mode);\n      add(kw ? "keyword" : "identifier", kw || raw, raw, sl, sc);')
p.write_text(s, encoding='utf-8')
print('patched v3 strict keyword boundary')
