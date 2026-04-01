# 🔍 DEBUG: Staff Assigned Orders - View & Action Issues

## 📋 Issue Report
**User Problem:** Staff can see assigned orders but cannot:
- ❌ View order details (clicking Eye icon does nothing)
- ❌ Change order status (clicking action buttons does nothing)

**Expected Behavior:**
- ✅ Click Eye icon → Opens order detail dialog with customer info, items, prescription
- ✅ Click "Bắt đầu làm" → Changes status from WAITING_CUSTOMER → PROCESSING
- ✅ Click "Làm xong" → Changes status from PROCESSING → READY
- ✅ Click "Giao khách" → Opens verify dialog, then marks COMPLETED

---

## 🛠️ Debug Tools Added

### 1. **Debug API Tab** (StaffDashboard)
- Navigate to: **Staff Dashboard → Debug API** tab
- Shows:
  - 👤 Current user info from localStorage
  - 🔑 User ID comparison with order.handledBy
  - 📊 Raw API responses
- Click "Test orderService (Final)" to fetch orders

### 2. **Debug Banner** (MyAssignedOrders page)
- Shows at top of "My Assigned Orders" page
- Displays:
  - Logged user ID
  - First order's handledBy ID
  - ✅/❌ ID match status

### 3. **Console Logging**
- All button clicks logged to browser console
- Handler executions tracked with emojis

---

## 🔬 Step-by-Step Debug Process

### Step 1: Check User Authentication
1. Open **Staff Dashboard → My Orders** tab
2. Look at the **blue debug banner** at the top
3. Note the values:
   ```
   Logged User ID: [GUID]
   First Order handledBy: [GUID]
   IDs MATCH: ✅ or ❌
   ```

**Expected:** Both IDs should be the same

**If IDs DON'T MATCH:**
- ❌ **ROOT CAUSE FOUND:** Backend rejects actions because logged-in staff ID ≠ order.handledBy
- **Solution:** Need to check:
  - Is staff logged in with correct account?
  - Did Operation assign order to different staff?
  - Is there a JWT token issue?

---

### Step 2: Test Button Clicks
1. Open browser **Console** (F12 → Console tab)
2. Click **Eye icon** (View Details) on any order
3. Check console for:
   ```
   👁️ View Details button clicked for order: [order-id]
   🔍 handleViewDetails called with order: [order-id] [order-number]
   ✅ Dialog state set: { isDetailDialogOpen: true, selectedOrder: ... }
   ```

**If you see these logs:**
- ✅ Button onClick works
- ✅ Handler executes
- ➡️ Check if dialog renders (Step 3)

**If NO logs appear:**
- ❌ Button onClick not firing
- Possible causes:
  - Button disabled
  - JavaScript error blocking execution
  - Event listener not attached

---

### Step 3: Check Dialog Rendering
1. After clicking Eye icon, check console for dialog logs
2. Inspect page with **F12 → Elements** tab
3. Search for: `isDetailDialogOpen`
4. Use React DevTools to check component state

**Expected:** `isDetailDialogOpen: true` and dialog should appear

**If dialog doesn't appear:**
- Check if Dialog component has `open={isDetailDialogOpen}` prop
- Check if there's CSS hiding the dialog (z-index, display: none)
- Check if selectedOrder is null

---

### Step 4: Test Status Change Actions
1. For orders with status **WAITING_CUSTOMER**, click **▶️ Play icon** (Bắt đầu làm)
2. Check console for:
   ```
   ▶️ Start Processing button clicked for order: [order-id]
   ⚡ handleAction called: { orderId: [id], action: 'start' }
   ✅ Opening confirm dialog for action: start
   ```
3. Confirm dialog should appear with "Bắt đầu xử lý đơn hàng?"

**If confirm dialog appears:**
- ✅ Button and handler work
- ➡️ Test API call (Step 5)

**If nothing happens:**
- Check conditional rendering: `order.status === 'CONFIRMED' || order.status === 'WAITING_CUSTOMER'`
- Check if button renders in DOM (Inspect Element)

---

### Step 5: Test API Calls
1. Open **Network tab** (F12 → Network)
2. Click action button (e.g., "Bắt đầu làm")
3. Confirm action in dialog
4. Check for API request: `PUT /orders/{id}/start-processing`

**Check Response:**
- **200 OK:** ✅ Success, order status should update
- **401 Unauthorized:** ❌ JWT token invalid or expired
- **403 Forbidden:** ❌ This staff not authorized for this order (ID mismatch!)
- **404 Not Found:** ❌ Order doesn't exist
- **500 Server Error:** ❌ Backend error

**If 403 Forbidden:**
- **ROOT CAUSE:** Backend checks if `req.user.id === order.handledBy`
- **Solution:** Verify logged-in staff ID matches order.handledBy (Step 1)

---

## 🐛 Common Issues & Solutions

### Issue 1: IDs Don't Match
**Symptom:** Debug banner shows ❌ IDs DON'T MATCH

**Causes:**
1. Staff logged in with wrong account
2. Operation assigned order to different staff
3. Backend returned wrong handledBy value
4. JWT token contains different user ID

**Solutions:**
- **A. Re-login as correct staff:**
  1. Logout
  2. Login with: `staff1@wdp.com` / `Admin@123`
  3. Check debug banner again

- **B. Check localStorage:**
  1. Open Console: `JSON.parse(localStorage.getItem('user'))`
  2. Verify `id` field matches handledBy

- **C. Re-assign order (Operation role):**
  1. Login as Operation user
  2. Go to Operations Dashboard → Orders
  3. Find the order
  4. Re-assign to correct staff

---

### Issue 2: Buttons Don't Show
**Symptom:** No action buttons visible (only Eye icon)

**Cause:** Order status doesn't match button conditions

**Check:**
- "Bắt đầu làm" (Play) → Shows for `CONFIRMED` or `WAITING_CUSTOMER`
- "Làm xong" (Package) → Shows for `PROCESSING`
- "Giao khách" (CheckCircle) → Shows for `READY`

**Solution:**
1. Check order status in debug banner or console
2. If status is unexpected, check backend order state
3. Update status using Operation dashboard if needed

---

### Issue 3: Dialog Doesn't Open
**Symptom:** Button click logged, handler executes, but no dialog appears

**Causes:**
1. `isDetailDialogOpen` state not updating
2. Dialog component not rendering
3. CSS z-index issue hiding dialog

**Solutions:**
- **A. Check React state:**
  - Use React DevTools
  - Find MyAssignedOrders component
  - Check `isDetailDialogOpen` state after click

- **B. Check Dialog component:**
  - Search code for: `<Dialog open={isDetailDialogOpen}`
  - Verify `open` prop is bound correctly

- **C. Check CSS:**
  - Inspect with F12
  - Look for Dialog element in DOM
  - Check if z-index is too low or display: none

---

### Issue 4: API Returns 403 Forbidden
**Symptom:** Network tab shows PUT request with 403 response

**Cause:** Backend authorization check fails
```typescript
// Backend logic
if (req.user.id !== order.handledBy) {
  throw new ForbiddenException('Not authorized');
}
```

**Solution:**
1. Confirm user ID matches handledBy (Step 1)
2. Check JWT token in localStorage: `localStorage.getItem('accessToken')`
3. Decode JWT at [jwt.io](https://jwt.io) to verify user ID
4. If token invalid, logout and re-login

---

## 📊 Expected Data Structure

### Current User (from AuthContext)
```typescript
{
  id: "3bc9f323-59c5-4161-a3ce-203d92fa4286",
  name: "staff1234",
  email: "staff1@wdp.com",
  role: "staff"
}
```

### Order (from API)
```typescript
{
  id: "order-uuid",
  orderNumber: "ORD-20241215-001",
  status: "WAITING_CUSTOMER",
  handledBy: "3bc9f323-59c5-4161-a3ce-203d92fa4286", // ⚠️ Must match user.id
  handler: {
    id: "3bc9f323-59c5-4161-a3ce-203d92fa4286",
    fullName: "staff1234",
    email: "staff1@wdp.com"
  },
  customer: { ... },
  orderItems: [ ... ],
  prescription: { ... }
}
```

**Critical:** `user.id === order.handledBy` for authorization

---

## 🧪 Test Scenarios

### Test 1: Basic View Details
1. ✅ Login as staff1@wdp.com
2. ✅ Navigate to My Orders
3. ✅ Check debug banner shows matching IDs
4. ✅ Click Eye icon on first order
5. ✅ Verify dialog opens with order details
6. ✅ Check Prescription tab shows prescription data

### Test 2: Start Processing Flow
1. ✅ Find order with status WAITING_CUSTOMER
2. ✅ Verify Play icon button visible
3. ✅ Click Play icon
4. ✅ Confirm dialog appears: "Bắt đầu xử lý đơn hàng?"
5. ✅ Click "Xác nhận"
6. ✅ Check Network tab for PUT /orders/{id}/start-processing
7. ✅ Verify 200 OK response
8. ✅ Check order status updates to PROCESSING
9. ✅ Verify button changes from Play to Package icon

### Test 3: Mark Ready Flow
1. ✅ Find order with status PROCESSING
2. ✅ Verify Package icon button visible
3. ✅ Click Package icon
4. ✅ Confirm dialog appears
5. ✅ Click "Xác nhận"
6. ✅ Verify status updates to READY
7. ✅ Verify button changes to CheckCircle icon

### Test 4: Complete Order Flow
1. ✅ Find order with status READY
2. ✅ Click CheckCircle icon (Giao khách)
3. ✅ Verify dialog appears: "Xác thực khách hàng"
4. ✅ Enter customer phone number
5. ✅ Click "Xác thực"
6. ✅ Check Network tab for POST /orders/{id}/verify-customer
7. ✅ If verified, enter completion note
8. ✅ Click "Hoàn thành"
9. ✅ Check Network tab for PUT /orders/{id}/complete
10. ✅ Verify status updates to COMPLETED

---

## 🔧 Quick Fixes Applied

### Fix 1: Added Console Logging
**File:** `MyAssignedOrders.tsx`
- Lines 70-80: handleViewDetails logs
- Lines 85-95: handleAction logs
- Lines 310-360: Button onClick logs

### Fix 2: Added Debug Banner
**File:** `MyAssignedOrders.tsx`
- Lines 235-255: Shows user ID, handledBy, match status

### Fix 3: Enhanced Debug API Tab
**File:** `DebugAssignedOrders.tsx`
- Lines 15-30: Current user info card
- Shows user from context and localStorage
- Compares with order.handledBy

---

## 📞 If Still Not Working

### Final Debug Checklist
- [ ] User ID matches handledBy in debug banner
- [ ] Console shows button click logs
- [ ] Console shows handler execution logs
- [ ] React DevTools shows state updates
- [ ] Dialog component renders in DOM (inspect element)
- [ ] Network tab shows API requests
- [ ] API responses are 200 OK (not 403/401)

### Manual Testing Command
```javascript
// Run in browser console
console.log('User:', JSON.parse(localStorage.getItem('user')));
console.log('Token:', localStorage.getItem('accessToken'));
```

### Backend Check (if you have access)
1. Check order in database: `SELECT * FROM orders WHERE order_number = 'ORD-20241215-001'`
2. Verify `handled_by` field matches staff user ID
3. Check logs for authorization errors

---

## ✅ Success Criteria

**All these should work:**
1. ✅ Click Eye icon → Dialog opens with order details
2. ✅ Click Play icon → Confirm dialog → Status changes to PROCESSING
3. ✅ Click Package icon → Confirm dialog → Status changes to READY
4. ✅ Click CheckCircle icon → Verify dialog → Complete dialog → Status changes to COMPLETED
5. ✅ All API calls return 200 OK
6. ✅ UI updates immediately after status change
7. ✅ No console errors

**When complete:**
- Remove debug banner from MyAssignedOrders.tsx (lines 235-255)
- Remove excessive console.log statements
- Keep Debug API tab for future troubleshooting
