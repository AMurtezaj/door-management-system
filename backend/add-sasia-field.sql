-- Migration: Add sasia (quantity) field to support quantity-based pricing
-- Date: 2024
-- Description: Add sasia field to Payment, OrderDetails, and SupplementaryOrder tables

BEGIN;

-- Add sasia field to Payment table
ALTER TABLE "Payments" 
ADD COLUMN "sasia" INTEGER NOT NULL DEFAULT 1;

-- Add comment to document the field
COMMENT ON COLUMN "Payments"."sasia" IS 'Quantity of products ordered';

-- Add sasia field to OrderDetails table
ALTER TABLE "OrderDetails" 
ADD COLUMN "sasia" INTEGER NOT NULL DEFAULT 1;

-- Add comment to document the field
COMMENT ON COLUMN "OrderDetails"."sasia" IS 'Quantity of products ordered';

-- Add sasia field to SupplementaryOrder table
ALTER TABLE "SupplementaryOrders" 
ADD COLUMN "sasia" INTEGER NOT NULL DEFAULT 1;

-- Add comment to document the field
COMMENT ON COLUMN "SupplementaryOrders"."sasia" IS 'Quantity of supplementary products ordered';

-- Add unit price fields to help with calculations
ALTER TABLE "Payments" 
ADD COLUMN "cmimiNjesite" DECIMAL(10, 2);

ALTER TABLE "SupplementaryOrders" 
ADD COLUMN "cmimiNjesite" DECIMAL(10, 2);

-- Add comments for unit price fields
COMMENT ON COLUMN "Payments"."cmimiNjesite" IS 'Unit price per product';
COMMENT ON COLUMN "SupplementaryOrders"."cmimiNjesite" IS 'Unit price per supplementary product';

COMMIT;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name IN ('Payments', 'OrderDetails', 'SupplementaryOrders') 
AND column_name IN ('sasia', 'cmimiNjesite')
ORDER BY table_name, column_name; 