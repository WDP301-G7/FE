# 🚀 Quick Start: Upload Hình Ảnh Ngay Bây Giờ

## ⚡ 3 Bước Đơn Giản:

### 1️⃣ Chọn hình từ máy tính
Chọn một hình đẹp (kích thước ~600x800px)

### 2️⃣ Copy vào thư mục này:
```
D:\ki 8\WDP\FE\public\images\auth-image.jpg
```
(Đổi tên file thành auth-image.jpg)

### 3️⃣ Refresh trình duyệt
Xong! Hình mới sẽ xuất hiện ngay!

---

## 🎯 Tùy chọn nguồn hình:

Mở file: `src/components/AuthImageSide.tsx`

Tìm dòng:
```typescript
const IMAGE_SOURCE: 'local' | 'online' = 'local';
```

**Chế độ:**
- `'local'` = Dùng hình từ máy (FE/public/images/auth-image.jpg)
- `'online'` = Dùng hình từ Unsplash (backup)

---

## 📝 Đổi tên file khác:

Nếu file hình của bạn tên khác (ví dụ: `my-photo.png`):

```typescript
const LOCAL_IMAGE = '/images/my-photo.png'; // Đổi tên ở đây
```

---

## ❌ Troubleshooting:

### Hình không hiển thị?
1. Kiểm tra file có tồn tại: `FE/public/images/auth-image.jpg`
2. Kiểm tra tên file chính xác (case-sensitive)
3. Refresh: Ctrl+F5

### Hiện message "Hình ảnh chưa được upload"?
→ Chức năng fallback đang hoạt động!
→ Copy hình vào đúng vị trí và refresh lại

---

## 💡 Pro Tips:

✅ Nén hình trước khi upload: https://tinypng.com
✅ Khuyên dùng format WebP (nhẹ hơn JPG)
✅ Chọn hình có tông màu sáng/đẹp mắt

---

**Hiện tại:** Đang chờ bạn upload hình! 📸
