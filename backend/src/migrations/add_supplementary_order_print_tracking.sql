-- Migration: Add print tracking to SupplementaryOrders
-- Date: 2024
-- Description: Adds print tracking fields to SupplementaryOrders table

BEGIN;

-- Add print tracking fields
ALTER TABLE "SupplementaryOrders" 
ADD COLUMN "eshtePrintuar" BOOLEAN DEFAULT false,
ADD COLUMN "dataPrintimit" TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN "SupplementaryOrders"."eshtePrintuar" IS 'A është printuar fatura e produktit shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."dataPrintimit" IS 'Data kur është printuar fatura e produktit shtesë';

COMMIT; 