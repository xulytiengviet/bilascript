# BilaScript 2.0 — Language profiles

## `---bila---`
CVNSS4.0 là spelling canonical. Từ khóa ECMAScript gốc vẫn là compatibility alias để di trú mã cũ và xử lý trường hợp chưa thể chuẩn hóa an toàn.

## `---bila:strict---`
Tokenizer chỉ đăng ký bảng keyword canonical của Bila. Nếu một spelling CVNSS4.0 tồn tại, keyword tiếng Anh không còn được nhận như keyword. Các spelling tiếng Anh được giữ nguyên trong bảng vì collision/parser-safety vẫn được phép.

## `---bila:js---`
Profile di trú JavaScript: chấp nhận đồng thời vocabulary JavaScript và Bila, giữ nguyên dấu câu/toán tử/cấu trúc JavaScript.

## Alias cũ
`---cvss---`, `---cvnss---`, `---cvnss40---`, `---cvnss4---` ánh xạ về profile mặc định `bila`.
