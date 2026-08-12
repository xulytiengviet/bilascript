#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def patch(path, old, new):
    p = ROOT / path
    s = p.read_text(encoding="utf-8")
    if new in s:
        return
    if old not in s:
        raise RuntimeError("patch marker missing: " + path)
    p.write_text(s.replace(old, new, 1), encoding="utf-8", newline="\n")


patch(
    "src/org/mozilla/javascript/BabylTokenizer.java",
    "    static Map<String, Integer> englishKeywordLookup;",
    "    // Native Bila mode prefers CVNSS4.0 aliases but accepts original ECMAScript\n"
    "    // keywords as a compatibility/fallback layer.\n"
    "    protected static Map<String, Integer> englishKeywordLookup;",
)

patch(
    "src/org/mozilla/javascript/babylscript/BabylGenericTokenizer.java",
    """        return new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n    }\n\n    public static BabylTokenizer createBengaliTokenizer""",
    """        BabylGenericTokenizer tokenizer = new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n        // CVNSS4.0 is canonical. English remains a fallback for unmapped terms,\n        // migrations from v1.0.0, and parser-safe collision cases.\n        tokenizer.keywordLookup.putAll(englishKeywordLookup);\n        return tokenizer;\n    }\n\n    public static BabylTokenizer createBengaliTokenizer""",
)

print("BilaScript v1.2.0 compatibility fallback applied")
