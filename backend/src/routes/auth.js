const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username?.trim() || !password) {
    return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'Le nom doit contenir au moins 3 caractères' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username.trim(), hash]
    );

    const user = result.rows[0];
    res.status(201).json({ user, token: generateToken(user) });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
    }
    console.error('register error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username?.trim() || !password) {
    return res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis" });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, created_at FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
    }

    const { password_hash, ...user } = row;
    res.json({ user, token: generateToken(user) });
  } catch (e) {
    console.error('login error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ user: result.rows[0] });
  } catch (e) {
    console.error('me error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
