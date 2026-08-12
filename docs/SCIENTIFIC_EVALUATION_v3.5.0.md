# Đánh giá kỹ thuật BilaScript v3.5.0

## Tóm tắt

BilaScript v3.5 nghiên cứu một thiết kế ngôn ngữ bản địa hóa trong đó surface vocabulary dùng CVNSS4.0 nhưng runtime không bị thay thế. Frontend được sở hữu bởi BilaScript; JavaScript là backend thực thi. Mục tiêu là giảm coupling, hạn chế semantic rewrite nguy hiểm và giữ khả năng tối ưu của JavaScript engine.

## Câu hỏi nghiên cứu

1. Có thể thay lớp từ vựng bằng CVNSS4.0 mà giữ số, toán tử và cấu trúc biểu thức JavaScript không?
2. Có thể tránh runtime translation/wrapper và sinh JavaScript trực tiếp không?
3. Có thể giảm rủi ro đổi nhầm API bằng semantic receiver resolution không?
4. Có thể làm AST độc lập hơn với backend bằng semantic token IDs không?

## Phương pháp

V3.5 triển khai lexer semantic-ID, parser riêng, AST có source span, semantic pass, normalization/type inference nhẹ, receiver-safe member mapping, JavaScript code generator, source-map encoder và zero-cost audit. Test suite chạy cả semantic correctness và execution của output.

## Kết quả kiến trúc

- CVNSS4.0 không tồn tại như runtime translator.
- `neub`, `trov_ved`, `haml_sob` được hạ thành `KW_IF`, `KW_RETURN`, `KW_FUNCTION` trước parser.
- `ds.dayq()` chỉ được hạ thành `ds.push()` khi `ds` được suy luận là Array.
- Property không rõ receiver được giữ nguyên và sinh cảnh báo thay vì rewrite im lặng.
- Output không chèn `BilaRuntime`, wrapper collection hay reflection helper.
- Source maps là metadata build-time, không thêm runtime overhead.

## Ưu điểm

- Frontend ownership rõ hơn v3.0.
- Rủi ro API collision giảm.
- JavaScript engine tiếp tục tối ưu output trực tiếp.
- Dễ xây formatter/LSP/type checker từ semantic AST.
- npm/user-defined API không bị bản địa hóa mù quáng.

## Nhược điểm và threats to validity

- Type inference hiện nhẹ, không phải hệ type hoàn chỉnh.
- Chưa có Test262/full ESNext conformance.
- Chưa công bố benchmark tốc độ; “zero-cost” ở đây nghĩa là không chèn runtime translation/helper cho mapping 1:1, không phải khẳng định nhanh hơn JavaScript.
- Template interpolation, module/class/async-await còn thiếu.
- Receiver inference có thể không chứng minh được dynamic values; khi đó compiler ưu tiên giữ property gốc.

## Kết luận

V3.5 chuyển trọng tâm từ “dịch tên JavaScript” sang “frontend semantic độc lập + JavaScript backend”. Đây là bước trung gian hợp lý trước Bila IR/multi-backend, đồng thời vẫn bảo toàn giá trị lớn nhất của JavaScript: runtime/JIT và ecosystem.
