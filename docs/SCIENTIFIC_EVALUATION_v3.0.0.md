# Đánh giá kỹ thuật BilaScript v3.0.0 theo cấu trúc bài báo khoa học

## Tóm tắt
BilaScript v3 nghiên cứu khả năng xây dựng một frontend ngôn ngữ lập trình CVNSS4.0 có cú pháp quen thuộc với JavaScript nhưng không phụ thuộc vào tokenizer/parser của JavaScript runtime lịch sử. Thiết kế tách frontend khỏi backend: source Bila được phân tích thành AST riêng rồi sinh JavaScript. Mục tiêu là tăng quyền làm chủ ngôn ngữ mà vẫn duy trì khả năng chạy trên hệ sinh thái JavaScript.

## Câu hỏi nghiên cứu
**RQ1:** Có thể tách vocabulary CVNSS4.0 khỏi JavaScript runtime nhưng giữ mô hình cú pháp quen thuộc không?  
**RQ2:** AST trung gian có giảm coupling với Rhino/Babylscript không?  
**RQ3:** JavaScript có thể đóng vai trò backend mà không quyết định bề mặt ngôn ngữ Bila không?

## Phương pháp
V3 triển khai lexer riêng, recursive-descent/precedence parser, AST backend-neutral, semantic analyzer và JavaScript code generator. Kiểm thử xác nhận: strict CVNSS4.0, English compatibility ở mode mặc định, AST shape, semantic error và thực thi output bằng Node VM.

## Kết quả định tính
- **Tăng mức làm chủ:** vocabulary, tokenization, parsing, AST và diagnostics nằm trong `v3/`.
- **Giảm phụ thuộc Rhino:** JavaScript backend không cần Rhino để xác định grammar core mới.
- **Khả năng di động:** output JavaScript có thể chuyển tới nhiều runtime JS.
- **Tính kiểm toán:** compiler stages tách biệt, dễ unit test hơn search/replace.

Không báo cáo con số hiệu năng hoặc mức tương thích ESNext giả định vì v3.0.0 chưa có benchmark/conformance corpus đủ lớn.

## Ưu điểm
1. Kiến trúc compiler chuẩn hơn: lexer → parser → AST → semantic → codegen.
2. JavaScript-compatible syntax làm giảm chi phí học.
3. Strict mode bảo vệ canonical CVNSS4.0.
4. Backend JS tận dụng browser/Node/Bun và thư viện hiện có.
5. Core mới nhỏ, dễ kiểm thử, MIT và có provenance rõ.

## Nhược điểm
1. Parser v3.0 mới bao phủ core subset, chưa phải full ECMAScript.
2. JavaScript backend khiến semantics cuối cùng vẫn chịu giới hạn runtime JS đích.
3. Source map, debugger protocol, formatter/LSP chưa đầy đủ.
4. Mapping built-in có thể tạo collision với identifier nếu specification chưa reserve rõ.
5. Chưa có type system tĩnh hay optimizer IR.

## Đe dọa tới tính hợp lệ
- Test hiện là smoke/unit tests, chưa phải Test262-equivalent conformance.
- Đánh giá hiện chủ yếu chức năng/kiến trúc, không phải benchmark hiệu năng.
- Vocabulary CVNSS4.0 cần tiếp tục audit collision/canonicalization.
- Tính dễ học cần nghiên cứu người dùng thực nghiệm, chưa thể kết luận từ code alone.

## Roadmap nghiên cứu
v3.1: source maps + formatter + richer diagnostics.  
v3.2: module/class/arrow/template literals.  
v3.5: TypeScript-like optional types + LSP.  
v4: Bila IR ổn định và backend WebAssembly thử nghiệm.

## Kết luận
V3 chứng minh bước chuyển kiến trúc từ “localized JavaScript runtime mode” sang “CVNSS4.0 language frontend with JavaScript backend”. Giá trị chính không nằm ở việc loại JavaScript, mà ở việc kiểm soát ranh giới compiler trước khi hạ xuống JavaScript.
