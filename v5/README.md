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


## 50 bài toán mẫu chạy trực tiếp

- Truy cập `/v5/`. Thanh bên có 50 bài, chia đều năm nhóm: Cơ bản, Điều kiện, Vòng lặp, Mảng, Thuật toán & ứng dụng.
- Chọn bài → ô mã `.bila` được nạp từ `v5/examples.mjs` → nhấn **Chạy bài toán** (hoặc Ctrl+Enter). Ô kết quả hiển thị kết quả **thực sự thực thi**, không phải chuỗi kết quả viết sẵn.
- Mỗi bài khai báo `haml_sob bai() {...}`; trình chạy chủ động gọi `bai()` sau khi compiler sinh JavaScript. Có ô kết quả mẫu để đối chiếu và ô JavaScript sinh ra có thể mở rộng.
- Mọi bài đều dùng canonical CVNSS4.0 keywords `haml_sob`, `trov_ved`, `bilb`, `neub`, `vil`, `trogp_ki`, v.v., không cần `JS_PASSTHROUGH`, `console.log` hoặc alias mới chưa được kiểm toán.
- Tạo kết quả cục bộ bên trong iframe không cùng origin (`sandbox="allow-scripts"`) với Worker riêng và giới hạn chạy 2,5 giây. Không chạy mã do người dùng nhập trên luồng giao diện chính. Cài đặt CSP trong iframe hạn chế mạng. Đây **không phải** môi trường thực thi mã độc an toàn tuyệt đối.
- Không thu thập hay tự gửi mã nguồn, không ký/gửi giao dịch blockchain; ví dụ blockchain là bài kiểm tra hạn mức off-chain.

Kiểm thử cả 50 bài bằng compiler CVNSS strict và JavaScript VM có giới hạn thời gian:

```bash
node --test v5/test/*.test.mjs
node --check v5/playground.mjs
node --check v5/src/demo-runner.mjs
```
