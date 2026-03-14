const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/products
router.get('/', auth, async (req, res) => {
  try {
    const { search, category_id } = req.query;
    let conditions = [];
    let params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (category_id) {
      conditions.push(`p.category_id = $${paramIdx++}`);
      params.push(category_id);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT p.id, p.name, p.sku, p.uom, p.per_unit_cost, p.reorder_qty, p.category_id,
        c.name AS category_name,
        COALESCE(SUM(s.qty), 0) AS on_hand,
        COALESCE(SUM(s.qty), 0) - COALESCE((
          SELECT SUM(dl.qty_demanded)
          FROM delivery_lines dl
          JOIN deliveries d ON d.id = dl.delivery_id
          WHERE dl.product_id = p.id AND d.status IN ('draft','waiting','ready')
        ), 0) AS free_to_use,
        CASE WHEN COALESCE(SUM(s.qty), 0) <= p.reorder_qty THEN true ELSE false END AS is_low_stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock s ON s.product_id = p.id
      ${where}
      GROUP BY p.id, c.name
      ORDER BY p.name
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const productRes = await db.query(`
      SELECT p.*, c.name AS category_name,
        COALESCE((SELECT SUM(s.qty) FROM stock s WHERE s.product_id = p.id), 0) AS on_hand
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `, [id]);

    if (productRes.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const stockRes = await db.query(`
      SELECT s.id, s.qty, l.id AS location_id, l.name AS location_name, w.id AS warehouse_id, w.name AS warehouse_name
      FROM stock s
      JOIN locations l ON l.id = s.location_id
      JOIN warehouses w ON w.id = l.warehouse_id
      WHERE s.product_id = $1
      ORDER BY w.name, l.name
    `, [id]);

    res.json({ ...productRes.rows[0], stock_by_location: stockRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/products
router.post('/', auth, async (req, res) => {
  try {
    const { name, sku, category_id, uom, per_unit_cost, reorder_qty, initial_stock, initial_location_id } = req.body;

    if (!name || !sku) return res.status(400).json({ error: 'Name and SKU are required' });

    const result = await db.query(
      'INSERT INTO products (name, sku, category_id, uom, per_unit_cost, reorder_qty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, sku, category_id || null, uom || 'pcs', per_unit_cost || 0, reorder_qty || 10]
    );

    const product = result.rows[0];

    if (initial_stock && initial_stock > 0 && initial_location_id) {
      await db.query(
        'INSERT INTO stock (product_id, location_id, qty) VALUES ($1, $2, $3) ON CONFLICT (product_id, location_id) DO UPDATE SET qty = EXCLUDED.qty',
        [product.id, initial_location_id, initial_stock]
      );
    }

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category_id, uom, per_unit_cost, reorder_qty } = req.body;

    const result = await db.query(
      'UPDATE products SET name=$1, sku=$2, category_id=$3, uom=$4, per_unit_cost=$5, reorder_qty=$6 WHERE id=$7 RETURNING *',
      [name, sku, category_id || null, uom, per_unit_cost, reorder_qty, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/products/:id/stock
router.patch('/:id/stock', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id, qty } = req.body;

    // Get old qty
    const oldRes = await db.query(
      'SELECT qty FROM stock WHERE product_id = $1 AND location_id = $2',
      [id, location_id]
    );
    const oldQty = oldRes.rows.length > 0 ? parseFloat(oldRes.rows[0].qty) : 0;
    const diff = parseFloat(qty) - oldQty;

    await db.query(
      'INSERT INTO stock (product_id, location_id, qty) VALUES ($1, $2, $3) ON CONFLICT (product_id, location_id) DO UPDATE SET qty = EXCLUDED.qty',
      [id, location_id, qty]
    );

    // Get product and location names for history
    const prodRes = await db.query('SELECT name FROM products WHERE id = $1', [id]);
    const locRes = await db.query('SELECT name FROM locations WHERE id = $1', [location_id]);

    if (diff !== 0) {
      await db.query(
        `INSERT INTO move_history (ref, type, product_id, product_name, from_location_id, from_location_name, to_location_id, to_location_name, qty)
         VALUES ($1, 'adjustment', $2, $3, $4, $5, $4, $5, $6)`,
        ['MANUAL', id, prodRes.rows[0]?.name, location_id, locRes.rows[0]?.name, diff]
      );
    }

    res.json({ message: 'Stock updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
