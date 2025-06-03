-- Add new column for product status to OrderDetails
ALTER TABLE "OrderDetails" ADD COLUMN "statusiProduktit" VARCHAR(15) DEFAULT 'në proces';

-- Add check constraint for OrderDetails
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_statusiProduktit_check" 
CHECK ("statusiProduktit" IN ('në proces', 'e përfunduar'));

-- Populate the new field based on existing statusi in OrderDetails
UPDATE "OrderDetails" 
SET "statusiProduktit" = CASE 
    WHEN "statusi" IN ('e përfunduar', 'borxh') THEN 'e përfunduar'
    ELSE 'në proces'
END;

-- Make the new column NOT NULL after populating
ALTER TABLE "OrderDetails" ALTER COLUMN "statusiProduktit" SET NOT NULL;

-- Add new column for product status to SupplementaryOrder
ALTER TABLE "SupplementaryOrder" ADD COLUMN "statusiProduktit" VARCHAR(15) DEFAULT 'në proces';

-- Add check constraint for SupplementaryOrder
ALTER TABLE "SupplementaryOrder" ADD CONSTRAINT "SupplementaryOrder_statusiProduktit_check" 
CHECK ("statusiProduktit" IN ('në proces', 'e përfunduar'));

-- Populate the new field based on existing statusi in SupplementaryOrder
UPDATE "SupplementaryOrder" 
SET "statusiProduktit" = CASE 
    WHEN "statusi" IN ('e përfunduar', 'borxh') THEN 'e përfunduar'
    ELSE 'në proces'
END;

-- Make the new column NOT NULL after populating
ALTER TABLE "SupplementaryOrder" ALTER COLUMN "statusiProduktit" SET NOT NULL; 