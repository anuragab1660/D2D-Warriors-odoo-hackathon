-- Users (manual auth, not Supabase)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  reset_otp TEXT,
  reset_otp_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  uom TEXT DEFAULT 'pcs',
  per_unit_cost NUMERIC DEFAULT 0,
  reorder_qty NUMERIC DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock per location
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
  qty NUMERIC DEFAULT 0,
  UNIQUE(product_id, location_id)
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  supplier TEXT,
  location_id INTEGER REFERENCES locations(id),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  schedule_date DATE,
  available_date DATE,
  responsible TEXT,
  destination_type TEXT DEFAULT 'internal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipt_lines (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  expected_qty NUMERIC DEFAULT 0,
  received_qty NUMERIC DEFAULT 0
);

-- Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  destination TEXT,
  city TEXT,
  location_id INTEGER REFERENCES locations(id),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  schedule_date DATE,
  responsible TEXT,
  destination_type TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_lines (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  qty_demanded NUMERIC DEFAULT 0,
  qty_done NUMERIC DEFAULT 0
);

-- Internal Transfers
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_lines (
  id SERIAL PRIMARY KEY,
  transfer_id INTEGER REFERENCES transfers(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  qty NUMERIC DEFAULT 0
);

-- Inventory Adjustments
CREATE TABLE IF NOT EXISTS adjustments (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  location_id INTEGER REFERENCES locations(id),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adjustment_lines (
  id SERIAL PRIMARY KEY,
  adjustment_id INTEGER REFERENCES adjustments(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  system_qty NUMERIC DEFAULT 0,
  counted_qty NUMERIC DEFAULT 0
);

-- Stock Ledger / Move History
CREATE TABLE IF NOT EXISTS move_history (
  id SERIAL PRIMARY KEY,
  ref TEXT,
  type TEXT,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT,
  from_location_id INTEGER,
  from_location_name TEXT,
  to_location_id INTEGER,
  to_location_name TEXT,
  qty NUMERIC,
  date TIMESTAMPTZ DEFAULT NOW()
);
