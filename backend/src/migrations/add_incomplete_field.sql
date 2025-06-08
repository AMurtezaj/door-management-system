-- Migration: Add isIncomplete field to OrderDetails table
-- Date: 2024
-- Description: Adds isIncomplete field to support measurement-first workflow

BEGIN;

-- Add isIncomplete column
ALTER TABLE "OrderDetails" 
ADD COLUMN IF NOT EXISTS "isIncomplete" BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the purpose
COMMENT ON COLUMN "OrderDetails"."isIncomplete" IS 'Indicates if this is an incomplete order from measurement-first workflow';

-- Create index for better performance when querying incomplete orders
CREATE INDEX IF NOT EXISTS "idx_order_details_incomplete" ON "OrderDetails"("isIncomplete");

COMMIT;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'OrderDetails' 
AND column_name = 'isIncomplete'; 