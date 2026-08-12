BILASCRIPT CVNSS4.0 - HƯỚNG DẪN RUNNER
======================================

BilaScript là biến thể JavaScript/ECMAScript mã nguồn mở phát triển theo chuỗi:

   Mozilla Rhino 1.7R2 -> Babylscript -> BilaScript CVNSS4.0

Bản runner hiện nạp bảng "Babylscript CVNSS4.0 Translation" vào cơ chế custom
language của Babylscript. CustomTokenizer kế thừa BabylGenericTokenizer, vì vậy
các từ khóa CVNSS4.0 được ánh xạ thành token ECMAScript bằng chính kiến trúc đa
ngôn ngữ của Babylscript.

BIÊN DỊCH
=========

Từ thư mục gốc:

   ant babylscriptrun

Lệnh trên tạo:

   build/babylscriptrun.jar

CHẠY BILASCRIPT CVNSS4.0
========================

Ví dụ có sẵn:

   babylrunner/sample.cvss.js

Chạy bằng:

   java -jar build/babylscriptrun.jar babylrunner/sample.cvss.js

Có thể chạy nhiều tệp theo thứ tự:

   java -jar build/babylscriptrun.jar thu_vien.js chuong_trinh.cvss.js

Mọi tệp nguồn nên lưu ở UTF-8.

CHẾ ĐỘ NGÔN NGỮ
===============

Chỉ thị công khai của BilaScript:

   ---cvss---

Các bí danh được chấp nhận:

   ---cvnss---
   ---cvnss40---
   ---cvnss4---

Runner đưa các chỉ thị này về ---test---, là kênh custom-language sẵn có của
Babylscript. Đây chỉ là ánh xạ nội bộ; mã BilaScript nên dùng ---cvss---.

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

Một số token chính:

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

Mã Java:

   src/org/mozilla/javascript/babylscript/gen/Cvnss40.java

Tài liệu đầy đủ:

   docs/CVNSS40_TRANSLATION.md

Các cụm nhiều từ trong bảng dịch được nối bằng dấu _ để tokenizer nhận chúng là
một identifier duy nhất.

VA CHẠM TỪ KHÓA
===============

Bảng nguồn có hai alias trùng:

   throw/throws   -> nemj
   finally/final  -> cujb cugl

Bản chạy ưu tiên từ khóa ECMAScript hoạt động:

   throw   -> nemj
   throws  -> throws
   finally -> cujb_cugl
   final   -> final

Bảng gốc vẫn được giữ trong RAW_KEYWORDS để audit.

BABYL2JS
========

Công cụ Babylscript -> JavaScript gốc vẫn có thể biên dịch bằng:

   ant babyl2js

và dùng như trước:

   java -jar build/babyl2js.jar -html sample.babyl2js.js output.html

Runner là đường thực thi đã được nối CVNSS4.0 trong phiên bản này. Hỗ trợ alias
---cvss--- trực tiếp trong toàn bộ pipeline Babyl2JS là phần tương thích tiếp
theo.

LƯU Ý RHINO
===========

Phải chạy ở interpreted mode:

   cx.setOptimizationLevel(-1);

vì optimizer/bytecode compiler của Rhino 1.7R2 không tương thích đầy đủ với các
thay đổi Babylscript.
