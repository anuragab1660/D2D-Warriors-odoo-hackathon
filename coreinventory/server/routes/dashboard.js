const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  try {
    // Total products
    const totalProductsRes = await db.query('SELECT COUNT(*) FROM products');
    const totalProducts = parseInt(totalProductsRes.rows[0].count);

    // Low stock count
    const lowStockRes = await db.query(`
      SELECT COUNT(*) FROM products p
      WHERE (SELECT COALESCE(SUM(s.qty), 0) FROM stock s WHERE s.product_id = p.id) <= p.reorder_qty
    `);
    const lowStockCount = parseInt(lowStockRes.rows[0].count);

    // Receipt breakdown
    const receiptBreakdownRes = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE schedule_date < CURRENT_DATE AND status != 'done') AS late,
        COUNT(*) FILTER (WHERE status = 'waiting') AS waiting,
        COUNT(*) FILTER (WHERE schedule_date > CURRENT_DATE AND status != 'done') AS operations,
        COUNT(*) FILTER (WHERE status IN ('draft','waiting','ready')) AS to_receive
      FROM receipts
    `);
    const receiptBreakdown = receiptBreakdownRes.rows[0];
    const pendingReceipts = parseInt(receiptBreakdown.to_receive);

    // Delivery breakdown
    const deliveryBreakdownRes = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE schedule_date < CURRENT_DATE AND status != 'done') AS late,
        COUNT(*) FILTER (WHERE status = 'waiting') AS waiting,
        COUNT(*) FILTER (WHERE schedule_date > CURRENT_DATE AND status != 'done') AS operations,
        COUNT(*) FILTER (WHERE status IN ('draft','waiting','ready')) AS to_deliver
      FROM deliveries
    `);
    const deliveryBreakdown = deliveryBreakdownRes.rows[0];
    const pendingDeliveries = parseInt(deliveryBreakdown.to_deliver);

    // Pending transfers
    const pendingTransfersRes = await db.query(`SELECT COUNT(*) FROM transfers WHERE status = 'draft'`);
    const pendingTransfers = parseInt(pendingTransfersRes.rows[0].count);

    // Today's receipts
    const todayReceiptsRes = await db.query(`
      SELECT r.ref, r.supplier, r.status, r.date, l.name AS location_name
      FROM receipts r
      LEFT JOIN locations l ON l.id = r.location_id
      WHERE r.date = CURRENT_DATE
      ORDER BY r.created_at DESC
    `);

    // Today's deliveries
    const todayDeliveriesRes = await db.query(`
      SELECT d.ref, d.destination, d.status, d.date, l.name AS location_name
      FROM deliveries d
      LEFT JOIN locations l ON l.id = d.location_id
      WHERE d.date = CURRENT_DATE
      ORDER BY d.created_at DESC
    `);

    // Low stock products (top 5 by ratio)
    const lowStockProductsRes = await db.query(`
      SELECT p.id, p.name, p.sku, p.reorder_qty,
        COALESCE(SUM(s.qty), 0) AS on_hand
      FROM products p
      LEFT JOIN stock s ON s.product_id = p.id
      GROUP BY p.id
      HAVING COALESCE(SUM(s.qty), 0) <= p.reorder_qty
      ORDER BY (COALESCE(SUM(s.qty), 0) / NULLIF(p.reorder_qty, 0)) ASC
      LIMIT 5
    `);

    res.json({
      totalProducts,
      lowStockCount,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      receiptBreakdown: {
        late: parseInt(receiptBreakdown.late),
        waiting: parseInt(receiptBreakdown.waiting),
        operations: parseInt(receiptBreakdown.operations),
        toReceive: parseInt(receiptBreakdown.to_receive)
      },
      deliveryBreakdown: {
        late: parseInt(deliveryBreakdown.late),
        waiting: parseInt(deliveryBreakdown.waiting),
        operations: parseInt(deliveryBreakdown.operations),
        toDeliver: parseInt(deliveryBreakdown.to_deliver)
      },
      todayReceipts: todayReceiptsRes.rows,
      todayDeliveries: todayDeliveriesRes.rows,
      lowStockProducts: lowStockProductsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard/filter
router.get('/filter', auth, async (req, res) => {
  try {
    const { doc_type, status, warehouse_id, category_id } = req.query;

    const results = [];

    const buildWhereClause = (conditions) => {
      if (conditions.length === 0) return '';
      return 'WHERE ' + conditions.join(' AND ');
    };

    // Receipts
    if (!doc_type || doc_type === 'receipts') {
      let conditions = [];
      let params = [];
      let paramIdx = 1;

      if (status) { conditions.push(`r.status = $${paramIdx++}`); params.push(status); }
      if (warehouse_id) { conditions.push(`w.id = $${paramIdx++}`); params.push(warehouse_id); }
      if (category_id) {
        conditions.push(`EXISTS (SELECT 1 FROM receipt_lines rl JOIN products p ON p.id = rl.product_id WHERE rl.receipt_id = r.id AND p.category_id = $${paramIdx++})`);
        params.push(category_id);
      }

      const query = `
        SELECT r.id, r.ref, 'receipts' AS doc_type, r.status,
          r.supplier AS party, l.name AS location, w.name AS warehouse, r.date,
          (SELECT COUNT(*) FROM receipt_lines WHERE receipt_id = r.id) AS lines_count
        FROM receipts r
        LEFT JOIN locations l ON l.id = r.location_id
        LEFT JOIN warehouses w ON w.id = l.warehouse_id
        ${buildWhereClause(conditions)}
        ORDER BY r.date DESC LIMIT 100
      `;
      const r = await db.query(query, params);
      results.push(...r.rows);
    }

    // Deliveries
    if (!doc_type || doc_type === 'deliveries') {
      let conditions = [];
      let params = [];
      let paramIdx = 1;

      if (status) { conditions.push(`d.status = $${paramIdx++}`); params.push(status); }
      if (warehouse_id) { conditions.push(`w.id = $${paramIdx++}`); params.push(warehouse_id); }
      if (category_id) {
        conditions.push(`EXISTS (SELECT 1 FROM delivery_lines dl JOIN products p ON p.id = dl.product_id WHERE dl.delivery_id = d.id AND p.category_id = $${paramIdx++})`);
        params.push(category_id);
      }

      const query = `
        SELECT d.id, d.ref, 'deliveries' AS doc_type, d.status,
          d.destination AS party, l.name AS location, w.name AS warehouse, d.date,
          (SELECT COUNT(*) FROM delivery_lines WHERE delivery_id = d.id) AS lines_count
        FROM deliveries d
        LEFT JOIN locations l ON l.id = d.location_id
        LEFT JOIN warehouses w ON w.id = l.warehouse_id
        ${buildWhereClause(conditions)}
        ORDER BY d.date DESC LIMIT 100
      `;
      const r = await db.query(query, params);
      results.push(...r.rows);
    }

    // Transfers
    if (!doc_type || doc_type === 'transfers') {
      let conditions = [];
      let params = [];
      let paramIdx = 1;

      if (status) { conditions.push(`t.status = $${paramIdx++}`); params.push(status); }
      if (warehouse_id) { conditions.push(`(wf.id = $${paramIdx} OR wt.id = $${paramIdx})`); paramIdx++; params.push(warehouse_id); }
      if (category_id) {
        conditions.push(`EXISTS (SELECT 1 FROM transfer_lines tl JOIN products p ON p.id = tl.product_id WHERE tl.transfer_id = t.id AND p.category_id = $${paramIdx++})`);
        params.push(category_id);
      }

      const query = `
        SELECT t.id, t.ref, 'transfers' AS doc_type, t.status,
          lf.name || ' → ' || lt.name AS party,
          lf.name AS location, wf.name AS warehouse, t.date,
          (SELECT COUNT(*) FROM transfer_lines WHERE transfer_id = t.id) AS lines_count
        FROM transfers t
        LEFT JOIN locations lf ON lf.id = t.from_location_id
        LEFT JOIN locations lt ON lt.id = t.to_location_id
        LEFT JOIN warehouses wf ON wf.id = lf.warehouse_id
        LEFT JOIN warehouses wt ON wt.id = lt.warehouse_id
        ${buildWhereClause(conditions)}
        ORDER BY t.date DESC LIMIT 100
      `;
      const r = await db.query(query, params);
      results.push(...r.rows);
    }

    // Adjustments
    if (!doc_type || doc_type === 'adjustments') {
      let conditions = [];
      let params = [];
      let paramIdx = 1;

      if (status) { conditions.push(`a.status = $${paramIdx++}`); params.push(status); }
      if (warehouse_id) { conditions.push(`w.id = $${paramIdx++}`); params.push(warehouse_id); }
      if (category_id) {
        conditions.push(`EXISTS (SELECT 1 FROM adjustment_lines al JOIN products p ON p.id = al.product_id WHERE al.adjustment_id = a.id AND p.category_id = $${paramIdx++})`);
        params.push(category_id);
      }

      const query = `
        SELECT a.id, a.ref, 'adjustments' AS doc_type, a.status,
          l.name AS party, l.name AS location, w.name AS warehouse, a.date,
          (SELECT COUNT(*) FROM adjustment_lines WHERE adjustment_id = a.id) AS lines_count
        FROM adjustments a
        LEFT JOIN locations l ON l.id = a.location_id
        LEFT JOIN warehouses w ON w.id = l.warehouse_id
        ${buildWhereClause(conditions)}
        ORDER BY a.date DESC LIMIT 100
      `;
      const r = await db.query(query, params);
      results.push(...r.rows);
    }

    // Sort all by date desc
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(results.slice(0, 100));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
