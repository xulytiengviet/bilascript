BILASCRIPT / BABYLSCRIPT - TÀI LIỆU TIẾNG VIỆT
==============================================

Mã nguồn Babylscript được xây dựng trên trình thông dịch JavaScript Mozilla Rhino,
phiên bản 1.7R2. Do Babylscript là một biến thể trực tiếp từ mã nguồn Rhino nên
các tệp kế thừa tiếp tục tuân theo các điều khoản giấy phép tương ứng của mã nguồn
gốc, chủ yếu là mô hình giấy phép kép MPL 1.1 / GPL 2.0. Xem LICENSE.txt và phần
license header trong từng tệp để biết đầy đủ điều khoản áp dụng.

Gói này chứa mã nguồn thô. Có thể nhập trực tiếp mã nguồn vào IDE Java để nghiên
cứu hoặc phát triển. Một số build script trong repo được kế thừa từ Rhino cũ nên
có thể cần điều chỉnh khi sử dụng với JDK hoặc môi trường build hiện đại.

Chỉ phần trình thông dịch (interpreter) của Rhino được sửa đổi cho Babylscript.
Phần optimizer/bytecode compiler không hoạt động đúng sau các thay đổi này. Vì
vậy khi sử dụng Babylscript phải tắt tối ưu hóa:

      Context cx = Context.enter();
      cx.setOptimizationLevel(-1);  // tắt tối ưu hóa
      try {
         Scriptable scope = cx.initStandardObjects();
         cx.evaluateString(scope, code /* mã cần chạy */, null, 0, null);
      } finally {
         Context.exit();
      }

Một số tính năng không thuần ECMAScript của Rhino cũng không được chỉnh sửa đồng
bộ, ví dụ destructuring assignment, let, E4X... Vì vậy các tính năng này có thể
không tương thích đầy đủ với cơ chế Babylscript hoặc có thể không hoạt động.


HƯỚNG DẪN NHANH
===============

Repo có kèm một chương trình runner đơn giản. Biên dịch bằng Apache Ant từ thư
mục gốc:

   ant babylscriptrun

Lệnh trên tạo tệp babylscriptrun.jar để chạy các tệp Babylscript mã hóa UTF-8.
Ví dụ Hello World nằm tại "babylrunner/sample.js".

Chạy ví dụ bằng:

   java -jar build/babylscriptrun.jar babylrunner/sample.js


TRÌNH DỊCH BABYLSCRIPT SANG JAVASCRIPT
======================================

Ngoài việc dùng Babylscript như một ngôn ngữ script cho Java, repo còn chứa một
trình dịch thử nghiệm từ Babylscript sang JavaScript thông thường. Nhờ đó mã
Babylscript có thể được chuyển thành JavaScript để chạy trong trình duyệt.

Biên dịch trình dịch bằng:

   ant babyl2js

Lệnh trên tạo tệp babyl2js.jar. Ví dụ nguồn nằm tại:

   babylrunner/sample.babyl2js.js

Chuyển ví dụ sang một tệp HTML bằng:

   java -jar build/babyl2js.jar -html babylrunner/sample.babyl2js.js output.html

Sau đó mở output.html bằng trình duyệt để chạy mã kết quả.


GHI CHÚ VỀ BILASCRIPT
=====================

BilaScript là fork định hướng Việt hóa và tài liệu hóa của Babylscript. Ở trạng
thái hiện tại, engine gốc chưa có LanguageMode.vi và chưa hỗ trợ chỉ thị ---vi---.
Việc bổ sung tiếng Việt ở cấp cú pháp cần cập nhật TokenStream, BabylTokenizer,
bảng từ khóa, ánh xạ tên đối tượng chuẩn và bộ kiểm thử Unicode/UTF-8.

README.md ở thư mục gốc cung cấp tài liệu tiếng Việt đầy đủ hơn về kiến trúc,
cách build, giới hạn kỹ thuật và định hướng bổ sung tiếng Việt cho engine.
