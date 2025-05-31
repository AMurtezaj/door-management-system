# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the role-based access control system implemented in the LindiDoors Management System. The system supports two user roles: **Admin** and **Manager** (menaxher), with different levels of access and permissions.

## User Roles

### Admin (`admin`)
- **Full access** to all system features
- Can perform all CRUD operations
- Can manage user accounts
- Can manage daily capacities
- Can process payments and manage debts
- Can edit and delete orders

### Manager (`menaxher`)
- **Limited access** with view-only restrictions on sensitive operations
- Can view all data but cannot modify critical business operations
- Can add new orders but cannot edit or delete existing ones
- Cannot manage payments or mark debts as paid
- Cannot manage daily capacities
- Cannot access user management

## Implementation Details

### 1. Authentication Context (`AuthContext.jsx`)
Enhanced with role-based helper functions:
```javascript
const isAdmin = user?.roli === 'admin';
const isManager = user?.roli === 'menaxher';
const canEditOrders = isAdmin;
const canManagePayments = isAdmin;
const canManageCapacities = isAdmin;
const canManageUsers = isAdmin;
```

### 2. Navigation Restrictions (`Sidebar.jsx`)
- **User Management** section is hidden from managers
- All other sections are visible to both roles
- Role-based filtering using `roles` array for each navigation item

### 3. Order Management (`OrderList.jsx`)

#### Admin Permissions:
- ✅ View all orders
- ✅ Add new orders
- ✅ Edit existing orders
- ✅ Delete orders
- ✅ Manage payments (Paguaj/Anulo Pagesën buttons)
- ✅ Manage dimensions
- ✅ Add supplementary orders
- ✅ Print invoices

#### Manager Restrictions:
- ✅ View all orders
- ✅ Add new orders
- ❌ Edit existing orders (button hidden)
- ❌ Delete orders (button hidden)
- ❌ Manage payments (buttons disabled)
- ❌ Manage dimensions (component hidden)
- ✅ Add supplementary orders
- ✅ Print invoices
- ℹ️ Shows "Vetëm shikimi" (View only) indicator

### 4. Capacity Management (`CapacityManagement.jsx`)

#### Admin Permissions:
- ✅ View daily capacities
- ✅ Add new capacity configurations
- ✅ Edit existing capacities
- ✅ Delete capacities
- ✅ View orders for specific days

#### Manager Restrictions:
- ✅ View daily capacities
- ❌ Add new capacity configurations (form hidden)
- ❌ Edit existing capacities (button hidden)
- ❌ Delete capacities (button hidden)
- ✅ View orders for specific days
- ℹ️ Shows informational alert about restrictions

### 5. Debt Management (`DebtManagementPage.jsx`)

#### Admin Permissions:
- ✅ View all debts (cash and bank)
- ✅ Mark debts as paid
- ✅ View debt statistics
- ✅ Access order details via Details button

#### Manager Restrictions:
- ✅ View all debts (cash and bank)
- ❌ Mark debts as paid (buttons disabled)
- ✅ View debt statistics
- ❌ Access order details (Details button hidden)
- ℹ️ Shows informational alert about payment and details restrictions

### 6. Supplementary Orders (`SupplementaryOrdersList.jsx`)

#### Admin Permissions:
- ✅ View supplementary orders
- ✅ Add new supplementary orders
- ✅ Manage payments for supplementary orders
- ✅ Delete supplementary orders

#### Manager Restrictions:
- ✅ View supplementary orders
- ✅ Add new supplementary orders
- ❌ Manage payments (buttons disabled with tooltip)
- ❌ Delete supplementary orders (button hidden)
- ℹ️ Shows "Vetëm shikimi" (View only) indicator

### 7. Notification Management (`NotificationsPage.jsx`)

#### Admin Permissions:
- ✅ View all notifications
- ✅ Mark notifications as read
- ✅ Mark all notifications as read
- ✅ Delete notifications
- ✅ Filter and search notifications

#### Manager Restrictions:
- ✅ View all notifications
- ✅ Mark notifications as read
- ✅ Mark all notifications as read
- ❌ Delete notifications (delete button hidden)
- ✅ Filter and search notifications
- ℹ️ Shows informational alert about deletion restrictions
- ℹ️ Shows "Vetëm shikimi" (View only) indicator when no actions are available

## User Interface Indicators

### For Managers:
1. **Informational Alerts**: Clear notifications explaining access restrictions
2. **Disabled Buttons**: Payment-related buttons are disabled with explanatory tooltips
3. **Hidden Elements**: Edit/Delete buttons are completely hidden
4. **View-Only Indicators**: "Vetëm shikimi" text shown where appropriate

### Visual Feedback:
- 🔒 Disabled buttons with tooltips explaining restrictions
- ℹ️ Blue informational alerts for managers
- 👁️ "View only" indicators in action columns

## Security Considerations

### Frontend Protection:
- Role checks in components prevent unauthorized actions
- UI elements are conditionally rendered based on permissions
- Clear visual indicators for restricted access

### Backend Protection:
- Server-side role validation (existing middleware)
- API endpoints respect user roles
- Database operations are role-protected

## Benefits

1. **Clear Separation of Duties**: Managers can view and add data but cannot modify critical business operations
2. **Data Integrity**: Prevents accidental modifications by limiting edit/delete access
3. **Payment Security**: Only admins can process payments and manage debts
4. **Capacity Control**: Daily capacity management is restricted to admins only
5. **User Management Security**: Confidential user data is admin-only
6. **Audit Trail**: Clear distinction between admin and manager actions

## Testing Scenarios

### Manager Login Test:
1. Login as manager
2. Verify restricted sections are hidden/disabled
3. Attempt to edit orders (should be prevented)
4. Attempt to manage payments (should be disabled)
5. Verify capacity management restrictions

### Admin Login Test:
1. Login as admin
2. Verify full access to all features
3. Confirm all buttons and sections are available
4. Test all CRUD operations

## Future Enhancements

1. **Granular Permissions**: More specific role-based permissions
2. **Department-Based Access**: Role restrictions based on departments
3. **Time-Based Access**: Temporary elevated permissions
4. **Audit Logging**: Track all role-based actions
5. **Permission Groups**: Custom permission sets for different user types

---

**Implementation Status**: ✅ Complete
**Last Updated**: December 2024
**Version**: 1.0 