const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
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
    const result = db
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(username.trim(), hash);

    const user = { id: result.lastInsertRowid, username: username.trim() };
    res.status(201).json({ user, token: generateToken(user) });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
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

  const row = db
    .prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?')
    .get(username.trim());

  if (!row) {
    return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
  }

  const { password_hash, ...user } = row;
  res.json({ user, token: generateToken(user) });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, username, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user });
});

module.exports = router;
