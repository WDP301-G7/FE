# Operations Components - Workflows Chính (Role: operations)

## 📋 Tổng Quan
Operations role quản lý toàn bộ lifecycle đơn hàng từ xác nhận → giao hàng, xử lý trả hàng, đơn thuốc, kiểm tra review, và quản lý kho/cửa hàng.

---

## 🔐 Role-Based Access Control
```typescript
// AuthContext checks role case-insensitive
hasRole(roles: UserRole | string[]) → normalized to UPPERCASE
// Default: ['operations']
```

**Route Mapping** (App.tsx):
```
/operations/orders      → OrderOperationsPage
/operations/returns     → ReturnPage
/operations/reviews     → ReviewManagementPage
/operations/prescriptions → PrescriptionRequestsPage
/operations/inventory   → InventoryManagement
/operations/stores      → StoresManagement
```

---

## 1️⃣ ORDER OPERATIONS PAGE - Quản Lý Đơn Hàng

### Main Workflow
```
1. List all orders (filter by status, order type, staff, keyword)
   ↓
2. View order detail (customer info, products, pricing, timeline)
   ↓
3. Confirm order (assign staff + appointment date)
   ↓
4. Cancel order (if needed)
```

### Key Features

#### A. Display & Filtering
- **Status Filter**: NEW, PENDING_PAYMENT, CONFIRMED, WAITING_CUSTOMER, PROCESSING, READY, COMPLETED, CANCELLED, EXPIRED
- **Order Type Filter**: 
  - `PRESCRIPTION` (Đơn thuốc) - Purple tag
  - `PRE_ORDER` (Đặt trước) - Gold tag
  - `IN_STOCK` split into:
    - `IN_STOCK_SHIP` (Có sẵn - Giao ship) - Cyan tag
    - `IN_STOCK_STORE` (Có sẵn - Tại quầy) - Green tag
- **Staff Filter**: Filter by assigned staff
- **Keyword Search**: By order ID, customer name/email/phone, staff name

#### B. Order Details Modal
Shows:
- **Customer Info Card** (User icon)
  - Name, phone, email
  - Shipping address (if HOME_DELIVERY)
  - Status, order type, delivery method
  
- **Products Card** (Package icon)
  - Table: image, product name, quantity, unit price, line total
  - Pricing breakdown: subtotal, discount, shipping fee, **total amount** (highlighted cyan)

- **Timeline Card** (CalendarDays icon)
  - Created date
  - Assigned staff
  - For PRESCRIPTION/PRE_ORDER: Expected ready date with urgency indicator
    - Green: ✓ Safe (more than 3 days)
    - Orange: ⚠️ Urgent (≤3 days)
    - Red: ⚠️ Overdue (if pastDue)

#### C. Confirm Order Action (status === 'CONFIRMED')
```typescript
// handleConfirm(order):
if (isInStockOrder) {
  appointmentDate = today  // Auto-set
} else if (isPrescriptionOrder) {
  appointmentDate = order.expectedReadyDate  // Auto-set
} else {
  appointmentDate = user_selected_date  // Required
}

// Call API
await operationsService.confirmOrder(orderId, {
  appointmentDate: ISO_string,
  appointmentNotes: string,
  assignedStaffId: UUID
})
// Result: Order status → PROCESSING/READY
```

#### D. Cancel Order Action (status === 'CONFIRMED')
```typescript
// handleCancel(order):
await operationsService.cancelOrder(orderId, { reason: string })
// Result: Order status → CANCELLED
```

### State Management
```typescript
const [orders, setOrders] = useState<OrderDetails[]>()
const [statusFilter, setStatusFilter] = useState<string>()
const [orderTypeLocalFilter, setOrderTypeLocalFilter] = useState<string>()  // IN_STOCK_SHIP/IN_STOCK_STORE
const [staffLocalFilter, setStaffLocalFilter] = useState<string>()
const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>()
const [isDetailOpen, setIsDetailOpen] = useState(boolean)
const [isConfirmOpen, setIsConfirmOpen] = useState(boolean)
const [isCancelOpen, setIsCancelOpen] = useState(boolean)
```

---

## 2️⃣ RETURN MANAGEMENT PAGE - Quản Lý Đơn Trả Hàng

### Main Workflow
```
1. List all return requests (filter by status, type, keyword)
   ↓
2. View return detail (customer, products, images, refund info, reason)
   ↓
3. Approve return
   ├→ Add approval note (optional)
   └→ Status: PENDING → APPROVED

4. Reject return
   ├→ Provide rejection reason (required)
   └→ Status: PENDING → REJECTED

5. Cancel return
   └→ For PENDING/APPROVED only
```

### Key Concepts

#### Return Types
- `RETURN` (Hoàn trả) - Tag: default
- `EXCHANGE` (Đổi hàng) - Tag: blue
- `WARRANTY` (Bảo hành) - Tag: green

#### Return Statuses
- `PENDING` - Chờ phê duyệt (show Approve/Reject buttons)
- `APPROVED` - Đã phê duyệt
- `REJECTED` - Đã từ chối
- `COMPLETED` - Hoàn thành
- `CANCELLED` - Đã hủy

#### Refund Amount Display
```typescript
if (selectedReturn.status === 'COMPLETED') {
  label = 'Hoàn tiền thực tế'      // Actual amount after processing
  amount = selectedReturn.refundAmount
} else {
  label = 'Dự kiến hoàn tiền'      // Estimated amount
  amount = calculated_from_items
}
```

#### Return Details Modal
- **Customer Info Card**: Name, phone, email, status, type
- **Return Reason Card**: Reason + description
- **Products Card**: Table of returned items (product, qty, condition, price)
- **Refund Info Card**: Amount (large cyan text) + refund method (bank/cash)
- **Images Card**: 4-column grid of evidence photos (cust/staff)
- **Rejection Reason Card** (if REJECTED): Red-colored rejection note
- **Completion Note Card** (if COMPLETED): Completion summary
- **Timeline Card**: Created date, approved date, completed date

#### Actions by Status
```
PENDING:
  - handleApprove() → APPROVED + optional note
  - handleReject() → REJECTED + required reason
  - handleCancel() → CANCELLED

PENDING/APPROVED:
  - handleCancel() → CANCELLED

REJECTED/COMPLETED/CANCELLED:
  (Read-only - no actions)
```

### Service Methods
```typescript
returnService.getReturns(filters)
returnService.approveReturn(id, note?)
returnService.rejectReturn(id, reason)
returnService.cancelReturn(id)
```

---

## 3️⃣ PRESCRIPTION REQUESTS PAGE - Quản Lý Đơn Thuốc

### Main Workflow
```
1. List all prescription requests (filter by status, store, handler, customer)
   ↓
2. View prescription detail (prescripted eye specs, diagnosis, created by)
   ↓
3. Contact customer
   ├→ Update contact status
   └→ Add contact notes

4. Create order from prescription
   ├→ Add products to order
   ├→ Set prescription specs (sphere, cylinder, axis for each eye)
   ├→ Set expiry date (days) for prescription
   └→ Create order
```

### Prescription Fields
```typescript
// Eye specs (OD = right, OS = left)
rightSphere: number        // Cầu kính phải
rightCylinder: number      // Trụ kính phải
rightAxis: number          // Trục phải
leftSphere: number         // Cầu kính trái
leftCylinder: number       // Trụ kính trái
leftAxis: number           // Trục trái
pupillaryDistance: number  // Khoảng cách đ瞳孔 (default: 62)

prescriptionNotes: string
expiryDays: number         // Ngày hết hạn tổng quát
expectedReadyDate: string  // Dự kiến hoàn thành
```

### Status Flow
```
NEW → CONTACTED / PENDING / COMPLETED / CANCELLED

Contact Status options:
  - PENDING_CONTACT
  - CONTACTED
  - NOT_REACHABLE
```

### Dialog Flows
1. **Detail Modal**: Show prescription request info + customer + contact history
2. **Contact Modal**: Update contact status + add notes
3. **Create Order Modal**: 
   - Add products from catalog
   - Fill prescription specs
   - Preview order
   - Confirm creation

---

## 4️⃣ REVIEW MANAGEMENT PAGE - Quản Lý Review/Đánh Giá

### Main Workflow
```
1. List all product reviews (filter by status, rating, search)
   ↓
2. View review detail (customer, product, rating, comment, images)
   ↓
3. Publish review (HIDDEN → PUBLISHED)
   ├→ Compose reply message
   └→ Reply sent

4. Hide review (PUBLISHED → HIDDEN)
```

### Key Features

#### Review Status
- `PUBLISHED` (Đã xuất bản) - Visible to customers
- `HIDDEN` (Ẩn) - Not visible

#### Display Stats
```
- Total reviews
- Published count
- Hidden count
- Average rating (stars)
- By-rating distribution (1-5 stars)
```

#### Review Detail Card
- **Product Info**: Name, image, category
- **Customer Info**: Name, email, phone, avatar
- **Rating**: Star display (1-5)
- **Comment**: Full text review
- **Images**: Gallery of user-uploaded photos
- **Metadata**: Created date, order ID

#### Services
```typescript
reviewService.getReviews(params)          // List
reviewService.getReviewDetail(id)         // Detail
reviewService.replyToReview(id, message)  // Add reply
reviewService.publishReview(id)           // HIDDEN → PUBLISHED
reviewService.hideReview(id)              // PUBLISHED → HIDDEN
```

---

## 5️⃣ INVENTORY MANAGEMENT - Quản Lý Kho

### Main Workflow
```
1. List inventory (filter by product, store, low-stock status)
   ↓
2. Create new inventory record
   ├→ Select product
   ├→ Select store
   ├→ Set quantity
   ├→ Set reserved quantity
   └→ Save

3. Edit inventory
   └→ Update quantity/reserved

4. Reserve quantity (block stock for specific orders)
   └→ Set reserve amount

5. Delete inventory record
```

### Key Metrics
```
Available = quantity - reservedQuantity
LowStock = available < 10  (configurable)
```

### Services
```typescript
inventoryService.getInventories(filters)
inventoryService.createInventory(data)
inventoryService.updateInventory(id, data)
inventoryService.deleteInventory(id)
inventoryService.reserveQuantity(id, amount)
```

---

## 6️⃣ STORES MANAGEMENT - Quản Lý Cửa Hàng

### Main Workflow
```
1. List all stores (search by name, address)
   ↓
2. Create new store
   ├→ Name
   ├→ Address
   └→ Save

3. Edit store
   └→ Name, address

4. Delete store
   └→ Confirm
```

### Services
```typescript
storeService.getStores(filters)
storeService.createStore(data)
storeService.updateStore(id, data)
storeService.deleteStore(id)
```

---

## 🔄 Data Flow Diagram

```
                     ┌─────────────────────────────────┐
                     │    AuthContext (hasRole)        │
                     │  Checks: role = 'operations'    │
                     └──────────────┬──────────────────┘
                                    │ ✓ Allow
                                    ↓
                    ┌─────────────────────────────────┐
                    │  operations-components/          │
                    │  ├─ OrderOperationsPage         │
                    │  ├─ ReturnPage                  │
                    │  ├─ PrescriptionRequestsPage    │
                    │  ├─ ReviewManagementPage        │
                    │  ├─ InventoryManagement         │
                    │  └─ StoresManagement            │
                    └──────────────┬──────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ↓                                ↓
         ┌──────────────────────────┐   ┌────────────────────────┐
         │  operationsService       │   │  Other Services        │
         ├──────────────────────────┤   ├────────────────────────┤
         │ getAllOrders()           │   │ returnService.*        │
         │ confirmOrder()           │   │ reviewService.*        │
         │ cancelOrder()            │   │ inventoryService.*     │
         │ getPrescriptions()       │   │ storeService.*         │
         │ updateContact()          │   │ productService.*       │
         │ createOrder()            │   │ adminService.*         │
         └──────────────────────────┘   └────────────────────────┘
                    │                                │
                    └───────────────┬────────────────┘
                                    ↓
                    ┌─────────────────────────────────┐
                    │   Backend API Endpoints         │
                    │   /api/orders/*                 │
                    │   /api/returns/*                │
                    │   /api/reviews/*                │
                    │   /api/inventory/*              │
                    │   /api/stores/*                 │
                    │   /api/prescriptions/*          │
                    └─────────────────────────────────┘
```

---

## 🛠️ Common Patterns

### 1. List + Filter + Pagination
```typescript
const [data, setData] = useState([])
const [filters, setFilters] = useState({page, limit, status, ...})

useEffect(() => {
  loadData(filters)
}, [filters])

const loadData = async () => {
  try {
    const res = await service.getData(filters)
    setData(res.data)
    setPagination(res.pagination)
  } catch (err) {
    toast.error(err.message)
  }
}
```

### 2. Detail Modal + Actions
```typescript
const [selected, setSelected] = useState(null)
const [detailOpen, setDetailOpen] = useState(false)
const [actionOpen, setActionOpen] = useState(false)

const openDetail = (item) => {
  setSelected(item)
  setDetailOpen(true)
}

const handleAction = async () => {
  try {
    await service.performAction(selected.id, data)
    toast.success()
    setActionOpen(false)
    loadData()  // Refresh
  } catch (err) {
    toast.error(err.message)
  }
}
```

### 3. Status-Based Actions
```typescript
if (item.status === 'PENDING') {
  // Show action buttons (approve, reject, etc)
} else if (item.status === 'COMPLETED') {
  // Read-only mode
} else {
  // Different actions
}
```

---

## 📊 Component Architecture

```
OrderOperationsPage
├── Stats Cards (4 columns)
│   ├─ Total orders
│   ├─ Completed
│   ├─ Confirmed
│   └─ Cancelled
├── Filters & Search
│   ├─ Status filter (Select)
│   ├─ Keyword search (Input)
│   ├─ Order type filter (Select)
│   ├─ Staff filter (Select)
│   ├─ Reload button
│   └─ Clear filters button
├── Table (with pagination)
│   ├─ Order ID
│   ├─ Status badge
│   ├─ Order type tag
│   ├─ Total amount
│   ├─ Created date
│   ├─ Customer name
│   ├─ Staff name
│   └─ Actions (View, Confirm, Cancel)
├── Detail Modal (width: 960px)
│   ├─ Customer info card
│   ├─ Products card
│   ├─ Pricing breakdown
│   └─ Timeline card
├── Confirm Modal
│   ├─ Order summary
│   ├─ Payment warning (if UNPAID)
│   ├─ Product list
│   ├─ Appointment date picker (if needed)
│   ├─ Staff select (required)
│   └─ Confirm button
└── Cancel Modal
    ├─ Cancel reason textarea
    └─ Confirm cancel button
```

---

## ⚠️ Important Notes

### Hook Rules Violation (Current Issue)
❌ **WRONG** - Role check before hooks:
```typescript
if (!hasRole(['operations'])) {
  return <Navigate to="/dashboard" replace />  // Returns too early
}
const { toast } = useToast()  // ❌ Hook called conditionally
const [orders, setOrders] = useState()  // ❌ Hook called conditionally
```

✅ **CORRECT** - Call all hooks first, then check role:
```typescript
const { hasRole } = useAuth()
const { toast } = useToast()
const [orders, setOrders] = useState()

// Then check role
if (!hasRole(['operations'])) {
  return <Navigate to="/dashboard" replace />  // ✓ All hooks already called
}
```

### Conditional Rendering
```typescript
// ✓ CORRECT - Render based on state, use hooks unconditionally
if (isDetailOpen) return null  // Just don't render, but hooks still called
return <Modal ... >...</Modal>
```

### RefreshData After Actions
Always refresh list after state-changing actions:
```typescript
await service.createOrder(data)
toast.success()
loadData()  // 👈 Refresh list
```

---

## 🔗 Related Services
- `operations.service.ts` - Orders, prescriptions
- `return.service.ts` - Returns management
- `review.service.ts` - Review management
- `inventory.service.ts` - Inventory CRUD
- `store.service.ts` - Store CRUD
- `admin.service.ts` - Staff list (loaded in OrderOperationsPage)
- `product.service.ts` - Product info + images

---

## 🎯 Summary
Operations role is the backbone of order fulfillment workflow:
1. **Accept & confirmation** of orders with staff assignment
2. **Handle returns** (approve/reject/cancel)
3. **Manage prescriptions** (contact + create orders)
4. **Moderate reviews** (publish/hide + reply)
5. **Maintain inventory** & store data

All operations have audit trails and status-based action flows with proper error handling.
