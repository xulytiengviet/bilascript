# Lịch sử kiến trúc BilaScript

| Phiên bản | Mốc chính |
|---|---|
| v1.0.0 | Đưa vocabulary CVNSS4.0 vào dòng Babylscript/Rhino để thử nghiệm JavaScript đa ngôn ngữ. |
| v1.2.0 | `bila` trở thành language mode native trong tokenizer Rhino/Babylscript; thêm mapping API và xử lý collision parser-safe. |
| v2.0.0 | Chuẩn hóa ba profile `bila`, `bila:strict`, `bila:js`; giữ hình dạng JavaScript và thêm lexical bridge/spec. |
| v3.0.0 | Tách frontend mới khỏi Rhino: Bila Lexer → Bila Parser → Bila AST → Semantic → JavaScript Codegen. |
| v3.5.0 | Zero-cost frontend: semantic keyword IDs, receiver-safe aliasing, source locations/source maps, Unicode identifiers, modern operator surface (`=>`, `?.`, `??`, spread), performance contract và Pascal-inspired site. |
