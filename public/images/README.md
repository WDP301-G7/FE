# 📁 Image Folder

Thư mục này chứa hình ảnh cho trang Login/Register.

## 🎯 Cách sử dụng:

1. Copy hình ảnh của bạn vào thư mục này
2. Đặt tên file là: `auth-image.jpg` (hoặc .png/.webp)
3. Hình sẽ tự động xuất hiện trên trang Login/Register

## 📸 Hình ảnh mặc định:

Hiện tại đang dùng: `auth-image.jpg`

## ⚙️ Đổi tên file khác:

Nếu muốn dùng tên file khác (ví dụ: `my-photo.png`):
- Mở: `src/components/AuthImageSide.tsx`
- Đổi dòng: `const IMAGE_URL = '/images/auth-image.jpg';`
- Thành: `const IMAGE_URL = '/images/my-photo.png';`

## 📏 Kích thước khuyến nghị:

- Width: 600-800px
- Height: 800-1000px
- Ratio: 3:4 hoặc 2:3
- Size: < 500KB (để load nhanh)

## ✅ Format hỗ trợ:

- JPG/JPEG ✅
- PNG ✅
- WebP ✅ (khuyên dùng)
- SVG ✅

---

**Lưu ý:** Nếu không có file `auth-image.jpg`, hình sẽ bị lỗi hiển thị.
Copy hình của bạn vào đây ngay bây giờ!
