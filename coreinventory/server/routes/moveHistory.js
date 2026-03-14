const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { type, product_id, search } = req.query;
    let conditions = [];
    let params = [];
    let paramIdx = 1;

    if (type) { conditions.push(`m.type = $${paramIdx++}`); params.push(type); }
    if (product_id) { conditions.push(`m.product_id = $${paramIdx++}`); params.push(product_id); }
    if (search) {
      conditions.push(`(m.product_name ILIKE $${paramIdx} OR m.ref ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT m.*
      FROM move_history m
      ${where}
      ORDER BY m.date DESC
      LIMIT 500
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
