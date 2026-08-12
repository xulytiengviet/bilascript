# BilaScript v3.5.0 — Zero-cost CVNSS4.0 Frontend

## Tuyên ngôn

**BilaScript không thay thế JavaScript runtime; BilaScript làm chủ cách con người viết chương trình, còn JavaScript đảm nhiệm việc chạy chương trình.**

V3.5 tiếp tục kiến trúc v3 nhưng siết ranh giới frontend/backend. Số, dấu câu và toán tử được giữ nguyên như JavaScript. Canonical CVNSS4.0 chỉ là surface vocabulary và được chuyển thành semantic IDs trước parser.

```text
*.bila
  ↓
Bila Lexer: CVNSS4.0 → KW_* semantic token
  ↓
Bila Parser
  ↓
Bila AST
  ↓
Semantic Analyzer
  ↓
Normalizer + receiver-safe alias resolution
  ↓
Normalized Bila AST
  ↓
JavaScript Codegen + Source Map
  ↓
Browser / Node / Bun / JavaScript runtime
```

## Điểm mới so với v3.0

- Keyword token chuyển sang backend-neutral IDs (`KW_IF`, `KW_FUNCTION`, ...), không dùng chuỗi JavaScript làm identity nội bộ.
- Token/AST có source span phục vụ diagnostics và source map.
- Normalizer chỉ đổi built-in member CVNSS4.0 khi receiver type được suy luận an toàn.
- Unknown/custom API được giữ nguyên, tránh phá npm/user object.
- Không có Bila runtime wrapper; construct 1:1 sinh JavaScript trực tiếp.
- Numeric literal giữ raw JavaScript, gồm hex/binary/octal, separator và BigInt surface.
- Unicode identifier của người dùng được giữ nguyên.
- Hỗ trợ thêm structural syntax không cần bản địa hóa: arrow `=>`, optional chaining `?.`, nullish `??`, spread `...`.
- CLI có `tokens`, `--normalized`, `--map`.
- Website chuyển sang Pascal-inspired dark blue / white / yellow minimal theme và bổ sung lịch sử phiên bản.

## Giới hạn

V3.5 chưa tuyên bố full ECMAScript/Test262 conformance. Template literal có `${...}` vẫn bị chặn vì compiler chưa tái lex expression bên trong. Module/class/async-await/destructuring đầy đủ, LSP và type system tĩnh là roadmap tiếp theo.
