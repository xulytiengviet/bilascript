BILASCRIPT / BABYLSCRIPT - HƯỚNG DẪN BỘ CÔNG CỤ DÒNG LỆNH
=========================================================

Mã nguồn Babylscript dựa trên trình thông dịch JavaScript Mozilla Rhino 1.7R2.
Do Babylscript là biến thể của Rhino nên các thành phần kế thừa tiếp tục sử dụng
các điều khoản giấy phép tương ứng của mã nguồn gốc, chủ yếu theo mô hình giấy
phép kép MPL 1.1 / GPL 2.0.

Gói công cụ có hai tệp JAR chính:

1. babylscriptrun.jar
   Trình chạy Babylscript dựa trên Java. Công cụ cung cấp một lớp bao đơn giản
   để thực thi mã Babylscript/Rhino/JavaScript từ dòng lệnh và có thể gọi trực
   tiếp các lớp Java từ script.

2. babyl2js.jar
   Trình dịch Babylscript sang JavaScript thông thường để mã kết quả có thể chạy
   trong trình duyệt.


TRÌNH CHẠY BABYLSCRIPT TRÊN JAVA
================================

BẮT ĐẦU NHANH

Repo có sẵn ví dụ Hello World tại "sample.js". Chạy bằng:

   java -jar babylscriptrun.jar sample.js

THÔNG TIN BỔ SUNG

Có thể chạy nhiều tệp theo thứ tự để nạp thư viện trước chương trình chính:

   java -jar babylscriptrun.jar lib.js sample.js

Các tệp nguồn dùng với trình chạy phải được lưu ở UTF-8 để bảo đảm ký tự Unicode
và các ngôn ngữ không dùng bảng chữ cái Latin được xử lý đúng.


TRÌNH DỊCH BABYLSCRIPT SANG JAVASCRIPT
======================================

BẮT ĐẦU NHANH

Ví dụ nguồn nằm tại "sample.babyl2js.js". Chuyển tệp này sang JavaScript được
bọc trong một trang HTML bằng:

   java -jar babyl2js.jar -html sample.babyl2js.js output.html

Sau đó mở output.html bằng trình duyệt để chạy kết quả.

THÔNG TIN BỔ SUNG

Trình dịch nhận tệp nguồn Babylscript mã hóa UTF-8 và tạo tệp JavaScript đầu ra
cũng theo UTF-8.

Các tùy chọn dòng lệnh chính:

   -html
      Bọc mã kết quả trong cấu trúc HTML và thẻ <script>...</script> để tệp đầu
      ra có thể mở trực tiếp trong trình duyệt.

   -noheaders
      Không chèn thư viện runtime Babylscript vào phần đầu của mã kết quả.

Nếu một ứng dụng gồm nhiều tệp Babylscript/JavaScript, runtime chỉ cần xuất hiện
trong tệp đầu tiên được trang HTML tải. Chèn runtime nhiều lần vẫn có thể chạy,
nhưng sẽ làm tăng kích thước đầu ra không cần thiết.


LƯU Ý CHO BILASCRIPT
====================

BilaScript là fork định hướng Việt hóa của Babylscript. Tài liệu tiếng Việt đầy
đủ hơn nằm tại README.md ở thư mục gốc. Engine hiện vẫn giữ nguyên danh sách chế
độ ngôn ngữ của Babylscript gốc; hỗ trợ cú pháp tiếng Việt ---vi--- cần được bổ
sung ở cấp tokenizer, bảng từ khóa, ánh xạ thư viện chuẩn và kiểm thử.
