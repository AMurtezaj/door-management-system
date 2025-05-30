-- Migration: Add dimension fields to OrderDetails table
-- Date: 2024
-- Description: Adds gjatesia, gjeresia, profiliLarte, and profiliPoshtem fields for door dimension management

BEGIN;

-- Add gjatesia column (input length value)
ALTER TABLE "OrderDetails" 
ADD COLUMN IF NOT EXISTS "gjatesia" DECIMAL(10,2) NULL;

-- Add gjeresia column (input width value)
ALTER TABLE "OrderDetails" 
ADD COLUMN IF NOT EXISTS "gjeresia" DECIMAL(10,2) NULL;

-- Add profiliLarte column (top profile - subtracted from length)
ALTER TABLE "OrderDetails" 
ADD COLUMN IF NOT EXISTS "profiliLarte" DECIMAL(10,2) NULL DEFAULT 0;

-- Add profiliPoshtem column (bottom profile - subtracted from width)
ALTER TABLE "OrderDetails" 
ADD COLUMN IF NOT EXISTS "profiliPoshtem" DECIMAL(10,2) NULL DEFAULT 0;

-- Add comments to document the purpose of each column
COMMENT ON COLUMN "OrderDetails"."gjatesia" IS 'Gjatësia e derës (input value)';
COMMENT ON COLUMN "OrderDetails"."gjeresia" IS 'Gjerësia e derës (input value)';
COMMENT ON COLUMN "OrderDetails"."profiliLarte" IS 'Profili i lartë - zbritet nga gjatësia';
COMMENT ON COLUMN "OrderDetails"."profiliPoshtem" IS 'Profili i poshtëm - zbritet nga gjerësia';

COMMIT;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'OrderDetails' 
AND column_name IN ('gjatesia', 'gjeresia', 'profiliLarte', 'profiliPoshtem')
ORDER BY column_name; 