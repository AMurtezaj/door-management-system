-- Create new tables

-- 1. Create Customers table
CREATE TABLE "Customers" (
    "id" SERIAL PRIMARY KEY,
    "emri" VARCHAR(255) NOT NULL,
    "mbiemri" VARCHAR(255) NOT NULL,
    "telefoni" VARCHAR(255) NOT NULL,
    "vendi" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Payments table
CREATE TABLE "Payments" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "cmimiTotal" DECIMAL(10, 2) NOT NULL,
    "kaparja" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "kaparaReceiver" VARCHAR(255),
    "menyraPageses" VARCHAR(10) NOT NULL,
    "isPaymentDone" BOOLEAN NOT NULL DEFAULT false,
    "debtType" VARCHAR(10) DEFAULT 'none',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create OrderDetails table
CREATE TABLE "OrderDetails" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "matesi" VARCHAR(255),
    "dataMatjes" TIMESTAMP WITH TIME ZONE,
    "sender" VARCHAR(255),
    "installer" VARCHAR(255),
    "dita" DATE,
    "statusi" VARCHAR(15) DEFAULT 'në proces',
    "eshtePrintuar" BOOLEAN DEFAULT false,
    "kaVule" BOOLEAN DEFAULT false,
    "statusiMatjes" VARCHAR(15) DEFAULT 'e pamatur',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Migrate data from Orders to Customers
INSERT INTO "Customers" ("emri", "mbiemri", "telefoni", "vendi", "createdAt", "updatedAt")
SELECT "emriKlientit", "mbiemriKlientit", "numriTelefonit", "vendi", "createdAt", "updatedAt"
FROM "Orders";

-- 5. Add customerId to Orders table
ALTER TABLE "Orders" ADD COLUMN "customerId" INTEGER;

-- 6. Update Orders table with customer IDs
UPDATE "Orders" o
SET "customerId" = c.id
FROM "Customers" c
WHERE o."emriKlientit" = c."emri" 
  AND o."mbiemriKlientit" = c."mbiemri" 
  AND o."numriTelefonit" = c."telefoni";

-- 7. Make customerId NOT NULL
ALTER TABLE "Orders" ALTER COLUMN "customerId" SET NOT NULL;

-- 8. Migrate data to Payments table
INSERT INTO "Payments" ("orderId", "cmimiTotal", "kaparja", "kaparaReceiver", "menyraPageses", "isPaymentDone", "debtType", "createdAt", "updatedAt")
SELECT "id", "cmimiTotal", "kaparja", "kaparaReceiver", "menyraPageses", "isPaymentDone", "debtType", "createdAt", "updatedAt"
FROM "Orders";

-- 9. Migrate data to OrderDetails table
INSERT INTO "OrderDetails" ("orderId", "matesi", "dataMatjes", "sender", "installer", "dita", "statusi", "eshtePrintuar", "kaVule", "statusiMatjes", "createdAt", "updatedAt")
SELECT "id", "matesi", "dataMatjes", "sender", "installer", "dita", "statusi", "eshtePrintuar", "kaVule", "statusiMatjes", "createdAt", "updatedAt"
FROM "Orders";

-- 10. Update Orders table structure - remove migrated columns
ALTER TABLE "Orders"
  DROP COLUMN "emriKlientit",
  DROP COLUMN "mbiemriKlientit",
  DROP COLUMN "numriTelefonit",
  DROP COLUMN "vendi",
  DROP COLUMN "matesi",
  DROP COLUMN "dataMatjes",
  DROP COLUMN "cmimiTotal",
  DROP COLUMN "kaparja",
  DROP COLUMN "kaparaReceiver",
  DROP COLUMN "sender",
  DROP COLUMN "installer",
  DROP COLUMN "pagesaMbetur", -- This is virtual, might not need dropping
  DROP COLUMN "menyraPageses",
  DROP COLUMN "isPaymentDone",
  DROP COLUMN "debtType",
  DROP COLUMN "dita",
  DROP COLUMN "statusi",
  DROP COLUMN "eshtePrintuar",
  DROP COLUMN "kaVule",
  DROP COLUMN "statusiMatjes";

-- 11. Add foreign key constraints
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customers"("id") ON DELETE CASCADE;
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE;
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE;

-- 12. Update Notification foreign key to reference Orders
ALTER TABLE "Notifications" DROP CONSTRAINT IF EXISTS "Notifications_orderId_fkey";
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE; 