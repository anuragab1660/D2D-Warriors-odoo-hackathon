const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/deliveries
router.get('/', auth, async (req, res) => {
  try {
    const { status, warehouse_id } = req.query;
    let conditions = [];
    let params = [];
    let paramIdx = 1;

    if (status) { conditions.push(`d.status = $${paramIdx++}`); params.push(status); }
    if (warehouse_id) { conditions.push(`w.id = $${paramIdx++}`); params.push(warehouse_id); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT d.*, l.name AS location_name, w.name AS warehouse_name, w.short_code AS warehouse_short_code,
        (SELECT COUNT(*) FROM delivery_lines WHERE delivery_id = d.id) AS lines_count
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      ${where}
      ORDER BY d.created_at DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/deliveries/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryRes = await db.query(`
      SELECT d.*, l.name AS location_name, l.warehouse_id,
        w.name AS warehouse_name, w.short_code AS warehouse_short_code
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [id]);

    if (deliveryRes.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });

    const delivery = deliveryRes.rows[0];

    const linesRes = await db.query(`
      SELECT dl.*, p.name AS product_name, p.sku, p.uom,
        COALESCE((SELECT s.qty FROM stock s WHERE s.product_id = dl.product_id AND s.location_id = $2), 0) AS current_stock
      FROM delivery_lines dl
      JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [id, delivery.location_id]);

    res.json({ ...delivery, lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deliveries
router.post('/', auth, async (req, res) => {
  try {
    const { destination, city, location_id, responsible, destination_type, notes, date, schedule_date, lines } = req.body;

    // Get warehouse short code
    const whRes = await db.query(
      'SELECT w.short_code FROM warehouses w JOIN locations l ON l.warehouse_id = w.id WHERE l.id = $1',
      [location_id]
    );
    const whCode = whRes.rows[0]?.short_code || 'WH';

    // Generate ref
    const countRes = await db.query('SELECT COUNT(*) FROM deliveries');
    const count = parseInt(countRes.rows[0].count) + 1;
    const ref = `${whCode}/OUT/${String(count).padStart(4, '0')}`;

    const deliveryRes = await db.query(
      `INSERT INTO deliveries (ref, destination, city, location_id, responsible, destination_type, notes, date, schedule_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [ref, destination || null, city || null, location_id, responsible || null, destination_type || 'customer', notes || null, date || new Date(), schedule_date || null]
    );

    const delivery = deliveryRes.rows[0];

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await db.query(
          'INSERT INTO delivery_lines (delivery_id, product_id, qty_demanded, qty_done) VALUES ($1, $2, $3, 0)',
          [delivery.id, line.product_id, line.qty_demanded || 0]
        );
      }
    }

    const fullDelivery = await db.query(`
      SELECT d.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [delivery.id]);

    const linesRes = await db.query(`
      SELECT dl.*, p.name AS product_name, p.sku, p.uom
      FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [delivery.id]);

    res.status(201).json({ ...fullDelivery.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/deliveries/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { destination, city, location_id, responsible, destination_type, notes, date, schedule_date, lines } = req.body;

    const check = await db.query('SELECT status FROM deliveries WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    if (!['draft', 'waiting'].includes(check.rows[0].status)) {
      return res.status(400).json({ error: 'Can only edit draft or waiting deliveries' });
    }

    await db.query(
      `UPDATE deliveries SET destination=$1, city=$2, location_id=$3, responsible=$4, destination_type=$5, notes=$6, date=$7, schedule_date=$8 WHERE id=$9`,
      [destination || null, city || null, location_id, responsible || null, destination_type || 'customer', notes || null, date, schedule_date || null, id]
    );

    await db.query('DELETE FROM delivery_lines WHERE delivery_id = $1', [id]);

    if (lines && lines.length > 0) {
      for (const line of lines) {
        await db.query(
          'INSERT INTO delivery_lines (delivery_id, product_id, qty_demanded, qty_done) VALUES ($1, $2, $3, 0)',
          [id, line.product_id, line.qty_demanded || 0]
        );
      }
    }

    const fullDelivery = await db.query(`
      SELECT d.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [id]);

    const linesRes = await db.query(`
      SELECT dl.*, p.name AS product_name, p.sku, p.uom,
        COALESCE((SELECT s.qty FROM stock s WHERE s.product_id = dl.product_id AND s.location_id = $2), 0) AS current_stock
      FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [id, location_id]);

    res.json({ ...fullDelivery.rows[0], lines: linesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deliveries/:id/todo — Draft/Waiting → Ready or Waiting
router.post('/:id/todo', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    const delivery = check.rows[0];
    if (!['draft', 'waiting'].includes(delivery.status)) {
      return res.status(400).json({ error: 'Delivery must be in Draft or Waiting status' });
    }

    const linesRes = await db.query('SELECT * FROM delivery_lines WHERE delivery_id = $1', [id]);
    const shortages = [];

    for (const line of linesRes.rows) {
      const stockRes = await db.query(
        'SELECT COALESCE(SUM(qty), 0) AS qty FROM stock WHERE product_id = $1',
        [line.product_id]
      );
      const available = parseFloat(stockRes.rows[0].qty);
      if (available < parseFloat(line.qty_demanded)) {
        const prodRes = await db.query('SELECT name FROM products WHERE id = $1', [line.product_id]);
        shortages.push({ product: prodRes.rows[0]?.name, available, demanded: parseFloat(line.qty_demanded) });
      }
    }

    if (shortages.length > 0) {
      await db.query('UPDATE deliveries SET status = $1 WHERE id = $2', ['waiting', id]);
      return res.json({ status: 'waiting', shortages });
    }

    await db.query('UPDATE deliveries SET status = $1 WHERE id = $2', ['ready', id]);

    const result = await db.query(`
      SELECT d.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [id]);

    const finalLines = await db.query(`
      SELECT dl.*, p.name AS product_name, p.sku, p.uom,
        COALESCE((SELECT s.qty FROM stock s WHERE s.product_id = dl.product_id AND s.location_id = $2), 0) AS current_stock
      FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [id, delivery.location_id]);

    res.json({ ...result.rows[0], lines: finalLines.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deliveries/:id/validate — Ready → Done
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    const delivery = check.rows[0];
    if (delivery.status !== 'ready') return res.status(400).json({ error: 'Delivery must be in Ready status to validate' });

    const linesRes = await db.query(`
      SELECT dl.*, p.name AS product_name
      FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [id]);

    const locRes = await db.query('SELECT name FROM locations WHERE id = $1', [delivery.location_id]);
    const locationName = locRes.rows[0]?.name || '';

    const alertLines = [];

    for (const line of linesRes.rows) {
      const stockRes = await db.query(
        'SELECT COALESCE(qty, 0) AS qty FROM stock WHERE product_id = $1 AND location_id = $2',
        [line.product_id, delivery.location_id]
      );
      const available = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].qty) : 0;

      if (available < parseFloat(line.qty_demanded)) {
        alertLines.push({ ...line, alert_stock: true, available });
      } else {
        // Reduce stock
        await db.query(
          'UPDATE stock SET qty = qty - $1 WHERE product_id = $2 AND location_id = $3',
          [line.qty_demanded, line.product_id, delivery.location_id]
        );
      }

      // Update qty_done
      await db.query('UPDATE delivery_lines SET qty_done = $1 WHERE id = $2', [line.qty_demanded, line.id]);

      // Insert move history
      await db.query(
        `INSERT INTO move_history (ref, type, product_id, product_name, from_location_id, from_location_name, qty)
         VALUES ($1, 'delivery', $2, $3, $4, $5, $6)`,
        [delivery.ref, line.product_id, line.product_name, delivery.location_id, locationName, line.qty_demanded]
      );
    }

    await db.query('UPDATE deliveries SET status = $1 WHERE id = $2', ['done', id]);

    const result = await db.query(`
      SELECT d.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [id]);

    const finalLines = await db.query(`
      SELECT dl.*, p.name AS product_name, p.sku, p.uom
      FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [id]);

    res.json({ ...result.rows[0], lines: finalLines.rows, alert_lines: alertLines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deliveries/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM deliveries WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    if (!['draft', 'waiting', 'ready'].includes(check.rows[0].status)) {
      return res.status(400).json({ error: 'Cannot cancel this delivery' });
    }
    await db.query('UPDATE deliveries SET status = $1 WHERE id = $2', ['cancelled', id]);
    const result = await db.query(`
      SELECT d.*, l.name AS location_name, w.name AS warehouse_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/deliveries/:id/status — Force set status (bypasses stock checks)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = ['draft', 'waiting', 'ready', 'done', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const check = await db.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    const delivery = check.rows[0];

    if (['done', 'cancelled'].includes(delivery.status)) {
      return res.status(400).json({ error: 'Cannot change status of a done or cancelled delivery' });
    }

    if (newStatus === 'done') {
      const linesRes = await db.query(`
        SELECT dl.*, p.name AS product_name
        FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
        WHERE dl.delivery_id = $1
      `, [id]);

      const locRes = await db.query('SELECT name FROM locations WHERE id = $1', [delivery.location_id]);
      const locationName = locRes.rows[0]?.name || '';

      for (const line of linesRes.rows) {
        const stockRes = await db.query(
          'SELECT COALESCE(qty, 0) AS qty FROM stock WHERE product_id = $1 AND location_id = $2',
          [line.product_id, delivery.location_id]
        );
        const available = stockRes.rows.length > 0 ? parseFloat(stockRes.rows[0].qty) : 0;
        if (available > 0) {
          const deduct = Math.min(available, parseFloat(line.qty_demanded));
          await db.query(
            'UPDATE stock SET qty = qty - $1 WHERE product_id = $2 AND location_id = $3',
            [deduct, line.product_id, delivery.location_id]
          );
        }
        await db.query('UPDATE delivery_lines SET qty_done = $1 WHERE id = $2', [line.qty_demanded, line.id]);
        await db.query(
          `INSERT INTO move_history (ref, type, product_id, product_name, from_location_id, from_location_name, qty)
           VALUES ($1, 'delivery', $2, $3, $4, $5, $6)`,
          [delivery.ref, line.product_id, line.product_name, delivery.location_id, locationName, line.qty_demanded]
        );
      }
    }

    await db.query('UPDATE deliveries SET status = $1 WHERE id = $2', [newStatus, id]);

    const result = await db.query(`
      SELECT d.*, l.name AS location_name, l.warehouse_id, w.name AS warehouse_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      WHERE d.id = $1
    `, [id]);

    const finalLines = await db.query(`
      SELECT dl.*, p.name AS product_name, p.sku, p.uom,
        COALESCE((SELECT s.qty FROM stock s WHERE s.product_id = dl.product_id AND s.location_id = $2), 0) AS current_stock
      FROM delivery_lines dl JOIN products p ON p.id = dl.product_id
      WHERE dl.delivery_id = $1
    `, [id, delivery.location_id]);

    res.json({ ...result.rows[0], lines: finalLines.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/deliveries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM deliveries WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Delivery not found' });
    if (check.rows[0].status !== 'draft') return res.status(400).json({ error: 'Can only delete draft deliveries' });
    await db.query('DELETE FROM deliveries WHERE id = $1', [id]);
    res.json({ message: 'Delivery deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
