-- Migration: Remove 'borxh' status option and clean up status logic
-- This migration aligns the legacy 'statusi' field with the new 'statusiProduktit' logic

-- 1. Update all orders with 'borxh' status to use product status instead
UPDATE "OrderDetails" 
SET "statusi" = "statusiProduktit" 
WHERE "statusi" = 'borxh';

UPDATE "SupplementaryOrders" 
SET "statusi" = "statusiProduktit" 
WHERE "statusi" = 'borxh';

-- 2. Drop the old constraint that included 'borxh'
ALTER TABLE "OrderDetails" DROP CONSTRAINT IF EXISTS "OrderDetails_statusi_check";
ALTER TABLE "SupplementaryOrders" DROP CONSTRAINT IF EXISTS "SupplementaryOrders_statusi_check";

-- 3. Add new constraint without 'borxh' option
ALTER TABLE "OrderDetails" 
ADD CONSTRAINT "OrderDetails_statusi_check" 
CHECK ("statusi" IN ('në proces', 'e përfunduar'));

ALTER TABLE "SupplementaryOrders" 
ADD CONSTRAINT "SupplementaryOrders_statusi_check" 
CHECK ("statusi" IN ('në proces', 'e përfunduar'));

-- 4. Verify data integrity - ensure statusi always matches statusiProduktit
UPDATE "OrderDetails" SET "statusi" = "statusiProduktit";
UPDATE "SupplementaryOrders" SET "statusi" = "statusiProduktit";

-- Migration complete!
-- The 'borxh' status has been removed and all status fields now properly reflect product completion only. 