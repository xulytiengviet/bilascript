# BilaScript v3 Core

**BilaScript v3.0.0** là frontend ngôn ngữ CVNSS4.0 độc lập ở mức compiler core: Bila tự sở hữu lexer, parser, AST, semantic diagnostics và JavaScript code generator. JavaScript được dùng như **backend thực thi**, không còn là nơi định nghĩa vocabulary/grammar bề mặt của Bila.

```text
*.bila
  ↓
Bila Lexer
  ↓
Bila Parser
  ↓
Bila AST
  ↓
Semantic Analyzer
  ↓
JavaScript Codegen
  ↓
Browser / Node.js / Bun / JS runtime
```

## Chạy

```bash
cd v3
npm test
node bin/bila.js run examples/hello.bila
node bin/bila.js compile examples/hello.bila -o hello.js
node bin/bila.js ast examples/hello.bila
```

## Phạm vi v3.0 Core

Frontend hiện hỗ trợ một tập lõi JavaScript-compatible: biến, hàm, block, `if/else`, `for`, `while`, `do/while`, `return`, `break`, `continue`, `try/catch/finally`, `throw`, array/object literal, call, member access, `new`, toán tử unary/binary/assignment/conditional và canonical built-in/member CVNSS4.0.

Đây **không phải full ECMAScript 2026 parser**. `class`, module ESM, template literal, destructuring, generator, async/await và nhiều cú pháp ESNext là roadmap sau v3.0.

## License và ghi công

BilaScript v3 Core: **MIT License** — Copyright © 2026 **Long Ngo**. Dự án được phát triển dựa trên hệ chữ **CVNSS4.0**. Các file lịch sử Rhino/Babylscript bên ngoài `v3/` tiếp tục tuân thủ giấy phép upstream tương ứng.
