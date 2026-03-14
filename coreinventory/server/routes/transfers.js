const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/transfers
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, lf.name AS from_location_name, lt.name AS to_location_name,
        wf.name AS from_warehouse_name, wt.name AS to_warehouse_name,
        (SELECT COUNT(*) FROM transfer_lines WHERE transfer_id = t.id) AS lines_count
      FROM transfers t
      LEFT JOIN locations lf ON lf.id = t.from_location_id
      LEFT JOIN locations lt ON lt.id = t.to_location_id
      LEFT JOIN warehouses wf ON wf.id = lf.warehouse_id
      LEFT JOIN warehouses wt ON wt.id = lt.warehouse_id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/transfers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const transferRes = await db.query(`
      SELECT t.*, lf.name AS from_location_name, lt.name AS to_location_name,
        lf.warehouse_id AS from_warehouse_id, lt.warehouse_id AS to_warehouse_id,
        wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
      FROM transfers t
      LEFT JOIN locations lf ON lf.id = t.from_location_id
      LEFT JOIN locations lt ON lt.id = t.to_location_id
      LEFT JOIN warehouses wf ON wf.id = lf.warehouse_id
      LEFT JOIN warehouses wt ON wt.id = lt.warehouse_id
      WHERE t.id = $1
    `, [id]);

    if (transferRes.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });

    const linesRes = await db.query(`
      SELECT tl.*, p.name AS product_name, p.sku, p.uom
      FROM transfer_lines tl
      JOIN products p ON p.id = tl.product_id
      WHERE tl.transfer_id = $1
    `, [id]);

    res.json({ ...transferRes.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transfers
router.post('/', auth, async (req, res) => {
  try {
    const { from_location_id, to_location_id, notes, date, lines } = req.body;

    if (from_location_id === to_location_id) {
      return res.status(400).json({ error: 'Source and destination locations must be different' });
    }

    // Get warehouse short code from from_location
    const whRes = await db.query(
      'SELECT w.short_code FROM warehouses w JOIN locations l ON l.warehouse_id = w.id WHERE l.id = $1',
      [from_location_id]
    );
    const whCode = whRes.rows[0]?.short_code || 'WH';

    const countRes = await db.query('SELECT COUNT(*) FROM transfers');
    const count = parseInt(countRes.rows[0].count) + 1;
    const ref = `${whCode}/TR/${String(count).padStart(4, '0')}`;

    const transferRes = await db.query(
      'INSERT INTO transfers (ref, from_location_id, to_location_id, notes, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ref, from_location_id, to_location_id, notes || null, date || new Date()]
    );

    const transfer = transferRes.rows[0];

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await db.query(
          'INSERT INTO transfer_lines (transfer_id, product_id, qty) VALUES ($1, $2, $3)',
          [transfer.id, line.product_id, line.qty || 0]
        );
      }
    }

    const fullTransfer = await db.query(`
      SELECT t.*, lf.name AS from_location_name, lt.name AS to_location_name,
        lf.warehouse_id AS from_warehouse_id, lt.warehouse_id AS to_warehouse_id,
        wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
      FROM transfers t
      LEFT JOIN locations lf ON lf.id = t.from_location_id
      LEFT JOIN locations lt ON lt.id = t.to_location_id
      LEFT JOIN warehouses wf ON wf.id = lf.warehouse_id
      LEFT JOIN warehouses wt ON wt.id = lt.warehouse_id
      WHERE t.id = $1
    `, [transfer.id]);

    const linesRes = await db.query(`
      SELECT tl.*, p.name AS product_name, p.sku, p.uom
      FROM transfer_lines tl JOIN products p ON p.id = tl.product_id
      WHERE tl.transfer_id = $1
    `, [transfer.id]);

    res.status(201).json({ ...fullTransfer.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/transfers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { from_location_id, to_location_id, notes, date, lines } = req.body;

    const check = await db.query('SELECT status FROM transfers WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only edit draft transfers' });

    if (from_location_id === to_location_id) {
      return res.status(400).json({ error: 'Source and destination locations must be different' });
    }

    await db.query(
      'UPDATE transfers SET from_location_id=$1, to_location_id=$2, notes=$3, date=$4 WHERE id=$5',
      [from_location_id, to_location_id, notes || null, date, id]
    );

    await db.query('DELETE FROM transfer_lines WHERE transfer_id = $1', [id]);

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await db.query(
          'INSERT INTO transfer_lines (transfer_id, product_id, qty) VALUES ($1, $2, $3)',
          [id, line.product_id, line.qty || 0]
        );
      }
    }

    const fullTransfer = await db.query(`
      SELECT t.*, lf.name AS from_location_name, lt.name AS to_location_name,
        lf.warehouse_id AS from_warehouse_id, lt.warehouse_id AS to_warehouse_id,
        wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
      FROM transfers t
      LEFT JOIN locations lf ON lf.id = t.from_location_id
      LEFT JOIN locations lt ON lt.id = t.to_location_id
      LEFT JOIN warehouses wf ON wf.id = lf.warehouse_id
      LEFT JOIN warehouses wt ON wt.id = lt.warehouse_id
      WHERE t.id = $1
    `, [id]);

    const linesRes = await db.query(`
      SELECT tl.*, p.name AS product_name, p.sku, p.uom
      FROM transfer_lines tl JOIN products p ON p.id = tl.product_id
      WHERE tl.transfer_id = $1
    `, [id]);

    res.json({ ...fullTransfer.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transfers/:id/validate
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM transfers WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });
    const transfer = check.rows[0];
    if (transfer.status !== 'draft') return res.status(400).json({ error: 'Transfer must be in Draft status' });

    const linesRes = await db.query(`
      SELECT tl.*, p.name AS product_name
      FROM transfer_lines tl JOIN products p ON p.id = tl.product_id
      WHERE tl.transfer_id = $1
    `, [id]);

    // Check stock
    for (const line of linesRes.rows) {
      const stockRes = await db.query(
        'SELECT COALESCE(qty, 0) AS qty FROM stock WHERE product_id = $1 AND location_id = $2',
        [line.product_id, transfer.from_location_id]
      );
      const available = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].qty) : 0;
      if (available < parseFloat(line.qty)) {
        return res.status(400).json({
          error: `Insufficient stock for ${line.product_name}. Available: ${available}, Required: ${line.qty}`
        });
      }
    }

    const fromLocRes = await db.query('SELECT name FROM locations WHERE id = $1', [transfer.from_location_id]);
    const toLocRes = await db.query('SELECT name FROM locations WHERE id = $1', [transfer.to_location_id]);
    const fromLocName = fromLocRes.rows[0]?.name || '';
    const toLocName = toLocRes.rows[0]?.name || '';

    for (const line of linesRes.rows) {
      // Reduce from source
      await db.query(
        'UPDATE stock SET qty = qty - $1 WHERE product_id = $2 AND location_id = $3',
        [line.qty, line.product_id, transfer.from_location_id]
      );

      // Add to destination
      await db.query(
        `INSERT INTO stock (product_id, location_id, qty) VALUES ($1, $2, $3)
         ON CONFLICT (product_id, location_id) DO UPDATE SET qty = stock.qty + EXCLUDED.qty`,
        [line.product_id, transfer.to_location_id, line.qty]
      );

      // Insert move history
      await db.query(
        `INSERT INTO move_history (ref, type, product_id, product_name, from_location_id, from_location_name, to_location_id, to_location_name, qty)
         VALUES ($1, 'transfer', $2, $3, $4, $5, $6, $7, $8)`,
        [transfer.ref, line.product_id, line.product_name, transfer.from_location_id, fromLocName, transfer.to_location_id, toLocName, line.qty]
      );
    }

    await db.query('UPDATE transfers SET status = $1 WHERE id = $2', ['done', id]);

    const result = await db.query(`
      SELECT t.*, lf.name AS from_location_name, lt.name AS to_location_name,
        lf.warehouse_id AS from_warehouse_id, lt.warehouse_id AS to_warehouse_id,
        wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
      FROM transfers t
      LEFT JOIN locations lf ON lf.id = t.from_location_id
      LEFT JOIN locations lt ON lt.id = t.to_location_id
      LEFT JOIN warehouses wf ON wf.id = lf.warehouse_id
      LEFT JOIN warehouses wt ON wt.id = lt.warehouse_id
      WHERE t.id = $1
    `, [id]);

    const finalLines = await db.query(`
      SELECT tl.*, p.name AS product_name, p.sku, p.uom
      FROM transfer_lines tl JOIN products p ON p.id = tl.product_id
      WHERE tl.transfer_id = $1
    `, [id]);

    res.json({ ...result.rows[0], lines: finalLines.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/transfers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM transfers WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Transfer not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only delete draft transfers' });
    await db.query('DELETE FROM transfers WHERE id = $1', [id]);
    res.json({ message: 'Transfer deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
