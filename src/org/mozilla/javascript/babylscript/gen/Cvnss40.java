package org.mozilla.javascript.babylscript.gen;

import java.util.HashMap;
import java.util.Map;

/**
 * BilaScript CVNSS4.0 translation table.
 *
 * Source: Babylscript CVNSS4.0 Translation workbook supplied with BilaScript.
 * Multi-word CVNSS4.0 aliases are normalized to underscore-separated
 * JavaScript identifiers (for example: "haml sob" -> "haml_sob").
 *
 * The raw keyword table is preserved for auditability. keywordMap() applies
 * only two parser-safety overrides caused by duplicate aliases in the source:
 *   - throw/throws -> keep "nemj" for active ECMAScript keyword throw;
 *     reserved word throws falls back to English.
 *   - finally/final -> keep "cujb_cugl" for active ECMAScript keyword finally;
 *     reserved word final falls back to English.
 */
public final class Cvnss40
{
    public static final String VERSION = "1.2.0";
    public static final String LANGUAGE_CODE = "bila";
    public static final String LEGACY_LANGUAGE_CODE = "cvss";

    private Cvnss40() {}

    public static final String [] RAW_KEYWORDS = {
        "function", "haml_sob",
        "if", "neub",
        "else", "kac",
        "for", "vil",
        "while", "trogp_ki",
        "return", "trov_ved",
        "do", "laml",
        "true", "thatf",
        "false", "sai",
        "var", "var",
        "in", "trong",
        "let", "deq_cho",
        "new", "moix",
        "try", "thuv",
        "case", "truzk_hoph",
        "null", "voy_jaj_trir",
        "this", "dayy",
        "with", "voix",
        "break", "faj_vow",
        "throw", "nemj",
        "catch", "chupr_layb",
        "switch", "cogy_tacx",
        "continue", "tifb_tucr",
        "debugger", "trihl_gow_roib",
        "instanceof", "vij_zur_cuaz",
        "typeof", "lojr",
        "void", "voy_hiwf",
        "delete", "xoaj_boz",
        "default", "mach_dihr",
        "finally", "cujb_cugl",
        "int", "int",
        "byte", "byte",
        "char", "char",
        "enum", "enum",
        "goto", "di_denb",
        "long", "zail",
        "const", "hago_soy",
        "super", "siwy",
        "class", "lopx",
        "yield", "nago_sadb",
        "final", "cujb_cugl",
        "float", "troiy_noiq",
        "short", "wanx",
        "native", "tuh_nhily",
        "throws", "nemj",
        "import", "nhapf_kauq",
        "double", "cep",
        "static", "tihs_lagh",
        "public", "cogy_cogf",
        "export", "xadb_kauq",
        "package", "buuo_cilf",
        "boolean", "boolean",
        "private", "rizy",
        "extends", "ceoj_zail",
        "abstract", "truuk_tuzh",
        "volatile", "bay_hoio",
        "interface", "jao_zilf",
        "protected", "dush_baoz_vef",
        "transient", "tamr_thoik",
        "implements", "zugr_cur",
        "synchronized", "dogd_bof",
    };

    public static final String [] OBJECTS = {
        "arguments", "trahp_lalf",
        "callee", "callee",
        "length", "chiwd_zail",
        "caller", "wujk_goir",
        "LIBRARY_SCOPE", "Famr_vi_thuo_vilf",
        "Function", "Haml_sob",
        "name", "Teny",
        "arity", "hivb_coj",
        "prototype", "wyly_maug",
        "constructor", "wujk_xayy_zugh",
        "toString", "denb_chujg",
        "toSource", "denb_wuld",
        "apply", "ugx_zugr",
        "call", "cusf_goir",
        "Object", "Suh_vatf",
        "toLocaleString", "tolocalestring",
        "valueOf", "jaj_trir_cuaz",
        "hasOwnProperty", "hasownproperty",
        "propertyIsEnumerable", "propertyisenumerable",
        "isPrototypeOf", "isprototypeof",
        "__defineGetter__", "__zefinegetter__",
        "__defineSetter__", "__zefinesetter__",
        "__lookupGetter__", "__lookupgetter__",
        "__lookupSetter__", "__lookupsetter__",
        "Error", "Loig",
        "message", "thogy_diff",
        "fileName", "teny_tepf",
        "lineNumber", "sob_zogl",
        "decodeURI", "jaiz_mas_URI",
        "decodeURIComponent", "jaiz_mas_URI_thahl_fand",
        "encodeURI", "mas_hoaj_URI",
        "encodeURIComponent", "mas_hoaj_URI_thahl_fand",
        "escape", "thodj_koiz",
        "eval", "dahj_jaj",
        "isFinite", "isfinite",
        "isNaN", "isnan",
        "isXMLName", "isxmlname",
        "parseFloat", "parsefloat",
        "parseInt", "parseint",
        "unescape", "unescape",
        "uneval", "voy_sogp",
        "NaN", "NaN",
        "Infinity", "voy_cuch",
        "undefined", "chuao_xac_dihr",
        "ConversionError", "Conversionerror",
        "EvalError", "Evalerror",
        "RangeError", "Rangeerror",
        "ReferenceError", "Referenceerror",
        "SyntaxError", "Loig_cuj_fap",
        "TypeError", "Typeerror",
        "URIError", "Urierror",
        "InternalError", "Loig_beny_trogp",
        "JavaException", "Javaexception",
        "Array", "Magz",
        "join", "tham_ja",
        "reverse", "daoz_wush",
        "sort", "lojr",
        "push", "dayq",
        "pop", "soiy_dogf",
        "shift", "suh_thay_doiq",
        "unshift", "kogy_tamr_boh",
        "splice", "moib_noib",
        "concat", "cetb_hoph",
        "slice", "lat_catx",
        "indexOf", "chiz_sob",
        "lastIndexOf", "chiz_mucr_cujb_cugl_cuaz",
        "every", "moir",
        "filter", "locr",
        "forEach", "cho_moig",
        "map", "banz_dod",
        "some", "motf_sob",
        "String", "soih_zayy",
        "fromCharCode", "tuk_mas_char",
        "charAt", "charat",
        "charCodeAt", "charcodeat",
        "split", "takj_ra",
        "substring", "chujg_con",
        "toLowerCase", "thahl_chuw_thuzk",
        "toUpperCase", "denb_truzk_hoph_treny",
        "substr", "substr",
        "bold", "in_damf",
        "italics", "chuw_in_wizy",
        "fixed", "das_suav",
        "strike", "dahj_dapf",
        "small", "nhoz_bej",
        "big", "to_lonx",
        "blink", "chopx_matx",
        "sup", "sup",
        "sub", "fur",
        "fontsize", "cow_chuw",
        "fontcolor", "maul_fogy_chuw",
        "link", "lily_cetb",
        "anchor", "moz_neo",
        "equals", "bagk",
        "equalsIgnoreCase", "bagk_truzk_hoph_boz_qa",
        "match", "cusf_thi_daub",
        "search", "Timl_civb",
        "replace", "thay_theb",
        "localeCompare", "so_sahj_wony_wuw",
        "toLocaleLowerCase", "tolocalelowercase",
        "toLocaleUpperCase", "tolocaleuppercase",
        "Boolean", "biwq_thucx_coj_diwd_cilf",
        "Number", "Con_sob",
        "POSITIVE_INFINITY", "tikj_cuch",
        "NEGATIVE_INFINITY", "tiwy_cuch",
        "MAX_VALUE", "jaj_trir_toib_da",
        "MIN_VALUE", "jaj_trir_toib_thiwq",
        "toFixed", "deq_suav_chuaw",
        "toExponential", "thahl_lys_thuak",
        "toPrecision", "chihj_xac",
        "Date", "Wayl",
        "now", "bayy_jok",
        "parse", "fany_tikj_cuj_fap",
        "UTC", "UTC",
        "toTimeString", "totimestring",
        "toDateString", "todatestring",
        "toLocaleTimeString", "tolocaletimestring",
        "toLocaleDateString", "tolocaledatestring",
        "toUTCString", "toutcstring",
        "getTime", "zahl_thoik_jan",
        "getYear", "getyear",
        "getFullYear", "getfullyear",
        "getUTCFullYear", "getutcfullyear",
        "getMonth", "getmonth",
        "getUTCMonth", "getutcmonth",
        "getDate", "henr_gaph",
        "getUTCDate", "getutcdate",
        "getDay", "getday",
        "getUTCDay", "getutcday",
        "getHours", "gethours",
        "getUTCHours", "getutchours",
        "getMinutes", "getminutes",
        "getUTCMinutes", "getutcminutes",
        "getSeconds", "getseconds",
        "getUTCSeconds", "getutcseconds",
        "getMilliseconds", "getmilliseconds",
        "getUTCMilliseconds", "getutcmilliseconds",
        "getTimezoneOffset", "gettimezoneoffset",
        "setTime", "cail_dath_thoik_jan",
        "setMilliseconds", "setmilliseconds",
        "setUTCMilliseconds", "setutcmilliseconds",
        "setSeconds", "setseconds",
        "setUTCSeconds", "setutcseconds",
        "setMinutes", "setminutes",
        "setUTCMinutes", "setutcminutes",
        "setHours", "sethours",
        "setUTCHours", "setutchours",
        "setDate", "dath_wayl",
        "setUTCDate", "setutcdate",
        "setMonth", "setmonth",
        "setUTCMonth", "setutcmonth",
        "setFullYear", "setfullyear",
        "setUTCFullYear", "setutcfullyear",
        "setYear", "setyear",
        "Math", "mony_Tolj",
        "abs", "coo_bugr",
        "acos", "acos",
        "asin", "asin",
        "atan", "atan",
        "atan2", "atan2",
        "ceil", "ceil",
        "cos", "cos",
        "exp", "exp",
        "floor", "floor",
        "log", "log",
        "max", "max",
        "min", "min",
        "pow", "pow",
        "random", "random",
        "round", "round",
        "sin", "sin",
        "sqrt", "sqrt",
        "tan", "tan",
        "E", "E",
        "PI", "PI",
        "LN10", "Ln10",
        "LN2", "Ln2",
        "LOG2E", "Log2e",
        "LOG10E", "Log10e",
        "SQRT1_2", "Sqrt1_2",
        "SQRT2", "Sqrt2",
        "With", "Voix",
        "Call", "Cusf_goir",
        "Script", "Script",
        "exec", "diwd_hahl",
        "compile", "bily_zikr",
        "Iterator", "Trihl_laph_lair",
        "next", "tifb_theo",
        "__iterator__", "__iterator__",
        "StopIteration", "Stopiteration",
        "RegExp", "holl_tac",
        "lastIndex", "mucr_cujb",
        "source", "wuld",
        "global", "toll_caud",
        "ignoreCase", "boz_qa",
        "multiline", "nhiwd_zogl",
        "test", "civq_tra",
        "prefix", "daud_wuw",
        "RegExp Matches", "Tranf_daub_Regexp",
        "index", "mucr_lucr",
        "input", "daud_vaol",
        "alert", "baoj_dogf",
        "show", "bieu_zilg",
    };

    public static Map<String, String> keywordMap()
    {
        Map<String, String> map = arrayToMap(RAW_KEYWORDS);

        // BilaScript v1.2.0 semantic CVNSS4.0 overrides.  RAW_KEYWORDS stays
        // unchanged for audit/back-reference to the original workbook.
        map.put("var", "bilb");                 // biến
        map.put("int", "sob_wyly");             // số nguyên
        map.put("char", "cij_tuh");             // ký tự
        map.put("enum", "lidf_cey");             // liệt kê
        map.put("long", "sob_zail");             // số dài
        map.put("float", "sob_thuch");           // số thực
        map.put("double", "sob_thuch_cep");      // số thực kép
        map.put("boolean", "lalf_lij");          // luận lý
        map.put("public", "cogy_kai");           // công khai
        map.put("private", "rizy_tuo");          // riêng tư
        map.put("extends", "mov_rogf");           // mở rộng
        map.put("volatile", "kaz_bilb");         // khả biến
        map.put("implements", "thuch_thi");      // thực thi
        map.put("import", "nhapf");              // nhập
        map.put("export", "xadb");               // xuất
        map.put("package", "goij");              // gói

        // These two source aliases collide in the supplied table.  Keeping the
        // inactive Java-reserved forms in English preserves ECMAScript parsing.
        map.put("throws", "throws");
        map.put("final", "final");
        return map;
    }

    public static Map<String, String> objectMap()
    {
        Map<String, String> map = arrayToMap(OBJECTS);

        // Safe semantic aliases generated/checked against the CVNSS4.0
        // audit-safe converter. Existing workbook aliases remain the fallback.
        map.put("callee", "haml_dush_goir");
        map.put("length", "dof_zail");
        map.put("arity", "sob_tham_sob");
        map.put("constructor", "bof_taor");
        map.put("toString", "denb_chujg");
        map.put("toSource", "denb_wuld");
        map.put("apply", "ap_zugr");
        map.put("call", "goir");
        map.put("toLocaleString", "denb_chujg_vugl");
        map.put("hasOwnProperty", "coj_thusf_tihj_rizy");
        map.put("propertyIsEnumerable", "thusf_tihj_coj_theq_lidf_cey");
        map.put("isPrototypeOf", "lal_wyly_maug_cuaz");
        map.put("__defineGetter__", "__dihr_wias_bof_layb__");
        map.put("__defineSetter__", "__dihr_wias_bof_dath__");
        map.put("__lookupGetter__", "__tra_bof_layb__");
        map.put("__lookupSetter__", "__tra_bof_dath__");
        map.put("ConversionError", "Loig_chylq_doiq");
        map.put("EvalError", "Loig_dahj_jaj");
        map.put("RangeError", "Loig_famr_vi");
        map.put("ReferenceError", "Loig_tham_chiwb");
        map.put("TypeError", "Loig_ciwq");
        map.put("URIError", "Loig_URI");
        map.put("JavaException", "Loig_Java");
        map.put("isFinite", "huuw_hanr");
        map.put("isNaN", "kogy_faiz_sob");
        map.put("parseFloat", "fany_tikj_sob_thuch");
        map.put("parseInt", "fany_tikj_sob_wyly");
        map.put("join", "noib");
        map.put("sort", "sapx_xepb");
        map.put("pop", "layb_cujb");
        map.put("shift", "zikr");
        map.put("unshift", "boz_zikr");
        map.put("concat", "gep");
        map.put("slice", "catx_lat");
        map.put("indexOf", "chiz_mucr_cuaz");
        map.put("lastIndexOf", "chiz_mucr_cujb_cuaz");
        map.put("map", "ahj_xar");
        map.put("some", "motf_vail");
        map.put("fromCharCode", "tuk_mas_cij_tuh");
        map.put("charAt", "cij_tuh_tair");
        map.put("charCodeAt", "mas_cij_tuh_tair");
        map.put("split", "takj");
        map.put("toLowerCase", "denb_chuw_thuzk");
        map.put("toUpperCase", "denb_chuw_hoa");
        map.put("equalsIgnoreCase", "bagk_nhau_boz_qa_hoa_thuzk");
        map.put("localeCompare", "so_sahj_vugl");
        map.put("MAX_VALUE", "jaj_trir_lonx_nhatb");
        map.put("MIN_VALUE", "jaj_trir_nhoz_nhatb");
        map.put("toFixed", "denb_cob_dihr");
        map.put("toExponential", "denb_sob_mus");
        map.put("toPrecision", "denb_dof_chihj_xac");
        map.put("now", "thoik_jan_hilf_tair");
        map.put("getYear", "layb_namo");
        map.put("getFullYear", "layb_namo_dayd_duz");
        map.put("getMonth", "layb_thagj");
        map.put("getDate", "layb_wayl");
        map.put("getDay", "layb_thux");
        map.put("getHours", "layb_jok");
        map.put("getMinutes", "layb_fut");
        map.put("getSeconds", "layb_jayy");
        map.put("getMilliseconds", "layb_mili_jayy");
        map.put("getTimezoneOffset", "dof_lekf_muij_jok");
        map.put("setMilliseconds", "dath_mili_jayy");
        map.put("setSeconds", "dath_jayy");
        map.put("setMinutes", "dath_fut");
        map.put("setHours", "dath_jok");
        map.put("setMonth", "dath_thagj");
        map.put("setFullYear", "dath_namo_dayd_duz");
        map.put("abs", "jaj_trir_tydf_doib");
        map.put("ceil", "trand");
        map.put("floor", "sanl");
        map.put("pow", "lys_thuak");
        map.put("random", "waug_nhily");
        map.put("round", "laml_tronl");
        map.put("sqrt", "cano_bacf_hai");
        map.put("next", "tifb_theo");
        map.put("prefix", "tild_tob");
        map.put("show", "hilq_thir");
        return map;
    }

    private static Map<String, String> arrayToMap(String [] arr)
    {
        Map<String, String> map = new HashMap<String, String>();
        for (int n = 0; n < arr.length; n += 2)
            map.put(arr[n], arr[n + 1]);
        return map;
    }
}
