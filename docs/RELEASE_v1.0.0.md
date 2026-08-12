# BilaScript v1.0.0 — CVNSS4.0 JavaScript/ECMAScript

**BilaScript v1.0.0** là bản phát hành đầu tiên của biến thể JavaScript/ECMAScript mã nguồn mở phát triển theo chuỗi **Mozilla Rhino 1.7R2 → Babylscript → BilaScript CVNSS4.0**.

Bản phát hành này đưa bảng **Babylscript CVNSS4.0 Translation** vào cơ chế tokenizer đa ngôn ngữ của Babylscript. `CustomTokenizer` kế thừa `BabylGenericTokenizer`, vì vậy từ khóa CVNSS4.0 được ánh xạ thành token ECMAScript trước khi Rhino Parser/Interpreter xử lý.

## Điểm chính

- Hỗ trợ chỉ thị nguồn `---cvss---` cùng các bí danh `---cvnss---`, `---cvnss40---`, `---cvnss4---`.
- Bảng từ khóa/API CVNSS4.0 được triển khai tại `src/org/mozilla/javascript/babylscript/gen/Cvnss40.java`.
- Runner thực thi trực tiếp BilaScript CVNSS4.0 bằng Rhino interpreted mode.
- Babyl2JS dịch BilaScript CVNSS4.0 sang JavaScript hoặc HTML.
- Có sample chạy thực tế tại `babylrunner/sample.cvss.js`.
- Có script kiểm tra/build trên Windows tại `scripts/build-windows.ps1`.

## Xác minh CI

Trước khi đóng gói v1.0.0, workflow **BilaScript CVNSS4.0 CI** đã hoàn tất thành công trên cả:

- Ubuntu + Temurin JDK 8 + Apache Ant;
- Windows Server + Temurin JDK 8 + Apache Ant.

Smoke test thực tế in đúng:

```text
Xin chaol BilaScript
Xin chaol CVNSS4.0
```

Cả `babylscriptrun.jar` và `babyl2js.jar` đều build thành công; Babyl2JS tạo được JavaScript và HTML không rỗng.

## Asset phát hành

- `BilaScript-v1.0.0-Runner.jar` — chạy trực tiếp mã BilaScript/CVNSS4.0.
- `BilaScript-v1.0.0-Babyl2JS.jar` — dịch BilaScript/CVNSS4.0 sang JavaScript/HTML.
- `BilaScript-v1.0.0-Windows-x64.zip` — gói dùng nhanh cho Windows, gồm hai JAR, sample, lệnh `.cmd`, README Windows và LICENSE.
- `SHA256SUMS.txt` — SHA-256 của ba binary/package ở trên.

## Chạy nhanh

```bash
java -jar BilaScript-v1.0.0-Runner.jar sample.cvss.js
```

Dịch sang JavaScript:

```bash
java -jar BilaScript-v1.0.0-Babyl2JS.jar sample.cvss.js output.js
```

Dịch sang HTML:

```bash
java -jar BilaScript-v1.0.0-Babyl2JS.jar -html sample.cvss.js output.html
```

## Lưu ý tương thích

Codebase kế thừa Rhino 1.7R2 vẫn dùng `source-level: 1.5` và `target-jvm: 1.5`. Release v1.0.0 được xác minh với JDK 8. Các warning về source/target 1.5 và API deprecated là warning legacy, không làm build thất bại.

BilaScript nên được xem là nền tảng JavaScript/ECMAScript đa ngôn ngữ phục vụ CVNSS4.0, giáo dục, thử nghiệm và nghiên cứu; không phải engine thay thế JavaScript hiện đại như V8.
