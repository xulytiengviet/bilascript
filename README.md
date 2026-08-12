# 🇻🇳 BilaScript — JavaScript/ECMAScript bằng CVNSS4.0

[![BilaScript v1.2.0 Native CI](https://github.com/xulytiengviet/bilascript/actions/workflows/bilascript-ci.yml/badge.svg?branch=Babylscript1_7R2_BRANCH)](https://github.com/xulytiengviet/bilascript/actions/workflows/bilascript-ci.yml)
[![Release v2.0.0](https://img.shields.io/badge/release-v2.0.0-blue)](https://github.com/xulytiengviet/bilascript/releases/tag/v2.0.0)

> **BilaScript là một biến thể JavaScript (ECMAScript) mã nguồn mở, phát triển từ Babylscript trên nền Mozilla Rhino, dành cho cộng đồng học tập, nghiên cứu và yêu thích CVNSS4.0.**

![Java](https://img.shields.io/badge/Java-Rhino%201.7R2-orange?logo=openjdk)
![ECMAScript](https://img.shields.io/badge/ECMAScript-Multilingual-blue)
![CVNSS4.0](https://img.shields.io/badge/CVNSS4.0-Translation-0b63ce)
![Encoding](https://img.shields.io/badge/Encoding-UTF--8-success)
![License](https://img.shields.io/badge/License-MPL%201.1%20%2F%20GPL%202.0-green)


## 🚀 BilaScript v2.0.0 — JavaScript-compatible CVNSS4.0 Grammar

BilaScript 2.0 **giữ cú pháp JavaScript** (`{}`, `()`, `[]`, toán tử, expression, object/array literal, member access...) và chuẩn hóa lớp **semantic vocabulary** sang CVNSS4.0. Engine có 3 profile: `---bila---`, `---bila:strict---`, `---bila:js---`.

```javascript
---bila:strict---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb ds = moix Magz(10, 20, 30);
neub (ds.dof_zail > 0) {
    java.lang.System.out.println(tong(ds[0], ds[1]));
}
```

**Đặc tả:** `spec/BilaScript-2.0.ebnf` · **Vocabulary:** `spec/bila-vocabulary-v2.json` · **Tool:** `python tools/bilac_v2.py --help` · **Chi tiết:** `docs/BILASCRIPT_v2.0.0.md`.

---

## 🧬 BilaScript v1.2.0 — nền native Bila Mode

Từ v1.2.0, chỉ thị chuẩn là **`---bila---`** và được lexer nhận bằng `TokenStream.LanguageMode.bila` thực sự. `---cvss---`, `---cvnss---`, `---cvnss40---`, `---cvnss4---` chỉ còn là alias tương thích ngược. Từ khóa/API được CVNSS4.0 hóa tối đa theo nguyên tắc parser-safe; mục nào không thể chuyển duy nhất/an toàn thì giữ tên gốc. Xem `docs/BILASCRIPT_LANGUAGE_v1.2.0.md`.

Ví dụ:

```javascript
---bila---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb cetb_qaz = tong(10, 20);
```

---

## 🎯 BilaScript là gì?

JavaScript truyền thống sử dụng các từ khóa tiếng Anh như `function`, `if`, `else`, `while`, `return`, `new`...

**BilaScript đưa cơ chế JavaScript đa ngôn ngữ của Babylscript sang CVNSS4.0.** Thay vì chỉ dịch tài liệu hoặc thay chuỗi trước khi chạy, BilaScript nạp một bảng từ khóa/API CVNSS4.0 vào hệ thống tokenizer của Babylscript. Các token này sau đó được ánh xạ về token ECMAScript và được Rhino phân tích/thực thi.

Mục tiêu của dự án là cho phép lập trình viên thử nghiệm mã JavaScript không phải tiếng Anh trong các ứng dụng thực tế, qua đó đưa JavaScript đến gần hơn với cộng đồng quan tâm CVNSS4.0.

BilaScript **không tuyên bố tạo ra một tiêu chuẩn ECMAScript mới**. Semantics cốt lõi vẫn là JavaScript/Rhino; BilaScript thay lớp ngôn ngữ bề mặt — từ khóa, tên đối tượng, thuộc tính và phương thức.

---

## 🧬 Dòng kế thừa kỹ thuật

```text
Mozilla Rhino 1.7R2
        │
        ▼
   Babylscript
        │
        │  JavaScript đa ngôn ngữ
        │  BabylTokenizer
        │  BabylGenericTokenizer
        │  CustomTokenizer
        ▼
 BilaScript CVNSS4.0
        │
        │  Babylscript CVNSS4.0 Translation
        │  Cvnss40.java
        ▼
 JavaScript / ECMAScript
        │
        ├── Runner → Rhino Interpreter
        └── Babyl2JS → JavaScript/HTML
```

**Rhino → Babylscript → BilaScript** là quan hệ kế thừa của dự án.

---

## ⚙️ CVNSS4.0 là language mode native trong engine

Luồng thực thi v1.2.0:

```text
Tệp BilaScript UTF-8 (*.bila.js)
        │
        ▼
    ---bila---
        │
        ▼
 TokenStream.LanguageMode.bila
        │
        ▼
BabylGenericTokenizer.createBilaTokenizer()
        │
        ├── Cvnss40.keywordMap()
        └── English keyword fallback (khi cần)
        │
        ▼
   ECMAScript Token
        │
        ▼
   Rhino Parser
        │
        ├── Runner → Rhino Interpreter
        └── Babyl2JS → ParserToJS
                         │
                         ▼
            TranslatedNameBindings["bila"]
                         │
                         ▼
                  JavaScript / HTML
```

Từ v1.2.0, BilaScript không còn mượn custom channel `test`. `bila` là một `LanguageMode` thực sự trong `TokenStream`; tokenizer native nạp bảng CVNSS4.0 và `TranslatedNameBindings` đăng ký namespace `bila` cho built-in object, property và method. ECMAScript keyword gốc vẫn là fallback có chủ đích để giữ tương thích và xử lý các mục không thể chuyển duy nhất/an toàn.

### Chỉ thị ngôn ngữ native

```text
---bila---
```

Các bí danh tương thích ngược cũng được chấp nhận:

```text
---cvss---
---cvnss---
---cvnss40---
---cvnss4---
```

Tất cả alias trên được lexer ánh xạ trực tiếp về `TokenStream.LanguageMode.bila`; chỉ thị chuẩn cho mã mới từ v1.2.0 là `---bila---`.

---

## 🚀 Ví dụ BilaScript CVNSS4.0

JavaScript:

```javascript
function chao(ten) {
    if (ten == null) {
        return "Xin chào CVNSS4.0!";
    } else {
        return "Xin chào " + ten;
    }
}

var danhSach = new Array("BilaScript", "CVNSS4.0");
```

BilaScript:

```javascript
---bila---

haml_sob chao(ten) {
    neub (ten == voy_jaj_trir) {
        trov_ved "Xin chaol CVNSS4.0!";
    } kac {
        trov_ved "Xin chaol " + ten;
    }
}

bilb danh_sach = moix Magz("BilaScript", "CVNSS4.0");
```

Tệp chạy mẫu có sẵn tại:

```text
babylrunner/sample.bila.js
```

---

## 🔤 Một số ánh xạ chính

| JavaScript | Babylscript CVNSS4.0 Translation | Token BilaScript |
|---|---|---|
| `function` | `haml sob` | `haml_sob` |
| `if` | `neub` | `neub` |
| `else` | `kac` | `kac` |
| `for` | `vil` | `vil` |
| `while` | `trogp ki` | `trogp_ki` |
| `return` | `trov ved` | `trov_ved` |
| `do` | `laml` | `laml` |
| `true` | `thatf` | `thatf` |
| `false` | `sai` | `sai` |
| `new` | `moix` | `moix` |
| `null` | `voy jaj trir` | `voy_jaj_trir` |
| `try` | `thuv` | `thuv` |
| `catch` | `chupr layb` | `chupr_layb` |
| `switch` | `cogy tacx` | `cogy_tacx` |
| `Array` | `Magz` | `Magz` |
| `Function` | `Haml_sob` | `Haml_sob` |
| `Object` | `Suh_vatf` | `Suh_vatf` |
| `Date` | `Wayl` | `Wayl` |
| `Math` | `mony Tolj` | `mony_Tolj` |
| `alert` | `baoj dogf` | `baoj_dogf` |

### Vì sao dùng `_`?

Bảng translation chứa nhiều cụm có khoảng trắng. JavaScript tokenizer phải đọc từ khóa/tên API như một identifier duy nhất, vì vậy BilaScript chỉ chuẩn hóa khoảng trắng thành `_`:

```text
haml sob       → haml_sob
trov ved       → trov_ved
trogp ki       → trogp_ki
voy jaj trir   → voy_jaj_trir
mony Tolj      → mony_Tolj
```

Đây là quy ước cú pháp để parser đọc được một token; dữ liệu gốc vẫn được giữ để audit.

---

## 📚 Babylscript CVNSS4.0 Translation

Nguồn ánh xạ của BilaScript được xây từ bảng **Babylscript CVNSS4.0 Translation** của dự án, gồm:

- 61 từ khóa/từ dành riêng;
- các đối tượng JavaScript chuẩn;
- thuộc tính và phương thức;
- ghi chú ngữ nghĩa đi kèm bảng dịch.

Mã nguồn bảng chạy:

```text
src/org/mozilla/javascript/babylscript/gen/Cvnss40.java
```

Bảng đối chiếu đầy đủ:

```text
docs/CVNSS40_TRANSLATION.md
```

### Chính sách va chạm parser

Bảng nguồn có hai alias trùng:

```text
throw   → nemj
throws  → nemj

finally → cujb cugl
final   → cujb cugl
```

Nạp nguyên trạng vào một `Map<String, token>` có thể khiến alias sau ghi đè alias trước. BilaScript giữ `RAW_KEYWORDS` nguyên bản để truy nguyên, nhưng bảng chạy áp dụng:

```text
throw   → nemj
throws  → throws
finally → cujb_cugl
final   → final
```

Mục đích là ưu tiên các từ khóa ECMAScript đang thực thi (`throw`, `finally`) trong khi vẫn không làm mất dữ liệu translation gốc.

---

## 🧪 CVNSS4.0 Converter Audit-Safe

BilaScript sử dụng **Babylscript CVNSS4.0 Translation** làm nguồn từ khóa/API. Bộ **CVNSS4.0 Converter 5.0.0 Audit-Safe** được dùng như lớp tham chiếu để kiểm tra cách biểu diễn chữ CVNSS4.0.

Ví dụ đã đối chiếu:

```text
hàm số   → haml sob
nếu      → neub
khác     → kac
trở về   → trov ved
mới      → moix
mảng     → magz
Xin chào → Xin chaol
```

Converter và tokenizer có vai trò khác nhau:

```text
CQN/Vietnamese ── converter ──► CVNSS4.0 text
                                  │
                                  ▼
                         BilaScript tokenizer
                                  │
                                  ▼
                           ECMAScript token
```

---

## ▶️ Build và chạy trực tiếp

### Yêu cầu

- Java/JDK phù hợp với codebase Rhino 1.7R2;
- Apache Ant;
- tệp nguồn UTF-8.

### Biên dịch Runner

```bash
ant babylscriptrun
```

### Chạy ví dụ

```bash
java -jar build/babylscriptrun.jar babylrunner/sample.bila.js
```

Runner hỗ trợ nhiều tệp theo thứ tự:

```bash
java -jar build/babylscriptrun.jar thu_vien.js chuong_trinh.bila.js
```

---

## 🔄 Biên dịch BilaScript CVNSS4.0 → JavaScript

BilaScript đã nối CVNSS4.0 vào công cụ **Babyl2JS** của Babylscript.

Biên dịch compiler:

```bash
ant babyl2js
```

Dịch tệp CVNSS4.0 sang JavaScript:

```bash
java -jar build/babyl2js.jar babylrunner/sample.bila.js output.js
```

Xuất trực tiếp thành HTML:

```bash
java -jar build/babyl2js.jar -html babylrunner/sample.bila.js output.html
```

Babyl2JS v1.2.0 đi qua cùng native language mode với Runner:

```text
1. ---bila--- → TokenStream.LanguageMode.bila
2. createBilaTokenizer() → Cvnss40.keywordMap()
3. TranslatedNameBindings["bila"] → Cvnss40.objectMap()
4. ParserToJS / compileStringToJS → JavaScript hoặc HTML
```

Sau đó `ParserToJS` tiếp tục tạo JavaScript theo cơ chế Babylscript. Khi có runtime header, các tên toàn cục được phát sinh dưới dạng lookup theo ngôn ngữ, vì vậy các alias như `Magz → Array`, `Wayl → Date`, `mony_Tolj → Math` có thể được đăng ký vào cùng hệ thống translation.

Tùy chọn:

```text
-html       bọc JavaScript đầu ra trong HTML
-noheaders  không chèn Babylscript runtime header
```

Với `-noheaders`, ứng dụng phải tự cung cấp Babylscript runtime tương ứng như hành vi vốn có của trình dịch gốc.

---

## 🏗️ Thành phần chính

| Thành phần | Vai trò |
|---|---|
| `src/org/mozilla/javascript/TokenStream.java` | khai báo `LanguageMode.bila` và chuyển native language mode |
| `src/org/mozilla/javascript/BabylTokenizer.java` | lexer nhận `---bila---` và các alias tương thích |
| `src/org/mozilla/javascript/babylscript/BabylGenericTokenizer.java` | `createBilaTokenizer()` ánh xạ CVNSS4.0 → token ECMAScript |
| `src/org/mozilla/javascript/babylscript/TranslatedNameBindings.java` | namespace `bila` cho object/property/method |
| `src/org/mozilla/javascript/babylscript/gen/Cvnss40.java` | bảng CVNSS4.0 của BilaScript |
| `babylrunner/Runner.java` | chạy BilaScript CVNSS4.0 bằng Rhino Interpreter |
| `babylrunner/Babyl2JS.java` | biên dịch BilaScript CVNSS4.0 sang JavaScript/HTML |
| `babylrunner/sample.bila.js` | ví dụ mã BilaScript |
| `docs/CVNSS40_TRANSLATION.md` | bảng đối chiếu và chính sách parser-safe |

---

## ⚠️ Giới hạn kỹ thuật kế thừa

BilaScript dựa trên codebase lịch sử Rhino 1.7R2/Babylscript. Các thay đổi Babylscript tập trung vào interpreter; optimizer/bytecode compiler không tương thích đầy đủ, vì vậy Runner dùng:

```java
Context cx = Context.enter();
cx.setOptimizationLevel(-1);
```

Một số phần cũ hoặc không thuần ECMAScript như E4X, destructuring và các đường tối ưu hóa có thể không hoạt động đầy đủ với lớp đa ngôn ngữ.

BilaScript nên được xem là **nền tảng JavaScript/ECMAScript đa ngôn ngữ phục vụ CVNSS4.0, giáo dục, thử nghiệm và nghiên cứu**, không phải một engine thay thế V8 hay JavaScript hiện đại.

---

## 🔐 Nguyên tắc thiết kế

1. **Giữ semantics ECMAScript** — chỉ thay lớp ngôn ngữ bề mặt khi có thể.
2. **Dùng tokenizer thật** — CVNSS4.0 đi qua `BabylGenericTokenizer`, không chỉ search/replace.
3. **Có thể truy nguyên** — giữ dữ liệu gốc và tách chính sách parser-safe.
4. **Không che giấu va chạm** — collision phải được ghi rõ.
5. **UTF-8 xuyên suốt**.
6. **Can thiệp có kiểm soát vào engine** — thêm native mode nhưng giữ semantics/parser Rhino.
7. **Runner và compiler dùng cùng bảng translation**.
8. **Có thể trộn language block** — giữ khả năng đa ngôn ngữ vốn có của Babylscript.

---

## 📜 Giấy phép và ghi nhận

BilaScript phát triển trên Babylscript; Babylscript là một sửa đổi của Mozilla Rhino 1.7R2. Các tệp kế thừa tiếp tục tuân theo license header và `LICENSE.txt` của mã nguồn gốc, chủ yếu theo mô hình MPL 1.1 / GPL 2.0 trong repository này.

Không xóa thông báo bản quyền hoặc giấy phép của Rhino/Babylscript.

### Nguồn gốc

- **Mozilla Rhino** — JavaScript engine viết bằng Java;
- **Babylscript** — JavaScript đa ngôn ngữ trên Rhino;
- **Babylscript CVNSS4.0 Translation** — bảng ngôn ngữ dùng cho lớp CVNSS4.0;
- **BilaScript** — biến thể JavaScript/ECMAScript hướng tới cộng đồng CVNSS4.0.

---

## 💙 Triết lý BilaScript

> **JavaScript vẫn là JavaScript; BilaScript mở thêm một cách viết JavaScript bằng CVNSS4.0.**

```text
CVNSS4.0
   ↕
BilaScript
   ↕
Babylscript
   ↕
ECMAScript / JavaScript
   ↕
Mozilla Rhino
```

Bằng cách cho phép lập trình viên sử dụng mã JavaScript không phải tiếng Anh trong các ứng dụng thực tế, BilaScript hướng đến việc đưa JavaScript đến với nhiều người dùng hơn — đặc biệt là nhóm học tập, nghiên cứu và yêu thích CVNSS4.0.
