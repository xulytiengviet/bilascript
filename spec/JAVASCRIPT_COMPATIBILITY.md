# JavaScript Compatibility Policy — BilaScript 2.0

BilaScript 2.0 **dùng lại cú pháp JavaScript**. Các thành phần sau giữ nguyên: `{ } ( ) [ ]`, `. , ; :`, toán tử số học/logic/so sánh/gán, object literal, array literal, function call, member access, string/number literal và comment.

BilaScript thay **semantic vocabulary**: keyword, reserved word có mapping an toàn, built-in object, global function, property và method chuẩn. Identifier do người dùng đặt không bị dịch tự động bởi engine.

### Runtime hiện tại
Java runtime kế thừa Rhino 1.7R2/Babylscript nên chỉ thực thi tập ECMAScript mà engine đó hỗ trợ. `bilac_v2.py` là lexical bridge cho source JavaScript hiện đại hơn, nhưng không được xem là full ECMAScript parser. Arrow functions, modules, async/await và các feature mới hơn được giữ nguyên về dấu/cấu trúc khi bridge không cần hiểu chúng; thực thi phụ thuộc backend JavaScript đích.

### Quy tắc an toàn
1. Không đổi string/comment.
2. Keyword canonical là reserved vocabulary của Bila.
3. Property/method chỉ canonicalize sau dấu `.` trong lexical bridge.
4. Một nhóm built-in global chuẩn có thể canonicalize ở global position.
5. Collision CVNSS4.0 không được overwrite im lặng; spelling English parser-safe được giữ nếu chưa có mapping duy nhất.
