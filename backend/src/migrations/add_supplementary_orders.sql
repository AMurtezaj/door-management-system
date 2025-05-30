-- Migration script to add SupplementaryOrders table
-- This script adds support for supplementary orders that can be attached to existing garage door orders

-- Create SupplementaryOrders table
CREATE TABLE IF NOT EXISTS "SupplementaryOrders" (
    "id" SERIAL PRIMARY KEY,
    "parentOrderId" INTEGER NOT NULL,
    "emriKlientit" VARCHAR(255) NOT NULL,
    "mbiemriKlientit" VARCHAR(255) NOT NULL,
    "numriTelefonit" VARCHAR(255) NOT NULL,
    "vendi" VARCHAR(255) NOT NULL,
    "pershkrimiProduktit" TEXT NOT NULL,
    "cmimiTotal" DECIMAL(10,2) NOT NULL,
    "kaparja" DECIMAL(10,2) DEFAULT 0,
    "kaparaReceiver" VARCHAR(255),
    "pagesaMbetur" DECIMAL(10,2) NOT NULL,
    "menyraPageses" VARCHAR(10) NOT NULL CHECK ("menyraPageses" IN ('kesh', 'banke')),
    "isPaymentDone" BOOLEAN DEFAULT false,
    "statusi" VARCHAR(20) DEFAULT 'në proces' CHECK ("statusi" IN ('në proces', 'e përfunduar', 'borxh')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to link supplementary orders to main orders
ALTER TABLE "SupplementaryOrders" 
ADD CONSTRAINT "SupplementaryOrders_parentOrderId_fkey" 
FOREIGN KEY ("parentOrderId") REFERENCES "Orders"("id") ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_supplementary_orders_parent_id" ON "SupplementaryOrders"("parentOrderId");
CREATE INDEX IF NOT EXISTS "idx_supplementary_orders_status" ON "SupplementaryOrders"("statusi");
CREATE INDEX IF NOT EXISTS "idx_supplementary_orders_payment" ON "SupplementaryOrders"("isPaymentDone");
CREATE INDEX IF NOT EXISTS "idx_supplementary_orders_location" ON "SupplementaryOrders"("vendi");

-- Add comments to the table and columns for documentation
COMMENT ON TABLE "SupplementaryOrders" IS 'Porositë shtesë që bashkëngjiten me porositë kryesore të dyerve të garazhit';
COMMENT ON COLUMN "SupplementaryOrders"."parentOrderId" IS 'ID e porosisë kryesore (derë garazhi) me të cilën lidhet';
COMMENT ON COLUMN "SupplementaryOrders"."emriKlientit" IS 'Emri i klientit për porosinë shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."mbiemriKlientit" IS 'Mbiemri i klientit për porosinë shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."numriTelefonit" IS 'Numri i telefonit të klientit';
COMMENT ON COLUMN "SupplementaryOrders"."vendi" IS 'Lokacioni i dërgimit (duhet të jetë i njëjtë me porosinë kryesore)';
COMMENT ON COLUMN "SupplementaryOrders"."pershkrimiProduktit" IS 'Përshkrimi i produktit shtesë (keramika, etj.)';
COMMENT ON COLUMN "SupplementaryOrders"."cmimiTotal" IS 'Çmimi total i produktit shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."kaparja" IS 'Kaparja e paguar për produktin shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."kaparaReceiver" IS 'Personi që ka marrë kaparën për produktin shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."pagesaMbetur" IS 'Pagesa e mbetur për produktin shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."menyraPageses" IS 'Mënyra e pagesës për produktin shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."isPaymentDone" IS 'A është përfunduar pagesa për produktin shtesë';
COMMENT ON COLUMN "SupplementaryOrders"."statusi" IS 'Statusi i porosisë shtesë';

-- Insert a sample record for testing (optional - remove in production)
-- INSERT INTO "SupplementaryOrders" (
--     "parentOrderId", "emriKlientit", "mbiemriKlientit", "numriTelefonit", 
--     "vendi", "pershkrimiProduktit", "cmimiTotal", "kaparja", 
--     "kaparaReceiver", "pagesaMbetur", "menyraPageses", "isPaymentDone", "statusi"
-- ) VALUES (
--     1, 'Test', 'Client', '+383 44 123 456', 
--     'Prishtinë', 'Keramika për banjo', 150.00, 50.00, 
--     'Admin', 100.00, 'kesh', false, 'në proces'
-- );

PRINT 'SupplementaryOrders table created successfully!'; 