const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireManager = require('../middleware/requireManager');

router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    let query = `
      SELECT l.*, w.name AS warehouse_name, w.short_code AS warehouse_short_code
      FROM locations l
      JOIN warehouses w ON w.id = l.warehouse_id
    `;
    const params = [];
    if (warehouse_id) {
      query += ' WHERE l.warehouse_id = $1';
      params.push(warehouse_id);
    }
    query += ' ORDER BY w.name, l.name';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/locations/:id/stock — stock quantities per product at this location
router.get('/:id/stock', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT s.product_id, s.qty, p.name AS product_name, p.sku
      FROM stock s
      JOIN products p ON p.id = s.product_id
      WHERE s.location_id = $1
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, requireManager, async (req, res) => {
  try {
    const { warehouse_id, name, short_code } = req.body;
    if (!warehouse_id || !name) return res.status(400).json({ error: 'Warehouse and name are required' });
    const result = await db.query(
      'INSERT INTO locations (warehouse_id, name, short_code) VALUES ($1, $2, $3) RETURNING *',
      [warehouse_id, name, short_code || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, short_code, warehouse_id } = req.body;
    const result = await db.query(
      'UPDATE locations SET name=$1, short_code=$2, warehouse_id=$3 WHERE id=$4 RETURNING *',
      [name, short_code || null, warehouse_id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Location not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM locations WHERE id = $1', [id]);
    res.json({ message: 'Location deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
