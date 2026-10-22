# BilaScript 5.0 Alpha — Đóng băng từ vựng CVNSS4.0

## Hợp đồng tương thích

**Toàn bộ mã compiler v4/src vẫn giữ nguyên.** Các dự án trước đây tiếp tục dùng lệnh:
```bash
node v4/bin/bila.js compile v4/examples/hello.bila -o output.js
```
Hoặc API `compileLegacy(source)` xuất nguyên kết quả compiler v4 (kể cả các JS_PASSTHROUGH đã từng được chấp nhận).

Compiler strict mới được truy cập qua `v5/src/strict.mjs` và yêu cầu `---bila:strict---`.
```js
import {compileStrict,compileLegacy} from "./v5/src/strict.mjs";
const result=compileStrict("---bila:strict---\nhaml_sob f(a){ trov_ved a+1; }");
const old=compileLegacy("---bila:strict---\nbilb x=typeof 42;");
```

## Frozen registry

- `vocabulary-lock.json`: 22 từ khóa CVNSS canonical, 8 global aliases, 24 members receiver-safe; snapshot trên commit `32a04d50` của BilaScript v4.
- 11 từ khóa `JS_PASSTHROUGH` của v4 được ghi nhận **là danh mục cấm trong strict v5**, không tự đặt tên CVNSS thay thế.
- Từng lần nới rộng hoặc đổi alias phải tạo lock version mới, có kiểm tra collisions và hồi quy.
- Bảng khóa tự kiểm tra drift với `v4/src/vocabulary.js` (mã lỗi `BILA-CV500`).

## Fail-closed policy

- `BILA-CV400`: thiếu profile strict;
- `BILA-CV401`: JS_PASSTHROUGH `async`, `await`, `typeof`, `this`, `in`, ...;
- `BILA-CV402`: một số từ khóa JS khác chưa có canonical CVNSS;
- `BILA-CV403`: template có nội suy chưa thể lower CVNSS an toàn;
- Bộ kiểm tra type/receiver và `BILA-T310` của v4 được giữ nguyên.

## Phạm vi

Alpha **chưa hỗ trợ toàn bộ JS APIs hoặc 100% npm/Web3 trong mã nguồn strict**. Chưa có alias chính thức thì từ chối thay vì giả đoán. Cú pháp `console.log` và host APIs vẫn cần registry riêng trong bản phát triển tiếp theo. JavaScript chỉ hiện diện ở mã đã biên dịch và các đường tương thích đã công bố. Không phát sinh VM, Proxy hay runtime translator.

## CI và website
```bash
node --test v5/test/*.test.mjs
cd v4 && npm test
```
Mở `/v5/` trên GitHub Pages sau khi nhánh chính được hợp nhất. Nếu Pages dùng nguồn branch, chọn `Babylscript1_7R2_BRANCH` và `/(root)` tại Settings → Pages. Kết nối GitHub dùng cho thay đổi mã **không có khả năng chỉnh Settings → Pages**.
