require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

if (!process.env.JWT_SECRET) {
  console.error('❌  JWT_SECRET est manquant — copiez .env.example en .env et remplissez les valeurs.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    FRONTEND_URL,
    'https://abrahamkoloboe27.github.io',
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '64kb' }));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 auth attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

const historyLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 120,                  // max 120 history requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans un instant.' },
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use('/api/auth',    authLimiter,    require('./routes/auth'));
app.use('/api/history', historyLimiter, require('./routes/history'));

// ── Error handlers ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Backend SQL 101 — http://localhost:${PORT}`);
  console.log(`    CORS autorisé pour : ${FRONTEND_URL}`);
});
