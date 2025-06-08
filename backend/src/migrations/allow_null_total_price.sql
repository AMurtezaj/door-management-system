-- Migration: Allow null values for cmimiTotal in Payment table
-- Date: 2024
-- Description: Modify cmimiTotal to allow null values for measurement-first workflow

BEGIN;

-- Allow null values for cmimiTotal and set default value
ALTER TABLE "Payments" 
ALTER COLUMN "cmimiTotal" DROP NOT NULL,
ALTER COLUMN "cmimiTotal" SET DEFAULT 0;

-- Add comment to document the change
COMMENT ON COLUMN "Payments"."cmimiTotal" IS 'Total price - can be null for incomplete orders';

COMMIT;

-- Verify the column was modified successfully
SELECT column_name, is_nullable, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'Payments' 
AND column_name = 'cmimiTotal'; 