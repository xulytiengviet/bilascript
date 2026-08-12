# CVNSS4.0 Canonical Vocabulary — BilaScript 2.0

Nguồn máy đọc chính thức: `spec/bila-vocabulary-v2.json`, được sinh trực tiếp từ `Cvnss40.java` trong quá trình nâng cấp để engine và tooling dùng cùng một vocabulary.

Mỗi semantic keyword có hai lớp:

```text
source spelling (haml_sob / function)
        ↓ lexer
semantic token (KW_FUNCTION)
        ↓ parser
FunctionDeclaration
```

CVNSS4.0 spelling là canonical. English spelling là compatibility alias tùy profile. Cú pháp nhiều từ chuẩn hóa khoảng trắng thành `_` để tạo một JavaScript identifier/token parser-safe.

BilaScript không CVNSS4.0 hóa dấu câu, toán tử, protocol/standard identifier (`JSON`, `URL`, `HTTP`, `WebSocket`, `WebAssembly`...) nếu việc đổi tên làm giảm khả năng tương thích hoặc không có canonical mapping đã kiểm chứng.
