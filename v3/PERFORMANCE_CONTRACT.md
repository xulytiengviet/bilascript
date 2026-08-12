# BilaScript v3.5 — Zero-cost Frontend Performance Contract

BilaScript không thay thế JavaScript runtime. CVNSS4.0 tồn tại ở **frontend**; JavaScript đảm nhiệm thực thi.

## Hợp đồng

1. Số, literal, dấu câu và toán tử JavaScript được giữ nguyên về mặt cú pháp/semantics.
2. Canonical CVNSS4.0 được chuyển thành semantic token (`KW_IF`, `KW_RETURN`, ...) trước parser; AST không phụ thuộc spelling.
3. Compiler không chèn runtime translator, Proxy, wrapper array/object hay helper call cho construct 1:1.
4. Built-in alias chỉ được đổi khi semantic normalizer chứng minh receiver phù hợp. `ds.dayq()` với `ds` là Array → `ds.push()`; `obj.dayq()` không rõ kiểu → giữ `dayq` và cảnh báo.
5. JavaScript output là code trực tiếp để V8/SpiderMonkey/JavaScriptCore/Bun tối ưu như JavaScript thông thường.
6. Source map được tạo ở compile-time; không thêm overhead runtime.

Không tuyên bố BilaScript nhanh hơn JavaScript. Mục tiêu là runtime performance tương đương **JavaScript được sinh ra**, và không thêm chi phí dịch CVNSS4.0 khi chạy.
