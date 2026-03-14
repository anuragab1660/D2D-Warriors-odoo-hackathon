-- Demo user (password: Demo@1234)
INSERT INTO users (name, email, password_hash, role) VALUES
('Demo User', 'demo@coreinventory.com', '$2a$10$ZfWWY0dP36p4kWgvMfS6Pe3wHeFXIT0rprY/n/YdWYEoGSvLk33fq', 'manager')
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

-- Products
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

-- In-Progress Delivery (waiting stage)
INSERT INTO deliveries (ref, destination, location_id, status, date) VALUES
('WH/OUT/0003', 'Client C - TechStart', 1, 'waiting', CURRENT_DATE)
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
('WH/IN/0001', 'receipt',  1, 'Desk',         NULL, NULL, 1, 'Main Store',           200, NOW() - INTERVAL '5 days'),
('WH/IN/0001', 'receipt',  7, 'Steel Frame',   NULL, NULL, 1, 'Main Store',          1500, NOW() - INTERVAL '5 days'),
('WH/IN/0002', 'receipt',  3, 'Steel Rods',    NULL, NULL, 1, 'Main Store',            45, NOW() - INTERVAL '3 days'),
('WH/IN/0002', 'receipt',  4, 'Copper Wire',   NULL, NULL, 1, 'Main Store',            12, NOW() - INTERVAL '3 days'),
('WH/IN/0003', 'receipt',  9, 'Motor Unit',    NULL, NULL, 3, 'Raw Materials Bay',     60, NOW() - INTERVAL '1 day'),
('WH/OUT/0001','delivery', 5, 'Circuit Board', 1,    'Main Store', NULL, NULL,         10, NOW() - INTERVAL '4 days'),
('WH/OUT/0001','delivery', 1, 'Desk',          1,    'Main Store', NULL, NULL,         50, NOW() - INTERVAL '4 days'),
('WH/OUT/0002','delivery',10, 'Control Panel', 4,    'Finished Goods Bay', NULL, NULL,  3, NOW() - INTERVAL '2 days'),
('WH/TR/0001', 'transfer', 1, 'Desk',          1,    'Main Store', 2, 'Production Floor', 30, NOW() - INTERVAL '3 days'),
('WH/TR/0001', 'transfer', 7, 'Steel Frame',   1,    'Main Store', 2, 'Production Floor',200, NOW() - INTERVAL '3 days'),
('WH/ADJ/0001','adjustment',8,'Power Cable',   1,    'Main Store', 1, 'Main Store',       -1, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
