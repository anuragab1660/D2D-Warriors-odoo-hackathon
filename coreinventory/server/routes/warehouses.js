const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireManager = require('../middleware/requireManager');

router.get('/', auth, async (req, res) => {
  try {
    const warehousesRes = await db.query('SELECT * FROM warehouses ORDER BY name');
    const locationsRes = await db.query('SELECT * FROM locations ORDER BY name');

    const warehouses = warehousesRes.rows.map(w => ({
      ...w,
      locations: locationsRes.rows.filter(l => l.warehouse_id === w.id)
    }));

    res.json(warehouses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, requireManager, async (req, res) => {
  try {
    const { name, short_code, address } = req.body;
    if (!name || !short_code) return res.status(400).json({ error: 'Name and short code are required' });
    const result = await db.query(
      'INSERT INTO warehouses (name, short_code, address) VALUES ($1, $2, $3) RETURNING *',
      [name, short_code, address || null]
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
    const { name, short_code, address } = req.body;
    const result = await db.query(
      'UPDATE warehouses SET name=$1, short_code=$2, address=$3 WHERE id=$4 RETURNING *',
      [name, short_code, address || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM warehouses WHERE id = $1', [id]);
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
