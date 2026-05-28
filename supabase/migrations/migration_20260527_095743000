-- Products: sub_name and show_stock
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_stock BOOLEAN DEFAULT FALSE;

-- Customers: saved_addresses
ALTER TABLE customers ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;

-- Delivery providers: logo_url
ALTER TABLE delivery_providers ADD COLUMN IF NOT EXISTS logo_url TEXT;