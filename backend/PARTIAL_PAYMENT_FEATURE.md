# Partial Payment Feature

## Overview

The partial payment feature allows customers to make incremental payments towards their orders instead of paying the full amount at once. This is particularly useful for large orders where customers may prefer to pay in installments.

## How It Works

### Current System Enhancement

The existing payment system has been enhanced to support partial payments:

- **`kaparja`** field now represents **total payments made so far** (including initial down payment + all partial payments)
- **`pagesaMbetur`** is calculated as `cmimiTotal - kaparja`
- **`isPaymentDone`** is automatically set to `true` when remaining debt ≤ €0.01
- **Order status remains unchanged** - it still reflects product completion status

### Key Features

1. **Flexible Payment Amounts**: Users can enter any amount up to the remaining debt
2. **Automatic Calculation**: System automatically updates totals and payment status
3. **Overpayment Protection**: Prevents payments exceeding remaining debt
4. **Payment Tracking**: Records who received each payment
5. **Status Independence**: Product status remains separate from payment status

## API Endpoints

### Main Orders

#### Add Partial Payment
```http
POST /api/orders/:id/partial-payment
Authorization: Bearer <token>
Content-Type: application/json

{
    "paymentAmount": 100.50,
    "paymentReceiver": "John Doe"
}
```

**Response:**
```json
{
    "message": "Pagesa prej €100.50 u regjistrua me sukses!",
    "order": {
        "id": 23,
        "Payment": {
            "cmimiTotal": "523.00",
            "kaparja": "398.50",
            "isPaymentDone": false,
            "kaparaReceiver": "John Doe"
        }
    }
}
```

### Supplementary Orders

#### Add Partial Payment to Supplementary Order
```http
POST /api/supplementary-orders/:id/partial-payment
Authorization: Bearer <token>
Content-Type: application/json

{
    "paymentAmount": 75.00,
    "paymentReceiver": "Jane Smith"
}
```

## Validation Rules

### Payment Amount Validation
- Must be a positive number > 0
- Cannot exceed remaining debt
- Automatically handles decimal precision

### Error Messages
- **Invalid Amount**: `"Shuma e pagesës duhet të jetë një numër pozitiv!"`
- **Overpayment**: `"Shuma e pagesës (€X.XX) nuk mund të jetë më e madhe se borxhi i mbetur (€Y.YY)!"`
- **Missing Amount**: `"Shuma e pagesës është e detyrueshme!"`

## Real-World Scenarios

### Scenario 1: Customer Making Multiple Payments
```
Initial Order: €500.00 total, €100.00 down payment
Remaining: €400.00

Payment 1: €150.00 → New balance: €250.00 remaining
Payment 2: €100.00 → New balance: €150.00 remaining  
Payment 3: €150.00 → New balance: €0.00 remaining ✅ PAID
```

### Scenario 2: Large Order with Small Installments
```
Initial Order: €1,200.00 total, €200.00 down payment
Remaining: €1,000.00

Monthly payments of €200.00:
- Month 1: €200.00 → €800.00 remaining
- Month 2: €200.00 → €600.00 remaining
- Month 3: €200.00 → €400.00 remaining
- Month 4: €200.00 → €200.00 remaining
- Month 5: €200.00 → €0.00 remaining ✅ PAID
```

## Database Changes

### Payment Model Updates
- **`kaparja`** comment updated to: `"Total payments made so far (including initial down payment and partial payments)"`
- **`kaparaReceiver`** comment updated to: `"Person who received the last payment"`

### Backward Compatibility
- Existing orders continue to work without changes
- Frontend can gradually adopt the new partial payment UI
- Legacy "Paguaj" button functionality remains intact

## Frontend Integration Guide

### Recommended UI Flow

1. **Payment Button Click**:
   ```javascript
   // Show modal with current debt info
   const remainingDebt = order.Payment.cmimiTotal - order.Payment.kaparja;
   showPaymentModal({
       remainingDebt,
       orderId: order.id
   });
   ```

2. **Payment Modal**:
   ```html
   <div class="payment-modal">
       <h3>Add Payment</h3>
       <p>Remaining Debt: €{remainingDebt}</p>
       <input type="number" placeholder="Payment Amount" max="{remainingDebt}" />
       <input type="text" placeholder="Received by" />
       <button onclick="submitPartialPayment()">Add Payment</button>
   </div>
   ```

3. **API Call**:
   ```javascript
   async function submitPartialPayment(orderId, amount, receiver) {
       const response = await fetch(`/api/orders/${orderId}/partial-payment`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify({
               paymentAmount: amount,
               paymentReceiver: receiver
           })
       });
       
       const result = await response.json();
       if (response.ok) {
           alert(result.message);
           refreshOrderData();
       } else {
           alert(result.message);
       }
   }
   ```

## Benefits

### For Business
- **Better Cash Flow**: Receive payments incrementally
- **Customer Satisfaction**: Flexible payment options
- **Reduced Risk**: Smaller outstanding debts per customer
- **Clear Tracking**: Know exactly how much each customer has paid

### For Customers  
- **Payment Flexibility**: Pay when convenient
- **Budget Management**: Spread large payments over time
- **Transparent Tracking**: See payment progress clearly

## Testing

Run the test script to verify functionality:
```bash
node test-partial-payments.js
```

The test covers:
- ✅ Adding partial payments
- ✅ Payment calculation accuracy
- ✅ Overpayment protection
- ✅ Invalid amount rejection
- ✅ Status independence verification

## Migration Notes

### Existing Data
- No migration required - existing `kaparja` values represent current payments made
- System seamlessly handles both old (single payment) and new (multiple payment) scenarios

### Implementation Steps
1. ✅ Backend API endpoints added
2. ✅ Validation and error handling implemented
3. ✅ Testing completed
4. 🔄 Frontend UI updates (recommended next step)

## Error Handling

The system provides comprehensive error handling:

```javascript
try {
    await addPartialPayment(orderId, amount, receiver);
} catch (error) {
    // Error messages are in Albanian for user-friendly display
    console.error(error.message);
    // Examples:
    // "Shuma e pagesës duhet të jetë një numër pozitiv!"
    // "Shuma e pagesës (€150.00) nuk mund të jetë më e madhe se borxhi i mbetur (€100.00)!"
}
```

This feature provides a robust foundation for flexible payment management while maintaining full backward compatibility with the existing system. 