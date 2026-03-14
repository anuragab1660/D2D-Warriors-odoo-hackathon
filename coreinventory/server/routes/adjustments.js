const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/adjustments
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, l.name AS location_name, w.name AS warehouse_name,
        (SELECT COUNT(*) FROM adjustment_lines WHERE adjustment_id = a.id) AS lines_count
      FROM adjustments a
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/adjustments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const adjRes = await db.query(`
      SELECT a.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM adjustments a
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE a.id = $1
    `, [id]);

    if (adjRes.rows.length === 0) return res.status(404).json({ error: 'Adjustment not found' });

    const linesRes = await db.query(`
      SELECT al.*, p.name AS product_name, p.sku, p.uom
      FROM adjustment_lines al
      JOIN products p ON p.id = al.product_id
      WHERE al.adjustment_id = $1
    `, [id]);

    res.json({ ...adjRes.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/adjustments
router.post('/', auth, async (req, res) => {
  try {
    const { location_id, notes, date, lines } = req.body;

    // Get warehouse short code
    const whRes = await db.query(
      'SELECT w.short_code FROM warehouses w JOIN locations l ON l.warehouse_id = w.id WHERE l.id = $1',
      [location_id]
    );
    const whCode = whRes.rows[0]?.short_code || 'WH';

    const countRes = await db.query('SELECT COUNT(*) FROM adjustments');
    const count = parseInt(countRes.rows[0].count) + 1;
    const ref = `${whCode}/ADJ/${String(count).padStart(4, '0')}`;

    const adjRes = await db.query(
      'INSERT INTO adjustments (ref, location_id, notes, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [ref, location_id, notes || null, date || new Date()]
    );

    const adjustment = adjRes.rows[0];

    if (lines && lines.length > 0) {
      for (const line of lines) {
        const stockRes = await db.query(
          'SELECT COALESCE(qty, 0) AS qty FROM stock WHERE product_id = $1 AND location_id = $2',
          [line.product_id, location_id]
        );
        const system_qty = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].qty) : 0;

        await db.query(
          'INSERT INTO adjustment_lines (adjustment_id, product_id, system_qty, counted_qty) VALUES ($1, $2, $3, $4)',
          [adjustment.id, line.product_id, system_qty, line.counted_qty !== undefined ? line.counted_qty : system_qty]
        );
      }
    }

    const fullAdj = await db.query(`
      SELECT a.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM adjustments a
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE a.id = $1
    `, [adjustment.id]);

    const linesRes = await db.query(`
      SELECT al.*, p.name AS product_name, p.sku, p.uom
      FROM adjustment_lines al JOIN products p ON p.id = al.product_id
      WHERE al.adjustment_id = $1
    `, [adjustment.id]);

    res.status(201).json({ ...fullAdj.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/adjustments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id, notes, date, lines } = req.body;

    const check = await db.query('SELECT status FROM adjustments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Adjustment not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only edit draft adjustments' });

    await db.query(
      'UPDATE adjustments SET location_id=$1, notes=$2, date=$3 WHERE id=$4',
      [location_id, notes || null, date, id]
    );

    await db.query('DELETE FROM adjustment_lines WHERE adjustment_id = $1', [id]);

    if (lines && lines.length > 0) {
      for (const line of lines) {
        const stockRes = await db.query(
          'SELECT COALESCE(qty, 0) AS qty FROM stock WHERE product_id = $1 AND location_id = $2',
          [line.product_id, location_id]
        );
        const system_qty = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].qty) : 0;

        await db.query(
          'INSERT INTO adjustment_lines (adjustment_id, product_id, system_qty, counted_qty) VALUES ($1, $2, $3, $4)',
          [id, line.product_id, system_qty, line.counted_qty !== undefined ? line.counted_qty : system_qty]
        );
      }
    }

    const fullAdj = await db.query(`
      SELECT a.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM adjustments a
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE a.id = $1
    `, [id]);

    const linesRes = await db.query(`
      SELECT al.*, p.name AS product_name, p.sku, p.uom
      FROM adjustment_lines al JOIN products p ON p.id = al.product_id
      WHERE al.adjustment_id = $1
    `, [id]);

    res.json({ ...fullAdj.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/adjustments/:id/validate
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM adjustments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Adjustment not found' });
    const adjustment = check.rows[0];
    if (adjustment.status !== 'draft') return res.status(400).json({ error: 'Adjustment must be in Draft status' });

    const linesRes = await db.query(`
      SELECT al.*, p.name AS product_name
      FROM adjustment_lines al JOIN products p ON p.id = al.product_id
      WHERE al.adjustment_id = $1
    `, [id]);

    const locRes = await db.query('SELECT name FROM locations WHERE id = $1', [adjustment.location_id]);
    const locationName = locRes.rows[0]?.name || '';

    for (const line of linesRes.rows) {
      // Set stock to counted_qty
      await db.query(
        `INSERT INTO stock (product_id, location_id, qty) VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id) DO UPDATE SET qty = EXCLUDED.qty`,
        [line.product_id, adjustment.location_id, line.counted_qty]
      );

      const diff = parseFloat(line.counted_qty) - parseFloat(line.system_qty);

      // Insert move history
      await db.query(
        `INSERT INTO move_history (ref, type, product_id, product_name, from_location_id, from_location_name, to_location_id, to_location_name, qty)
         VALUES ($1, 'adjustment', $2, $3, $4, $5, $4, $5, $6)`,
        [adjustment.ref, line.product_id, line.product_name, adjustment.location_id, locationName, diff]
      );
    }

    await db.query('UPDATE adjustments SET status = $1 WHERE id = $2', ['done', id]);

    const result = await db.query(`
      SELECT a.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM adjustments a
      LEFT JOIN locations l ON l.id = a.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE a.id = $1
    `, [id]);

    const finalLines = await db.query(`
      SELECT al.*, p.name AS product_name, p.sku, p.uom
      FROM adjustment_lines al JOIN products p ON p.id = al.product_id
      WHERE al.adjustment_id = $1
    `, [id]);

    res.json({ ...result.rows[0], lines: finalLines.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/adjustments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM adjustments WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Adjustment not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only delete draft adjustments' });
    await db.query('DELETE FROM adjustments WHERE id = $1', [id]);
    res.json({ message: 'Adjustment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
