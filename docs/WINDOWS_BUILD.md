# BilaScript v1.2.0 — Build trên Windows/JDK 8

Tài liệu này mô tả cấu hình đã được **GitHub Actions xác minh thực tế** cho BilaScript v1.2.0 với chế độ CVNSS4.0 native `---bila---`.

## Cấu hình đã xác minh

- Windows Server trên GitHub Actions
- Eclipse Temurin/OpenJDK 8
- Apache Ant 1.10.x
- Nhánh: `Babylscript1_7R2_BRANCH`
- Build target: `source=1.5`, `target=1.5` theo cấu hình Rhino/Babylscript legacy

> Khuyến nghị dùng JDK 8 để **build source**. Các JAR đã build có thể chạy trên JVM mới hơn nếu JVM còn tương thích với bytecode/API mà Rhino 1.7R2 sử dụng.

## 1. Cài Java 8

Cài một JDK 8 đầy đủ, ví dụ Eclipse Temurin 8.

```powershell
java -version
javac -version
```

Kết quả build chuẩn nên có dạng `1.8.0_xxx`.

## 2. Cài Apache Ant

Nếu dùng Chocolatey:

```powershell
choco install ant -y
ant -version
```

## 3. Clone repo

```powershell
git clone https://github.com/xulytiengviet/bilascript.git
cd bilascript
git checkout Babylscript1_7R2_BRANCH
```

## 4. Build tự động một lệnh

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-windows.ps1
```

Script v1.2.0 tự động:

1. kiểm tra `java`, `javac`, `ant`;
2. chạy `ant clean`;
3. build `babylscriptrun.jar`;
4. chạy sample native `babylrunner/sample.bila.js`;
5. xác minh `---bila---`, từ khóa CVNSS4.0 và API/property dịch (`dof_zail`);
6. chạy lại `sample.cvss.js` để kiểm tra tương thích v1.0.0;
7. build `babyl2js.jar`;
8. dịch sample native sang JavaScript và HTML;
9. xác minh output Babyl2JS dùng namespace `bila` và các artifact không rỗng.

Kết quả native mong đợi:

```text
Xin chaol BilaScript
Xin chaol CVNSS4.0
Dof zail: 3
```

## 5. Build thủ công

### Runner native `---bila---`

```powershell
ant babylscriptrun
java -jar build\babylscriptrun.jar babylrunner\sample.bila.js
```

### BilaScript → JavaScript

```powershell
ant babyl2js
java -jar build\babyl2js.jar babylrunner\sample.bila.js build\sample.bila.compiled.js
```

### BilaScript → HTML

```powershell
java -jar build\babyl2js.jar -html babylrunner\sample.bila.js build\sample.bila.html
```

## 6. Chỉ thị ngôn ngữ

Chỉ thị chuẩn từ v1.2.0:

```text
---bila---
```

Các alias cũ vẫn được chấp nhận để tương thích:

```text
---cvss---
---cvnss---
---cvnss40---
---cvnss4---
```

Tất cả đều ánh xạ về `TokenStream.LanguageMode.bila`.

## 7. Artifact đầu ra

```text
build/babylscriptrun.jar
build/babyl2js.jar
build/runner-output-windows.txt
build/legacy-output-windows.txt
build/sample.bila.compiled.js
build/sample.bila.html
```

## 8. Warning legacy

Build có thể hiển thị:

```text
source value 1.5 is obsolete
target value 1.5 is obsolete
bootstrap class path not set in conjunction with -source 1.5
```

Đây là warning của Rhino 1.7R2/Babylscript legacy. Trong cấu hình JDK 8 đã xác minh, chúng **không làm build thất bại**.

## 9. GitHub Actions

Workflow chính:

```text
.github/workflows/bilascript-ci.yml
```

CI v1.2.0 chạy trên:

```text
Ubuntu + JDK 8 + Ant
Windows + JDK 8 + Ant
```

Mỗi job kiểm tra native `---bila---`, tương thích `---cvss---`, Runner, Babyl2JS, JavaScript/HTML và artifact build.
