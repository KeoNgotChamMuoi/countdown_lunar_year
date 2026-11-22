# Đếm ngày đến Tết (tet-countdown)

Đếm ngược đến Tết Nguyên Đán. Một giao diện dùng cho 4 nơi:

| Nơi dùng | Cách làm | Thư mục |
|---|---|---|
| App trên điện thoại (mở như app) | PWA, cài qua Chrome | `src/pwa/` |
| Widget màn hình chính Android | App Android gốc (Kotlin) có widget | `src/android/` |
| Hình nền desktop (động) | Lively Wallpaper chạy trang web | `release/tet-countdown-lively.zip` |
| Màn hình khóa Windows | Script vẽ ảnh mỗi ngày bằng Edge chạy ẩn | `src/desktop/lockscreen/` |

- Version: 1.1.0
- Ngày Tết tính bằng thuật toán âm lịch của Hồ Ngọc Đức (`src/pwa/lunar.js`, bản Kotlin `Lunar.kt`). Đã đối chiếu 2020–2027 khớp lịch Việt Nam; bản JS và Kotlin cho kết quả giống nhau 2020–2035.
- Font Playfair Display (có bộ chữ tiếng Việt) đóng gói kèm trong `src/pwa/fonts/`, giấy phép OFL.

## Chức năng

- Đếm ngày, giờ, phút, giây đến 00:00 mùng 1 Tết (giờ Việt Nam).
- Tên năm Can Chi, ngày dương lịch mùng 1 Tết, thanh tiến độ từ Tết năm trước.
- Mùng 1–3: hiện "Chúc Mừng Năm Mới" và tự bắn pháo hoa. Sau mùng 3: đếm Tết năm sau.
- Tương tác:
  - Chạm vào số ngày: số nảy lên, bắn pháo hoa, đổi lời chúc, rung nhẹ.
  - Chạm chỗ trống: hoa mai bung ra tại chỗ chạm.
  - Nút **Bóc lì xì**: phong bao lắc, mở ra số tiền lộc ngẫu nhiên kèm lời chúc.
  - Lắc điện thoại: pháo hoa.
- `?mode=lock`: bản tĩnh cho ảnh màn hình khóa (ẩn giờ/phút/giây, nút bấm).

## 1. PWA

```bash
cd mobile-modules/tet-countdown/src/pwa
python -m http.server 8080      # mở http://localhost:8080
```

Cài lên điện thoại cần HTTPS: đưa `src/pwa/` lên GitHub Pages hoặc Netlify Drop, mở bằng Chrome → ⋮ → **Cài đặt ứng dụng**.

## 2. App Android + widget

1. Android Studio → **Open** → chọn `src/android/`. Đợi Gradle sync (lần đầu tải Gradle 8.11.1, AGP 8.7.3).
2. Cắm điện thoại (bật USB debugging) → **Run**. Hoặc **Build → Build APK(s)**, file ở `src/android/app/build/outputs/apk/`.
3. Trên điện thoại: giữ màn hình chính → **Widget** → **Đếm Tết** → kéo ra.

- App mở giao diện PWA (lấy thẳng từ `src/pwa/` khi build, không chép trùng).
- Widget hiện số ngày còn lại, tự cập nhật lúc 0h mỗi ngày (báo thức không chính xác tuyệt đối, có thể trễ vài phút) và mỗi giờ. Chạm widget để mở app.
- Không dùng thư viện ngoài (không AndroidX). minSdk 26 (Android 8), targetSdk 34.

## 3. Hình nền desktop (Lively Wallpaper)

1. Cài Lively Wallpaper (Microsoft Store hoặc https://github.com/rocksdanister/lively).
2. Kéo `release/tet-countdown-lively.zip` thả vào cửa sổ Lively → chọn làm hình nền.
3. Muốn bấm được lên hình nền (pháo hoa, lì xì): Lively → Settings → Wallpaper → **Wallpaper input: Mouse**.

Máy công ty không cài được Lively: dùng ảnh tĩnh ở mục 4 với tham số `-Wallpaper`.

## 4. Màn hình khóa Windows

```bat
src\desktop\lockscreen\cai-dat.cmd             :: chỉ màn hình khóa
src\desktop\lockscreen\cai-dat.cmd -Wallpaper  :: thêm hình nền desktop tĩnh
src\desktop\lockscreen\go-cai-dat.cmd          :: gỡ
```

- Không cần quyền admin. Chép app vào `%LOCALAPPDATA%\TetCountdown`, tạo tác vụ `TetCountdown` chạy 00:01 mỗi ngày + lối tắt Startup chạy khi đăng nhập.
- Ảnh vẽ bằng Microsoft Edge chạy ẩn, đúng độ phân giải màn hình chính.
- Trước khi cài: Settings → Personalization → Lock screen → chọn **Picture** (không dùng Windows Spotlight).
- Nhật ký lỗi: `%LOCALAPPDATA%\TetCountdown\log.txt`.
- Máy công ty có chính sách khóa đổi màn hình khóa / hình nền, hoặc chặn chạy PowerShell script thì script báo lỗi trong log, không vượt được.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/pwa/` | `index.html`, `style.css`, `app.js`, `lunar.js`, `sw.js`, `manifest.webmanifest`, `icons/`, `fonts/` |
| `src/android/` | Project Android Studio (Kotlin): `MainActivity`, `TetWidget`, `TetState`, `Lunar` |
| `src/desktop/lively/` | `LivelyInfo.json`, ảnh thumbnail cho gói Lively |
| `src/desktop/lockscreen/` | Script PowerShell màn hình khóa |
| `release/` | `tet-countdown-lively.zip` |
| `doc/`, `mockup/`, `ai/` | Tài liệu, thiết kế, agent/skill AI |

## Quy chuẩn

- Sửa file trong `src/pwa/`: tăng `VERSION` trong `src/pwa/sw.js`; thêm file mới thì thêm vào `FILES` trong `sw.js`.
- Sửa giao diện: đóng gói lại `release/tet-countdown-lively.zip` (nội dung `src/pwa/` trừ `sw.js`, `manifest.webmanifest`, cộng 2 file trong `src/desktop/lively/`).
- Đổi thuật toán ngày Tết: sửa cả `src/pwa/lunar.js` và `Lunar.kt`, đối chiếu kết quả hai bên.
- Script `.ps1`: lưu UTF-8 **có BOM** (Windows PowerShell 5.1 đọc file không BOM thành ANSI, hỏng tiếng Việt).
- Không dùng thư viện/font tải từ mạng, để app chạy offline.
