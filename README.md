# 🇻🇳 BilaScript — JavaScript/ECMAScript bằng CVNSS4.0

> **BilaScript là một biến thể JavaScript (ECMAScript) mã nguồn mở, phát triển từ Babylscript trên nền Mozilla Rhino, dành cho cộng đồng yêu thích CVNSS4.0.**

![Java](https://img.shields.io/badge/Java-Rhino%201.7R2-orange?logo=openjdk)
![ECMAScript](https://img.shields.io/badge/ECMAScript-Multilingual-blue)
![CVNSS4.0](https://img.shields.io/badge/CVNSS4.0-Translation-0b63ce)
![Encoding](https://img.shields.io/badge/Encoding-UTF--8-success)
![License](https://img.shields.io/badge/License-MPL%201.1%20%2F%20GPL%202.0-green)

## 🎯 BilaScript là gì?

JavaScript truyền thống sử dụng các từ khóa tiếng Anh như `function`, `if`, `else`, `while`, `return`, `new`...

**BilaScript đưa cơ chế đa ngôn ngữ của Babylscript sang CVNSS4.0**, cho phép lập trình viên viết các từ khóa và nhiều tên API JavaScript bằng bộ từ vựng CVNSS4.0 trong mã nguồn thực tế.

Mục tiêu của dự án là:

- đưa JavaScript/ECMAScript đến gần hơn với nhóm người dùng yêu thích CVNSS4.0;
- chứng minh một ngôn ngữ lập trình có thể giữ nguyên mô hình thực thi ECMAScript nhưng thay lớp từ khóa/ngôn ngữ bề mặt;
- hỗ trợ học tập, thử nghiệm ngôn ngữ, nghiên cứu xử lý tiếng Việt và CVNSS4.0;
- vẫn cho phép kết hợp mã JavaScript tiếng Anh với các khối mã CVNSS4.0.

BilaScript **không tạo ra một ECMAScript chuẩn mới**. Phần cú pháp lõi và mô hình thực thi vẫn dựa trên JavaScript/Rhino; BilaScript thay đổi lớp nhận diện từ khóa và tên đối tượng thông qua kiến trúc đa ngôn ngữ của Babylscript.

---

## 🧬 Dòng kế thừa

```text
Mozilla Rhino 1.7R2
        │
        ▼
   Babylscript
        │
        │  cơ chế JavaScript đa ngôn ngữ
        │  BabylTokenizer / BabylGenericTokenizer
        ▼
 BilaScript CVNSS4.0
        │
        │  Babylscript CVNSS4.0 Translation
        │  Cvnss40.java
        ▼
 JavaScript / ECMAScript
        │
        ├── chạy trực tiếp bằng Rhino Interpreter
        └── dịch sang JavaScript bằng Babyl2JS
```

**Rhino → Babylscript → BilaScript** là quan hệ kế thừa kỹ thuật của dự án.

---

## ⚙️ CVNSS4.0 thực sự đi qua `BabylGenericTokenizer`

BilaScript không chỉ thay chữ trong README.

Luồng xử lý của bản CVNSS4.0:

```text
Tệp UTF-8
   │
   ▼
---cvss---
   │
   ▼
BilaScript Runner
   │
   ├── nạp Cvnss40.keywordMap()
   ├── nạp Cvnss40.objectMap()
   └── ánh xạ ---cvss--- → kênh custom-language của Babylscript
   │
   ▼
CustomTokenizer
   │
   └── extends BabylGenericTokenizer
              │
              ▼
      keywordLookup / Token
              │
              ▼
        Rhino Parser
              │
              ▼
       Rhino Interpreter
```

Babylscript đã có sẵn `CustomTokenizer`, và lớp này **kế thừa trực tiếp `BabylGenericTokenizer`**. BilaScript tận dụng chính cơ chế đó để nạp bảng CVNSS4.0 thay vì viết một bộ phân tích JavaScript hoàn toàn mới.

Ở giao diện mã nguồn, BilaScript dùng:

```text
---cvss---
```

và chấp nhận thêm các bí danh:

```text
---cvnss---
---cvnss40---
---cvnss4---
```

Bên trong runner, các chỉ thị này được đưa về kênh custom-language `---test---` vốn có của Babylscript. Đây chỉ là chi tiết tương thích nội bộ; người viết BilaScript sử dụng `---cvss---`.

---

## 🚀 Ví dụ BilaScript CVNSS4.0

JavaScript thông thường:

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
---cvss---

haml_sob chao(ten) {
    neub (ten == voy_jaj_trir) {
        trov_ved "Xin chaol CVNSS4.0!";
    } kac {
        trov_ved "Xin chaol " + ten;
    }
}

var danh_sach = moix Magz("BilaScript", "CVNSS4.0");
```

Một số ánh xạ tiêu biểu:

| JavaScript | CVNSS4.0 trong bảng | Token dùng trong mã |
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

### Vì sao cụm nhiều từ dùng `_`?

Tokenizer của JavaScript cần đọc một từ khóa như **một identifier/token duy nhất**. Vì vậy BilaScript giữ nguyên nội dung của bảng dịch nhưng chuẩn hóa khoảng trắng:

```text
haml sob      → haml_sob
trov ved      → trov_ved
trogp ki      → trogp_ki
voy jaj trir  → voy_jaj_trir
```

Đây là chuẩn hóa cú pháp để chạy được, không phải thay đổi quy tắc CVNSS4.0.

---

## 📚 Nguồn bảng dịch CVNSS4.0

Bảng lõi được tạo từ **Babylscript CVNSS4.0 Translation**, gồm:

- 61 từ khóa/từ dành riêng;
- tên đối tượng JavaScript;
- tên phương thức và thuộc tính chuẩn;
- ghi chú ngữ nghĩa đi kèm bảng dịch.

Mã Java tương ứng nằm tại:

```text
src/org/mozilla/javascript/babylscript/gen/Cvnss40.java
```

Tài liệu đối chiếu đầy đủ:

```text
docs/CVNSS40_TRANSLATION.md
```

### Chính sách va chạm từ khóa

Bảng nguồn có hai nhóm alias trùng:

```text
throw   → nemj
throws  → nemj

finally → cujb cugl
final   → cujb cugl
```

Nếu nạp nguyên trạng vào `keywordLookup`, alias xuất hiện sau có thể ghi đè alias trước.

BilaScript áp dụng chính sách parser-safe:

```text
throw   → nemj
throws  → throws

finally → cujb_cugl
final   → final
```

`throws` và `final` là từ dành riêng trong codebase Rhino/Babylscript này, còn `throw` và `finally` là từ khóa thực thi; vì vậy ưu tiên này giữ cho chương trình ECMAScript hoạt động đúng.

Bảng gốc vẫn được giữ trong `RAW_KEYWORDS` để có thể kiểm tra và truy nguyên.

---

## 🧪 Đối chiếu với CVNSS4.0 Converter Audit-Safe

BilaScript sử dụng bảng translation của Babylscript làm nguồn từ khóa. Bộ **CVNSS4.0 Converter 5.0.0 Audit-Safe** được dùng như lớp tham chiếu để kiểm tra cách biểu diễn CVNSS4.0.

Ví dụ:

```text
hàm số   → haml sob
nếu      → neub
khác     → kac
trở về   → trov ved
mới      → moix
mảng     → magz
```

Converter 5.0 cũng công khai cơ chế audit cho các ánh xạ nhiều-một, giữ tập ứng viên đảo và áp dụng chính sách canonical xác định thay vì âm thầm ghi đè kết quả.

> Lưu ý: converter và tokenizer giải quyết hai bài toán khác nhau. Converter chuyển đổi văn bản CQN ↔ CVNSS4.0; tokenizer BilaScript nhận các token CVNSS4.0 đã định nghĩa và biến chúng thành token ECMAScript.

---

## ▶️ Biên dịch và chạy

### Yêu cầu

- Java/JDK tương thích với codebase Rhino 1.7R2;
- Apache Ant;
- mã nguồn UTF-8.

### Biên dịch runner

```bash
ant babylscriptrun
```

### Chạy ví dụ CVNSS4.0

```bash
java -jar build/babylscriptrun.jar babylrunner/sample.cvss.js
```

Runner hỗ trợ nhiều tệp:

```bash
java -jar build/babylscriptrun.jar thu_vien.js chuong_trinh.cvss.js
```

---

## 🔄 Babylscript → JavaScript

Codebase gốc còn có công cụ Babyl2JS:

```bash
ant babyl2js
```

Ví dụ:

```bash
java -jar build/babyl2js.jar -html babylrunner/sample.babyl2js.js output.html
```

Mục tiêu tiếp theo của BilaScript là bảo đảm toàn bộ đường dịch Babyl2JS nhận trực tiếp alias công khai `---cvss---` giống runner.

---

## 🏗️ Thành phần chính

| Thành phần | Vai trò |
|---|---|
| `src/org/mozilla/javascript/BabylTokenizer.java` | lexer/tokenizer nền của Babylscript |
| `src/org/mozilla/javascript/babylscript/BabylGenericTokenizer.java` | ánh xạ từ khóa ngôn ngữ → token ECMAScript |
| `src/org/mozilla/javascript/babylscript/CustomTokenizer.java` | tokenizer custom kế thừa `BabylGenericTokenizer` |
| `src/org/mozilla/javascript/babylscript/CustomTokenizerConfig.java` | cấu hình bảng từ khóa custom |
| `src/org/mozilla/javascript/babylscript/gen/Cvnss40.java` | bảng CVNSS4.0 của BilaScript |
| `babylrunner/Runner.java` | nạp CVNSS4.0 và chạy mã |
| `babylrunner/sample.cvss.js` | ví dụ BilaScript CVNSS4.0 |
| `docs/CVNSS40_TRANSLATION.md` | bảng đối chiếu và chính sách parser-safe |

---

## ⚠️ Giới hạn của nền Rhino/Babylscript

BilaScript kế thừa codebase lịch sử của Babylscript/Rhino 1.7R2.

Các thay đổi đa ngôn ngữ tập trung vào interpreter. Vì vậy khi chạy BilaScript phải tắt optimizer:

```java
Context cx = Context.enter();
cx.setOptimizationLevel(-1);
```

Một số tính năng không thuần ECMAScript hoặc các phần cũ như E4X, destructuring và một số đường optimizer/bytecode compiler có thể không tương thích đầy đủ với cơ chế Babylscript.

BilaScript nên được xem là:

> **một nền tảng JavaScript/ECMAScript đa ngôn ngữ phục vụ thử nghiệm CVNSS4.0, giáo dục và nghiên cứu**, không phải một engine thay thế cho JavaScript hiện đại.

---

## 🔐 Nguyên tắc thiết kế

1. **Giữ nguyên lõi ECMAScript** — không tự sáng tạo semantics mới nếu không cần thiết.
2. **CVNSS4.0 là lớp ngôn ngữ bề mặt** — keyword/API alias được ánh xạ về token và đối tượng JavaScript.
3. **Có thể kiểm tra** — bảng gốc và bảng parser-safe được tách rõ.
4. **Không âm thầm xử lý va chạm** — các alias trùng phải có chính sách rõ ràng.
5. **UTF-8 xuyên suốt**.
6. **Tương thích Babylscript** — tận dụng kiến trúc gốc thay vì viết lại parser từ đầu.
7. **Có thể trộn ngôn ngữ** — mã CVNSS4.0 và mã JavaScript tiếng Anh có thể cùng tồn tại theo language block.

---

## 📜 Giấy phép và nguồn gốc

BilaScript phát triển trên mã nguồn Babylscript, mà Babylscript được xây dựng bằng cách sửa đổi Mozilla Rhino 1.7R2.

Các tệp Rhino/Babylscript tiếp tục tuân theo thông báo giấy phép đi kèm mã nguồn gốc, chủ yếu theo mô hình **MPL 1.1 / GPL 2.0** trong repository này.

Không xóa các license header và thông báo bản quyền của mã nguồn kế thừa.

### Ghi nhận

- **Mozilla Rhino** — JavaScript engine viết bằng Java;
- **Babylscript** — lớp JavaScript đa ngôn ngữ trên Rhino;
- **CVNSS4.0 Translation** — bảng ngôn ngữ dùng để tạo lớp từ khóa BilaScript;
- **BilaScript** — biến thể hướng CVNSS4.0 và cộng đồng yêu thích CVNSS4.0.

---

## 💙 Triết lý BilaScript

> **JavaScript vẫn là JavaScript. Người dùng chỉ cần được phép tiếp cận nó bằng một lớp ngôn ngữ quen thuộc hơn.**

BilaScript không cố tách cộng đồng CVNSS4.0 khỏi hệ sinh thái JavaScript. Mục tiêu là tạo một cây cầu:

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

Bằng cách cho phép lập trình viên sử dụng mã JavaScript không phải tiếng Anh trong các ứng dụng thực tế, BilaScript hướng đến việc đưa JavaScript đến với nhiều người dùng hơn — đặc biệt là cộng đồng nghiên cứu, học tập và yêu thích CVNSS4.0.
