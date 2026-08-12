# 🇻🇳 BilaScript

> **JavaScript đa ngôn ngữ dựa trên Mozilla Rhino 1.7R2 — được tài liệu hóa và Việt hóa cho cộng đồng người dùng Việt Nam.**

![Java](https://img.shields.io/badge/Java-Rhino%201.7R2-orange?logo=openjdk)
![Encoding](https://img.shields.io/badge/Encoding-UTF--8-blue)
![License](https://img.shields.io/badge/License-MPL%201.1%20%2F%20GPL%202.0-green)
![Status](https://img.shields.io/badge/Status-Legacy%20Engine-yellow)

## 📌 Giới thiệu

**BilaScript** là bản fork và lớp tài liệu hóa tiếng Việt của **Babylscript**, một biến thể của trình thông dịch JavaScript **Mozilla Rhino 1.7R2**. Ý tưởng cốt lõi của Babylscript là cho phép viết JavaScript bằng nhiều ngôn ngữ tự nhiên thông qua:

- bộ từ khóa được dịch theo từng ngôn ngữ;
- cơ chế chuyển đổi chế độ ngôn ngữ ngay trong mã nguồn;
- ánh xạ tên hàm, đối tượng và thuộc tính của thư viện chuẩn;
- trình chạy trên Java;
- công cụ chuyển Babylscript sang JavaScript thông thường.

Repo này ưu tiên **giữ nguyên hành vi kỹ thuật của mã nguồn gốc**, đồng thời bổ sung tài liệu tiếng Việt rõ ràng, dễ đọc và dễ thử nghiệm.

---

## 🧬 Nguồn gốc kiến trúc

Chuỗi kế thừa của dự án:

```text
Mozilla Rhino
   ↓
Babylscript
   ↓
BilaScript
```

BilaScript hiện dựa trên nhánh mã nguồn Babylscript được xây dựng từ **Rhino 1.7R2**.

> ⚠️ Lưu ý quan trọng: các thay đổi của Babylscript tập trung vào **interpreter**. Phần optimizer/bytecode compiler của Rhino không tương thích đầy đủ với các thay đổi này.

Vì vậy khi nhúng engine vào Java, cần tắt tối ưu hóa:

```java
Context cx = Context.enter();
cx.setOptimizationLevel(-1);
try {
    Scriptable scope = cx.initStandardObjects();
    cx.evaluateString(scope, code, null, 0, null);
} finally {
    Context.exit();
}
```

---

## 🌍 Cơ chế đa ngôn ngữ

Babylscript cho phép đổi ngôn ngữ bằng cú pháp dạng:

```text
---fr---
```

hoặc:

```text
---en---
```

Ví dụ có sẵn trong repo:

```javascript
---fr---
fonction afficher(texte) {
    java.lang.System.out.println(texte);
}
ceci['en':'show'] = ceci['ro':'afișează'] = 'afficher';

---en---
show('Hello world');
```

Ý tưởng là cùng một chương trình có thể khai báo tên hàm ở một ngôn ngữ và ánh xạ sang tên tương đương ở ngôn ngữ khác.

### Các chế độ ngôn ngữ đang có trong engine gốc

`ar`, `bn`, `de`, `en`, `eo`, `es`, `fr`, `hi`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `ro`, `ru`, `sw`, `tr`, `zh` và chế độ thử nghiệm `test`.

> 🇻🇳 **Tiếng Việt (`vi`) chưa có trong engine gốc.** Việc bổ sung `---vi---` cần cập nhật tokenizer, bảng từ khóa, ánh xạ đối tượng chuẩn và bộ kiểm thử để bảo đảm tương thích.

---

## 🏗️ Kiến trúc chính

```text
Mã BilaScript/Babylscript UTF-8
            │
            ▼
     TokenCharStream
            │
            ▼
      BabylTokenizer
            │
            ├── bộ từ khóa theo ngôn ngữ
            ├── nhận diện ---xx---
            └── chuẩn hóa token
            │
            ▼
        TokenStream
            │
            ▼
      Rhino Interpreter
            │
      ┌─────┴─────────────┐
      ▼                   ▼
  Chạy trên Java     Dịch sang JavaScript
                          │
                          ▼
                      Trình duyệt
```

Các thành phần đáng chú ý:

| Thành phần | Vai trò |
|---|---|
| `src/org/mozilla/javascript/TokenStream.java` | quản lý chế độ ngôn ngữ và tokenizer hiện hành |
| `src/org/mozilla/javascript/BabylTokenizer.java` | tokenizer mở rộng, nhận diện từ khóa và mã ngôn ngữ |
| `src/org/mozilla/javascript/babylscript/` | tokenizer và bảng ánh xạ đa ngôn ngữ |
| `babylrunner/Runner.java` | trình chạy Babylscript trên Java |
| `babylrunner/Babyl2JS.java` | chuyển Babylscript sang JavaScript |
| `babylrunner/sample.js` | ví dụ Hello World đa ngôn ngữ |

---

## 🚀 Bắt đầu nhanh

### 1. Yêu cầu

- Java Development Kit phù hợp với mã nguồn cũ của dự án;
- Apache Ant;
- tệp nguồn lưu ở UTF-8.

### 2. Biên dịch trình chạy

Từ thư mục gốc:

```bash
ant babylscriptrun
```

Sau khi biên dịch, chạy ví dụ:

```bash
java -jar build/babylscriptrun.jar babylrunner/sample.js
```

### 3. Biên dịch công cụ Babylscript → JavaScript

```bash
ant babyl2js
```

Chuyển tệp mẫu sang HTML:

```bash
java -jar build/babyl2js.jar -html babylrunner/sample.babyl2js.js output.html
```

Sau đó mở `output.html` bằng trình duyệt.

---

## 🛠️ Các tùy chọn của Babyl2JS

| Tùy chọn | Mô tả |
|---|---|
| `-html` | bọc mã kết quả trong thẻ HTML/`<script>` để mở trực tiếp bằng trình duyệt |
| `-noheaders` | không chèn thư viện runtime Babylscript vào đầu tệp kết quả |

Nếu một ứng dụng gồm nhiều tệp Babylscript/JavaScript, runtime chỉ cần được chèn ở tệp đầu tiên được tải.

---

## ⚠️ Giới hạn kỹ thuật

Đây là một codebase lịch sử dựa trên Rhino 1.7R2, vì vậy cần lưu ý:

- optimizer/bytecode compiler không hoạt động đúng với các sửa đổi Babylscript;
- nên chạy interpreter với `setOptimizationLevel(-1)`;
- một số phần không thuần ECMAScript như destructuring, `let`, E4X... có thể không tương thích hoàn toàn;
- build script được kế thừa từ Rhino cũ và có thể cần điều chỉnh trên JDK hiện đại;
- không nên xem dự án là engine JavaScript hiện đại thay thế cho V8, GraalJS hay Rhino phiên bản mới.

---

## 🇻🇳 Định hướng Việt hóa

Mục tiêu của BilaScript là đưa ý tưởng “lập trình bằng ngôn ngữ tự nhiên” đến gần hơn với người dùng Việt Nam theo cách có thể kiểm thử và bảo trì.

Các bước kỹ thuật đề xuất:

1. thêm `LanguageMode.vi`;
2. hỗ trợ chỉ thị `---vi---`;
3. xây dựng bảng từ khóa JavaScript tiếng Việt;
4. ánh xạ các tên chuẩn như `Array`, `String`, `Math`, `Date`, `Object` sang bí danh tiếng Việt;
5. thêm bộ test Việt ↔ Anh;
6. bảo đảm mã nguồn UTF-8 và xử lý dấu tiếng Việt ổn định;
7. bổ sung ví dụ và tài liệu cú pháp tiếng Việt.

Ví dụ cú pháp mục tiêu trong tương lai:

```javascript
---vi---
hàm chao(ten) {
    trả_về "Xin chào " + ten;
}
```

> Đoạn trên minh họa định hướng thiết kế, **chưa phải cú pháp đang được engine hỗ trợ**.

---

## 📁 Cấu trúc repo

```text
bilascript/
├── babylrunner/      # trình chạy và trình dịch Babylscript → JavaScript
├── babyltest/        # kiểm thử
├── babyltools/       # công cụ hỗ trợ
├── examples/         # ví dụ kế thừa từ Rhino/Babylscript
├── src/              # mã nguồn Java chính
├── build.xml         # Apache Ant build
├── LICENSE.txt       # giấy phép gốc
└── README.md         # tài liệu tiếng Việt
```

---

## 📜 Giấy phép và ghi nhận nguồn

Phần lớn mã nguồn Rhino trong repo sử dụng mô hình **dual-license MPL 1.1 / GPL 2.0** theo các điều khoản đi kèm mã nguồn gốc.

BilaScript không xóa hoặc thay đổi các thông báo bản quyền và giấy phép của Rhino/Babylscript. Khi phân phối lại hoặc sửa đổi mã nguồn, hãy đọc kỹ `LICENSE.txt` và các license header trong từng tệp.

### Ghi nhận

- **Mozilla Rhino** — nền tảng JavaScript engine viết bằng Java;
- **Babylscript** — lớp mở rộng đa ngôn ngữ trên Rhino;
- **BilaScript** — fork định hướng Việt hóa và tài liệu hóa cho cộng đồng Việt Nam.

---

## 🤝 Đóng góp

Đóng góp được khuyến khích theo hướng:

- bổ sung tokenizer tiếng Việt;
- thiết kế bộ từ khóa tiếng Việt nhất quán;
- test Unicode và dấu tiếng Việt;
- tương thích JDK hiện đại;
- chuẩn hóa build;
- bổ sung ví dụ giáo dục và tài liệu kiến trúc.

Khi sửa engine, nên giữ thay đổi nhỏ, có test và không phá khả năng chạy các chương trình Babylscript cũ.

---

## ⭐ Tóm tắt

**BilaScript = Rhino 1.7R2 + Babylscript + lớp tài liệu/định hướng Việt hóa.**

Đây là một dự án thú vị để nghiên cứu:

- thiết kế ngôn ngữ lập trình đa ngôn ngữ;
- tokenizer và parser;
- ánh xạ từ khóa theo ngôn ngữ tự nhiên;
- tương tác Java ↔ JavaScript;
- biên dịch nguồn sang nguồn;
- Unicode và quốc tế hóa ngôn ngữ lập trình.
