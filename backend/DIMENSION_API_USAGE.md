# Door Dimension Management API

This document explains how to use the new door dimension management features.

## New Fields Added to OrderDetails

- `gjatesia` (DECIMAL): Input length value
- `gjeresia` (DECIMAL): Input width value  
- `profiliLarte` (DECIMAL): Top profile value (subtracted from length)
- `profiliPoshtem` (DECIMAL): Bottom profile value (subtracted from width)
- `gjatesiaFinale` (VIRTUAL): Calculated final length (gjatesia - profiliLarte)
- `gjeresiaFinale` (VIRTUAL): Calculated final width (gjeresia - profiliPoshtem)

## API Endpoints

### 1. Update Door Dimensions
**PUT** `/api/orders/:id/dimensions`

Updates the dimension fields for a specific order.

**Request Body:**
```json
{
  "gjatesia": 200.50,
  "gjeresia": 150.75,
  "profiliLarte": 5.25,
  "profiliPoshtem": 3.50
}
```

**Response:**
```json
{
  "order": {
    // Complete order object with updated dimensions
  },
  "dimensionCalculations": {
    "gjatesiaFinale": 195.25,
    "gjeresiaFinale": 147.25,
    "dimensionData": {
      "gjatesia": {
        "input": 200.5,
        "profili": 5.25,
        "finale": 195.25
      },
      "gjeresia": {
        "input": 150.75,
        "profili": 3.5,
        "finale": 147.25
      }
    }
  }
}
```

### 2. Get Dimension Calculations
**GET** `/api/orders/:id/dimensions`

Retrieves the calculated dimensions for a specific order.

**Response:**
```json
{
  "gjatesiaFinale": 195.25,
  "gjeresiaFinale": 147.25,
  "dimensionData": {
    "gjatesia": {
      "input": 200.5,
      "profili": 5.25,
      "finale": 195.25
    },
    "gjeresia": {
      "input": 150.75,
      "profili": 3.5,
      "finale": 147.25
    }
  }
}
```

## Frontend Service Usage

### Update Dimensions
```javascript
import { updateDimensions } from '../services/orderService';

const dimensionData = {
  gjatesia: 200.50,
  gjeresia: 150.75,
  profiliLarte: 5.25,
  profiliPoshtem: 3.50
};

try {
  const result = await updateDimensions(orderId, dimensionData);
  console.log('Updated order:', result.order);
  console.log('Calculations:', result.dimensionCalculations);
} catch (error) {
  console.error('Error updating dimensions:', error.message);
}
```

### Get Dimension Calculations
```javascript
import { getDimensionCalculations } from '../services/orderService';

try {
  const calculations = await getDimensionCalculations(orderId);
  console.log('Final length:', calculations.gjatesiaFinale);
  console.log('Final width:', calculations.gjeresiaFinale);
  console.log('Detailed data:', calculations.dimensionData);
} catch (error) {
  console.error('Error getting calculations:', error.message);
}
```

## Calculation Logic

The final dimensions are calculated as follows:

- **Final Length** = Input Length - Top Profile
- **Final Width** = Input Width - Bottom Profile

### Example:
- Input Length: 200.50 cm
- Top Profile: 5.25 cm
- **Final Length: 195.25 cm**

- Input Width: 150.75 cm  
- Bottom Profile: 3.50 cm
- **Final Width: 147.25 cm**

## Validation

- All dimension values must be positive numbers
- Profile values default to 0 if not provided
- Input values can be null/undefined (treated as 0 in calculations)

## Usage in Invoice Printing

These dimensions are specifically designed for invoice printing where you need to show:
1. The input values (what was measured/entered)
2. The profile values (what gets subtracted)
3. The final calculated dimensions (what the actual door size will be)

The visual representation should show arrows indicating the measurements and the calculation process. 