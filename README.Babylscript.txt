BILASCRIPT CVNSS4.0 / BABYLSCRIPT
=================================

BilaScript là một biến thể JavaScript (ECMAScript) mã nguồn mở dành cho cộng
đồng học tập, nghiên cứu và yêu thích CVNSS4.0. Dự án kế thừa theo chuỗi:

   Mozilla Rhino 1.7R2 -> Babylscript -> BilaScript CVNSS4.0

Babylscript mở rộng Rhino để JavaScript có thể dùng các từ khóa và tên API ở
nhiều ngôn ngữ. BilaScript tận dụng chính kiến trúc này để nạp bảng
"Babylscript CVNSS4.0 Translation" vào cơ chế tokenizer của Babylscript.

BẢN CHẤT KỸ THUẬT
=================

CustomTokenizer của Babylscript kế thừa BabylGenericTokenizer. BilaScript nạp
Cvnss40.keywordMap() vào CustomTokenizerConfig và nạp Cvnss40.objectMap() cho
các tên đối tượng/phương thức chuẩn. Mã nguồn công khai dùng chỉ thị:

   ---cvss---

Các bí danh ---cvnss---, ---cvnss40--- và ---cvnss4--- cũng được chấp nhận.
Để ít xâm lấn mã Rhino/Babylscript, Runner và Babyl2JS ánh xạ các chỉ thị này
vào custom-language channel nội bộ ---test--- trước khi parser xử lý. Token vẫn
đi qua:

   CustomTokenizer -> BabylGenericTokenizer -> ECMAScript Token

Runner tiếp tục qua Rhino Parser/Interpreter; Babyl2JS tiếp tục qua ParserToJS
để tạo JavaScript thông thường.

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

HƯỚNG DẪN NHANH - CHẠY TRỰC TIẾP
================================

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

BILASCRIPT CVNSS4.0 -> JAVASCRIPT
=================================

Biên dịch Babyl2JS:

   ant babyl2js

Dịch trực tiếp tệp CVNSS4.0 sang JavaScript:

   java -jar build/babyl2js.jar babylrunner/sample.cvss.js output.js

Hoặc xuất HTML:

   java -jar build/babyl2js.jar -html babylrunner/sample.cvss.js output.html

Babyl2JS đăng ký cùng Cvnss40.keywordMap() và Cvnss40.objectMap() trước khi gọi
compileStringToJS. ParserToJS tạo runtime header từ TranslatedNameBindings, nên
các alias CVNSS4.0 của thư viện chuẩn được đưa vào cùng cơ chế lookup ngôn ngữ.

GIỚI HẠN RHINO/BABYLSCRIPT
==========================

Mã nguồn dựa trên Rhino 1.7R2. Chỉ phần interpreter được sửa đổi đầy đủ cho
Babylscript; optimizer/bytecode compiler không tương thích với các thay đổi này.
Vì vậy khi thực thi phải tắt tối ưu hóa:

   Context cx = Context.enter();
   cx.setOptimizationLevel(-1);

Một số phần cũ/không thuần ECMAScript như E4X, destructuring hoặc các đường
optimizer có thể không tương thích đầy đủ.

GIẤY PHÉP
=========

Các tệp kế thừa Rhino/Babylscript tiếp tục tuân theo license header và
LICENSE.txt của mã nguồn gốc, chủ yếu theo mô hình MPL 1.1 / GPL 2.0. Không xóa
các thông báo bản quyền và giấy phép của mã nguồn kế thừa.
