# 📋 STAFF TODO LIST - Prescription Order Management

## 🎯 TỔNG QUAN FLOW

```
[Operation assigns order] 
        ↓
[Staff nhận đơn: CONFIRMED/WAITING_CUSTOMER]
        ↓
[Staff bắt đầu làm: → PROCESSING] (start-processing)
        ↓
[Staff làm xong kính: → READY] (mark-ready)
        ↓
[Khách đến lấy → Staff verify customer]
        ↓
[Staff giao hàng: → COMPLETED] (complete)
```

---

## ✅ ĐÃ HOÀN THÀNH (Implemented)

### 1. ✅ Lấy danh sách đơn được assign
- **Component**: `MyAssignedOrders.tsx`
- **API**: `GET /orders/assigned`
- **Service**: `orderService.getAssignedOrders()`
- **Status**: ✅ Fixed - Backend trả về array trực tiếp, frontend đã xử lý

### 2. ✅ Xem chi tiết đơn hàng
- **Component**: Dialog trong `MyAssignedOrders.tsx`
- **Features**:
  - Tab "Thông tin đơn": Customer, items, total amount
  - Tab "Đơn thuốc": Prescription data (SPH, CYL, AXIS, PD)
- **Component phụ**: `PrescriptionDetails.tsx`
- **Status**: ✅ Hoàn chỉnh

### 3. ✅ Bắt đầu sản xuất kính
- **Button**: "Bắt đầu làm" (Play icon) - chỉ show khi `status === 'CONFIRMED'`
- **API**: `POST /orders/:id/start-processing`
- **Service**: `orderService.startProcessing(id)`
- **Kết quả**: status: CONFIRMED → **PROCESSING**
- **Status**: ✅ Implemented

### 4. ✅ Đánh dấu hoàn thành sản xuất
- **Button**: "Làm xong" (Package icon) - chỉ show khi `status === 'PROCESSING'`
- **API**: `POST /orders/:id/mark-ready`
- **Service**: `orderService.markReady(id)`
- **Kết quả**: status: PROCESSING → **READY**
- **Status**: ✅ Implemented

### 5. ✅ Xác minh khách hàng (khi đến lấy)
- **Dialog**: Verify Customer Dialog
- **Input**: Phone number
- **API**: `GET /orders/:id/verify?phone=xxx`
- **Service**: `orderService.verifyCustomer(orderId, phone)`
- **Response**: `{ verified: true/false, customer: {...}, order: {...} }`
- **Status**: ✅ Implemented

### 6. ✅ Giao hàng cho khách
- **Button**: "Giao khách" (CheckCircle icon) - chỉ show khi `status === 'READY'`
- **API**: `PATCH /orders/:id/complete-with-notes`
- **Service**: `orderService.completeOrderWithNotes(id, { completionNote })`
- **Textarea**: Ghi chú giao hàng (optional)
- **Kết quả**: status: READY → **COMPLETED**
- **Status**: ✅ Implemented

### 7. ✅ Responsive design với animations
- **Framer Motion**: Tất cả components đã có fade-in/slide animations
- **Status**: ✅ Complete

---

## ⚠️ VẤN ĐỀ CẦN FIX (Issues Found)

### 1. ⚠️ Status mismatch: WAITING_CUSTOMER vs CONFIRMED

**Vấn đề**:
- Backend trả về orders với `status: "WAITING_CUSTOMER"` sau khi Operation assign
- Frontend button "Bắt đầu làm" chỉ show khi `status === 'CONFIRMED'`
- Debug data cho thấy 6 orders đều có `status: "WAITING_CUSTOMER"`

**Nguyên nhân có thể**:
1. Backend chưa cập nhật status sau khi assign
2. Operation `confirmOrder()` chưa set status = CONFIRMED
3. Backend API expecting thêm 1 bước confirm từ customer

**Giải pháp**:

**Option A - Fix Frontend** (Nhanh, ít rủi ro):
```typescript
// Trong MyAssignedOrders.tsx, line 312
// Thay đổi điều kiện show button

// CŨ:
{order.status === 'CONFIRMED' && (

// MỚI:
{(order.status === 'CONFIRMED' || order.status === 'WAITING_CUSTOMER') && (
```

**Option B - Fix Backend** (Đúng theo flow):
```typescript
// Backend: operations.service.ts → confirmOrder()
// Sau khi assign staff, cần update:
await Order.update(orderId, {
  status: 'CONFIRMED',  // ⬅️ Set CONFIRMED thay vì để WAITING_CUSTOMER
  handledBy: staffId,
  appointmentDate: appointmentDate,
});
```

**Quyết định**: Nên dùng **Option A** cho nhanh, nhưng báo cho Backend team fix Option B.

---

### 2. ⚠️ Missing: Order Type filter

**Vấn đề**: 
- Staff có thể nhận cả đơn `IN_STOCK` và `PRESCRIPTION`
- Hiện tại không có filter theo order type
- Prescription orders cần xử lý khác (có tab đơn thuốc)

**Giải pháp**:
```typescript
// Thêm filter trong MyAssignedOrders.tsx
const [orderTypeFilter, setOrderTypeFilter] = useState('ALL');

// Thêm Select
<Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
  <SelectContent>
    <SelectItem value="ALL">All Types</SelectItem>
    <SelectItem value="PRESCRIPTION">Đơn thuốc</SelectItem>
    <SelectItem value="IN_STOCK">Có sẵn</SelectItem>
  </SelectContent>
</Select>
```

---

### 3. ⚠️ Missing: Expected Ready Date tracking

**Vấn đề**:
- Order có field `expectedReadyDate` từ Operation
- Staff không thấy deadline này
- Không có warning nếu quá deadline

**Giải pháp**:
```typescript
// Thêm column "Expected Ready" trong table
<TableHead>Expected Ready</TableHead>

// Trong TableCell
<TableCell>
  {order.expectedReadyDate ? (
    <div className={getDateColorClass(order.expectedReadyDate)}>
      {formatDate(order.expectedReadyDate)}
      {isOverdue(order.expectedReadyDate) && (
        <Badge variant="destructive" className="ml-2">Overdue</Badge>
      )}
    </div>
  ) : 'N/A'}
</TableCell>
```

---

## 🔨 TODO LIST - CẦN BỔ SUNG

### High Priority

- [ ] **Fix status button logic**: Allow "Bắt đầu làm" cho `WAITING_CUSTOMER` status
- [ ] **Thêm Expected Ready Date column** trong table
- [ ] **Thêm Order Type badge** trong table (PRESCRIPTION/IN_STOCK)
- [ ] **Thêm overdue warning** cho orders quá expected ready date

### Medium Priority

- [ ] **Thêm notification badge** trên sidebar menu "Orders" khi có đơn mới
- [ ] **Thêm stats cards** trong StaffDashboard Overview:
  - Pending: Số đơn WAITING_CUSTOMER/CONFIRMED
  - Processing: Số đơn PROCESSING
  - Ready: Số đơn READY (chờ khách lấy)
  - Completed Today: Số đơn COMPLETED hôm nay
- [ ] **Sort orders** theo priority: READY > PROCESSING > CONFIRMED > WAITING_CUSTOMER
- [ ] **Highlight prescription orders** (màu khác hoặc icon đặc biệt)

### Low Priority

- [ ] **Add image preview** cho prescription images trong detail dialog
- [ ] **Add print button** để in thông tin đơn thuốc cho khách
- [ ] **Add notes history** (nếu backend support) - xem các lần cập nhật
- [ ] **Add customer appointment info** - hiển thị `appointmentDate` từ Operation

---

## 📊 TESTING CHECKLIST

### Scenario 1: Đơn mới được assign
- [ ] Login as Staff (`staff1@wdp.com` / `Admin@123`)
- [ ] Vào "My Orders" tab
- [ ] Verify: Thấy 6 orders với status WAITING_CUSTOMER
- [ ] Click "Debug API" tab → "Test orderService" → Verify itemsCount = 6

### Scenario 2: Start Processing
- [ ] Chọn 1 order có status WAITING_CUSTOMER hoặc CONFIRMED
- [ ] Click button "Bắt đầu làm" (Play icon)
- [ ] Confirm dialog → Click "Confirm"
- [ ] Verify: Status chuyển sang PROCESSING
- [ ] Verify: Button chuyển thành "Làm xong" (Package icon)

### Scenario 3: Mark Ready
- [ ] Chọn order có status PROCESSING
- [ ] Click "Làm xong"
- [ ] Confirm
- [ ] Verify: Status → READY
- [ ] Verify: Button chuyển thành "Giao khách" (CheckCircle)

### Scenario 4: Complete Order
- [ ] Chọn order có status READY
- [ ] Click "Giao khách"
- [ ] Dialog mở → Nhập phone customer (vd: `0856457844`)
- [ ] Click "Verify Customer"
- [ ] Verify: Show customer name
- [ ] Nhập completion note (optional)
- [ ] Click "Complete Order"
- [ ] Verify: Status → COMPLETED

### Scenario 5: View Prescription
- [ ] Chọn order có `orderType: PRESCRIPTION`
- [ ] Click "Xem chi tiết" (Eye icon)
- [ ] Switch to "Đơn thuốc" tab
- [ ] Verify: Hiển thị đúng right eye, left eye data
- [ ] Verify: Prescription image hiển thị

---

## 🐛 KNOWN BUGS

1. **ESLint warnings** trong MyAssignedOrders.tsx:
   - Line 32: `useState<any>` → Cần type cụ thể
   - Line 38: `useState<any>` 
   - Line 46: Missing `loadOrders` in useEffect deps
   - Lines 59, 123, 139, 184: `error: any` → Cần type Error

**Fix**:
```typescript
// Replace any types
const [prescriptionData, setPrescriptionData] = useState<Prescription | null>(null);
const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

// Fix useEffect
useEffect(() => {
  loadOrders();
}, [pagination.page, searchTerm, statusFilter, loadOrders]);

// Fix error type
} catch (error: unknown) {
  const err = error as { response?: { data?: { message?: string } } };
```

---

## 📝 NOTES

### Order Status Flow (theo MD):
```
WAITING_CUSTOMER (sau payment, chờ Operation assign)
      ↓ (Operation confirms + assigns staff)
CONFIRMED (staff nhận đơn)
      ↓ (staff starts processing)
PROCESSING (đang làm kính)
      ↓ (staff marks ready)
READY (sẵn sàng giao khách)
      ↓ (staff verifies + completes)
COMPLETED (đã giao)
```

### Appointment Date:
- Operation set khi confirm: `appointmentDate` = ngày khách hẹn đến lấy
- Staff cần nhìn thấy để sắp xếp ưu tiên
- Nếu quá appointment date mà chưa READY → có vấn đề

### Payment Flow:
- Customer thanh toán qua VNPay → `paymentStatus: PAID`
- Staff KHÔNG cần xử lý payment
- Staff chỉ verify customer (phone) và giao hàng

---

## 🚀 DEPLOYMENT CHECKLIST

Trước khi deploy lên production:

- [ ] Fix status button logic (WAITING_CUSTOMER → show "Bắt đầu làm")
- [ ] Test toàn bộ flow từ Debug API
- [ ] Fix ESLint warnings
- [ ] Test với real data từ backend
- [ ] Verify animations không lag
- [ ] Test responsive trên mobile browser
- [ ] Check console không có error

---

## 📞 CONTACTS

- **Backend API docs**: `PRESCRIPTION_FLOW_REACT_NATIVE.md`
- **Test credentials**: 
  - Staff: `staff1@wdp.com` / `Admin@123`
  - Customer (test): `customer@example.com` / `Admin@123`
  - Operation (test): `operation@wdp.com` / `Admin@123`
