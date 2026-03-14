const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/receipts
router.get('/', auth, async (req, res) => {
  try {
    const { status, warehouse_id } = req.query;
    let conditions = [];
    let params = [];
    let paramIdx = 1;

    if (status) { conditions.push(`r.status = $${paramIdx++}`); params.push(status); }
    if (warehouse_id) { conditions.push(`w.id = $${paramIdx++}`); params.push(warehouse_id); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT r.*, l.name AS location_name, w.name AS warehouse_name, w.short_code AS warehouse_short_code,
        (SELECT COUNT(*) FROM receipt_lines WHERE receipt_id = r.id) AS lines_count
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      ${where}
      ORDER BY r.created_at DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/receipts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const receiptRes = await db.query(`
      SELECT r.*, l.name AS location_name, l.warehouse_id,
        w.name AS warehouse_name, w.short_code AS warehouse_short_code
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE r.id = $1
    `, [id]);

    if (receiptRes.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });

    const linesRes = await db.query(`
      SELECT rl.*, p.name AS product_name, p.sku, p.uom
      FROM receipt_lines rl
      JOIN products p ON p.id = rl.product_id
      WHERE rl.receipt_id = $1
    `, [id]);

    res.json({ ...receiptRes.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/receipts
router.post('/', auth, async (req, res) => {
  try {
    const { supplier, location_id, notes, date, schedule_date, available_date, responsible, destination_type, lines } = req.body;

    // Get warehouse short code
    const whRes = await db.query(
      'SELECT w.short_code FROM warehouses w JOIN locations l ON l.warehouse_id = w.id WHERE l.id = $1',
      [location_id]
    );
    const whCode = whRes.rows[0]?.short_code || 'WH';

    // Generate ref
    const countRes = await db.query('SELECT COUNT(*) FROM receipts');
    const count = parseInt(countRes.rows[0].count) + 1;
    const ref = `${whCode}/IN/${String(count).padStart(4, '0')}`;

    const receiptRes = await db.query(
      `INSERT INTO receipts (ref, supplier, location_id, notes, date, schedule_date, available_date, responsible, destination_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [ref, supplier || null, location_id, notes || null, date || new Date(), schedule_date || null, available_date || null, responsible || null, destination_type || 'internal']
    );

    const receipt = receiptRes.rows[0];

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await db.query(
          'INSERT INTO receipt_lines (receipt_id, product_id, expected_qty, received_qty) VALUES ($1, $2, $3, $4)',
          [receipt.id, line.product_id, line.expected_qty || 0, line.received_qty || 0]
        );
      }
    }

    const fullReceipt = await db.query(`
      SELECT r.*, l.name AS location_name, w.name AS warehouse_name
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE r.id = $1
    `, [receipt.id]);

    const linesRes = await db.query(`
      SELECT rl.*, p.name AS product_name, p.sku, p.uom
      FROM receipt_lines rl JOIN products p ON p.id = rl.product_id
      WHERE rl.receipt_id = $1
    `, [receipt.id]);

    res.status(201).json({ ...fullReceipt.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/receipts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier, location_id, notes, date, schedule_date, available_date, responsible, destination_type, lines } = req.body;

    const check = await db.query('SELECT status FROM receipts WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only edit draft receipts' });

    await db.query(
      `UPDATE receipts SET supplier=$1, location_id=$2, notes=$3, date=$4, schedule_date=$5, available_date=$6, responsible=$7, destination_type=$8 WHERE id=$9`,
      [supplier || null, location_id, notes || null, date, schedule_date || null, available_date || null, responsible || null, destination_type || 'internal', id]
    );

    await db.query('DELETE FROM receipt_lines WHERE receipt_id = $1', [id]);

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await db.query(
          'INSERT INTO receipt_lines (receipt_id, product_id, expected_qty, received_qty) VALUES ($1, $2, $3, $4)',
          [id, line.product_id, line.expected_qty || 0, line.received_qty || 0]
        );
      }
    }

    const fullReceipt = await db.query(`
      SELECT r.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE r.id = $1
    `, [id]);

    const linesRes = await db.query(`
      SELECT rl.*, p.name AS product_name, p.sku, p.uom
      FROM receipt_lines rl JOIN products p ON p.id = rl.product_id
      WHERE rl.receipt_id = $1
    `, [id]);

    res.json({ ...fullReceipt.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/receipts/:id/todo — Draft → Ready
router.post('/:id/todo', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM receipts WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Receipt must be in Draft status' });

    await db.query('UPDATE receipts SET status = $1 WHERE id = $2', ['ready', id]);

    const result = await db.query(`
      SELECT r.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE r.id = $1
    `, [id]);

    const linesRes = await db.query(`
      SELECT rl.*, p.name AS product_name, p.sku, p.uom
      FROM receipt_lines rl JOIN products p ON p.id = rl.product_id
      WHERE rl.receipt_id = $1
    `, [id]);

    res.json({ ...result.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/receipts/:id/validate — Ready → Done
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM receipts WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
    if (check.rows[0].status !== 'ready') return res.status(400).json({ error: 'Receipt must be in Ready status to validate' });

    const receipt = check.rows[0];
    const linesRes = await db.query(`
      SELECT rl.*, p.name AS product_name
      FROM receipt_lines rl JOIN products p ON p.id = rl.product_id
      WHERE rl.receipt_id = $1
    `, [id]);

    const locRes = await db.query('SELECT name FROM locations WHERE id = $1', [receipt.location_id]);
    const locationName = locRes.rows[0]?.name || '';

    for (const line of linesRes.rows) {
      // Update stock
      await db.query(
        `INSERT INTO stock (product_id, location_id, qty) VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id) DO UPDATE SET qty = stock.qty + EXCLUDED.qty`,
        [line.product_id, receipt.location_id, line.received_qty]
      );

      // Insert move history
      await db.query(
        `INSERT INTO move_history (ref, type, product_id, product_name, to_location_id, to_location_name, qty)
         VALUES ($1, 'receipt', $2, $3, $4, $5, $6)`,
        [receipt.ref, line.product_id, line.product_name, receipt.location_id, locationName, line.received_qty]
      );
    }

    await db.query('UPDATE receipts SET status = $1 WHERE id = $2', ['done', id]);

    const result = await db.query(`
      SELECT r.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE r.id = $1
    `, [id]);

    const finalLines = await db.query(`
      SELECT rl.*, p.name AS product_name, p.sku, p.uom
      FROM receipt_lines rl JOIN products p ON p.id = rl.product_id
      WHERE rl.receipt_id = $1
    `, [id]);

    res.json({ ...result.rows[0], lines: finalLines.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/receipts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM receipts WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only delete draft receipts' });
    await db.query('DELETE FROM receipts WHERE id = $1', [id]);
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
