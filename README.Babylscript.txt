BILASCRIPT CVNSS4.0 / BABYLSCRIPT
=================================

BilaScript là một biến thể JavaScript (ECMAScript) mã nguồn mở dành cho cộng
đồng yêu thích CVNSS4.0. Dự án kế thừa theo chuỗi:

   Mozilla Rhino 1.7R2 -> Babylscript -> BilaScript CVNSS4.0

Babylscript mở rộng Rhino để JavaScript có thể dùng các từ khóa và tên API ở
nhiều ngôn ngữ. BilaScript tận dụng chính kiến trúc này để nạp bảng
"Babylscript CVNSS4.0 Translation" vào cơ chế tokenizer của Babylscript.

BẢN CHẤT KỸ THUẬT
=================

CustomTokenizer của Babylscript kế thừa BabylGenericTokenizer. BilaScript Runner
nạp Cvnss40.keywordMap() vào CustomTokenizerConfig và nạp Cvnss40.objectMap()
cho các tên đối tượng/phương thức chuẩn. Mã nguồn công khai dùng chỉ thị:

   ---cvss---

Runner cũng nhận các bí danh ---cvnss---, ---cvnss40--- và ---cvnss4---. Để giữ
nguyên lõi Babylscript, runner ánh xạ các chỉ thị này sang kênh custom-language
nội bộ ---test--- trước khi parser xử lý. Việc phân tích token vẫn đi qua
CustomTokenizer -> BabylGenericTokenizer -> Rhino Parser/Interpreter.

Các cụm CVNSS4.0 nhiều từ được chuẩn hóa khoảng trắng thành dấu gạch dưới để tạo
một token JavaScript hợp lệ, ví dụ:

   function  : haml sob     -> haml_sob
   if        : neub         -> neub
   else      : kac          -> kac
   while     : trogp ki     -> trogp_ki
   return    : trov ved     -> trov_ved
   new       : moix         -> moix
   null      : voy jaj trir -> voy_jaj_trir
   Array     : Magz         -> Magz

Bảng đầy đủ nằm tại:

   src/org/mozilla/javascript/babylscript/gen/Cvnss40.java
   docs/CVNSS40_TRANSLATION.md

HƯỚNG DẪN NHANH
===============

Biên dịch runner:

   ant babylscriptrun

Chạy ví dụ CVNSS4.0:

   java -jar build/babylscriptrun.jar babylrunner/sample.cvss.js

Ví dụ:

   ---cvss---

   haml_sob chao(ten) {
       neub (ten == voy_jaj_trir) {
           trov_ved "Xin chaol CVNSS4.0!";
       } kac {
           trov_ved "Xin chaol " + ten;
       }
   }

GIỚI HẠN RHINO/BABYLSCRIPT
==========================

Mã nguồn dựa trên Rhino 1.7R2. Chỉ phần interpreter được sửa đổi đầy đủ cho
Babylscript; optimizer/bytecode compiler không tương thích với các thay đổi này.
Vì vậy phải tắt tối ưu hóa:

   Context cx = Context.enter();
   cx.setOptimizationLevel(-1);

Một số phần cũ/không thuần ECMAScript như E4X, destructuring hoặc các đường
optimizer có thể không tương thích đầy đủ.

TRÌNH DỊCH BABYLSCRIPT -> JAVASCRIPT
====================================

Biên dịch:

   ant babyl2js

Chuyển ví dụ sang HTML:

   java -jar build/babyl2js.jar -html babylrunner/sample.babyl2js.js output.html

Đường Babyl2JS gốc vẫn được giữ. Runner BilaScript hiện là đường chạy đã được
nối trực tiếp với CVNSS4.0; việc mở rộng alias ---cvss--- cho toàn bộ đường
Babyl2JS là phần tương thích tiếp theo.

GIẤY PHÉP
=========

Các tệp kế thừa Rhino/Babylscript tiếp tục tuân theo license header và
LICENSE.txt của mã nguồn gốc, chủ yếu theo mô hình MPL 1.1 / GPL 2.0. Không xóa
các thông báo bản quyền và giấy phép của mã nguồn kế thừa.
