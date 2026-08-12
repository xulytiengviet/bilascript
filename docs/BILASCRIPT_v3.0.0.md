# BilaScript v3.0.0 — Native CVNSS4.0 Frontend / JavaScript Backend

## Tóm tắt
BilaScript v3 chuyển ranh giới sở hữu công nghệ: thay vì để Rhino/Babylscript quyết định toàn bộ quá trình phân tích cú pháp, v3 có frontend riêng gồm lexer, parser, AST và semantic analyzer. JavaScript chỉ còn là backend đầu tiên.

## Bản chất
BilaScript không phải một VM JavaScript mới. V3 là một **source language + compiler frontend** có bề mặt CVNSS4.0 và cấu trúc JavaScript-compatible. Nó hạ AST Bila sang JavaScript để tận dụng browser/Node/Bun.

## Kiến trúc
```text
Bila source
  ↓ lexical analysis
Bila tokens
  ↓ parsing
Bila AST
  ↓ semantic analysis
Validated Bila AST
  ↓ JavaScript code generation
ECMAScript source
  ↓
Browser / Node / Bun
```

## Tại sao quan trọng
1. AST không phụ thuộc spelling `neub` hay `if`; nó mang `IfStatement`.
2. Backend có thể thay mà không đổi source Bila.
3. Diagnostics thuộc Bila, không phụ thuộc thông báo lỗi Rhino.
4. CVNSS4.0 trở thành lexical/semantic contract của frontend.
5. Legacy Rhino có thể tiếp tục tồn tại như compatibility runtime, nhưng không còn là kiến trúc duy nhất.

## Phạm vi đã triển khai trong 3.0.0
Một core JavaScript-compatible có thể chạy thực tế: declarations, functions, control flow cơ bản, exceptions, arrays/objects, calls/member access, new, expression precedence, semantic diagnostics và JS codegen. Full ESNext chưa phải phạm vi v3.0.0.

## Ghi công
BilaScript v3 Core được phát triển bởi **Long Ngo**, dựa trên **CVNSS4.0**, phát hành theo **MIT License** cho phần mã mới trong `v3/`. Di sản Rhino/Babylscript giữ giấy phép upstream.
