# CoreInventory — Final Claude CLI Prompt (Docker Edition)
# Copy EVERYTHING below this line and paste directly into Claude CLI

---

You are a senior full-stack engineer and UI/UX designer.

Build a COMPLETE, fully-functional, production-ready Inventory Management System called **CoreInventory**.

## ABSOLUTE RULES
1. Output ONLY code — zero explanations, zero commentary
2. Do NOT skip any file
3. Generate EVERY file completely — no placeholders, no "// add logic here", no "TODO"
4. Every API must connect to the local PostgreSQL container
5. Every frontend page must call the real backend API
6. The entire project must start with a single command: `docker compose up --build`
7. Judges must be able to open the app in the browser with zero manual setup
8. If generation is cut off, the user will run `claude --continue` to resume

---

## TECH STACK

### Infrastructure (Docker)
- Docker Compose v3.8
- PostgreSQL 15 (database)
- pgAdmin 4 (database GUI — accessible at http://localhost:5050)
- Node.js 20 Alpine (backend)
- Node.js 20 Alpine (frontend via Vite dev server)

### Frontend
- React 18 + Vite
- Tailwind CSS v3
- React Router v6
- Zustand (auth + global state)
- Axios
- Recharts (dashboard charts)
- Lucide React (icons)
- Google Fonts: "Syne" (headings) + "DM Sans" (body)

### Backend
- Node.js + Express.js
- pg (node-postgres — direct PostgreSQL driver)
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- dotenv, cors, express-validator

### Database
- PostgreSQL 15 (running in Docker)
- pgAdmin 4 (GUI at http://localhost:5050)
- Schema auto-initialized via init.sql on first container start
- Seed data auto-inserted via seed.sql on first container start

---

## DOCKER ARCHITECTURE

```
docker compose up --build
│
├── postgres (port 5432)
│   ├── Database: coreinventory
│   ├── User: postgres
│   └── Password: postgres123
│
├── pgadmin (port 5050)
│   ├── Email: admin@coreinventory.com
│   └── Password: admin123
│
├── server (port 5000)
│   ├── Node.js Express API
│   └── Connects to postgres via DATABASE_URL
│
└── client (port 3000)
    ├── React + Vite
    └── Calls server at http://localhost:5000
```

---

## FULL PROJECT STRUCTURE

```
coreinventory/
│
├── docker-compose.yml
├── .env
├── README.md
│
├── database/
│   ├── init.sql          ← schema creation (runs on first start)
│   └── seed.sql          ← seed data (runs on first start)
│
├── server/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   ├── db.js             ← PostgreSQL pool connection
│   ├── middleware/
│   │   └── auth.js       ← JWT verification middleware
│   └── routes/
│       ├── auth.js
│       ├── dashboard.js
│       ├── products.js
│       ├── categories.js
│       ├── warehouses.js
│       ├── locations.js
│       ├── receipts.js
│       ├── deliveries.js
│       ├── transfers.js
│       ├── adjustments.js
│       └── moveHistory.js
│
└── client/
    ├── Dockerfile
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── client.js
        ├── store/
        │   └── authStore.js
        ├── hooks/
        │   └── useToast.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   ├── Header.jsx
        │   ├── KPICard.jsx
        │   ├── StatusBadge.jsx
        │   ├── DataTable.jsx
        │   ├── Modal.jsx
        │   ├── ConfirmDialog.jsx
        │   ├── Toast.jsx
        │   ├── EmptyState.jsx
        │   └── Spinner.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── ForgotPassword.jsx
            ├── Dashboard.jsx
            ├── Products.jsx
            ├── ProductDetail.jsx
            ├── Categories.jsx
            ├── Receipts.jsx
            ├── ReceiptDetail.jsx
            ├── Deliveries.jsx
            ├── DeliveryDetail.jsx
            ├── Transfers.jsx
            ├── TransferDetail.jsx
            ├── Adjustments.jsx
            ├── AdjustmentDetail.jsx
            ├── MoveHistory.jsx
            ├── Settings.jsx
            └── MyProfile.jsx
```

---

## FILE: docker-compose.yml

```yaml
version: '3.8'

services:

  postgres:
    image: postgres:15-alpine
    container_name: coreinventory_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: coreinventory
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01_init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d coreinventory"]
      interval: 5s
      timeout: 5s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: coreinventory_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@coreinventory.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      - postgres
    volumes:
      - pgadmin_data:/var/lib/pgadmin

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: coreinventory_server
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/coreinventory
      JWT_SECRET: coreinventory_super_secret_jwt_key_2024
      PORT: 5000
      NODE_ENV: development
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./server:/app
      - /app/node_modules

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: coreinventory_client
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:5000
    ports:
      - "3000:3000"
    depends_on:
      - server
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  postgres_data:
  pgadmin_data:
```

---

## FILE: .env (root level — for reference)

```
POSTGRES_DB=coreinventory
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
JWT_SECRET=coreinventory_super_secret_jwt_key_2024
PGADMIN_EMAIL=admin@coreinventory.com
PGADMIN_PASSWORD=admin123
```

---

## FILE: README.md

```markdown
# CoreInventory

A professional Inventory Management System.

## Quick Start

\`\`\`bash
docker compose up --build
\`\`\`

## Access

| Service   | URL                        | Credentials                          |
|-----------|----------------------------|--------------------------------------|
| App       | http://localhost:3000      | Register a new account               |
| API       | http://localhost:5000      | —                                    |
| pgAdmin   | http://localhost:5050      | admin@coreinventory.com / admin123   |

## pgAdmin Setup

1. Open http://localhost:5050
2. Login: admin@coreinventory.com / admin123
3. Right-click Servers → Register → Server
4. Name: CoreInventory
5. Connection tab → Host: postgres, Port: 5432, DB: coreinventory, User: postgres, Password: postgres123
6. Save → Browse all tables

## Default Demo Login

Email: demo@coreinventory.com
Password: Demo@1234
```

---

## FILE: database/init.sql

Complete PostgreSQL schema. Use SERIAL primary keys (not UUID) for simplicity with pg driver.

```sql
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
-- Receipt status lifecycle: draft → ready → done | cancelled
-- (from excalidraw: Draft > Ready > Done)
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  supplier TEXT,
  location_id INTEGER REFERENCES locations(id),
  status TEXT DEFAULT 'draft',   -- draft | ready | done | cancelled
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  schedule_date DATE,             -- scheduled receipt date (shown in list as "Schedule date")
  available_date DATE,            -- available date shown in list view
  responsible TEXT,               -- auto-filled with logged-in user name
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
-- status lifecycle: draft → waiting → ready → done | cancelled
-- (from excalidraw: Draft > Waiting > Ready > Done)
-- Waiting = stock not available, Ready = stock confirmed
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  ref TEXT UNIQUE,
  destination TEXT,
  city TEXT,
  location_id INTEGER REFERENCES locations(id),
  status TEXT DEFAULT 'draft',   -- draft | waiting | ready | done | cancelled
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  schedule_date DATE,
  responsible TEXT,               -- auto-filled with logged-in user name
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
```

---

## FILE: database/seed.sql

```sql
-- Demo user (password: Demo@1234)
INSERT INTO users (name, email, password_hash, role) VALUES
('Demo User', 'demo@coreinventory.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager')
ON CONFLICT DO NOTHING;

-- Warehouses
INSERT INTO warehouses (name, short_code, address) VALUES
('Main Warehouse', 'MW', '123 Industrial Zone, City'),
('Secondary Warehouse', 'SW', '456 Storage Lane, City')
ON CONFLICT DO NOTHING;

-- Locations
INSERT INTO locations (warehouse_id, name) VALUES
(1, 'Main Store'),
(1, 'Production Floor'),
(2, 'Raw Materials Bay'),
(2, 'Finished Goods Bay')
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (name) VALUES
('Electronics'),
('Raw Materials'),
('Finished Goods')
ON CONFLICT DO NOTHING;

-- Products (with per_unit_cost)
-- SKU format follows [SKU] Name pattern shown in excalidraw e.g. [DESK001] Desk
INSERT INTO products (name, sku, category_id, uom, per_unit_cost, reorder_qty) VALUES
('Desk',            'DESK001', 3, 'pcs',    3000.00,  10),
('Table',           'TBL001',  3, 'pcs',    2500.00,  10),
('Steel Rods',      'STL001',  2, 'kg',       45.00,  50),
('Copper Wire',     'CPR001',  2, 'meters',   12.50, 100),
('Circuit Board',   'CKT001',  1, 'pcs',     350.00,  20),
('LED Panel',       'LED001',  1, 'pcs',     220.00,  15),
('Steel Frame',     'FRM001',  3, 'pcs',     180.00,  10),
('Power Cable',     'PWR001',  1, 'meters',   18.00,  50),
('Motor Unit',      'MTR001',  1, 'pcs',     850.00,   5),
('Control Panel',   'CTL001',  3, 'pcs',    1200.00,   8)
ON CONFLICT DO NOTHING;

-- Stock
INSERT INTO stock (product_id, location_id, qty) VALUES
(1, 1, 200), (1, 3, 80),
(2, 1, 500), (2, 3, 150),
(3, 1, 45),  (3, 4, 20),
(4, 1, 12),
(5, 4, 30),
(6, 1, 300),
(7, 1, 1500),(7, 3, 400),
(8, 1, 4),
(9, 3, 60),
(10, 4, 6)
ON CONFLICT DO NOTHING;

-- Completed Receipts
INSERT INTO receipts (ref, supplier, location_id, status, date) VALUES
('WH/IN/0001', 'SteelCo Supplies', 1, 'done', CURRENT_DATE - 5),
('WH/IN/0002', 'ElectroHub Ltd',   1, 'done', CURRENT_DATE - 3),
('WH/IN/0003', 'MetalWorks Inc',   3, 'done', CURRENT_DATE - 1)
ON CONFLICT DO NOTHING;

INSERT INTO receipt_lines (receipt_id, product_id, expected_qty, received_qty) VALUES
(1, 1, 200, 200), (1, 7, 1500, 1500),
(2, 3, 50,  45),  (2, 4, 15,   12),   (2, 8, 5, 4),
(3, 9, 60,  60),  (3, 2, 150,  150)
ON CONFLICT DO NOTHING;

-- Pending Receipts
INSERT INTO receipts (ref, supplier, location_id, status, date) VALUES
('WH/IN/0004', 'PowerTech Corp',  1, 'draft', CURRENT_DATE),
('WH/IN/0005', 'Global Metals',   3, 'draft', CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO receipt_lines (receipt_id, product_id, expected_qty, received_qty) VALUES
(4, 6, 200, 0), (4, 3, 30, 0),
(5, 1, 100, 0), (5, 9, 50, 0)
ON CONFLICT DO NOTHING;

-- Completed Deliveries
INSERT INTO deliveries (ref, destination, location_id, status, date) VALUES
('WH/OUT/0001', 'Client A - BuildCo',    1, 'done', CURRENT_DATE - 4),
('WH/OUT/0002', 'Client B - FrameWorks', 4, 'done', CURRENT_DATE - 2)
ON CONFLICT DO NOTHING;

INSERT INTO delivery_lines (delivery_id, product_id, qty_demanded, qty_done) VALUES
(1, 5, 10, 10), (1, 1, 50, 50),
(2, 10, 3,  3), (2, 3,  5,  5)
ON CONFLICT DO NOTHING;

-- In-Progress Delivery (picking stage)
INSERT INTO deliveries (ref, destination, location_id, status, date) VALUES
('WH/OUT/0003', 'Client C - TechStart', 1, 'picking', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Pending Delivery (draft)
INSERT INTO deliveries (ref, destination, location_id, status, date) VALUES
('WH/OUT/0004', 'Client D - MegaBuild', 1, 'draft', CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO delivery_lines (delivery_id, product_id, qty_demanded, qty_done) VALUES
(3, 6, 100, 0), (3, 8, 2, 0)
ON CONFLICT DO NOTHING;

-- Completed Transfer
INSERT INTO transfers (ref, from_location_id, to_location_id, status, date) VALUES
('WH/TR/0001', 1, 2, 'done', CURRENT_DATE - 3)
ON CONFLICT DO NOTHING;

INSERT INTO transfer_lines (transfer_id, product_id, qty) VALUES
(1, 1, 30), (1, 7, 200)
ON CONFLICT DO NOTHING;

-- Pending Transfer
INSERT INTO transfers (ref, from_location_id, to_location_id, status, date) VALUES
('WH/TR/0002', 3, 4, 'draft', CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO transfer_lines (transfer_id, product_id, qty) VALUES
(2, 9, 20), (2, 2, 50)
ON CONFLICT DO NOTHING;

-- Completed Adjustment
INSERT INTO adjustments (ref, location_id, status, date) VALUES
('WH/ADJ/0001', 1, 'done', CURRENT_DATE - 2)
ON CONFLICT DO NOTHING;

INSERT INTO adjustment_lines (adjustment_id, product_id, system_qty, counted_qty) VALUES
(1, 8, 5, 4)
ON CONFLICT DO NOTHING;

-- Pending Adjustment
INSERT INTO adjustments (ref, location_id, status, date) VALUES
('WH/ADJ/0002', 3, 'draft', CURRENT_DATE)
ON CONFLICT DO NOTHING;

INSERT INTO adjustment_lines (adjustment_id, product_id, system_qty, counted_qty) VALUES
(2, 1, 80, 80), (2, 9, 60, 58)
ON CONFLICT DO NOTHING;

-- Move History for completed documents
INSERT INTO move_history (ref, type, product_id, product_name, from_location_id, from_location_name, to_location_id, to_location_name, qty, date) VALUES
('WH/IN/0001', 'receipt',  1, 'Steel Rods',    NULL, NULL, 1, 'Main Store',       200, NOW() - INTERVAL '5 days'),
('WH/IN/0001', 'receipt',  7, 'Bolt Set',       NULL, NULL, 1, 'Main Store',      1500, NOW() - INTERVAL '5 days'),
('WH/IN/0002', 'receipt',  3, 'Circuit Board',  NULL, NULL, 1, 'Main Store',        45, NOW() - INTERVAL '3 days'),
('WH/IN/0002', 'receipt',  4, 'LED Panel',      NULL, NULL, 1, 'Main Store',        12, NOW() - INTERVAL '3 days'),
('WH/IN/0003', 'receipt',  9, 'Aluminum Sheet', NULL, NULL, 3, 'Raw Materials Bay', 60, NOW() - INTERVAL '1 day'),
('WH/OUT/0001','delivery', 5, 'Steel Frame',    1,    'Main Store', NULL, NULL,       10, NOW() - INTERVAL '4 days'),
('WH/OUT/0001','delivery', 1, 'Steel Rods',     1,    'Main Store', NULL, NULL,       50, NOW() - INTERVAL '4 days'),
('WH/OUT/0002','delivery',10, 'Control Panel',  4,    'Finished Goods Bay', NULL, NULL, 3, NOW() - INTERVAL '2 days'),
('WH/TR/0001', 'transfer', 1, 'Steel Rods',     1,    'Main Store', 2, 'Production Floor', 30, NOW() - INTERVAL '3 days'),
('WH/TR/0001', 'transfer', 7, 'Bolt Set',       1,    'Main Store', 2, 'Production Floor',200, NOW() - INTERVAL '3 days'),
('WH/ADJ/0001','adjustment',8,'Motor Unit',     1,    'Main Store', 1, 'Main Store',       -1, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
```

---

## FILE: server/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

---

## FILE: server/package.json

```json
{
  "name": "coreinventory-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.7",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## FILE: server/db.js

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

module.exports = pool;
```

---

## FILE: server/index.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/categories',  require('./routes/categories'));
app.use('/api/warehouses',  require('./routes/warehouses'));
app.use('/api/locations',   require('./routes/locations'));
app.use('/api/receipts',    require('./routes/receipts'));
app.use('/api/deliveries',  require('./routes/deliveries'));
app.use('/api/transfers',   require('./routes/transfers'));
app.use('/api/adjustments', require('./routes/adjustments'));
app.use('/api/move-history',require('./routes/moveHistory'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CoreInventory API running on port ${PORT}`);
});
```

---

## FILE: server/middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## FILE: server/routes/auth.js

Implement all authentication endpoints using bcryptjs and jsonwebtoken against the users table in PostgreSQL.

Endpoints:

POST /api/auth/signup
- Body: { name, email, password }
- Validate before inserting (return 400 with message if fails):
  1. name (login ID) must be unique and between 6–12 characters
  2. email must not already exist in the database
  3. password must be minimum 8 characters, contain at least one lowercase, one uppercase, and one special character
- Hash password with bcrypt (10 rounds)
- Insert into users table
- Return JWT token + user object (id, name, email, role)
- JWT expires in 7d

POST /api/auth/login
- Body: { email, password }
- Find user by email
- Compare password with bcrypt.compare
- Return JWT token + user object
- Return 401 if invalid credentials

POST /api/auth/forgot-password
- Body: { email }
- Generate 6-digit numeric OTP
- Store OTP + expiry (30 minutes from now) in users table (reset_otp, reset_otp_expires)
- Return { message: 'OTP sent', otp: generatedOTP } (in real app you'd email it; for demo return it in response)

POST /api/auth/reset-password
- Body: { email, otp, newPassword }
- Verify OTP matches and is not expired
- Hash new password and update
- Clear OTP fields
- Return { message: 'Password reset successful' }

GET /api/auth/me
- Protected route (use auth middleware)
- Return current user from database by req.user.id

PUT /api/auth/profile
- Protected route
- Body: { name }
- Update user name in database
- Return updated user object

PUT /api/auth/change-password
- Protected route
- Body: { currentPassword, newPassword }
- Verify currentPassword matches bcrypt hash
- Hash newPassword and update
- Return { message: 'Password updated successfully' }

---

## FILE: server/routes/dashboard.js (Protected)

GET /api/dashboard — return all KPIs in one query:

```json
{
  "totalProducts": 10,
  "lowStockCount": 3,
  "pendingReceipts": 2,
  "pendingDeliveries": 1,
  "pendingTransfers": 1,
  "todayReceipts": [...],
  "todayDeliveries": [...],
  "lowStockProducts": [
    { "id": 1, "name": "...", "sku": "...", "on_hand": 4, "reorder_qty": 5 }
  ]
}
```

- lowStockCount: count of products where SUM(stock.qty) <= products.reorder_qty
- pendingReceipts: count where status IN ('draft','waiting','ready')
- receiptBreakdown: {
    late: count where schedule_date < CURRENT_DATE AND status != 'done',
    waiting: count where status = 'waiting',
    operations: count where schedule_date > CURRENT_DATE AND status != 'done',
    toReceive: count where status IN ('draft','waiting','ready')
  }
- pendingDeliveries: count where status IN ('draft','waiting','ready')
- deliveryBreakdown: {
    late: count where schedule_date < CURRENT_DATE AND status != 'done',
    waiting: count where status = 'waiting',
    operations: count where schedule_date > CURRENT_DATE AND status != 'done',
    toDeliver: count where status IN ('draft','waiting','ready')
  }
- pendingTransfers: count where status = 'draft'
- todayReceipts: array with ref, supplier, status, date for today
- todayDeliveries: array with ref, destination, status, date for today
- lowStockProducts: top 5 products by (on_hand / reorder_qty) ratio ASC

All data from PostgreSQL using the pg pool.

GET /api/dashboard/filter — Dynamic filter endpoint for dashboard operations table

Query params (all optional, combinable):
- ?doc_type= — receipts | deliveries | transfers | adjustments
- ?status= — draft | picking | packing | done | cancelled
- ?warehouse_id= — filter by warehouse (joins through locations)
- ?category_id= — filter by product category (joins through lines)

Returns unified array of operations:
```json
[
  {
    "id": 1,
    "ref": "WH/IN/0001",
    "doc_type": "receipts",
    "status": "done",
    "party": "SteelCo Supplies",
    "location": "Main Store",
    "warehouse": "Main Warehouse",
    "date": "2024-01-01",
    "lines_count": 3
  }
]
```

Implementation: run 4 separate queries (one per doc_type) with WHERE clauses built from params, UNION ALL the results, apply unified status/warehouse/category filters, order by date DESC, limit 100.

---

## FILE: server/routes/products.js (All routes protected with auth middleware)

GET /api/products
- List all products with:
  - category name (JOIN)
  - total on_hand = SUM(stock.qty) across all locations
  - free_to_use = on_hand - SUM(delivery_lines.qty_demanded) WHERE delivery status IN ('draft','waiting','ready')
  - is_low_stock boolean (on_hand <= reorder_qty)
- Support ?search= query param (ILIKE on name or sku)
- Support ?category_id= filter

GET /api/products/:id
- Single product with category name
- Stock per location (JOIN with locations and warehouses)

POST /api/products
- Body: { name, sku, category_id, uom, reorder_qty, initial_stock, initial_location_id }
- Insert product
- If initial_stock > 0 and initial_location_id provided: insert into stock table

PUT /api/products/:id
- Update product fields

PATCH /api/products/:id/stock
- Body: { location_id, qty }
- Directly set stock qty for a product at a specific location (used by inline stock edit on Products page)
- Upsert stock table: ON CONFLICT (product_id, location_id) DO UPDATE SET qty = EXCLUDED.qty
- Insert move_history (type: 'adjustment', qty diff = new - old)

DELETE /api/products/:id
- Delete product (cascade deletes stock)

---

## FILE: server/routes/categories.js (All protected)

GET /api/categories — list all
POST /api/categories — create { name }
PUT /api/categories/:id — update { name }
DELETE /api/categories/:id — delete if no products reference it, else return 400 with message

---

## FILE: server/routes/warehouses.js (All protected)

GET /api/warehouses — list all warehouses with their locations array nested
POST /api/warehouses — create { name, short_code, address }
PUT /api/warehouses/:id — update
DELETE /api/warehouses/:id — delete (cascade deletes locations)

---

## FILE: server/routes/locations.js (All protected)

GET /api/locations — list all with warehouse_name joined. Support ?warehouse_id= filter
POST /api/locations — create { warehouse_id, name, short_code }
PUT /api/locations/:id — update { name, short_code, warehouse_id }
DELETE /api/locations/:id — delete

---

## FILE: server/routes/receipts.js (All protected)

GET /api/receipts
- List all receipts with location name, warehouse name, line count
- Support ?status= filter
- Support ?warehouse_id= filter
- Order by created_at DESC

GET /api/receipts/:id
- Receipt detail with lines
- Each line includes product name, sku, uom

POST /api/receipts
- Body: { supplier, location_id, notes, date, available_date, lines: [{ product_id, expected_qty, received_qty }] }
- Auto-generate ref: count receipts + 1, format as WH/IN/XXXX (padded 4 digits)
- Insert receipt then insert all lines
- Return created receipt with lines

PUT /api/receipts/:id
- Update receipt header and replace lines (delete old, insert new)
- Only allowed if status = 'draft'

POST /api/receipts/:id/todo
- "TODO" button — from excalidraw: "onclick TODO → move to Ready"
- status must be 'draft' — else return 400
- UPDATE receipts SET status = 'ready'
- Return updated receipt

POST /api/receipts/:id/validate
- "Validate" button — from excalidraw: "onclick Validate → move to Done"
- status must be 'ready' — else return 400 "Receipt must be in Ready status to validate"
- For each line:
  - INSERT INTO stock (product_id, location_id, qty) VALUES (...) ON CONFLICT (product_id, location_id) DO UPDATE SET qty = stock.qty + EXCLUDED.qty
  - INSERT INTO move_history (type: 'receipt', ref, product_id, product_name, to_location_id, to_location_name, qty = received_qty)
- UPDATE receipts SET status = 'done'
- Return updated receipt

DELETE /api/receipts/:id
- Only if status = 'draft'

---

## FILE: server/routes/deliveries.js (All protected)

Delivery status lifecycle (from excalidraw): draft → waiting → ready → done | cancelled
- Draft: Initial state — order created, editable
- Waiting: Waiting for out-of-stock product to become available
- Ready: Ready to deliver (stock confirmed available)
- Done: Delivered, stock reduced
- Cancelled: Cancelled at any stage before done

GET /api/deliveries — list with location name, line count, filters (?status=, ?warehouse_id=)
GET /api/deliveries/:id — detail with lines + product info + current stock qty per product at delivery location

POST /api/deliveries
- Body: { destination, city, location_id, responsible, destination_type, notes, date, lines: [{ product_id, qty_demanded }] }
- Auto-generate ref using warehouse short_code: {WH_CODE}/OUT/XXXX
- status starts as 'draft'
- Insert delivery + lines (qty_done defaults to 0)
- Return created delivery

PUT /api/deliveries/:id — update header + replace lines (draft or waiting only)

POST /api/deliveries/:id/todo
- "TODO" button action — from excalidraw: "TODO = When in Draft, onclick TODO → move to Ready"
- status must be 'draft' or 'waiting'
- For each line: check stock >= qty_demanded at location_id
  - If ANY product insufficient: set status = 'waiting', return { status: 'waiting', shortages: [{product, available, demanded}] }
  - If ALL products have stock: set status = 'ready', return updated delivery
- This implements the Waiting state: auto-detects stock shortage

POST /api/deliveries/:id/validate
- "Validate" button action — from excalidraw: "Validate = When in Ready, onclick Validate → move to Done"
- status must be 'ready' — else return 400
- For each line:
  - Re-check stock >= qty_demanded (safety check)
  - UPDATE stock SET qty = qty - qty_demanded WHERE product_id AND location_id
  - INSERT move_history (type: 'delivery', ref, product_id, product_name, from_location_id, from_location_name, qty = qty_demanded)
  - Mark line red in response if stock was insufficient (alert_stock: true)
- UPDATE deliveries SET status = 'done'
- Return updated delivery

POST /api/deliveries/:id/cancel
- Allowed if status IN ('draft', 'waiting', 'ready')
- UPDATE deliveries SET status = 'cancelled'
- Return updated delivery

DELETE /api/deliveries/:id — draft only

---

## FILE: server/routes/transfers.js (All protected)

GET /api/transfers — list with from/to location names, warehouse names, line count
GET /api/transfers/:id — detail with lines + product info

POST /api/transfers
- Body: { from_location_id, to_location_id, notes, date, lines: [{ product_id, qty }] }
- Validate from_location_id !== to_location_id
- Auto-generate ref: WH/TR/XXXX
- Insert transfer + lines

PUT /api/transfers/:id — update header + replace lines (draft only)

POST /api/transfers/:id/validate
- status must be 'draft'
- For each line:
  - Check stock at from_location >= qty → else return 400 with product name + available qty
- If all pass:
  - Reduce stock at from_location
  - Upsert stock at to_location (ON CONFLICT DO UPDATE SET qty = stock.qty + EXCLUDED.qty)
  - INSERT move_history (type: 'transfer', from_location and to_location both filled)
- UPDATE transfers SET status = 'done'

DELETE /api/transfers/:id — draft only

---

## FILE: server/routes/adjustments.js (All protected)

GET /api/adjustments — list with location name, line count
GET /api/adjustments/:id — detail with lines + product info + current system_qty from stock

POST /api/adjustments
- Body: { location_id, notes, date, lines: [{ product_id }] }
- For each product in lines: auto-fetch current stock qty as system_qty
- Auto-generate ref: WH/ADJ/XXXX
- Insert adjustment + lines with system_qty populated from stock

PUT /api/adjustments/:id
- Update header + replace lines (re-fetch system_qty for each product)
- Draft only

POST /api/adjustments/:id/validate
- status must be 'draft'
- For each line:
  - INSERT INTO stock ON CONFLICT DO UPDATE SET qty = EXCLUDED.qty (set to counted_qty directly)
  - diff = counted_qty - system_qty
  - INSERT move_history with qty = diff (type: 'adjustment')
- UPDATE adjustments SET status = 'done'

DELETE /api/adjustments/:id — draft only

---

## FILE: server/routes/moveHistory.js (Protected)

GET /api/move-history
- List all move_history rows
- Support ?type= filter (receipt | delivery | transfer | adjustment)
- Support ?product_id= filter
- Support ?search= (ILIKE on product_name or ref)
- Order by date DESC
- Limit 500 rows

---

## FRONTEND COMPLETE IMPLEMENTATION

### FILE: client/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

### FILE: client/package.json

```json
{
  "name": "coreinventory-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.3",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}
```

### FILE: client/vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  }
})
```

### FILE: client/tailwind.config.js

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        sidebar: '#1A1D23',
      }
    },
  },
  plugins: [],
}
```

### FILE: client/postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### FILE: client/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CoreInventory</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## DESIGN SYSTEM — STRICTLY FOLLOW THIS

### Color Palette (CSS variables in index.css)
```css
:root {
  --bg: #F7F8FA;
  --sidebar: #1A1D23;
  --sidebar-hover: #2D3139;
  --sidebar-text: #9EA3AE;
  --sidebar-active-text: #FFFFFF;
  --primary: #6366F1;
  --primary-hover: #4F46E5;
  --primary-light: #EEF2FF;
  --success: #10B981;
  --success-light: #D1FAE5;
  --warning: #F59E0B;
  --warning-light: #FEF3C7;
  --danger: #EF4444;
  --danger-light: #FEE2E2;
  --border: #E5E7EB;
  --text: #111827;
  --text-muted: #6B7280;
  --white: #FFFFFF;
  --card: #FFFFFF;
}
```

### Typography
- Page titles: font-family Syne, font-weight 700, text-gray-900
- Section headers: font-family Syne, font-weight 600
- Body text: DM Sans, font-weight 400
- Labels / small: DM Sans, font-weight 500, text-gray-500

### Component Specs
- **Cards**: bg-white rounded-xl border border-gray-200 shadow-sm p-6
- **Primary Button**: bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors
- **Secondary Button**: bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm
- **Danger Button**: bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm
- **Input**: w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
- **Select**: same as Input
- **Table header row**: bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider
- **Table data row**: text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100
- **Sidebar width**: 240px fixed left, full height, bg #1A1D23
- **Main content**: ml-60 bg-[#F7F8FA] min-h-screen

### Status Badge Colors
- draft → gray (bg-gray-100 text-gray-600)
- ready → amber (bg-amber-100 text-amber-700)
- done → green (bg-green-100 text-green-700)
- cancelled → red (bg-red-100 text-red-600)
- LOW → red (bg-red-100 text-red-600)
- OK → green (bg-green-100 text-green-700)

---

## FILE: client/src/index.css

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  font-family: 'DM Sans', sans-serif;
  background: #F7F8FA;
  color: #111827;
  margin: 0;
}

h1, h2, h3, h4 {
  font-family: 'Syne', sans-serif;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #F1F5F9; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
```

---

## FILE: client/src/api/client.js

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ci_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ci_token');
      localStorage.removeItem('ci_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
```

---

## FILE: client/src/store/authStore.js

Zustand store:
- State: user (object | null), token (string | null), loading (bool)
- Initialize from localStorage on store creation: read 'ci_user' and 'ci_token'
- Actions:
  - login(user, token): set state + save to localStorage
  - logout(): clear state + remove from localStorage + redirect to /login
  - setUser(user): update user in state and localStorage
- Export useAuthStore hook

---

## FILE: client/src/hooks/useToast.js

Simple toast hook:
- State: toasts array [{ id, type, message }]
- addToast(type, message): push new toast with uuid id
- removeToast(id): remove from array
- Auto-remove after 3000ms
- types: 'success' | 'error' | 'warning' | 'info'
- Export { toasts, toast } where toast.success(msg), toast.error(msg), toast.warning(msg)

---

## FILE: client/src/main.jsx

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

---

## FILE: client/src/App.jsx

React Router v6 setup:
- Public routes (no auth required): /login, /signup, /forgot-password
- Protected routes (check localStorage ci_token): wrap in ProtectedRoute component
- ProtectedRoute: if no token → redirect to /login
- Default: / → redirect to /dashboard
- All protected pages wrapped in Layout component

Routes:
```
/login           → Login.jsx
/signup          → Signup.jsx
/forgot-password → ForgotPassword.jsx
/dashboard       → Dashboard.jsx       (protected)
/products        → Products.jsx        (protected)
/products/:id    → ProductDetail.jsx   (protected)
/categories      → Categories.jsx      (protected)
/receipts        → Receipts.jsx        (protected)
/receipts/new    → ReceiptDetail.jsx   (protected, create mode)
/receipts/:id    → ReceiptDetail.jsx   (protected, edit/view mode)
/deliveries      → Deliveries.jsx      (protected)
/deliveries/new  → DeliveryDetail.jsx  (protected)
/deliveries/:id  → DeliveryDetail.jsx  (protected)
/transfers       → Transfers.jsx       (protected)
/transfers/new   → TransferDetail.jsx  (protected)
/transfers/:id   → TransferDetail.jsx  (protected)
/adjustments     → Adjustments.jsx     (protected)
/adjustments/new → AdjustmentDetail.jsx (protected)
/adjustments/:id → AdjustmentDetail.jsx (protected)
/move-history    → MoveHistory.jsx     (protected)
/settings        → Settings.jsx        (protected)
/profile         → MyProfile.jsx       (protected)
```

---

## PAGES — COMPLETE IMPLEMENTATION

### Login.jsx
Full-page two-column layout:
- Left column (40% width): bg-[#1A1D23], flex-col, centered content
  - App Logo: a cube/box SVG icon (inline, indigo color, 48px) above the wordmark
  - CoreInventory wordmark in Syne font, text-white, 2xl bold
  - Tagline: "Real-time inventory control for modern businesses" in text-[#9EA3AE]
  - Three feature bullet points with check icons (green checkmark + text)
- Right column (60% width): white bg, centered login form
  - "Welcome back" heading in Syne font
  - Email + Password inputs
  - "Forgot password?" link
  - Sign In button (full width, indigo)
  - "Don't have an account? Sign up" link
- On submit: POST /api/auth/login → store token+user → navigate to /dashboard
- From excalidraw login logic:
  - Check credentials → if match allow login → redirect to dashboard
  - If credentials do not match → show inline error: "Invalid Login Id or Password"
  - "Forget Password?" link → /forgot-password
  - "Sign Up" link → /signup
- Show loading spinner on button while submitting

### Signup.jsx
Same split layout as Login.
- Left side: dark with branding
- Right side: Name (6–12 chars), Email, Password, Confirm Password fields
- Client-side validation before submit:
  1. Name must be 6–12 characters
  2. Email must be valid format
  3. Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 special character
  4. Password === Confirm Password
- Show inline red error messages below each field if validation fails
- POST /api/auth/signup → auto-login → navigate to /dashboard
- Show server error in red toast if API returns error

### ForgotPassword.jsx
Centered single-column layout, max-w-md:
- Step 1: Enter email → POST /api/auth/forgot-password → show OTP returned in response
- Step 2: Enter OTP + new password → POST /api/auth/reset-password
- Step 3: Success state with link to login
- Note: "For demo, OTP is shown in the API response"

### Dashboard.jsx
Fetch GET /api/dashboard on mount.
Fetch GET /api/dashboard/filter on mount and whenever any filter changes.

Layout:
1. Page header: "Dashboard" title + current date on right
2. KPI row (5 cards) — matches PDF KPIs exactly:
   - Total Products in Stock (Package icon, indigo)
   - Low Stock / Out of Stock Items (AlertTriangle icon, red)
   - Pending Receipts (PackageCheck icon, amber) — with sub-stats below the number:
       "X draft · X waiting · X ready" in text-xs text-gray-500
   - Pending Deliveries (Truck icon, blue) — with sub-stats:
       "X draft · X picking · X packing"
   - Internal Transfers Scheduled (ArrowLeftRight icon, purple) — count of draft transfers
3. Two-column row matching mockup dashboard cards:
   - Left card "Receipt": large number showing total pending (draft+ready), sub-stat rows:
       - "X Late" (red dot) = receipts where schedule_date < today
       - "X Waiting" (amber dot) = receipts in 'waiting' status
       - "X Operations" (blue dot) = receipts where schedule_date > today (upcoming)
       - "X to receive" summary line
     - "View all →" link navigates to /receipts
   - Right card "Delivery": same structure:
       - "X Late" (red) = deliveries where schedule_date < today
       - "X Waiting" (amber) = deliveries in 'waiting' status (stock shortage)
       - "X Operations" (blue) = deliveries where schedule_date > today
       - "X to deliver" summary line
     - "View all →" link navigates to /deliveries
   - From excalidraw annotation: "Late: schedule_date < today's date | Operations: schedule_date > today's date | Waiting: Waiting for the stocks" 
4. Full-width: "Low Stock Alerts" table (product name, sku, on hand qty, reorder qty, badge)
   - Clicking a row navigates to /products/:id
5. Full-width: "Operations" section with DYNAMIC FILTERS:
   - Filter bar (all in one row, bg-white rounded-xl border p-4):
     - "Document Type" dropdown: All | Receipts | Deliveries | Transfers | Adjustments
     - "Status" dropdown: All | Draft | Waiting | Ready | Picking | Packing | Done | Cancelled
     - "Warehouse" dropdown: All | {list from API}
     - "Category" dropdown: All | {list from API}
     - "Clear Filters" button (only visible when any filter is active)
   - Results table below filters: Ref, Type badge, Party (supplier/destination), Location, Warehouse, Date, Status badge, Lines
   - Table updates live on every filter change (call GET /api/dashboard/filter with active params)
   - Show row count: "Showing X results"
   - Clicking a row navigates to the correct detail page (/receipts/:id, /deliveries/:id, etc.)
6. All sections show EmptyState if no data, Spinner while loading

### Products.jsx
Matches the "Stock" page from the mockup exactly.

- Page title: "Stock" (not "Products") with subtitle "Manage your product inventory"
- Top bar: Search input (search by name or SKU) + Category filter dropdown + "New Product" button (right-aligned, indigo)
- DataTable columns matching excalidraw exactly:
  | # | Product | Per Unit Cost | On Hand | Free to Use | Reorder Qty | Status |
  - # = row number
  - Product = name + SKU below in gray text-xs
  - Per Unit Cost = numeric, formatted as ₹ currency
  - On Hand = total stock across all locations (bold)
  - Free to Use = On Hand minus any reserved/committed qty from pending deliveries (computed as: on_hand - SUM of qty_demanded from deliveries where status IN ('draft','waiting','ready'))
  - Reorder Qty = plain number, red if On Hand ≤ Reorder Qty
  - Status = LOW STOCK (red badge) or IN STOCK (green badge)
- Click row → navigate to /products/:id
- Inline stock edit: clicking the "On Hand" value in the row opens a small inline popover/input to quickly update stock for that location (calls PATCH /api/products/:id/stock). Note from mockup: "User must be able to update the stock from here."
- New Product modal fields: Name*, SKU*, Per Unit Cost, Category, UOM, Reorder Qty, Initial Stock Qty, Initial Location
- Submit creates product via POST /api/products

### ProductDetail.jsx
- Breadcrumb: Dashboard > Products > {product name}
- Two sections:
  1. Product info card (editable inline — clicking Edit enables form fields):
     - Name, SKU, Category, UOM, Per Unit Cost, Reorder Qty
     - Save / Cancel buttons in edit mode
  2. "Stock by Location" table: Location, Warehouse, Qty, Low Stock badge
     - Each row has a quick-edit Qty button (pencil icon) that opens inline input
- Delete button with ConfirmDialog at top right
- Delete navigates back to /products

### Categories.jsx
- Simple page: "Categories" title + "Add Category" button
- Inline table: Name, Actions (Edit pencil | Delete trash)
- Edit: inline text input in table row
- Delete: ConfirmDialog before delete

### Receipts.jsx
Matches the "Receipts — List View" from the excalidraw exactly.
From excalidraw: "By default land on List View", "Allow user to switch to the kanban view based on status"

- Page title: "Receipts" with subtitle showing total count
- Top action bar:
  - Left: "New" button (indigo, + icon) → navigates to /receipts/new
  - Right: List view icon | Kanban view icon | Search icon (tooltip: "Search by reference & contacts") | Filter icon
  - From excalidraw: "Allow user to search receptive based on reference & contacts" 
- **List View** (default): DataTable as described below
- **Kanban View** (toggle): 4 columns — Draft | Ready | Done | Cancelled
  - Each column header shows count + colored badge
  - Each card shows: Ref, Supplier, Schedule Date, Location, line count
  - Cards are NOT draggable — kanban is view-only, status changes happen inside detail page
- Status filter pills (below action bar): All | Draft | Waiting | Ready | Done | Cancelled
- DataTable columns matching excalidraw exactly:
  | # | Reference | From | To | Contact | Schedule Date | Status |
  - Reference = {WH_CODE}/IN/XXXX, clickable
  - From = source location name
  - To = destination location name
  - Contact = supplier/vendor name
  - Schedule Date = schedule_date field
  - Status = StatusBadge (Draft=gray, Ready=amber, Done=green, Cancelled=red)
  - Row colour: Ready rows get amber left border, Done rows get green left border
- Click row → /receipts/:id

### ReceiptDetail.jsx
Matches the "Receipt Detail" from the mockup exactly.

**Top button bar** (from excalidraw: "Draft > Ready > Done", "TODO → Ready, Validate → Done"):
- status = 'draft':    [ New ] [ TODO → ] [ Cancel ] [ Print ]   ........   Draft ▶ Ready ▶ Done
- status = 'ready':    [ Validate ✓ ] [ Cancel ] [ Print ]
- status = 'done':     [ Print ] only — read-only, green "Received" banner. From excalidraw: "Print the receipt once it's DONE"
- status = 'cancelled': read-only — no buttons

**Status stepper** (horizontal — from excalidraw text EXACTLY: "Draft > Ready > Done"):
```
● Draft  ──  ○ Ready  ──  ○ Done
```
- Current = indigo filled, completed = green, future = gray
- Status legend shown below stepper (from excalidraw exact text):
  "Draft - Initial stage | Ready - Ready to receive | Done - Received" 

**Header info section** (two-column grid, white card):
- Left column:
  - Ref number (auto-generated, read-only, shown prominently as large text)
  - Receive From (text input — vendor/supplier name, maps to 'supplier')
  - Schedule Date (date picker — maps to schedule_date)
  - Responsible (text input — auto-filled with logged-in user name)
- Right column:
  - Destination Type (dropdown: Internal / External)
  - Source Warehouse (dropdown → filters Destination Location)
  - Destination Location (location where received goods will be stored)
  - Notes (textarea)
  - Notes (textarea)

**Products section** (white card, label "Products"):
- Table columns: | Product | Quantity | (delete row icon) |
  - Product = dropdown showing "[SKU] Name" format e.g. "[DESK001] Desk" exactly as in excalidraw
  - Quantity = number input (maps to received_qty)
- "+ New Product" text link below the last line (not a button — plain text with + icon)
- Example from excalidraw: product shown as "[DESK001] Desk" with quantity "6"
- Product dropdown option format: "[{sku}] {name}" 

**Footer**: Back link "← Receipts" on left

After validate: status → 'done', refresh data, success toast, full read-only

### Deliveries.jsx
Matches excalidraw "Delivery — List View" exactly.
From excalidraw: "By default land on List View", "Allow user to switch to the kanban view based on status"

- Page title: "Delivery"
- Top action bar:
  - Left: "New" button (indigo) → /deliveries/new
  - Right: List view icon | Kanban view icon | Search icon (tooltip: "Search by reference & contacts") | Filter icon
  - From excalidraw: "Allow user to search Delivery based on reference & contacts"
- **List View** (default): DataTable as described below
- **Kanban View**: 5 columns — Draft | Waiting | Ready | Done | Cancelled
  - Each card shows: Ref, Destination, Schedule Date, Status badge, line count
  - Waiting column cards highlighted in amber
- Status filter pills: All | Draft | Waiting | Ready | Done | Cancelled
- DataTable columns matching excalidraw exactly:
  | # | Reference | From | To | Contact | Schedule Date | Status |
  - Reference = {WH_CODE}/OUT/XXXX, clickable
  - From = source location name
  - To = destination/delivery address
  - Contact = customer/destination name
  - Schedule Date = schedule_date field
  - Status = StatusBadge (Draft=gray, Waiting=blue, Ready=amber, Done=green, Cancelled=red)
  - Waiting rows highlighted with amber left border
- Click row → /deliveries/:id

### DeliveryDetail.jsx
Matches excalidraw annotation exactly.

**Top button bar** (from excalidraw: "TODO = When in Draft, Validate = When in Ready"):
- status = 'draft':    [ New ] [ TODO → ] [ Cancel ] [ Print ]   ........   Draft ▶ Waiting ▶ Ready ▶ Done
- status = 'waiting':  [ TODO → ] [ Cancel ] [ Print ]  (waiting for stock — show amber banner listing shortage products)
- status = 'ready':    [ Validate ✓ ] [ Cancel ] [ Print ]
- status = 'done':     [ Print ] only — read-only, green "Delivered" banner
- status = 'cancelled': read-only — no buttons

**Status stepper** (horizontal — from excalidraw text EXACTLY: "Draft > Waiting>  Ready > Done"):
```
● Draft  ──  ○ Waiting  ──  ○ Ready  ──  ○ Done
```
- Current step = indigo filled circle + bold label
- Completed steps = green filled circle
- Future steps = gray outline circle
- Status definitions shown as tooltip/legend (from excalidraw):
  "Draft: Initial state | Waiting: Waiting for the out of stock product to be in | Ready: Ready to deliver/receive | Done: Received or delivered" 

**Stock alert** (from excalidraw: "Alert the notification & mark the line red if product is not in stock"):
- When TODO is clicked and stock is insufficient: status becomes 'waiting'
- Show amber warning banner at top of page: "⚠ Waiting for stock — the following products are currently unavailable: [list]"
- In the products table: mark rows with insufficient stock in red background + "OUT OF STOCK" badge in Quantity cell
- Status definitions note shown below stepper (from excalidraw exact text):
  "Draft: Initial state | Waiting: Waiting for the out of stock product to be in | Ready: Ready to deliver/receive | Done: Received or delivered" 

**Header info section** (white card, two-column grid):
- Left column:
  - Delivery Adress (text input — label spelled as "Delivery Adress" per excalidraw, maps to 'destination')
  - Schedule Date (date picker — label "Schedule Date", maps to schedule_date)
  - Responsible (text input — label "Responsible", auto-filled with logged-in user name)
- Right column:
  - Operation type (dropdown — label "Operation type" per excalidraw: Customer / Internal, maps to 'destination_type')
  - Source Warehouse (dropdown → filters Source Location)
  - Source Location (cascading dropdown — where stock is taken from)
  - Notes (textarea)

**Products section** (white card, label "Products"):
- Table columns: | Product | Quantity | (delete row icon) |
  - Product = dropdown showing "[SKU] Name" format — e.g. "[DESK001] Desk" (from excalidraw)
  - Quantity = number input — example shows "6" (from excalidraw)
  - From excalidraw: "Alert the notification & mark the line red if product is not in stock"
    → If product's free_to_use < qty entered: highlight row background red + show small red badge "OUT OF STOCK"
- "Add New product" text link below the last line (from excalidraw label "Add New product")
- Status legend below products (from excalidraw): "Draft: Initial state | Waiting: Waiting for out of stock... | Ready: Ready to deliver | Done: Received or delivered" 

**Stock validation note** (shown as amber info banner when in draft):
"Stock will be checked when you click Validate. If insufficient, you will see which product is short."

After validate (POST /pick → /pack → /validate flow internally):
- If insufficient stock: red toast "Insufficient stock for {productName}. Available: {qty}"
- If success: status → 'done', read-only, green toast

### Transfers.jsx
DataTable: Ref, From Location, To Location, Date, Status, Lines count

### TransferDetail.jsx
Header fields:
- From Warehouse → From Location (cascading dropdowns)
- To Warehouse → To Location (cascading dropdowns)
- Validate that from ≠ to location
- Date, Notes

Lines: Product dropdown, Qty input

Validate button → POST /api/transfers/:id/validate

### Adjustments.jsx
DataTable: Ref, Location, Date, Status, Lines count

### AdjustmentDetail.jsx
Header: Warehouse → Location (cascading), Date, Notes

Lines table:
- Product (dropdown)
- System Qty (read-only, gray background — fetched from current stock)
- Counted Qty (editable number input)
- Difference (computed: counted - system, green if ≥ 0, red if < 0)

When adding a product to lines: fetch current stock qty at selected location and populate System Qty.

Validate → POST /api/adjustments/:id/validate

### MoveHistory.jsx
Matches the "Move History — List View" from the mockup exactly.

- Page title: "Move History"
- Note from mockup: "By default land on List View" + "Allow user to cancel delivery based on reference & contacts"
- Top action bar: right-aligned Search icon + Filter icon buttons
- DataTable columns matching excalidraw exactly:
  | # | Ref | Contact (supplier/destination) | From | To | Quantity | Status |
  - # = row number
  - Ref = document ref (e.g. MW/IN/0001) — clickable, navigates to source document
  - Contact = supplier name or destination name
  - From = source location name (empty for receipts)
  - To = destination location name (empty for deliveries)
  - Quantity = number — from excalidraw: "In event (receipts/transfers in) = GREEN text, Out moves (deliveries/transfers out) = RED text"
  - Status = StatusBadge (Ready / Done / Cancelled)
  - From excalidraw: "if single reference has multiple products, display each in a separate row"
    → Each move_history row is one product. If WH/IN/0001 had 3 products, show 3 rows all with ref WH/IN/0001
    → Group consecutive same-ref rows visually (first row shows ref, subsequent rows show ref in lighter gray)
- Filter panel (opens on Filter icon click):
  - Type: All | Receipt | Delivery | Transfer | Adjustment
  - Warehouse filter dropdown
  - Date range (from / to)
- Note from mockup sidebar annotation: "Regardless of empty place reloads the form — To only show to match products — it might still be in there — to search data shows in view — tree current stock on data — show current quantity by display it"
- Sorted newest first, limit 200 rows

### MyProfile.jsx
- Page title: "My Profile"
- Breadcrumb: Dashboard > My Profile
- Profile card (white, centered, max-w-lg):
  - Avatar circle (large, 80px, initials + indigo bg)
  - Name (Syne font, large)
  - Email (text-gray-500)
  - Role badge (Inventory Manager / Staff)
- Edit Profile form:
  - Name (text input)
  - Email (text input, read-only — greyed out)
  - Role (read-only badge, not editable)
  - "Save Changes" button → PUT /api/auth/profile { name }
- Change Password section (separate card below):
  - Current Password input
  - New Password input
  - Confirm New Password input
  - "Update Password" button → PUT /api/auth/change-password { currentPassword, newPassword }
  - Validate: new password === confirm password before submit
- Both forms show loading spinner on submit and toast on success/error

### Settings.jsx
Matches the Settings mockup pages exactly — two separate form pages, not tabs.

The Settings page shows two cards side by side (or stacked on small screens):

**Warehouse Card** (matches excalidraw exactly):
- Card title: "Warehouse" with subtitle "This page contains the warehouse details & location."
- Form fields matching excalidraw labels exactly:
  - Name: (text input — label is "Name:")
  - Short Code: (text input — label is "Short Code:")
  - Address: (text input — label is "Address:")
- Below the form: DataTable of all warehouses
  - Columns: Name, Short Code, Address, Locations Count, Actions (edit pencil | delete trash)
  - Edit: fills the form above with selected warehouse data
  - "New" button clears form for new entry
  - Save / Cancel buttons at bottom of form
  - Delete: ConfirmDialog

**Location Card** (matches excalidraw exactly):
- Card title: "location" (lowercase, as shown in excalidraw)
- Subtitle: "This holds the multiple locations of warehouse, rooms etc.."
- Form fields matching excalidraw labels exactly:
  - Name: (text input — label is "Name:")
  - Short Code: (text input — label is "Short Code:")
  - warehouse: (dropdown — label is "warehouse:", shows WH short_code + name)
  - Short code field auto-populates as e.g. "WH" from selected warehouse
- Below the form: DataTable of all locations
  - Columns: Name, Short Code, Warehouse, Actions (edit | delete)
  - Edit: fills form above
  - Save / Cancel / New buttons
  - Delete: ConfirmDialog

---

## COMPONENTS — COMPLETE IMPLEMENTATION

### Layout.jsx
```jsx
// Fixed sidebar (240px) + scrollable main content
// Renders <Sidebar /> on left
// Top area has TWO layers:
//   1. Breadcrumb bar (very top, bg-white border-b border-gray-100 h-10 px-6)
//      Shows clickable breadcrumb trail e.g. "Dashboard > Operations > Receipts > WH/IN/0001"
//      Built from current route path — each segment is a clickable link
//   2. Header bar below breadcrumb (bg-white border-b border-gray-200 h-14)
//      Page title (Syne bold) on left, actions (bell + user) on right
// Main content area: ml-60 pt-24 px-6 bg-[#F7F8FA] min-h-screen
// <Outlet /> renders page content
```

### Sidebar.jsx
Full sidebar component matching the Odoo-style mockup exactly:

- Logo at top: "CoreInventory" wordmark in Syne bold, text-white, with a small Box icon (Lucide)
- Sidebar sections with section labels (text-xs text-[#9EA3AE] uppercase tracking-widest px-3 mb-1 mt-4):

  SECTION: (no label — main)
  - Dashboard (LayoutDashboard icon) → /dashboard

  SECTION LABEL: "Products"
  - Products (Package icon) → /products
  - Categories (Tag icon) → /categories

  SECTION LABEL: "Operations"
  - Receipts (PackageCheck icon) → /receipts
  - Deliveries (Truck icon) → /deliveries
  - Transfers (ArrowLeftRight icon) → /transfers
  - Adjustments (SlidersHorizontal icon) → /adjustments
  - Move History (History icon) → /move-history

  SECTION LABEL: "Configuration"
  - Settings (Settings2 icon) → /settings

- Active item style: bg-[#2D3139] text-white rounded-lg
- Inactive item style: text-[#9EA3AE] hover:bg-[#2D3139] hover:text-white rounded-lg transition-colors
- Bottom section (absolute bottom-0, border-t border-[#2D3139] pt-3):
  - User avatar circle (indigo bg, white initials from name, w-8 h-8 rounded-full) — clicking navigates to /profile
  - User name (text-white text-sm font-medium) + role (text-[#9EA3AE] text-xs)
  - Two bottom buttons:
    1. "My Profile" (User icon, text-[#9EA3AE] hover:text-white) → navigates to /profile
    2. "Logout" (LogOut icon, text-[#9EA3AE] hover:text-red-400) → logout action
- Each nav item: flex items-center gap-3 px-3 py-2.5 text-sm font-medium cursor-pointer rounded-lg mx-2

### Header.jsx
- Fixed top header (left: ml-60)
- bg-white border-b border-gray-200 h-16
- Left: Dynamic page title from current route (map path to human title)
- Right: Bell icon with badge showing lowStockCount from dashboard store + User name

### KPICard.jsx
Props: title, value, icon, iconBg, trend
```jsx
// bg-white rounded-xl border border-gray-200 p-5
// Left: value (text-3xl font-bold Syne), title (text-sm text-gray-500), optional trend
// Right: icon in colored circle
```

### StatusBadge.jsx
```jsx
const colors = {
  draft:      'bg-gray-100 text-gray-600',
  waiting:    'bg-blue-100 text-blue-700',
  ready:      'bg-amber-100 text-amber-700',
  picking:    'bg-sky-100 text-sky-700',
  packing:    'bg-violet-100 text-violet-700',
  done:       'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  canceled:   'bg-red-100 text-red-600',
  LOW:        'bg-red-100 text-red-600',
  OK:         'bg-green-100 text-green-700',
  receipt:    'bg-blue-100 text-blue-700',
  delivery:   'bg-purple-100 text-purple-700',
  transfer:   'bg-indigo-100 text-indigo-700',
  adjustment: 'bg-orange-100 text-orange-700',
}
// Display label mapping (normalize for display):
const labels = {
  draft: 'Draft', waiting: 'Waiting', ready: 'Ready',
  picking: 'Picking', packing: 'Packing',
  done: 'Done', cancelled: 'Cancelled', canceled: 'Cancelled',
  LOW: 'Low Stock', OK: 'In Stock',
  receipt: 'Receipt', delivery: 'Delivery',
  transfer: 'Transfer', adjustment: 'Adjustment',
}
// <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
//   {labels[status] || status}
// </span>
```

### DataTable.jsx
Props: columns, data, onRowClick, loading, emptyMessage, emptyIcon
- loading: show 5 skeleton rows (gray animated pulse)
- empty: show EmptyState
- Otherwise: render table
- columns[].render(value, row): optional custom cell renderer

### Modal.jsx
Props: isOpen, onClose, title, children, size ('sm'|'md'|'lg')
- Fixed overlay (bg-black/50 backdrop-blur-sm)
- Centered white card with rounded-xl shadow-2xl
- Header: title + X close button
- Body: children with overflow-y-auto
- Close on overlay click + Escape key

### ConfirmDialog.jsx
Props: isOpen, onConfirm, onCancel, title, message, confirmText, confirmVariant
- Smaller modal (max-w-sm)
- Warning/danger icon
- Title + message
- Cancel + Confirm buttons (confirm button is danger color by default)

### Toast.jsx
Fixed container (bottom-right, z-50):
- Each toast: rounded-lg shadow-lg p-4 flex items-center gap-3
- success: bg-green-50 border-green-200 text-green-800
- error: bg-red-50 border-red-200 text-red-800
- warning: bg-amber-50 border-amber-200 text-amber-800
- Auto dismiss 3000ms
- Slide-in animation (translate-x from right)
- X button to manually dismiss

### EmptyState.jsx
Props: icon (Lucide component), title, description, action (optional button config)
- Centered in container
- Gray icon (large, 48px)
- Title in Syne font
- Description text in text-gray-500
- Optional action button

### Spinner.jsx
```jsx
// Centered div with spinning circle
// <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-indigo-500" />
```

---

## AUTH FLOW (JWT — no Supabase)

1. User visits /login
2. POST /api/auth/login → server returns { token, user }
3. Store token in localStorage as 'ci_token'
4. Store user in localStorage as 'ci_user' (JSON stringified)
5. Zustand authStore reads from localStorage on init
6. All API calls: axios interceptor adds Authorization: Bearer {token}
7. Backend auth.js middleware: jwt.verify(token, JWT_SECRET)
8. Logout: clear localStorage + redirect to /login

---

## UX RULES — ALL MUST BE IMPLEMENTED

1. Every form submit button shows a loading spinner and is disabled during request
2. Every successful action shows a green toast notification
3. Every error shows a red toast with the error message from the API
4. Every destructive action (delete, validate) requires ConfirmDialog first
5. Empty tables always show EmptyState with contextual icon and message
6. All data tables show 5 skeleton rows while loading (gray pulse animation)
7. Status badges are consistent across all pages using StatusBadge component
8. All modals close on overlay click or Escape key
9. After successful save/validate: re-fetch data and update UI without page reload
10. Back navigation uses router (no browser back button dependency)
11. Print button on Receipt/Delivery detail (when status = 'done'):
    - From excalidraw: "Print the receipt once it's DONE"
    - Clicking Print calls window.print() with a print-friendly CSS layout
    - Print layout: white page, show ref, date, supplier/destination, responsible, product lines table, status
    - Hide sidebar, header, action buttons in print media query (@media print)

---

## REFERENCE NUMBER GENERATION (BACKEND)

From excalidraw: Reference = <Warehouse>/<Operation>/<ID>
where Warehouse = short_code of the selected warehouse, Operation = IN/OUT/TR/ADJ, ID = auto-incremental padded 4 digits.

```javascript
// In each route POST handler — example for receipt:
// 1. Get warehouse short_code from location_id → location → warehouse
const whResult = await db.query(
  'SELECT w.short_code FROM warehouses w JOIN locations l ON l.warehouse_id = w.id WHERE l.id = $1',
  [location_id]
);
const whCode = whResult.rows[0]?.short_code || 'WH';
// 2. Count existing receipts for sequence
const countResult = await db.query('SELECT COUNT(*) FROM receipts');
const count = parseInt(countResult.rows[0].count) + 1;
// 3. Build ref
const ref = `${whCode}/IN/${String(count).padStart(4, '0')}`;
```

- Receipts:    {WH_CODE}/IN/0001   e.g. MW/IN/0001
- Deliveries:  {WH_CODE}/OUT/0001  e.g. MW/OUT/0001
- Transfers:   {WH_CODE}/TR/0001   e.g. MW/TR/0001
- Adjustments: {WH_CODE}/ADJ/0001  e.g. MW/ADJ/0001

---

## OUTPUT FORMAT

Output every file using this exact format:

```
FILE: docker-compose.yml
```yaml
[full content]
```

FILE: server/index.js
```javascript
[full content]
```
```

Generate files in this order:
1. docker-compose.yml
2. .env
3. README.md
4. database/init.sql
5. database/seed.sql
6. server/Dockerfile
7. server/package.json
8. server/db.js
9. server/index.js
10. server/middleware/auth.js
11. server/routes/auth.js
12. server/routes/dashboard.js   ← includes both GET /api/dashboard and GET /api/dashboard/filter
13. server/routes/products.js
14. server/routes/categories.js
15. server/routes/warehouses.js
16. server/routes/locations.js
17. server/routes/receipts.js
18. server/routes/deliveries.js
19. server/routes/transfers.js
20. server/routes/adjustments.js
21. server/routes/moveHistory.js
22. client/Dockerfile
23. client/package.json
24. client/vite.config.js
25. client/tailwind.config.js
26. client/postcss.config.js
27. client/index.html
28. client/src/index.css
29. client/src/main.jsx
30. client/src/App.jsx
31. client/src/api/client.js
32. client/src/store/authStore.js
33. client/src/hooks/useToast.js
34. client/src/components/Layout.jsx
35. client/src/components/Sidebar.jsx
36. client/src/components/Header.jsx
37. client/src/components/KPICard.jsx
38. client/src/components/StatusBadge.jsx
39. client/src/components/DataTable.jsx
40. client/src/components/Modal.jsx
41. client/src/components/ConfirmDialog.jsx
42. client/src/components/Toast.jsx
43. client/src/components/EmptyState.jsx
44. client/src/components/Spinner.jsx
45. client/src/pages/Login.jsx
46. client/src/pages/Signup.jsx
47. client/src/pages/ForgotPassword.jsx
48. client/src/pages/Dashboard.jsx
49. client/src/pages/Products.jsx
50. client/src/pages/ProductDetail.jsx
51. client/src/pages/Categories.jsx
52. client/src/pages/Receipts.jsx
53. client/src/pages/ReceiptDetail.jsx
54. client/src/pages/Deliveries.jsx
55. client/src/pages/DeliveryDetail.jsx
56. client/src/pages/Transfers.jsx
57. client/src/pages/TransferDetail.jsx
58. client/src/pages/Adjustments.jsx
59. client/src/pages/AdjustmentDetail.jsx
60. client/src/pages/MoveHistory.jsx
61. client/src/pages/Settings.jsx
62. client/src/pages/MyProfile.jsx

Do NOT stop until file 62 is complete.
Do NOT summarize any file — write every file in full.
Do NOT add explanations between files.
If output limit is reached, stop at a clean file boundary.
User will run `claude --continue` to resume from the next file.

---

BEGIN NOW. Start with file 1: docker-compose.yml
