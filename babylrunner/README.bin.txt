BILASCRIPT CVNSS4.0 - HƯỚNG DẪN DÒNG LỆNH
=========================================

BilaScript là biến thể JavaScript/ECMAScript mã nguồn mở phát triển theo chuỗi:

   Mozilla Rhino 1.7R2 -> Babylscript -> BilaScript CVNSS4.0

BilaScript nạp bảng "Babylscript CVNSS4.0 Translation" vào cơ chế custom
language của Babylscript. CustomTokenizer kế thừa BabylGenericTokenizer, vì vậy
các từ khóa CVNSS4.0 được ánh xạ thành token ECMAScript bằng chính kiến trúc đa
ngôn ngữ của Babylscript.

CÔNG CỤ 1 - RUNNER
==================

Biên dịch:

   ant babylscriptrun

Chạy ví dụ:

   java -jar build/babylscriptrun.jar babylrunner/sample.cvss.js

Có thể chạy nhiều tệp theo thứ tự:

   java -jar build/babylscriptrun.jar thu_vien.js chuong_trinh.cvss.js

CÔNG CỤ 2 - BILASCRIPT -> JAVASCRIPT
====================================

Biên dịch:

   ant babyl2js

Dịch tệp CVNSS4.0 sang JavaScript:

   java -jar build/babyl2js.jar babylrunner/sample.cvss.js output.js

Xuất HTML:

   java -jar build/babyl2js.jar -html babylrunner/sample.cvss.js output.html

Babyl2JS đăng ký cùng bảng từ khóa/API CVNSS4.0 trước khi gọi compileStringToJS,
vì vậy Runner và compiler dùng cùng nguồn translation.

Tùy chọn:

   -html       bọc kết quả bằng HTML và thẻ script
   -noheaders  không chèn Babylscript runtime header

CHẾ ĐỘ CVNSS4.0
===============

Chỉ thị công khai:

   ---cvss---

Bí danh:

   ---cvnss---
   ---cvnss40---
   ---cvnss4---

Runner và Babyl2JS đưa các chỉ thị này vào custom-language channel ---test---
vốn có của Babylscript. Đây là chi tiết tương thích nội bộ nhằm giữ nguyên lõi
Rhino/Babylscript; mã BilaScript nên dùng ---cvss---.

VÍ DỤ
=====

   ---cvss---

   haml_sob chao(ten) {
       neub (ten == voy_jaj_trir) {
           trov_ved "Xin chaol CVNSS4.0!";
       } kac {
           trov_ved "Xin chaol " + ten;
       }
   }

   var danh_sach = moix Magz("BilaScript", "CVNSS4.0");

Một số token:

   function -> haml_sob
   if       -> neub
   else     -> kac
   while    -> trogp_ki
   return   -> trov_ved
   new      -> moix
   null     -> voy_jaj_trir
   Array    -> Magz

BẢNG DỊCH
=========

   src/org/mozilla/javascript/babylscript/gen/Cvnss40.java
   docs/CVNSS40_TRANSLATION.md

Các cụm nhiều từ được nối bằng dấu _ để tạo một identifier/token duy nhất.

VA CHẠM TỪ KHÓA
===============

Bảng nguồn có:

   throw/throws   -> nemj
   finally/final  -> cujb cugl

Bảng chạy ưu tiên từ khóa ECMAScript hoạt động:

   throw   -> nemj
   throws  -> throws
   finally -> cujb_cugl
   final   -> final

RAW_KEYWORDS vẫn lưu translation gốc để audit.

LƯU Ý RHINO
===========

Runner phải chạy interpreted mode:

   cx.setOptimizationLevel(-1);

vì optimizer/bytecode compiler của Rhino 1.7R2 không tương thích đầy đủ với các
thay đổi Babylscript. Tệp nguồn và đầu ra sử dụng UTF-8.
