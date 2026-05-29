
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  customer_code CHAR(8) UNIQUE NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE,
  phone TEXT,
  email TEXT,
  address TEXT,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select_own" ON customers FOR SELECT USING (true);
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update_own" ON customers FOR UPDATE USING (true);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_all" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update_all" ON categories FOR UPDATE USING (true);
CREATE POLICY "categories_delete_all" ON categories FOR DELETE USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  images JSONB DEFAULT '[]',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock INT DEFAULT 0,
  variants JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_active" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_all" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update_all" ON products FOR UPDATE USING (true);
CREATE POLICY "products_delete_all" ON products FOR DELETE USING (true);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  details JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods_select_all" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "payment_methods_insert_all" ON payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "payment_methods_update_all" ON payment_methods FOR UPDATE USING (true);
CREATE POLICY "payment_methods_delete_all" ON payment_methods FOR DELETE USING (true);

-- Delivery providers
CREATE TABLE IF NOT EXISTS delivery_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual',
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE delivery_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_providers_select_all" ON delivery_providers FOR SELECT USING (true);
CREATE POLICY "delivery_providers_insert_all" ON delivery_providers FOR INSERT WITH CHECK (true);
CREATE POLICY "delivery_providers_update_all" ON delivery_providers FOR UPDATE USING (true);
CREATE POLICY "delivery_providers_delete_all" ON delivery_providers FOR DELETE USING (true);

-- Fees config
CREATE TABLE IF NOT EXISTS fees_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'charge',
  value_type TEXT NOT NULL DEFAULT 'fixed',
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  applies_always BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fees_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fees_config_select_all" ON fees_config FOR SELECT USING (true);
CREATE POLICY "fees_config_insert_all" ON fees_config FOR INSERT WITH CHECK (true);
CREATE POLICY "fees_config_update_all" ON fees_config FOR UPDATE USING (true);
CREATE POLICY "fees_config_delete_all" ON fees_config FOR DELETE USING (true);

-- Vouchers
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_referral BOOLEAN DEFAULT FALSE,
  referrer_customer_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vouchers_select_all" ON vouchers FOR SELECT USING (true);
CREATE POLICY "vouchers_insert_all" ON vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY "vouchers_update_all" ON vouchers FOR UPDATE USING (true);
CREATE POLICY "vouchers_delete_all" ON vouchers FOR DELETE USING (true);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  fees_applied JSONB DEFAULT '[]',
  voucher_code TEXT,
  voucher_discount NUMERIC(10,2) DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  delivery_provider_id UUID REFERENCES delivery_providers(id) ON DELETE SET NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_proof_url TEXT,
  maya_checkout_id TEXT,
  shipping_address JSONB DEFAULT '{}',
  receipt_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_all" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_all" ON orders FOR UPDATE USING (true);
CREATE POLICY "orders_delete_all" ON orders FOR DELETE USING (true);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  telegram_thread_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_tickets_select_all" ON support_tickets FOR SELECT USING (true);
CREATE POLICY "support_tickets_insert_all" ON support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "support_tickets_update_all" ON support_tickets FOR UPDATE USING (true);
CREATE POLICY "support_tickets_delete_all" ON support_tickets FOR DELETE USING (true);

-- Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'customer',
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_messages_select_all" ON support_messages FOR SELECT USING (true);
CREATE POLICY "support_messages_insert_all" ON support_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "support_messages_update_all" ON support_messages FOR UPDATE USING (true);
CREATE POLICY "support_messages_delete_all" ON support_messages FOR DELETE USING (true);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_all" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete_all" ON notifications FOR DELETE USING (true);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_select_all" ON app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings_insert_all" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "app_settings_update_all" ON app_settings FOR UPDATE USING (true);
CREATE POLICY "app_settings_delete_all" ON app_settings FOR DELETE USING (true);

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
