const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const requireManager = require('../middleware/requireManager');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, requireManager, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'Category name already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await db.query('UPDATE categories SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category that has products assigned to it' });
    }
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
