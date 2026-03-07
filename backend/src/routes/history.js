const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ── GET /api/history ─────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const rows = db
    .prepare(
      `SELECT id, query, executed_at, rows_returned, has_error
       FROM query_history
       WHERE user_id = ?
       ORDER BY executed_at DESC
       LIMIT ?`
    )
    .all(req.user.id, limit);
  res.json({ history: rows });
});

// ── POST /api/history ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { query, rows_returned, has_error } = req.body ?? {};
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Requête vide' });
  }
  const result = db
    .prepare(
      `INSERT INTO query_history (user_id, query, rows_returned, has_error)
       VALUES (?, ?, ?, ?)`
    )
    .run(req.user.id, query.trim(), rows_returned ?? 0, has_error ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid });
});

// ── DELETE /api/history  (clear all for user) ────────────────────────────────
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM query_history WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// ── DELETE /api/history/:id  (single entry) ──────────────────────────────────
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID invalide' });

  const result = db
    .prepare('DELETE FROM query_history WHERE id = ? AND user_id = ?')
    .run(id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Entrée introuvable' });
  }
  res.json({ ok: true });
});

module.exports = router;
