# BilaScript v1.2.0 — Native `---bila---` CVNSS4.0

BilaScript v1.2.0 chuyển lớp CVNSS4.0 từ custom channel lịch sử của Babylscript thành một **language mode native** trong Rhino/Babylscript fork này.

## Chỉ thị chính

```text
---bila---
```

Các chỉ thị cũ `---cvss---`, `---cvnss---`, `---cvnss40---`, `---cvnss4---` vẫn được nhận để tương thích ngược, nhưng tất cả cùng ánh xạ về `LanguageMode.bila`.

## Pipeline v1.2.0

```text
*.bila.js
   ↓
---bila---
   ↓
TokenStream.LanguageMode.bila
   ↓
BabylGenericTokenizer.createBilaTokenizer()
   ↓
Cvnss40.keywordMap()
   ↓
Rhino Parser / Interpreter
   ↓
TranslatedNameBindings["bila"]
   ↓
JavaScript / HTML
```

## Quy tắc “CVNSS4.0 tối đa, ECMAScript an toàn”

- Từ khóa, từ dành riêng và API chuẩn mà có ánh xạ CVNSS4.0 duy nhất/an toàn được dùng bằng CVNSS4.0.
- Các alias có nguy cơ va chạm parser giữ dạng gốc. Hai trường hợp đã biết là `throws` và `final`, vì dữ liệu nguồn trùng alias với `throw` và `finally`.
- Các thuật ngữ toán học/quốc tế hoặc API không có bản chuyển an toàn có thể giữ nguyên.
- Identifier do người dùng đặt (tên biến, tên hàm, tên lớp logic) được phép viết trực tiếp theo CVNSS4.0. Engine không tự ý đổi tên identifier tùy ý vì việc đó có thể phá liên kết scope/property.

## Ví dụ

```javascript
---bila---

haml_sob tong(a, b) {
    trov_ved a + b;
}

bilb cetb_qaz = tong(10, 20);
java.lang.System.out.println(cetb_qaz);
```

Trong đó `bilb` là alias v1.2.0 cho `var` (từ “biến” → CVNSS4.0), còn tên `cetb_qaz` là identifier CVNSS4.0 do lập trình viên đặt.

## Phạm vi “toàn diện”

“Toàn diện” ở v1.2.0 nghĩa là bề mặt ngôn ngữ **mà Rhino 1.7R2/Babylscript hiện thực sự hỗ trợ**: lexer, từ khóa, built-in objects, properties/methods và compiler Babyl2JS. Đây không phải lời khẳng định hỗ trợ toàn bộ ECMAScript 2026/Node.js/TypeScript.
