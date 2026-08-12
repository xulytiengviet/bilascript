#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8", newline="\n")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError("%s: expected exactly one match, got %d" % (label, count))
    return text.replace(old, new, 1)


def upgrade_token_stream():
    path = "src/org/mozilla/javascript/TokenStream.java"
    s = read(path)
    if "LanguageMode.bila" in s:
        return
    s = replace_once(s, "        bn,\n        de,", "        bn,\n        bila,\n        de,", path + " enum")
    s = replace_once(
        s,
        "        else if (\"bn\".equals(str))\n            return LanguageMode.bn;\n        else if (\"de\".equals(str))",
        "        else if (\"bn\".equals(str))\n            return LanguageMode.bn;\n        else if (\"bila\".equals(str) || \"cvss\".equals(str) || \"cvnss\".equals(str) || \"cvnss40\".equals(str) || \"cvnss4\".equals(str))\n            return LanguageMode.bila;\n        else if (\"de\".equals(str))",
        path + " stringToLanguageMode",
    )
    s = replace_once(
        s,
        "        case bn:\n            return \"bn\";\n        case de:",
        "        case bn:\n            return \"bn\";\n        case bila:\n            return \"bila\";\n        case de:",
        path + " languageModeToString",
    )
    s = replace_once(
        s,
        "        case bn:\n            currentTokenizer = BabylGenericTokenizer.createBengaliTokenizer(parser, in, this);\n            break;\n        case de:",
        "        case bn:\n            currentTokenizer = BabylGenericTokenizer.createBengaliTokenizer(parser, in, this);\n            break;\n        case bila:\n            currentTokenizer = BabylGenericTokenizer.createBilaTokenizer(parser, in, this);\n            break;\n        case de:",
        path + " setLanguage",
    )
    write(path, s)


def upgrade_babyl_tokenizer():
    path = "src/org/mozilla/javascript/BabylTokenizer.java"
    s = read(path)
    if 'languageModeCodes.put("bila"' in s:
        return
    s = replace_once(
        s,
        '        languageModeCodes.put("ar", TokenStream.LanguageMode.ar);\n        languageModeCodes.put("de", TokenStream.LanguageMode.de);',
        '        languageModeCodes.put("ar", TokenStream.LanguageMode.ar);\n        // BilaScript v1.2.0: native CVNSS4.0 language mode.\n        languageModeCodes.put("bila", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("cvss", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("cvnss", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("cvnss40", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("cvnss4", TokenStream.LanguageMode.bila);\n        languageModeCodes.put("de", TokenStream.LanguageMode.de);',
        path + " language mode codes",
    )
    write(path, s)


def upgrade_generic_tokenizer():
    path = "src/org/mozilla/javascript/babylscript/BabylGenericTokenizer.java"
    s = read(path)
    if "createBilaTokenizer" in s:
        return
    s = replace_once(
        s,
        "import org.mozilla.javascript.TokenStream;\n",
        "import org.mozilla.javascript.TokenStream;\nimport org.mozilla.javascript.babylscript.gen.Cvnss40;\n",
        path + " import",
    )
    marker = "    public static BabylTokenizer createBengaliTokenizer(ParserErrorReportingBase p, TokenCharStream in, TokenStream ts)\n"
    factory = "    /** Native BilaScript/CVNSS4.0 tokenizer (v1.2.0). */\n    public static BabylTokenizer createBilaTokenizer(ParserErrorReportingBase p, TokenCharStream in, TokenStream ts)\n    {\n        return new BabylGenericTokenizer(p,\n                in,\n                ts,\n                new BabylTokenizer.DecimalNumberReader(),\n                Cvnss40.keywordMap());\n    }\n\n"
    if marker not in s:
        raise RuntimeError(path + ": factory insertion marker not found")
    s = s.replace(marker, factory + marker, 1)
    write(path, s)


def upgrade_translated_bindings():
    path = "src/org/mozilla/javascript/babylscript/TranslatedNameBindings.java"
    s = read(path)
    if 'LanguageMode.bila' in s:
        return
    s = replace_once(
        s,
        "import org.mozilla.javascript.babylscript.gen.Keywords;\n",
        "import org.mozilla.javascript.babylscript.gen.Cvnss40;\nimport org.mozilla.javascript.babylscript.gen.Keywords;\n",
        path + " import",
    )
    s = replace_once(
        s,
        '        EquivalentLanguageNames.put("id", new String[] {"id", "ms"});',
        '        // BilaScript names are aliases of one native language mode.\n        String [] bilaNames = new String[] {"bila", "cvss", "cvnss", "cvnss40", "cvnss4"};\n        EquivalentLanguageNames.put("bila", bilaNames);\n        EquivalentLanguageNames.put("cvss", bilaNames);\n        EquivalentLanguageNames.put("cvnss", bilaNames);\n        EquivalentLanguageNames.put("cvnss40", bilaNames);\n        EquivalentLanguageNames.put("cvnss4", bilaNames);\n\n        EquivalentLanguageNames.put("id", new String[] {"id", "ms"});',
        path + " equivalent names",
    )
    s = replace_once(
        s,
        "        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.en), arrayToMap(Objects.en));\n",
        "        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.en), arrayToMap(Objects.en));\n        langResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila), Cvnss40.objectMap());\n",
        path + " object map",
    )
    s = replace_once(
        s,
        "        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.en), arrayToMap(Keywords.en));\n",
        "        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.en), arrayToMap(Keywords.en));\n        keywordResourceMap.put(TokenStream.languageModeToString(LanguageMode.bila), Cvnss40.keywordMap());\n",
        path + " keyword map",
    )
    write(path, s)


def upgrade_cvnss_table():
    path = "src/org/mozilla/javascript/babylscript/gen/Cvnss40.java"
    s = read(path)
    if 'VERSION = "1.2.0"' in s:
        return
    s = replace_once(
        s,
        '    public static final String LANGUAGE_CODE = "cvss";\n',
        '    public static final String VERSION = "1.2.0";\n    public static final String LANGUAGE_CODE = "bila";\n    public static final String LEGACY_LANGUAGE_CODE = "cvss";\n',
        path + " version/language",
    )
    old_keyword_tail = '''    public static Map<String, String> keywordMap()\n    {\n        Map<String, String> map = arrayToMap(RAW_KEYWORDS);\n        map.put("throws", "throws");\n        map.put("final", "final");\n        return map;\n    }\n\n    public static Map<String, String> objectMap()\n    {\n        return arrayToMap(OBJECTS);\n    }'''
    new_keyword_tail = '''    public static Map<String, String> keywordMap()\n    {\n        Map<String, String> map = arrayToMap(RAW_KEYWORDS);\n\n        // BilaScript v1.2.0 semantic CVNSS4.0 overrides.  RAW_KEYWORDS stays\n        // unchanged for audit/back-reference to the original workbook.\n        map.put("var", "bilb");                 // biến\n        map.put("int", "sob_wyly");             // số nguyên\n        map.put("char", "cij_tuh");             // ký tự\n        map.put("enum", "lidf_cey");             // liệt kê\n        map.put("long", "sob_zail");             // số dài\n        map.put("float", "sob_thuch");           // số thực\n        map.put("double", "sob_thuch_cep");      // số thực kép\n        map.put("boolean", "lalf_lij");          // luận lý\n        map.put("public", "cogy_kai");           // công khai\n        map.put("private", "rizy_tuo");          // riêng tư\n        map.put("extends", "mov_rogf");           // mở rộng\n        map.put("volatile", "kaz_bilb");         // khả biến\n        map.put("implements", "thuch_thi");      // thực thi\n        map.put("import", "nhapf");              // nhập\n        map.put("export", "xadb");               // xuất\n        map.put("package", "goij");              // gói\n\n        // These two source aliases collide in the supplied table.  Keeping the\n        // inactive Java-reserved forms in English preserves ECMAScript parsing.\n        map.put("throws", "throws");\n        map.put("final", "final");\n        return map;\n    }\n\n    public static Map<String, String> objectMap()\n    {\n        Map<String, String> map = arrayToMap(OBJECTS);\n\n        // Safe semantic aliases generated/checked against the CVNSS4.0\n        // audit-safe converter. Existing workbook aliases remain the fallback.\n        map.put("callee", "haml_dush_goir");\n        map.put("length", "dof_zail");\n        map.put("arity", "sob_tham_sob");\n        map.put("constructor", "bof_taor");\n        map.put("toString", "denb_chujg");\n        map.put("toSource", "denb_wuld");\n        map.put("apply", "ap_zugr");\n        map.put("call", "goir");\n        map.put("toLocaleString", "denb_chujg_vugl");\n        map.put("hasOwnProperty", "coj_thusf_tihj_rizy");\n        map.put("propertyIsEnumerable", "thusf_tihj_coj_theq_lidf_cey");\n        map.put("isPrototypeOf", "lal_wyly_maug_cuaz");\n        map.put("__defineGetter__", "__dihr_wias_bof_layb__");\n        map.put("__defineSetter__", "__dihr_wias_bof_dath__");\n        map.put("__lookupGetter__", "__tra_bof_layb__");\n        map.put("__lookupSetter__", "__tra_bof_dath__");\n        map.put("ConversionError", "Loig_chylq_doiq");\n        map.put("EvalError", "Loig_dahj_jaj");\n        map.put("RangeError", "Loig_famr_vi");\n        map.put("ReferenceError", "Loig_tham_chiwb");\n        map.put("TypeError", "Loig_ciwq");\n        map.put("URIError", "Loig_URI");\n        map.put("JavaException", "Loig_Java");\n        map.put("isFinite", "huuw_hanr");\n        map.put("isNaN", "kogy_faiz_sob");\n        map.put("parseFloat", "fany_tikj_sob_thuch");\n        map.put("parseInt", "fany_tikj_sob_wyly");\n        map.put("join", "noib");\n        map.put("sort", "sapx_xepb");\n        map.put("pop", "layb_cujb");\n        map.put("shift", "zikr");\n        map.put("unshift", "boz_zikr");\n        map.put("concat", "gep");\n        map.put("slice", "catx_lat");\n        map.put("indexOf", "chiz_mucr_cuaz");\n        map.put("lastIndexOf", "chiz_mucr_cujb_cuaz");\n        map.put("map", "ahj_xar");\n        map.put("some", "motf_vail");\n        map.put("fromCharCode", "tuk_mas_cij_tuh");\n        map.put("charAt", "cij_tuh_tair");\n        map.put("charCodeAt", "mas_cij_tuh_tair");\n        map.put("split", "takj");\n        map.put("toLowerCase", "denb_chuw_thuzk");\n        map.put("toUpperCase", "denb_chuw_hoa");\n        map.put("equalsIgnoreCase", "bagk_nhau_boz_qa_hoa_thuzk");\n        map.put("localeCompare", "so_sahj_vugl");\n        map.put("MAX_VALUE", "jaj_trir_lonx_nhatb");\n        map.put("MIN_VALUE", "jaj_trir_nhoz_nhatb");\n        map.put("toFixed", "denb_cob_dihr");\n        map.put("toExponential", "denb_sob_mus");\n        map.put("toPrecision", "denb_dof_chihj_xac");\n        map.put("now", "thoik_jan_hilf_tair");\n        map.put("getYear", "layb_namo");\n        map.put("getFullYear", "layb_namo_dayd_duz");\n        map.put("getMonth", "layb_thagj");\n        map.put("getDate", "layb_wayl");\n        map.put("getDay", "layb_thux");\n        map.put("getHours", "layb_jok");\n        map.put("getMinutes", "layb_fut");\n        map.put("getSeconds", "layb_jayy");\n        map.put("getMilliseconds", "layb_mili_jayy");\n        map.put("getTimezoneOffset", "dof_lekf_muij_jok");\n        map.put("setMilliseconds", "dath_mili_jayy");\n        map.put("setSeconds", "dath_jayy");\n        map.put("setMinutes", "dath_fut");\n        map.put("setHours", "dath_jok");\n        map.put("setMonth", "dath_thagj");\n        map.put("setFullYear", "dath_namo_dayd_duz");\n        map.put("abs", "jaj_trir_tydf_doib");\n        map.put("ceil", "trand");\n        map.put("floor", "sanl");\n        map.put("pow", "lys_thuak");\n        map.put("random", "waug_nhily");\n        map.put("round", "laml_tronl");\n        map.put("sqrt", "cano_bacf_hai");\n        map.put("next", "tifb_theo");\n        map.put("prefix", "tild_tob");\n        map.put("show", "hilq_thir");\n        return map;\n    }'''
    s = replace_once(s, old_keyword_tail, new_keyword_tail, path + " maps")
    write(path, s)


def upgrade_runner():
    path = "babylrunner/Runner.java"
    s = read(path)
    if "---bila---" in s and "---test---" not in s:
        return
    s = s.replace("BilaScript exposes CVNSS4.0 source blocks with ---cvss--- (plus aliases\n * ---cvnss--- and ---cvnss40---). Babylscript's original custom-language\n * channel is internally named \"test\"; this runner normalizes the public\n * CVNSS4.0 directive to that channel before parsing.",
                  "BilaScript v1.2.0 exposes the native ---bila--- language mode.\n * Legacy ---cvss---/---cvnss--- directives remain accepted as compatibility\n * aliases and normalize to the same native LanguageMode.bila.")
    s = s.replace("        cx.setCustomTokenizerConfig(createCvnssTokenizerConfig());\n", "")
    s = s.replace("            cx.initCustomLanguageObjectTranslations(scope, Cvnss40.objectMap());\n", "")
    start = s.find("    private static CustomTokenizerConfig createCvnssTokenizerConfig()")
    end = s.find("    private static String normalizeCvnssDirectives", start)
    if start >= 0 and end >= 0:
        s = s[:start] + s[end:]
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvss---(\\\\s*)$", "$1---test---$2")', '.replaceAll("(?m)^(\\\\s*)---cvss---(\\\\s*)$", "$1---bila---$2")')
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvnss---(\\\\s*)$", "$1---test---$2")', '.replaceAll("(?m)^(\\\\s*)---cvnss---(\\\\s*)$", "$1---bila---$2")')
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvnss40---(\\\\s*)$", "$1---test---$2")', '.replaceAll("(?m)^(\\\\s*)---cvnss40---(\\\\s*)$", "$1---bila---$2")')
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvnss4---(\\\\s*)$", "$1---test---$2");', '.replaceAll("(?m)^(\\\\s*)---cvnss4---(\\\\s*)$", "$1---bila---$2");')
    s = s.replace("// Public BilaScript aliases -> Babylscript custom-language channel.", "// Legacy aliases -> native BilaScript language mode.")
    s = s.replace("Dung ---cvss--- de bat che do CVNSS4.0 trong ma nguon.", "Dung ---bila--- de bat BilaScript CVNSS4.0 (---cvss--- van la alias).")
    s = s.replace("import org.mozilla.javascript.babylscript.CustomTokenizerConfig;\n", "")
    s = s.replace("import org.mozilla.javascript.babylscript.gen.Cvnss40;\n", "")
    write(path, s)


def upgrade_babyl2js():
    path = "babylrunner/Babyl2JS.java"
    s = read(path)
    if 'put("bila"' in s and "---test---" not in s:
        return
    s = s.replace("private static CustomTokenizerConfig createCvnssTokenizerConfig()", "private static CustomTokenizerConfig createCvnssTokenizerConfig()")
    # Keep the helper for source compatibility, but native mode no longer consumes it.
    s = s.replace('TranslatedNameBindings.keywordResourceMap.put("test", Cvnss40.keywordMap());', 'TranslatedNameBindings.keywordResourceMap.put("bila", Cvnss40.keywordMap());')
    s = s.replace('TranslatedNameBindings.langResourceMap.put("test", Cvnss40.objectMap());', 'TranslatedNameBindings.langResourceMap.put("bila", Cvnss40.objectMap());')
    s = s.replace("        cx.setCustomTokenizerConfig(createCvnssTokenizerConfig());\n", "")
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvss---(\\\\s*)$", "$1---test---$2")', '.replaceAll("(?m)^(\\\\s*)---cvss---(\\\\s*)$", "$1---bila---$2")')
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvnss---(\\\\s*)$", "$1---test---$2")', '.replaceAll("(?m)^(\\\\s*)---cvnss---(\\\\s*)$", "$1---bila---$2")')
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvnss40---(\\\\s*)$", "$1---test---$2")', '.replaceAll("(?m)^(\\\\s*)---cvnss40---(\\\\s*)$", "$1---bila---$2")')
    s = s.replace('.replaceAll("(?m)^(\\\\s*)---cvnss4---(\\\\s*)$", "$1---test---$2");', '.replaceAll("(?m)^(\\\\s*)---cvnss4---(\\\\s*)$", "$1---bila---$2");')
    s = s.replace("Tep dau vao phai o UTF-8. Dung ---cvss--- cho khoi CVNSS4.0.", "Tep dau vao phai o UTF-8. Dung ---bila--- cho BilaScript CVNSS4.0.")
    write(path, s)


def create_sample_and_docs():
    sample = '''---bila---\n\nhaml_sob chao(ten) {\n    neub (ten == voy_jaj_trir) {\n        trov_ved "Xin chaol BilaScript v1.2.0!";\n    } kac {\n        trov_ved "Xin chaol " + ten;\n    }\n}\n\nbilb danh_sach = moix Magz("BilaScript", "CVNSS4.0");\ndanh_sach.dayq("Native bila");\njava.lang.System.out.println(chao(danh_sach[0]));\njava.lang.System.out.println(chao(danh_sach[1]));\njava.lang.System.out.println("Dof zail: " + danh_sach.dof_zail);\n'''
    write("babylrunner/sample.bila.js", sample)

    doc = '''# BilaScript v1.2.0 — Native `---bila---` CVNSS4.0\n\nBilaScript v1.2.0 chuyển lớp CVNSS4.0 từ custom channel lịch sử của Babylscript thành một **language mode native** trong Rhino/Babylscript fork này.\n\n## Chỉ thị chính\n\n```text\n---bila---\n```\n\nCác chỉ thị cũ `---cvss---`, `---cvnss---`, `---cvnss40---`, `---cvnss4---` vẫn được nhận để tương thích ngược, nhưng tất cả cùng ánh xạ về `LanguageMode.bila`.\n\n## Pipeline v1.2.0\n\n```text\n*.bila.js\n   ↓\n---bila---\n   ↓\nTokenStream.LanguageMode.bila\n   ↓\nBabylGenericTokenizer.createBilaTokenizer()\n   ↓\nCvnss40.keywordMap()\n   ↓\nRhino Parser / Interpreter\n   ↓\nTranslatedNameBindings[\"bila\"]\n   ↓\nJavaScript / HTML\n```\n\n## Quy tắc “CVNSS4.0 tối đa, ECMAScript an toàn”\n\n- Từ khóa, từ dành riêng và API chuẩn mà có ánh xạ CVNSS4.0 duy nhất/an toàn được dùng bằng CVNSS4.0.\n- Các alias có nguy cơ va chạm parser giữ dạng gốc. Hai trường hợp đã biết là `throws` và `final`, vì dữ liệu nguồn trùng alias với `throw` và `finally`.\n- Các thuật ngữ toán học/quốc tế hoặc API không có bản chuyển an toàn có thể giữ nguyên.\n- Identifier do người dùng đặt (tên biến, tên hàm, tên lớp logic) được phép viết trực tiếp theo CVNSS4.0. Engine không tự ý đổi tên identifier tùy ý vì việc đó có thể phá liên kết scope/property.\n\n## Ví dụ\n\n```javascript\n---bila---\n\nhaml_sob tong(a, b) {\n    trov_ved a + b;\n}\n\nbilb cetb_qaz = tong(10, 20);\njava.lang.System.out.println(cetb_qaz);\n```\n\nTrong đó `bilb` là alias v1.2.0 cho `var` (từ “biến” → CVNSS4.0), còn tên `cetb_qaz` là identifier CVNSS4.0 do lập trình viên đặt.\n\n## Phạm vi “toàn diện”\n\n“Toàn diện” ở v1.2.0 nghĩa là bề mặt ngôn ngữ **mà Rhino 1.7R2/Babylscript hiện thực sự hỗ trợ**: lexer, từ khóa, built-in objects, properties/methods và compiler Babyl2JS. Đây không phải lời khẳng định hỗ trợ toàn bộ ECMAScript 2026/Node.js/TypeScript.\n'''
    write("docs/BILASCRIPT_LANGUAGE_v1.2.0.md", doc)


def upgrade_ci():
    path = ".github/workflows/bilascript-ci.yml"
    s = read(path)
    s = s.replace("name: BilaScript CVNSS4.0 CI", "name: BilaScript v1.2.0 Native CI")
    s = s.replace("Run CVNSS4.0 smoke test", "Run native ---bila--- smoke test")
    s = s.replace("Translate CVNSS4.0 to JavaScript and HTML", "Translate native BilaScript to JavaScript and HTML")
    s = s.replace("babylrunner/sample.cvss.js", "babylrunner/sample.bila.js")
    s = s.replace("sample.cvss.compiled.js", "sample.bila.compiled.js")
    s = s.replace("sample.cvss.html", "sample.bila.html")
    s = s.replace('grep -F "Xin chaol CVNSS4.0" build/runner-output.txt', 'grep -F "Xin chaol CVNSS4.0" build/runner-output.txt\n          grep -F "Dof zail: 3" build/runner-output.txt')
    s = s.replace("if (-not ($output -match 'Xin chaol CVNSS4.0')) { throw 'Missing CVNSS4.0 smoke-test output' }", "if (-not ($output -match 'Xin chaol CVNSS4.0')) { throw 'Missing CVNSS4.0 smoke-test output' }\n          if (-not ($output -match 'Dof zail: 3')) { throw 'Native translated Array.length failed' }")
    # Compiler output must now identify the native language as 'bila'.
    s = s.replace('grep -F "function" build/sample.bila.compiled.js', 'grep -F "function" build/sample.bila.compiled.js\n          grep -F "bila" build/sample.bila.compiled.js')
    write(path, s)


def upgrade_readme():
    path = "README.md"
    s = read(path)
    s = s.replace("Release v1.0.0", "Release v1.2.0")
    s = s.replace("release-v1.0.0-blue", "release-v1.2.0-blue")
    s = s.replace("/releases/tag/v1.0.0", "/releases/tag/v1.2.0")
    intro = '''\n## 🚀 BilaScript v1.2.0 — Native Bila Mode\n\nTừ v1.2.0, chỉ thị chuẩn là **`---bila---`** và được lexer nhận bằng `TokenStream.LanguageMode.bila` thực sự. `---cvss---`, `---cvnss---`, `---cvnss40---`, `---cvnss4---` chỉ còn là alias tương thích ngược. Từ khóa/API được CVNSS4.0 hóa tối đa theo nguyên tắc parser-safe; mục nào không thể chuyển duy nhất/an toàn thì giữ tên gốc. Xem `docs/BILASCRIPT_LANGUAGE_v1.2.0.md`.\n\nVí dụ:\n\n```javascript\n---bila---\n\nhaml_sob tong(a, b) {\n    trov_ved a + b;\n}\n\nbilb cetb_qaz = tong(10, 20);\n```\n\n---\n'''
    marker = "## 🎯 BilaScript là gì?"
    if "## 🚀 BilaScript v1.2.0 — Native Bila Mode" not in s:
        s = s.replace(marker, intro + "\n" + marker, 1)
    s = s.replace("Chỉ thị ngôn ngữ công khai", "Chỉ thị ngôn ngữ native")
    # Make the first documented primary directive Bila. Compatibility aliases remain documented in v1.2 doc.
    s = s.replace("```text\n---cvss---\n```", "```text\n---bila---\n```", 1)
    s = s.replace("mã BilaScript nên dùng `---cvss---`", "mã BilaScript v1.2+ nên dùng `---bila---`")
    s = s.replace("babylrunner/sample.cvss.js", "babylrunner/sample.bila.js")
    write(path, s)


def main():
    upgrade_token_stream()
    upgrade_babyl_tokenizer()
    upgrade_generic_tokenizer()
    upgrade_translated_bindings()
    upgrade_cvnss_table()
    upgrade_runner()
    upgrade_babyl2js()
    create_sample_and_docs()
    upgrade_ci()
    upgrade_readme()
    print("BilaScript v1.2.0 native upgrade applied successfully")


if __name__ == "__main__":
    main()
