const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { db, hashPw } = require('../db');

const SECRET = process.env.JWT_SECRET || 'df_secret_k9x2024';

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Senha obrigatória' });

  const row = db.prepare("SELECT value FROM settings WHERE key = 'password'").get();
  if (!row || row.value !== hashPw(password)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '30d' });
  res.json({ token });
});

module.exports = router;
