-- Migration: Add combined order type to Order enum
-- Date: 2024
-- Description: Adds 'derë garazhi + kapak' option to tipiPorosise enum

BEGIN;

-- Add the new enum value to the existing enum type
ALTER TYPE "enum_Orders_tipiPorosise" ADD VALUE 'derë garazhi + kapak';

COMMIT;

-- Verify the enum values
SELECT enum_range(NULL::enum_Orders_tipiPorosise); 