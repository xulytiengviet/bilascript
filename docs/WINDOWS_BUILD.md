# BilaScript CVNSS4.0 — Build trên Windows/JDK 8

Tài liệu này mô tả cấu hình đã được **GitHub Actions xác minh thực tế** cho BilaScript CVNSS4.0.

## Cấu hình đã xác minh

- Windows Server 2025 trên GitHub Actions
- Eclipse Temurin/OpenJDK 8
- Apache Ant 1.10.x
- Nhánh: `Babylscript1_7R2_BRANCH`
- Build target: `source=1.5`, `target=1.5` theo cấu hình Rhino/Babylscript legacy

> Khuyến nghị dùng JDK 8 cho codebase hiện tại. JDK mới hơn có thể từ chối trực tiếp `-source 1.5` / `-target 1.5`.

## 1. Cài Java 8

Cài một JDK 8 đầy đủ, ví dụ Eclipse Temurin 8.

Kiểm tra:

```powershell
java -version
javac -version
```

Kết quả nên có dạng `1.8.0_xxx`.

## 2. Cài Apache Ant

Nếu dùng Chocolatey:

```powershell
choco install ant -y
```

Kiểm tra:

```powershell
ant -version
```

## 3. Clone repo

```powershell
git clone https://github.com/xulytiengviet/bilascript.git
cd bilascript
git checkout Babylscript1_7R2_BRANCH
```

## 4. Build tự động một lệnh

Từ PowerShell ở thư mục repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-windows.ps1
```

Script sẽ tự động:

1. kiểm tra `java`, `javac`, `ant`;
2. chạy `ant clean`;
3. build `babylscriptrun.jar`;
4. chạy smoke test `babylrunner/sample.cvss.js`;
5. xác minh output CVNSS4.0;
6. build `babyl2js.jar`;
7. dịch sample sang JavaScript;
8. dịch sample sang HTML;
9. kiểm tra các artifact không rỗng.

Kết quả mong đợi:

```text
Xin chaol BilaScript
Xin chaol CVNSS4.0
```

## 5. Build thủ công

### Runner

```powershell
ant babylscriptrun
java -jar build\babylscriptrun.jar babylrunner\sample.cvss.js
```

### BilaScript → JavaScript

```powershell
ant babyl2js
java -jar build\babyl2js.jar babylrunner\sample.cvss.js build\sample.cvss.compiled.js
```

### BilaScript → HTML

```powershell
java -jar build\babyl2js.jar -html babylrunner\sample.cvss.js build\sample.cvss.html
```

## 6. Artifact đầu ra

Sau khi chạy script thành công:

```text
build/babylscriptrun.jar
build/babyl2js.jar
build/runner-output-windows.txt
build/sample.cvss.compiled.js
build/sample.cvss.html
```

## 7. Warning hiện tại

Build có thể hiển thị các warning như:

```text
source value 1.5 is obsolete
target value 1.5 is obsolete
bootstrap class path not set in conjunction with -source 1.5
```

Đây là warning của codebase Rhino 1.7R2/Babylscript legacy. Trong cấu hình JDK 8 đã xác minh, chúng **không làm build thất bại**.

Ngoài ra còn có các warning API deprecated và unchecked operations từ Rhino/Babylscript gốc.

## 8. GitHub Actions

Workflow kiểm thử nằm tại:

```text
.github/workflows/bilascript-ci.yml
```

Workflow chạy trên cả:

```text
Ubuntu + JDK 8 + Ant
Windows + JDK 8 + Ant
```

Mỗi job đều build, chạy CVNSS4.0 smoke test, build Babyl2JS và upload artifact.
