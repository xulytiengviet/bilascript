# BilaScript v2.0.0 — JavaScript-compatible CVNSS4.0 Grammar

BilaScript 2.0 chuyển dự án từ “native CVNSS4.0 mode trên Babylscript” thành một **language profile được đặc tả rõ**: giữ cấu trúc/cú pháp JavaScript và chuẩn hóa semantic vocabulary sang CVNSS4.0.

## Thành phần đã triển khai
- `---bila---`: canonical + English fallback.
- `---bila:strict---`: canonical keyword profile, không nạp English keyword fallback.
- `---bila:js---`: migration profile cho JavaScript.
- Lexer hiểu dấu `:` trong language directive.
- `TokenStream.LanguageMode.bila`, `bila_strict`, `bila_js`.
- Cùng một object/property/method translation namespace cho cả 3 profile.
- `spec/BilaScript-2.0.ebnf`: grammar JavaScript-compatible.
- `spec/bila-vocabulary-v2.json`: vocabulary máy đọc sinh từ `Cvnss40.java`.
- `tools/bilac_v2.py`: `to-js`, `from-js`, `fmt`, `check --strict`.
- Examples cho default/strict/js migration.

## Mục tiêu ngữ pháp
```text
JavaScript syntax + operators + punctuation
                ↓ giữ nguyên
Bila semantic vocabulary
                ↓ canonical CVNSS4.0
ECMAScript-compatible program structure
```

## Lưu ý runtime
JAR Java vẫn kế thừa Rhino 1.7R2, vì vậy runtime không tự nhiên có toàn bộ ECMAScript hiện đại. Tooling v2 được tách khỏi giới hạn đó để có thể làm backend JavaScript mới trong các bản tiếp theo mà không đổi grammar/vocabulary.
