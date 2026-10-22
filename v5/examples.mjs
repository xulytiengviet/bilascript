/** 50 chương trình mẫu BilaScript v5 strict CVNSS4.0. Các tên tự đặt là định danh người dùng. */
export const CATEGORIES = Object.freeze(["Cơ bản","Điều kiện","Vòng lặp","Mảng","Thuật toán & ứng dụng"]);
export const EXERCISES = Object.freeze([
  {
    "id": 1,
    "category": "Cơ bản",
    "title": "Cộng hai số",
    "description": "Tính tổng của 12 và 8.",
    "code": "---bila:strict---\n// Cộng hai số\n// Tính tổng của 12 và 8.\nhaml_sob bai() {\n  bilb a = 12;\n  bilb b = 8;\n  trov_ved a + b;\n}\n",
    "expected": 20
  },
  {
    "id": 2,
    "category": "Cơ bản",
    "title": "Trừ hai số",
    "description": "Tính hiệu của 85 và 27.",
    "code": "---bila:strict---\n// Trừ hai số\n// Tính hiệu của 85 và 27.\nhaml_sob bai() {\n  bilb a = 85;\n  bilb b = 27;\n  trov_ved a - b;\n}\n",
    "expected": 58
  },
  {
    "id": 3,
    "category": "Cơ bản",
    "title": "Nhân hai số",
    "description": "Tính tích của 14 và 6.",
    "code": "---bila:strict---\n// Nhân hai số\n// Tính tích của 14 và 6.\nhaml_sob bai() {\n  bilb a = 14;\n  bilb b = 6;\n  trov_ved a * b;\n}\n",
    "expected": 84
  },
  {
    "id": 4,
    "category": "Cơ bản",
    "title": "Chia hai số",
    "description": "Chia 144 cho 12.",
    "code": "---bila:strict---\n// Chia hai số\n// Chia 144 cho 12.\nhaml_sob bai() {\n  bilb a = 144;\n  bilb b = 12;\n  trov_ved a / b;\n}\n",
    "expected": 12
  },
  {
    "id": 5,
    "category": "Cơ bản",
    "title": "Bình phương",
    "description": "Tính 9 mũ 2.",
    "code": "---bila:strict---\n// Bình phương\n// Tính 9 mũ 2.\nhaml_sob bai() {\n  bilb a = 9;\n  trov_ved a ** 2;\n}\n",
    "expected": 81
  },
  {
    "id": 6,
    "category": "Cơ bản",
    "title": "Lập phương",
    "description": "Tính 4 mũ 3.",
    "code": "---bila:strict---\n// Lập phương\n// Tính 4 mũ 3.\nhaml_sob bai() {\n  bilb a = 4;\n  trov_ved a ** 3;\n}\n",
    "expected": 64
  },
  {
    "id": 7,
    "category": "Cơ bản",
    "title": "Trung bình ba số",
    "description": "Tính trung bình cộng của 7, 8, 9.",
    "code": "---bila:strict---\n// Trung bình ba số\n// Tính trung bình cộng của 7, 8, 9.\nhaml_sob bai() {\n  bilb a = 7;\n  bilb b = 8;\n  bilb c = 9;\n  trov_ved (a + b + c) / 3;\n}\n",
    "expected": 8
  },
  {
    "id": 8,
    "category": "Cơ bản",
    "title": "Chu vi hình chữ nhật",
    "description": "Hình chữ nhật dài 12, rộng 5.",
    "code": "---bila:strict---\n// Chu vi hình chữ nhật\n// Hình chữ nhật dài 12, rộng 5.\nhaml_sob bai() {\n  bilb dai = 12;\n  bilb rong = 5;\n  trov_ved 2 * (dai + rong);\n}\n",
    "expected": 34
  },
  {
    "id": 9,
    "category": "Cơ bản",
    "title": "Diện tích hình tròn",
    "description": "Tính diện tích với bán kính 5 và π≈3.14.",
    "code": "---bila:strict---\n// Diện tích hình tròn\n// Tính diện tích với bán kính 5 và π≈3.14.\nhaml_sob bai() {\n  bilb r = 5;\n  trov_ved 3.14 * r * r;\n}\n",
    "expected": 78.5
  },
  {
    "id": 10,
    "category": "Cơ bản",
    "title": "Hoán đổi hai số",
    "description": "Đổi giá trị a và b; trả về mảng hai phần tử.",
    "code": "---bila:strict---\n// Hoán đổi hai số\n// Đổi giá trị a và b; trả về mảng hai phần tử.\nhaml_sob bai() {\n  bilb a = 12;\n  bilb b = 35;\n  bilb tam = a;\n  a = b;\n  b = tam;\n  trov_ved [a, b];\n}\n",
    "expected": [
      35,
      12
    ]
  },
  {
    "id": 11,
    "category": "Điều kiện",
    "title": "Kiểm tra chẵn lẻ",
    "description": "Cho số 48, trả về kết luận.",
    "code": "---bila:strict---\n// Kiểm tra chẵn lẻ\n// Cho số 48, trả về kết luận.\nhaml_sob bai() {\n  bilb n = 48;\n  neub (n % 2 === 0) {\n    trov_ved \"Chẵn\";\n  }\n  kac {\n    trov_ved \"Lẻ\";\n  }\n}\n",
    "expected": "Chẵn"
  },
  {
    "id": 12,
    "category": "Điều kiện",
    "title": "Số lớn nhất trong hai số",
    "description": "So sánh 25 và 43.",
    "code": "---bila:strict---\n// Số lớn nhất trong hai số\n// So sánh 25 và 43.\nhaml_sob bai() {\n  bilb a = 25;\n  bilb b = 43;\n  neub (a > b) { trov_ved a; }\n  kac { trov_ved b; }\n}\n",
    "expected": 43
  },
  {
    "id": 13,
    "category": "Điều kiện",
    "title": "Số lớn nhất trong ba số",
    "description": "Tìm số lớn nhất của 12, 99 và 34.",
    "code": "---bila:strict---\n// Số lớn nhất trong ba số\n// Tìm số lớn nhất của 12, 99 và 34.\nhaml_sob bai() {\n  bilb a = 12;\n  bilb b = 99;\n  bilb c = 34;\n  bilb lon_nhat = a;\n  neub (b > lon_nhat) { lon_nhat = b; }\n  neub (c > lon_nhat) { lon_nhat = c; }\n  trov_ved lon_nhat;\n}\n",
    "expected": 99
  },
  {
    "id": 14,
    "category": "Điều kiện",
    "title": "Số dương hay âm",
    "description": "Phân loại số -12.",
    "code": "---bila:strict---\n// Số dương hay âm\n// Phân loại số -12.\nhaml_sob bai() {\n  bilb n = -12;\n  neub (n > 0) { trov_ved \"Dương\"; }\n  kac neub (n < 0) { trov_ved \"Âm\"; }\n  kac { trov_ved \"Bằng 0\"; }\n}\n",
    "expected": "Âm"
  },
  {
    "id": 15,
    "category": "Điều kiện",
    "title": "Đạt hay chưa đạt",
    "description": "Điểm 6.5 đạt nếu >= 5.",
    "code": "---bila:strict---\n// Đạt hay chưa đạt\n// Điểm 6.5 đạt nếu >= 5.\nhaml_sob bai() {\n  bilb diem = 6.5;\n  neub (diem >= 5) { trov_ved \"Đạt\"; }\n  kac { trov_ved \"Chưa đạt\"; }\n}\n",
    "expected": "Đạt"
  },
  {
    "id": 16,
    "category": "Điều kiện",
    "title": "Xếp loại điểm",
    "description": "Điểm 8.6: từ 8 là Giỏi, từ 6.5 là Khá.",
    "code": "---bila:strict---\n// Xếp loại điểm\n// Điểm 8.6: từ 8 là Giỏi, từ 6.5 là Khá.\nhaml_sob bai() {\n  bilb diem = 8.6;\n  neub (diem >= 8) { trov_ved \"Giỏi\"; }\n  kac neub (diem >= 6.5) { trov_ved \"Khá\"; }\n  kac { trov_ved \"Cần cố gắng\"; }\n}\n",
    "expected": "Giỏi"
  },
  {
    "id": 17,
    "category": "Điều kiện",
    "title": "Kiểm tra năm nhuận",
    "description": "Kiểm tra năm 2024 theo lịch Gregory.",
    "code": "---bila:strict---\n// Kiểm tra năm nhuận\n// Kiểm tra năm 2024 theo lịch Gregory.\nhaml_sob bai() {\n  bilb nam = 2024;\n  neub ((nam % 400 === 0) || ((nam % 4 === 0) && (nam % 100 !== 0))) {\n    trov_ved \"Năm nhuận\";\n  }\n  trov_ved \"Năm thường\";\n}\n",
    "expected": "Năm nhuận"
  },
  {
    "id": 18,
    "category": "Điều kiện",
    "title": "Giá vé trẻ em",
    "description": "Dưới hoặc bằng 12 tuổi có giá vé 10000.",
    "code": "---bila:strict---\n// Giá vé trẻ em\n// Dưới hoặc bằng 12 tuổi có giá vé 10000.\nhaml_sob bai() {\n  bilb tuoi = 9;\n  neub (tuoi <= 12) { trov_ved 10000; }\n  kac { trov_ved 20000; }\n}\n",
    "expected": 10000
  },
  {
    "id": 19,
    "category": "Điều kiện",
    "title": "Tam giác hợp lệ",
    "description": "Kiểm tra độ dài cạnh 3, 4, 5.",
    "code": "---bila:strict---\n// Tam giác hợp lệ\n// Kiểm tra độ dài cạnh 3, 4, 5.\nhaml_sob bai() {\n  bilb a = 3;\n  bilb b = 4;\n  bilb c = 5;\n  neub ((a + b > c) && (a + c > b) && (b + c > a)) {\n    trov_ved \"Hợp lệ\";\n  }\n  trov_ved \"Không hợp lệ\";\n}\n",
    "expected": "Hợp lệ"
  },
  {
    "id": 20,
    "category": "Điều kiện",
    "title": "Giới hạn trong khoảng",
    "description": "Ép giá trị 125 về đoạn [0,100].",
    "code": "---bila:strict---\n// Giới hạn trong khoảng\n// Ép giá trị 125 về đoạn [0,100].\nhaml_sob bai() {\n  bilb n = 125;\n  neub (n < 0) { n = 0; }\n  neub (n > 100) { n = 100; }\n  trov_ved n;\n}\n",
    "expected": 100
  },
  {
    "id": 21,
    "category": "Vòng lặp",
    "title": "Tổng từ 1 đến 100",
    "description": "Tính tổng 1+2+...+100 bằng vòng lặp.",
    "code": "---bila:strict---\n// Tổng từ 1 đến 100\n// Tính tổng 1+2+...+100 bằng vòng lặp.\nhaml_sob bai() {\n  bilb tong = 0;\n  vil (bilb i = 1; i <= 100; i++) {\n    tong += i;\n  }\n  trov_ved tong;\n}\n",
    "expected": 5050
  },
  {
    "id": 22,
    "category": "Vòng lặp",
    "title": "Tổng số chẵn",
    "description": "Tính tổng các số chẵn từ 2 đến 20.",
    "code": "---bila:strict---\n// Tổng số chẵn\n// Tính tổng các số chẵn từ 2 đến 20.\nhaml_sob bai() {\n  bilb tong = 0;\n  vil (bilb i = 2; i <= 20; i += 2) {\n    tong += i;\n  }\n  trov_ved tong;\n}\n",
    "expected": 110
  },
  {
    "id": 23,
    "category": "Vòng lặp",
    "title": "Tổng số lẻ",
    "description": "Tính tổng các số lẻ từ 1 đến 19.",
    "code": "---bila:strict---\n// Tổng số lẻ\n// Tính tổng các số lẻ từ 1 đến 19.\nhaml_sob bai() {\n  bilb tong = 0;\n  vil (bilb i = 1; i < 20; i += 2) {\n    tong += i;\n  }\n  trov_ved tong;\n}\n",
    "expected": 100
  },
  {
    "id": 24,
    "category": "Vòng lặp",
    "title": "Giai thừa",
    "description": "Tính 6! bằng vòng lặp.",
    "code": "---bila:strict---\n// Giai thừa\n// Tính 6! bằng vòng lặp.\nhaml_sob bai() {\n  bilb ket_qua = 1;\n  vil (bilb i = 2; i <= 6; i++) {\n    ket_qua *= i;\n  }\n  trov_ved ket_qua;\n}\n",
    "expected": 720
  },
  {
    "id": 25,
    "category": "Vòng lặp",
    "title": "Mười số Fibonacci",
    "description": "Sinh 10 số đầu tiên của dãy Fibonacci.",
    "code": "---bila:strict---\n// Mười số Fibonacci\n// Sinh 10 số đầu tiên của dãy Fibonacci.\nhaml_sob bai() {\n  bilb ds: Magz<Sob> = [];\n  bilb a = 0;\n  bilb b = 1;\n  vil (bilb i = 0; i < 10; i++) {\n    ds.dayq(a);\n    bilb tam = a + b;\n    a = b;\n    b = tam;\n  }\n  trov_ved ds;\n}\n",
    "expected": [
      0,
      1,
      1,
      2,
      3,
      5,
      8,
      13,
      21,
      34
    ]
  },
  {
    "id": 26,
    "category": "Vòng lặp",
    "title": "Bảng nhân 7",
    "description": "Trả về bảng cửu chương 7.",
    "code": "---bila:strict---\n// Bảng nhân 7\n// Trả về bảng cửu chương 7.\nhaml_sob bai() {\n  bilb ds: Magz<Sob> = [];\n  vil (bilb i = 1; i <= 10; i++) {\n    ds.dayq(7 * i);\n  }\n  trov_ved ds;\n}\n",
    "expected": [
      7,
      14,
      21,
      28,
      35,
      42,
      49,
      56,
      63,
      70
    ]
  },
  {
    "id": 27,
    "category": "Vòng lặp",
    "title": "Đếm chữ số",
    "description": "Số 123456 có bao nhiêu chữ số?",
    "code": "---bila:strict---\n// Đếm chữ số\n// Số 123456 có bao nhiêu chữ số?\nhaml_sob bai() {\n  bilb n = 123456;\n  bilb dem = 0;\n  trogp_ki (n > 0) {\n    bilb du = n % 10;\n    n = (n - du) / 10;\n    dem++;\n  }\n  trov_ved dem;\n}\n",
    "expected": 6
  },
  {
    "id": 28,
    "category": "Vòng lặp",
    "title": "Đảo số nguyên",
    "description": "Đảo 12345 thành 54321 mà không dùng hàm ngoài.",
    "code": "---bila:strict---\n// Đảo số nguyên\n// Đảo 12345 thành 54321 mà không dùng hàm ngoài.\nhaml_sob bai() {\n  bilb n = 12345;\n  bilb dao = 0;\n  trogp_ki (n > 0) {\n    bilb du = n % 10;\n    dao = dao * 10 + du;\n    n = (n - du) / 10;\n  }\n  trov_ved dao;\n}\n",
    "expected": 54321
  },
  {
    "id": 29,
    "category": "Vòng lặp",
    "title": "Kiểm tra số nguyên tố",
    "description": "Kiểm tra số 97.",
    "code": "---bila:strict---\n// Kiểm tra số nguyên tố\n// Kiểm tra số 97.\nhaml_sob bai() {\n  bilb n = 97;\n  neub (n < 2) { trov_ved \"Không nguyên tố\"; }\n  vil (bilb i = 2; i * i <= n; i++) {\n    neub (n % i === 0) { trov_ved \"Không nguyên tố\"; }\n  }\n  trov_ved \"Nguyên tố\";\n}\n",
    "expected": "Nguyên tố"
  },
  {
    "id": 30,
    "category": "Vòng lặp",
    "title": "Ước chung lớn nhất",
    "description": "Dùng thuật toán Euclid cho 84 và 30.",
    "code": "---bila:strict---\n// Ước chung lớn nhất\n// Dùng thuật toán Euclid cho 84 và 30.\nhaml_sob bai() {\n  bilb a = 84;\n  bilb b = 30;\n  trogp_ki (b !== 0) {\n    bilb du = a % b;\n    a = b;\n    b = du;\n  }\n  trov_ved a;\n}\n",
    "expected": 6
  },
  {
    "id": 31,
    "category": "Mảng",
    "title": "Tổng các phần tử mảng",
    "description": "Tính tổng [5,7,9].",
    "code": "---bila:strict---\n// Tổng các phần tử mảng\n// Tính tổng [5,7,9].\nhaml_sob bai() {\n  bilb ds = [5, 7, 9];\n  bilb tong = 0;\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    tong += ds[i];\n  }\n  trov_ved tong;\n}\n",
    "expected": 21
  },
  {
    "id": 32,
    "category": "Mảng",
    "title": "Giá trị nhỏ nhất",
    "description": "Tìm phần tử nhỏ nhất của [-3,8,2].",
    "code": "---bila:strict---\n// Giá trị nhỏ nhất\n// Tìm phần tử nhỏ nhất của [-3,8,2].\nhaml_sob bai() {\n  bilb ds = [-3, 8, 2];\n  bilb nho = ds[0];\n  vil (bilb i = 1; i < ds.dof_zail; i++) {\n    neub (ds[i] < nho) { nho = ds[i]; }\n  }\n  trov_ved nho;\n}\n",
    "expected": -3
  },
  {
    "id": 33,
    "category": "Mảng",
    "title": "Giá trị lớn nhất",
    "description": "Tìm phần tử lớn nhất của [1,10,4].",
    "code": "---bila:strict---\n// Giá trị lớn nhất\n// Tìm phần tử lớn nhất của [1,10,4].\nhaml_sob bai() {\n  bilb ds = [1, 10, 4];\n  bilb lon = ds[0];\n  vil (bilb i = 1; i < ds.dof_zail; i++) {\n    neub (ds[i] > lon) { lon = ds[i]; }\n  }\n  trov_ved lon;\n}\n",
    "expected": 10
  },
  {
    "id": 34,
    "category": "Mảng",
    "title": "Trung bình một mảng",
    "description": "Tính trung bình [4,7,10,13].",
    "code": "---bila:strict---\n// Trung bình một mảng\n// Tính trung bình [4,7,10,13].\nhaml_sob bai() {\n  bilb ds = [4, 7, 10, 13];\n  bilb tong = 0;\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    tong += ds[i];\n  }\n  trov_ved tong / ds.dof_zail;\n}\n",
    "expected": 8.5
  },
  {
    "id": 35,
    "category": "Mảng",
    "title": "Đếm số dương",
    "description": "Đếm phần tử > 0 trong [-2,5,0,8,-7,3].",
    "code": "---bila:strict---\n// Đếm số dương\n// Đếm phần tử > 0 trong [-2,5,0,8,-7,3].\nhaml_sob bai() {\n  bilb ds = [-2, 5, 0, 8, -7, 3];\n  bilb dem = 0;\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    neub (ds[i] > 0) { dem++; }\n  }\n  trov_ved dem;\n}\n",
    "expected": 3
  },
  {
    "id": 36,
    "category": "Mảng",
    "title": "Lọc số chẵn",
    "description": "Chọn các số chẵn từ [3,4,8,11,14].",
    "code": "---bila:strict---\n// Lọc số chẵn\n// Chọn các số chẵn từ [3,4,8,11,14].\nhaml_sob bai() {\n  bilb ds = [3, 4, 8, 11, 14];\n  bilb ket_qua: Magz<Sob> = [];\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    neub (ds[i] % 2 === 0) {\n      ket_qua.dayq(ds[i]);\n    }\n  }\n  trov_ved ket_qua;\n}\n",
    "expected": [
      4,
      8,
      14
    ]
  },
  {
    "id": 37,
    "category": "Mảng",
    "title": "Đảo ngược mảng",
    "description": "Đảo [3,6,9,12] bằng vòng lặp.",
    "code": "---bila:strict---\n// Đảo ngược mảng\n// Đảo [3,6,9,12] bằng vòng lặp.\nhaml_sob bai() {\n  bilb ds = [3, 6, 9, 12];\n  bilb ket_qua: Magz<Sob> = [];\n  vil (bilb i = ds.dof_zail - 1; i >= 0; i--) {\n    ket_qua.dayq(ds[i]);\n  }\n  trov_ved ket_qua;\n}\n",
    "expected": [
      12,
      9,
      6,
      3
    ]
  },
  {
    "id": 38,
    "category": "Mảng",
    "title": "Sắp xếp nổi bọt",
    "description": "Sắp xếp số tăng dần (không phải sắp xếp chuỗi).",
    "code": "---bila:strict---\n// Sắp xếp nổi bọt\n// Sắp xếp số tăng dần (không phải sắp xếp chuỗi).\nhaml_sob bai() {\n  bilb ds = [9, 2, 11, 1, 4];\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    vil (bilb j = 0; j < ds.dof_zail - 1; j++) {\n      neub (ds[j] > ds[j + 1]) {\n        bilb tam = ds[j];\n        ds[j] = ds[j + 1];\n        ds[j + 1] = tam;\n      }\n    }\n  }\n  trov_ved ds;\n}\n",
    "expected": [
      1,
      2,
      4,
      9,
      11
    ]
  },
  {
    "id": 39,
    "category": "Mảng",
    "title": "Loại phần tử trùng",
    "description": "Giữ thứ tự, loại giá trị lặp.",
    "code": "---bila:strict---\n// Loại phần tử trùng\n// Giữ thứ tự, loại giá trị lặp.\nhaml_sob bai() {\n  bilb ds = [1, 2, 2, 3, 1, 4];\n  bilb ket_qua: Magz<Sob> = [];\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    bilb da_co = 0;\n    vil (bilb j = 0; j < ket_qua.dof_zail; j++) {\n      neub (ket_qua[j] === ds[i]) { da_co = 1; }\n    }\n    neub (da_co === 0) { ket_qua.dayq(ds[i]); }\n  }\n  trov_ved ket_qua;\n}\n",
    "expected": [
      1,
      2,
      3,
      4
    ]
  },
  {
    "id": 40,
    "category": "Mảng",
    "title": "Tìm kiếm tuyến tính",
    "description": "Tìm số 12 trong [3,8,12,19], trả về vị trí 0-based.",
    "code": "---bila:strict---\n// Tìm kiếm tuyến tính\n// Tìm số 12 trong [3,8,12,19], trả về vị trí 0-based.\nhaml_sob bai() {\n  bilb ds = [3, 8, 12, 19];\n  bilb can_tim = 12;\n  vil (bilb i = 0; i < ds.dof_zail; i++) {\n    neub (ds[i] === can_tim) { trov_ved i; }\n  }\n  trov_ved -1;\n}\n",
    "expected": 2
  },
  {
    "id": 41,
    "category": "Thuật toán & ứng dụng",
    "title": "Tìm kiếm nhị phân",
    "description": "Tìm 10 trong mảng đã sắp xếp.",
    "code": "---bila:strict---\n// Tìm kiếm nhị phân\n// Tìm 10 trong mảng đã sắp xếp.\nhaml_sob bai() {\n  bilb ds = [2, 4, 6, 8, 10, 12, 14];\n  bilb trai = 0;\n  bilb phai = ds.dof_zail - 1;\n  trogp_ki (trai <= phai) {\n    bilb tong = trai + phai;\n    bilb giua = (tong - (tong % 2)) / 2;\n    neub (ds[giua] === 10) { trov_ved giua; }\n    neub (ds[giua] < 10) { trai = giua + 1; }\n    kac { phai = giua - 1; }\n  }\n  trov_ved -1;\n}\n",
    "expected": 4
  },
  {
    "id": 42,
    "category": "Thuật toán & ứng dụng",
    "title": "Chuỗi đối xứng",
    "description": "Kiểm tra chuỗi level có đối xứng không.",
    "code": "---bila:strict---\n// Chuỗi đối xứng\n// Kiểm tra chuỗi level có đối xứng không.\nhaml_sob bai() {\n  bilb chuoi: Chujg = \"level\";\n  bilb trai = 0;\n  bilb phai = chuoi.dof_zail - 1;\n  trogp_ki (trai < phai) {\n    neub (chuoi[trai] !== chuoi[phai]) {\n      trov_ved \"Không đối xứng\";\n    }\n    trai++;\n    phai--;\n  }\n  trov_ved \"Đối xứng\";\n}\n",
    "expected": "Đối xứng"
  },
  {
    "id": 43,
    "category": "Thuật toán & ứng dụng",
    "title": "Đảo chuỗi",
    "description": "Đảo chuỗi bilascript bằng cách duyệt ký tự.",
    "code": "---bila:strict---\n// Đảo chuỗi\n// Đảo chuỗi bilascript bằng cách duyệt ký tự.\nhaml_sob bai() {\n  bilb chuoi: Chujg = \"bilascript\";\n  bilb dao = \"\";\n  vil (bilb i = chuoi.dof_zail - 1; i >= 0; i--) {\n    dao = dao + chuoi[i];\n  }\n  trov_ved dao;\n}\n",
    "expected": "tpircsalib"
  },
  {
    "id": 44,
    "category": "Thuật toán & ứng dụng",
    "title": "Độ dài chuỗi",
    "description": "Đếm số ký tự của CVNSS40.",
    "code": "---bila:strict---\n// Độ dài chuỗi\n// Đếm số ký tự của CVNSS40.\nhaml_sob bai() {\n  bilb chuoi: Chujg = \"CVNSS40\";\n  trov_ved chuoi.dof_zail;\n}\n",
    "expected": 7
  },
  {
    "id": 45,
    "category": "Thuật toán & ứng dụng",
    "title": "Đếm ký tự a",
    "description": "Đếm chữ a trong bananaban.",
    "code": "---bila:strict---\n// Đếm ký tự a\n// Đếm chữ a trong bananaban.\nhaml_sob bai() {\n  bilb chuoi: Chujg = \"bananaban\";\n  bilb dem = 0;\n  vil (bilb i = 0; i < chuoi.dof_zail; i++) {\n    neub (chuoi[i] === \"a\") { dem++; }\n  }\n  trov_ved dem;\n}\n",
    "expected": 4
  },
  {
    "id": 46,
    "category": "Thuật toán & ứng dụng",
    "title": "Kiểm tra tọa độ GIS",
    "description": "Kiểm tra điểm (106.7,10.1) có nằm trong bbox.",
    "code": "---bila:strict---\n// Kiểm tra tọa độ GIS\n// Kiểm tra điểm (106.7,10.1) có nằm trong bbox.\nhaml_sob bai() {\n  bilb x = 106.7;\n  bilb y = 10.1;\n  bilb trai = 106.5;\n  bilb phai = 107;\n  bilb duoi = 9.9;\n  bilb tren = 10.3;\n  neub (x >= trai && x <= phai && y >= duoi && y <= tren) {\n    trov_ved \"Trong vùng\";\n  }\n  trov_ved \"Ngoài vùng\";\n}\n",
    "expected": "Trong vùng"
  },
  {
    "id": 47,
    "category": "Thuật toán & ứng dụng",
    "title": "Khoảng cách bình phương",
    "description": "Tính bình phương khoảng cách từ (3,4) đến (7,1).",
    "code": "---bila:strict---\n// Khoảng cách bình phương\n// Tính bình phương khoảng cách từ (3,4) đến (7,1).\nhaml_sob bai() {\n  bilb x1 = 3;\n  bilb y1 = 4;\n  bilb x2 = 7;\n  bilb y2 = 1;\n  bilb dx = x2 - x1;\n  bilb dy = y2 - y1;\n  trov_ved dx * dx + dy * dy;\n}\n",
    "expected": 25
  },
  {
    "id": 48,
    "category": "Thuật toán & ứng dụng",
    "title": "Tổng lượng mưa",
    "description": "Tính tổng lượng mưa 5 ngày: [12,0,18,25,5].",
    "code": "---bila:strict---\n// Tổng lượng mưa\n// Tính tổng lượng mưa 5 ngày: [12,0,18,25,5].\nhaml_sob bai() {\n  bilb mua = [12, 0, 18, 25, 5];\n  bilb tong = 0;\n  vil (bilb i = 0; i < mua.dof_zail; i++) {\n    tong += mua[i];\n  }\n  trov_ved tong;\n}\n",
    "expected": 60
  },
  {
    "id": 49,
    "category": "Thuật toán & ứng dụng",
    "title": "Tính tiền điện hai bậc",
    "description": "100 kWh đầu: 2000, phần vượt: 2500; dùng 175 kWh.",
    "code": "---bila:strict---\n// Tính tiền điện hai bậc\n// 100 kWh đầu: 2000, phần vượt: 2500; dùng 175 kWh.\nhaml_sob bai() {\n  bilb so_dien = 175;\n  neub (so_dien <= 100) {\n    trov_ved so_dien * 2000;\n  }\n  trov_ved 100 * 2000 + (so_dien - 100) * 2500;\n}\n",
    "expected": 387500
  },
  {
    "id": 50,
    "category": "Thuật toán & ứng dụng",
    "title": "Kiểm tra hạn mức phí",
    "description": "Ví dụ off-chain: số tiền 100000, phí 2500, hạn mức 110000.",
    "code": "---bila:strict---\n// Kiểm tra hạn mức phí\n// Ví dụ off-chain: số tiền 100000, phí 2500, hạn mức 110000.\nhaml_sob bai() {\n  bilb gia_tri = 100000;\n  bilb phi = 2500;\n  bilb han_muc = 110000;\n  neub (gia_tri + phi <= han_muc) {\n    trov_ved \"Trong hạn mức\";\n  }\n  trov_ved \"Vượt hạn mức\";\n}\n",
    "expected": "Trong hạn mức"
  }
]);
