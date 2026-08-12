# 📘 BilaScript CVNSS4.0 Translation

> Bảng đối chiếu dùng để xây lớp từ khóa/API CVNSS4.0 cho BilaScript. Nội dung được lấy từ bảng `Babylscript CVNSS4.0 Translation` do dự án cung cấp.

## Quy tắc đưa bảng dịch vào mã nguồn

- Cột **Bản dịch gốc** giữ nội dung từ bảng.
- Cột **Token BilaScript** chỉ thay chuỗi khoảng trắng bằng `_` để tạo một identifier duy nhất.
- Không tự sửa các gợi ý nằm trong cột ghi chú; chúng được giữ như thông tin tham khảo.
- Khi cùng một tên API xuất hiện nhiều lần theo ngữ cảnh, bảng Java hiện dùng lần xuất hiện đầu tiên làm ánh xạ mặc định, phù hợp cấu trúc map đơn của Babylscript.

## Từ khóa

| # | JavaScript | Bản dịch gốc | Token BilaScript | Ghi chú |
|---:|---|---|---|---|
| 1 | `function` | `haml sob` | `haml_sob` |  |
| 2 | `if` | `neub` | `neub` |  |
| 3 | `else` | `kac` | `kac` |  |
| 4 | `for` | `vil` | `vil` |  |
| 5 | `while` | `trogp ki` | `trogp_ki` |  |
| 6 | `return` | `trov ved` | `trov_ved` |  |
| 7 | `do` | `laml` | `laml` |  |
| 8 | `true` | `thatf` | `thatf` |  |
| 9 | `false` | `sai` | `sai` |  |
| 10 | `var` | `var` | `var` | variable |
| 11 | `in` | `trong` | `trong` | for a in [1,2,3] |
| 12 | `let` | `deq cho` | `deq_cho` | like in math, let a = 4 |
| 13 | `new` | `moix` | `moix` |  |
| 14 | `try` | `thuv` | `thuv` |  |
| 15 | `case` | `truzk hoph` | `truzk_hoph` | switch(a) { case 0: } |
| 16 | `null` | `voy jaj trir` | `voy_jaj_trir` |  |
| 17 | `this` | `dayy` | `dayy` |  |
| 18 | `with` | `voix` | `voix` |  |
| 19 | `break` | `faj vow` | `faj_vow` |  |
| 20 | `throw` | `nemj` | `nemj` |  |
| 21 | `catch` | `chupr layb` | `chupr_layb` |  |
| 22 | `switch` | `cogy tacx` | `cogy_tacx` |  |
| 23 | `continue` | `tifb tucr` | `tifb_tucr` |  |
| 24 | `debugger` | `trihl gow roib` | `trihl_gow_roib` |  |
| 25 | `instanceof` | `vij zur cuaz` | `vij_zur_cuaz` |  |
| 26 | `typeof` | `lojr` | `lojr` |  |
| 27 | `void` | `voy hiwf` | `voy_hiwf` |  |
| 28 | `delete` | `xoaj boz` | `xoaj_boz` |  |
| 29 | `default` | `mach dihr` | `mach_dihr` |  |
| 30 | `finally` | `cujb cugl` | `cujb_cugl` |  |
| 31 | `int` | `int` | `int` | integer |
| 32 | `byte` | `byte` | `byte` |  |
| 33 | `char` | `char` | `char` | character |
| 34 | `enum` | `enum` | `enum` | enumeration |
| 35 | `goto` | `di denb` | `di_denb` |  |
| 36 | `long` | `zail` | `zail` |  |
| 37 | `const` | `hago_soy` | `hago_soy` | constant (From: Tu Binh Tran, nên sửa là "hằng số" = hagk sob) |
| 38 | `super` | `siwy` | `siwy` |  |
| 39 | `class` | `lopx` | `lopx` |  |
| 40 | `yield` | `nago sadb` | `nago_sadb` |  |
| 41 | `final` | `cujb cugl` | `cujb_cugl` |  |
| 42 | `float` | `troiy noiq` | `troiy_noiq` | (From: Tu Binh Tran, có thể sửa là "thả nổi" = thaz noiq) |
| 43 | `short` | `wanx` | `wanx` |  |
| 44 | `native` | `tuh nhily` | `tuh_nhily` |  |
| 45 | `throws` | `nemj` | `nemj` |  |
| 46 | `import` | `nhapf kauq` | `nhapf_kauq` |  |
| 47 | `double` | `cep` | `cep` |  |
| 48 | `static` | `tihs lagh` | `tihs_lagh` |  |
| 49 | `public` | `cogy cogf` | `cogy_cogf` |  |
| 50 | `export` | `xadb kauq` | `xadb_kauq` |  |
| 51 | `package` | `buuo cilf` | `buuo_cilf` |  |
| 52 | `boolean` | `boolean` | `boolean` |  |
| 53 | `private` | `rizy` | `rizy` |  |
| 54 | `extends` | `ceoj zail` | `ceoj_zail` |  |
| 55 | `abstract` | `truuk tuzh` | `truuk_tuzh` |  |
| 56 | `volatile` | `bay hoio` | `bay_hoio` |  |
| 57 | `interface` | `jao zilf` | `jao_zilf` |  |
| 58 | `protected` | `dush baoz vef` | `dush_baoz_vef` |  |
| 59 | `transient` | `tamr thoik` | `tamr_thoik` |  |
| 60 | `implements` | `zugr cur` | `zugr_cur` |  |
| 61 | `synchronized` | `dogd bof` | `dogd_bof` |  |

### Chính sách va chạm parser

Hai alias bị trùng trong bảng nguồn:

```text
throw   -> nemj
throws  -> nemj

finally -> cujb cugl
final   -> cujb cugl
```

Bản chạy ưu tiên từ khóa ECMAScript hoạt động:

```text
throw   -> nemj
throws  -> throws
finally -> cujb_cugl
final   -> final
```

`RAW_KEYWORDS` trong `Cvnss40.java` vẫn giữ nguyên dữ liệu gốc để audit.

## Đối tượng, thuộc tính và phương thức

| # | JavaScript/API | Bản dịch gốc | Token BilaScript | Ghi chú |
|---:|---|---|---|---|
| 1 | `arguments` | `trahp lalf` | `trahp_lalf` | can be a keyword |
| 2 | `callee` | `callee` | `callee` |  |
| 3 | `length` | `chiwd zail` | `chiwd_zail` |  |
| 4 | `caller` | `wujk goir` | `wujk_goir` |  |
| 5 | `LIBRARY_SCOPE` | `Famr_vi thuo_vilf` | `Famr_vi_thuo_vilf` |  |
| 6 | `Function` | `Haml_sob` | `Haml_sob` | Function object should have a different translation than the function keyword (perhaps use a _) |
| 7 | `name` | `Teny` | `Teny` |  |
| 8 | `arity` | `hivb coj` | `hivb_coj` | number of expected parameters/arguments for a function |
| 9 | `length` | `chiwd zail` | `chiwd_zail` |  |
| 10 | `prototype` | `wyly maug` | `wyly_maug` |  |
| 11 | `arguments` | `trahp lalf` | `trahp_lalf` |  |
| 12 | `constructor` | `wujk xayy zugh` | `wujk_xayy_zugh` |  |
| 13 | `toString` | `denb_chujg` | `denb_chujg` |  |
| 14 | `toSource` | `denb_wuld` | `denb_wuld` | source code of the object |
| 15 | `apply` | `ugx_zugr` | `ugx_zugr` | call a function using an array listing its parameters/arguments |
| 16 | `call` | `cusf_goir` | `cusf_goir` |  |
| 17 | `Object` | `Suh_vatf` | `Suh_vatf` |  |
| 18 | `constructor` | `wujk xayy zugh` | `wujk_xayy_zugh` |  |
| 19 | `toString` | `denb_chujg` | `denb_chujg` |  |
| 20 | `toLocaleString` | `tolocalestring` | `tolocalestring` |  |
| 21 | `valueOf` | `jaj_trir cuaz` | `jaj_trir_cuaz` |  |
| 22 | `hasOwnProperty` | `hasownproperty` | `hasownproperty` | (property = property/characteristics of an object) |
| 23 | `propertyIsEnumerable` | `propertyisenumerable` | `propertyisenumerable` |  |
| 24 | `isPrototypeOf` | `isprototypeof` | `isprototypeof` | (Nên sửa cột CQN là isprototypeof) |
| 25 | `toSource` | `denb_wuld` | `denb_wuld` | source code of the object |
| 26 | `__defineGetter__` | `__zefinegetter__` | `__zefinegetter__` | Depending on the language, it might be better to translate "get" as "read" and "set" as "write" |
| 27 | `__defineSetter__` | `__zefinesetter__` | `__zefinesetter__` |  |
| 28 | `__lookupGetter__` | `__lookupgetter__` | `__lookupgetter__` |  |
| 29 | `__lookupSetter__` | `__lookupsetter__` | `__lookupsetter__` |  |
| 30 | `Error` | `Loig` | `Loig` |  |
| 31 | `toString` | `denb_chujg` | `denb_chujg` |  |
| 32 | `toSource` | `denb_wuld` | `denb_wuld` |  |
| 33 | `name` | `Teny` | `Teny` |  |
| 34 | `message` | `thogy_diff` | `thogy_diff` |  |
| 35 | `fileName` | `teny_tepf` | `teny_tepf` |  |
| 36 | `lineNumber` | `sob zogl` | `sob_zogl` |  |
| 37 | `decodeURI` | `jaiz_mas URI` | `jaiz_mas_URI` | decodes a URI string |
| 38 | `decodeURIComponent` | `jaiz_mas URI thahl_fand` | `jaiz_mas_URI_thahl_fand` | decodes a URI string, but properly |
| 39 | `encodeURI` | `mas_hoaj URI` | `mas_hoaj_URI` | encodes a string for a URI |
| 40 | `encodeURIComponent` | `mas_hoaj URI thahl_fand` | `mas_hoaj_URI_thahl_fand` | encodes a string for a URI, but properly |
| 41 | `escape` | `thodj koiz` | `thodj_koiz` | encodes a string for a URL (escapes out the special characters) |
| 42 | `eval` | `dahj jaj` | `dahj_jaj` | evaluate |
| 43 | `isFinite` | `isfinite` | `isfinite` |  |
| 44 | `isNaN` | `isnan` | `isnan` | is Not-A-Number |
| 45 | `isXMLName` | `isxmlname` | `isxmlname` |  |
| 46 | `parseFloat` | `parsefloat` | `parsefloat` |  |
| 47 | `parseInt` | `parseint` | `parseint` |  |
| 48 | `unescape` | `unescape` | `unescape` | un-escape |
| 49 | `uneval` | `voy sogp` | `voy_sogp` | un-eval |
| 50 | `NaN` | `NaN` | `NaN` | Not-a-Number |
| 51 | `Infinity` | `voy cuch` | `voy_cuch` |  |
| 52 | `undefined` | `chuao xac dihr` | `chuao_xac_dihr` |  |
| 53 | `ConversionError` | `Conversionerror` | `Conversionerror` |  |
| 54 | `EvalError` | `Evalerror` | `Evalerror` |  |
| 55 | `RangeError` | `Rangeerror` | `Rangeerror` |  |
| 56 | `ReferenceError` | `Referenceerror` | `Referenceerror` |  |
| 57 | `SyntaxError` | `Loig cuj fap` | `Loig_cuj_fap` |  |
| 58 | `TypeError` | `Typeerror` | `Typeerror` |  |
| 59 | `URIError` | `Urierror` | `Urierror` |  |
| 60 | `InternalError` | `Loig beny trogp` | `Loig_beny_trogp` |  |
| 61 | `JavaException` | `Javaexception` | `Javaexception` |  |
| 62 | `Array` | `Magz` | `Magz` |  |
| 63 | `length` | `chiwd zail` | `chiwd_zail` |  |
| 64 | `toString` | `denb_chujg` | `denb_chujg` |  |
| 65 | `toLocaleString` | `chujg wony wuw` | `chujg_wony_wuw` |  |
| 66 | `toSource` | `denb_wuld` | `denb_wuld` |  |
| 67 | `join` | `tham ja` | `tham_ja` | joins all elements together into a string |
| 68 | `reverse` | `daoz wush` | `daoz_wush` |  |
| 69 | `sort` | `lojr` | `lojr` |  |
| 70 | `push` | `dayq` | `dayq` | push element onto end of stack |
| 71 | `pop` | `soiy dogf` | `soiy_dogf` | pop element off end a stack |
| 72 | `shift` | `suh thay doiq` | `suh_thay_doiq` | shift the first element off of the front of the list |
| 73 | `unshift` | `kogy tamr boh` | `kogy_tamr_boh` | shift a new element onto the front of the list |
| 74 | `splice` | `moib noib` | `moib_noib` | cut out a section of the array |
| 75 | `concat` | `cetb hoph` | `cetb_hoph` | concatenate or join lists together |
| 76 | `slice` | `lat catx` | `lat_catx` | returns a slice/subsection of the array |
| 77 | `indexOf` | `chiz sob` | `chiz_sob` |  |
| 78 | `lastIndexOf` | `chiz mucr cujb cugl cuaz` | `chiz_mucr_cujb_cugl_cuaz` |  |
| 79 | `every` | `moir` | `moir` | checks if every element satisfies certain restrictions |
| 80 | `filter` | `locr` | `locr` | filters the data |
| 81 | `forEach` | `cho moig` | `cho_moig` | iterates over each element |
| 82 | `map` | `banz dod` | `banz_dod` | maps each element to a new value by applying a function |
| 83 | `some` | `motf sob` | `motf_sob` | checks if some elements satisfy certain restrictions |
| 84 | `String` | `soih zayy` | `soih_zayy` |  |
| 85 | `length` | `chiwd zail` | `chiwd_zail` |  |
| 86 | `fromCharCode` | `tuk mas char` | `tuk_mas_char` |  |
| 87 | `toSource` | `dikj denb` | `dikj_denb` |  |
| 88 | `valueOf` | `jaj trir cuaz` | `jaj_trir_cuaz` |  |
| 89 | `charAt` | `charat` | `charat` |  |
| 90 | `charCodeAt` | `charcodeat` | `charcodeat` |  |
| 91 | `indexOf` | `chiz sob` | `chiz_sob` |  |
| 92 | `lastIndexOf` | `chiz mucr cujb cugl cuaz` | `chiz_mucr_cujb_cugl_cuaz` |  |
| 93 | `split` | `takj ra` | `takj_ra` | split up a string into parts using a separator string |
| 94 | `substring` | `chujg con` | `chujg_con` |  |
| 95 | `toLowerCase` | `thahl chuw thuzk` | `thahl_chuw_thuzk` |  |
| 96 | `toUpperCase` | `denb truzk hoph treny` | `denb_truzk_hoph_treny` |  |
| 97 | `substr` | `substr` | `substr` | substring but different paramters |
| 98 | `concat` | `cetb hoph` | `cetb_hoph` | concatenate two strings together |
| 99 | `slice` | `lat catx` | `lat_catx` | returns a slice/substring of a string |
| 100 | `bold` | `in damf` | `in_damf` | html |
| 101 | `italics` | `chuw in wizy` | `chuw_in_wizy` | html |
| 102 | `fixed` | `das suav` | `das_suav` | html |
| 103 | `strike` | `dahj dapf` | `dahj_dapf` | html |
| 104 | `small` | `nhoz bej` | `nhoz_bej` | html |
| 105 | `big` | `to lonx` | `to_lonx` | html |
| 106 | `blink` | `chopx matx` | `chopx_matx` | html |
| 107 | `sup` | `sup` | `sup` | html |
| 108 | `sub` | `fur` | `fur` | html |
| 109 | `fontsize` | `cow chuw` | `cow_chuw` | html |
| 110 | `fontcolor` | `maul fogy chuw` | `maul_fogy_chuw` | html |
| 111 | `link` | `lily cetb` | `lily_cetb` | html |
| 112 | `anchor` | `moz neo` | `moz_neo` | html |
| 113 | `equals` | `bagk` | `bagk` |  |
| 114 | `equalsIgnoreCase` | `bagk truzk hoph boz qa` | `bagk_truzk_hoph_boz_qa` |  |
| 115 | `match` | `cusf thi daub` | `cusf_thi_daub` |  |
| 116 | `search` | `Timl civb` | `Timl_civb` |  |
| 117 | `replace` | `thay theb` | `thay_theb` |  |
| 118 | `localeCompare` | `so sahj wony wuw` | `so_sahj_wony_wuw` |  |
| 119 | `toLocaleLowerCase` | `tolocalelowercase` | `tolocalelowercase` |  |
| 120 | `toLocaleUpperCase` | `tolocaleuppercase` | `tolocaleuppercase` |  |
| 121 | `Boolean` | `biwq thucx coj diwd cilf` | `biwq_thucx_coj_diwd_cilf` |  |
| 122 | `toString` | `denb chujg` | `denb_chujg` |  |
| 123 | `toSource` | `denb wuld` | `denb_wuld` |  |
| 124 | `valueOf` | `jaj trir cuaz` | `jaj_trir_cuaz` |  |
| 125 | `Number` | `Con sob` | `Con_sob` |  |
| 126 | `NaN` | `NaN` | `NaN` |  |
| 127 | `POSITIVE_INFINITY` | `tikj cuch` | `tikj_cuch` |  |
| 128 | `NEGATIVE_INFINITY` | `tiwy cuch` | `tiwy_cuch` |  |
| 129 | `MAX_VALUE` | `jaj trir toib da` | `jaj_trir_toib_da` |  |
| 130 | `MIN_VALUE` | `jaj trir toib thiwq` | `jaj_trir_toib_thiwq` |  |
| 131 | `constructor` | `wujk xayy zugh` | `wujk_xayy_zugh` |  |
| 132 | `toString` | `denb chujg` | `denb_chujg` |  |
| 133 | `toLocaleString` | `chujg wony_wuw` | `chujg_wony_wuw` |  |
| 134 | `toSource` | `denb wuld` | `denb_wuld` |  |
| 135 | `valueOf` | `jaj trir cuaz` | `jaj_trir_cuaz` |  |
| 136 | `toFixed` | `deq suav_chuaw` | `deq_suav_chuaw` | returns a string formatted using fixed point notation |
| 137 | `toExponential` | `thahl lys thuak` | `thahl_lys_thuak` | returns a string formatted using exponential notation |
| 138 | `toPrecision` | `chihj xac` | `chihj_xac` | returns a string formatted with a set number of decimal places |
| 139 | `Date` | `Wayl` | `Wayl` |  |
| 140 | `now` | `bayy jok` | `bayy_jok` |  |
| 141 | `parse` | `fany tikj cuj fap` | `fany_tikj_cuj_fap` |  |
| 142 | `UTC` | `UTC` | `UTC` | UTC Universal Coordinated Time or GMT Greenwich Mean Time |
| 143 | `toString` | `tostring` | `tostring` |  |
| 144 | `toTimeString` | `totimestring` | `totimestring` |  |
| 145 | `toDateString` | `todatestring` | `todatestring` |  |
| 146 | `toLocaleString` | `tolocalestring` | `tolocalestring` |  |
| 147 | `toLocaleTimeString` | `tolocaletimestring` | `tolocaletimestring` |  |
| 148 | `toLocaleDateString` | `tolocaledatestring` | `tolocaledatestring` |  |
| 149 | `toUTCString` | `toutcstring` | `toutcstring` |  |
| 150 | `toSource` | `tosource` | `tosource` |  |
| 151 | `valueOf` | `jaj trir cuaz` | `jaj_trir_cuaz` |  |
| 152 | `getTime` | `zahl thoik jan` | `zahl_thoik_jan` |  |
| 153 | `getYear` | `getyear` | `getyear` |  |
| 154 | `getFullYear` | `getfullyear` | `getfullyear` | two-digit year (number of years since 1900) |
| 155 | `getUTCFullYear` | `getutcfullyear` | `getutcfullyear` | four-digit year |
| 156 | `getMonth` | `getmonth` | `getmonth` |  |
| 157 | `getUTCMonth` | `getutcmonth` | `getutcmonth` |  |
| 158 | `getDate` | `henr gaph` | `henr_gaph` |  |
| 159 | `getUTCDate` | `getutcdate` | `getutcdate` |  |
| 160 | `getDay` | `getday` | `getday` |  |
| 161 | `getUTCDay` | `getutcday` | `getutcday` |  |
| 162 | `getHours` | `gethours` | `gethours` |  |
| 163 | `getUTCHours` | `getutchours` | `getutchours` |  |
| 164 | `getMinutes` | `getminutes` | `getminutes` |  |
| 165 | `getUTCMinutes` | `getutcminutes` | `getutcminutes` |  |
| 166 | `getSeconds` | `getseconds` | `getseconds` |  |
| 167 | `getUTCSeconds` | `getutcseconds` | `getutcseconds` |  |
| 168 | `getMilliseconds` | `getmilliseconds` | `getmilliseconds` |  |
| 169 | `getUTCMilliseconds` | `getutcmilliseconds` | `getutcmilliseconds` |  |
| 170 | `getTimezoneOffset` | `gettimezoneoffset` | `gettimezoneoffset` |  |
| 171 | `setTime` | `cail dath thoik jan` | `cail_dath_thoik_jan` |  |
| 172 | `setMilliseconds` | `setmilliseconds` | `setmilliseconds` |  |
| 173 | `setUTCMilliseconds` | `setutcmilliseconds` | `setutcmilliseconds` |  |
| 174 | `setSeconds` | `setseconds` | `setseconds` |  |
| 175 | `setUTCSeconds` | `setutcseconds` | `setutcseconds` |  |
| 176 | `setMinutes` | `setminutes` | `setminutes` |  |
| 177 | `setUTCMinutes` | `setutcminutes` | `setutcminutes` |  |
| 178 | `setHours` | `sethours` | `sethours` |  |
| 179 | `setUTCHours` | `setutchours` | `setutchours` |  |
| 180 | `setDate` | `dath wayl` | `dath_wayl` |  |
| 181 | `setUTCDate` | `setutcdate` | `setutcdate` |  |
| 182 | `setMonth` | `setmonth` | `setmonth` |  |
| 183 | `setUTCMonth` | `setutcmonth` | `setutcmonth` |  |
| 184 | `setFullYear` | `setfullyear` | `setfullyear` |  |
| 185 | `setUTCFullYear` | `setutcfullyear` | `setutcfullyear` |  |
| 186 | `setYear` | `setyear` | `setyear` |  |
| 187 | `Math` | `mony Tolj` | `mony_Tolj` |  |
| 188 | `toSource` | `tosource` | `tosource` |  |
| 189 | `abs` | `coo bugr` | `coo_bugr` | absolute value |
| 190 | `acos` | `acos` | `acos` | arc cosine |
| 191 | `asin` | `asin` | `asin` | arc sine |
| 192 | `atan` | `atan` | `atan` | arc tangent |
| 193 | `atan2` | `atan2` | `atan2` | arc tangent, but better |
| 194 | `ceil` | `ceil` | `ceil` | ceiling |
| 195 | `cos` | `cos` | `cos` | cosine |
| 196 | `exp` | `exp` | `exp` | e to the power of a certain argument, e with a certain exponent |
| 197 | `floor` | `floor` | `floor` |  |
| 198 | `log` | `log` | `log` | logarithm_e(x) |
| 199 | `max` | `max` | `max` |  |
| 200 | `min` | `min` | `min` |  |
| 201 | `pow` | `pow` | `pow` | power, e.g. 5 to the power of 2 or 5^2 |
| 202 | `random` | `random` | `random` |  |
| 203 | `round` | `round` | `round` |  |
| 204 | `sin` | `sin` | `sin` | sine |
| 205 | `sqrt` | `sqrt` | `sqrt` | square root |
| 206 | `tan` | `tan` | `tan` | tangent |
| 207 | `E` | `E` | `E` | Euler's constant, the natural logarithm |
| 208 | `PI` | `PI` | `PI` |  |
| 209 | `LN10` | `Ln10` | `Ln10` | log_e(10) |
| 210 | `LN2` | `Ln2` | `Ln2` | log_e(2) |
| 211 | `LOG2E` | `Log2e` | `Log2e` | log_2(e) |
| 212 | `LOG10E` | `Log10e` | `Log10e` | log_10(e) |
| 213 | `SQRT1_2` | `Sqrt1_2` | `Sqrt1_2` | sqrt(1/2) |
| 214 | `SQRT2` | `Sqrt2` | `Sqrt2` | sqrt(2) |
| 215 | `With` | `Voix` | `Voix` | deprecated |
| 216 | `Call` | `Cusf goir` | `Cusf_goir` | deprecated |
| 217 | `arguments` | `trahp lalf` | `trahp_lalf` |  |
| 218 | `Script` | `Script` | `Script` |  |
| 219 | `toString` | `denb_chujg` | `denb_chujg` |  |
| 220 | `exec` | `diwd_hahl` | `diwd_hahl` |  |
| 221 | `compile` | `bily_zikr` | `bily_zikr` |  |
| 222 | `Iterator` | `Trihl laph lair` | `Trihl_laph_lair` |  |
| 223 | `next` | `tifb theo` | `tifb_theo` |  |
| 224 | `__iterator__` | `__iterator__` | `__iterator__` |  |
| 225 | `StopIteration` | `Stopiteration` | `Stopiteration` |  |
| 226 | `RegExp` | `holl_tac` | `holl_tac` |  |
| 227 | `lastIndex` | `mucr_cujb` | `mucr_cujb` |  |
| 228 | `source` | `wuld` | `wuld` |  |
| 229 | `global` | `toll_caud` | `toll_caud` |  |
| 230 | `ignoreCase` | `boz_qa` | `boz_qa` |  |
| 231 | `multiline` | `nhiwd_zogl` | `nhiwd_zogl` |  |
| 232 | `compile` | `bily_zikr` | `bily_zikr` |  |
| 233 | `toString` | `denb_chujg` | `denb_chujg` |  |
| 234 | `toSource` | `dikj_denb` | `dikj_denb` |  |
| 235 | `exec` | `diwd_hahl` | `diwd_hahl` |  |
| 236 | `test` | `civq_tra` | `civq_tra` |  |
| 237 | `prefix` | `daud_wuw` | `daud_wuw` |  |
| 238 | `RegExp Matches` | `Tranf_daub Regexp` | `Tranf_daub_Regexp` |  |
| 239 | `index` | `mucr_lucr` | `mucr_lucr` |  |
| 240 | `input` | `daud_vaol` | `daud_vaol` |  |
| 241 | `alert` | `baoj_dogf` | `baoj_dogf` |  |
| 242 | `show` | `bieu_zilg` | `bieu_zilg` |  |

## Kiểm tra với CVNSS4.0 Converter 5.0

Bộ converter audit-safe được dùng để kiểm tra các dạng CVNSS4.0 có nguồn CQN rõ ràng. Ví dụ:

```text
hàm số  -> haml sob
nếu     -> neub
khác    -> kac
trở về  -> trov ved
mới     -> moix
mảng    -> magz
```

Converter và tokenizer là hai lớp khác nhau: converter xử lý chuyển đổi chữ; tokenizer ánh xạ token BilaScript vào token ECMAScript.
