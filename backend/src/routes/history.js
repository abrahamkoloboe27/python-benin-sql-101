const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/history ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  try {
    const result = await pool.query(
      `SELECT id, query, executed_at, rows_returned, has_error
       FROM query_history
       WHERE user_id = $1
       ORDER BY executed_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ history: result.rows });
  } catch (e) {
    console.error('history get error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/history ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { query, rows_returned, has_error } = req.body ?? {};
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Requête vide' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO query_history (user_id, query, rows_returned, has_error)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.user.id, query.trim(), rows_returned ?? 0, has_error ? true : false]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (e) {
    console.error('history post error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/history  (clear all for user) ────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM query_history WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('history delete error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/history/:id  (single entry) ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalide' });

  try {
    const result = await pool.query(
      'DELETE FROM query_history WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Entrée introuvable' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('history delete entry error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
