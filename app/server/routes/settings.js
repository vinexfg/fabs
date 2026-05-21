const router = require('express').Router();
const { db, hashPw } = require('../db');

const PUBLIC_KEYS = ['clinicName', 'doctorName', 'cro', 'clinicAddress', 'clinicPhone'];

router.get('/', (req, res) => {
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_KEYS.map(() => '?').join(',')})`)
    .all(...PUBLIC_KEYS);
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  res.json(obj);
});

router.put('/', (req, res) => {
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  PUBLIC_KEYS.forEach(k => { if (req.body[k] !== undefined) update.run(k, req.body[k]); });
  res.json({ ok: true });
});

router.put('/password', (req, res) => {
  const { current, next: newPw } = req.body;
  if (!current || !newPw) return res.status(400).json({ error: 'Campos obrigatórios' });

  const row = db.prepare("SELECT value FROM settings WHERE key = 'password'").get();
  if (row?.value !== hashPw(current)) return res.status(401).json({ error: 'Senha atual incorreta' });

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('password', ?)").run(hashPw(newPw));
  res.json({ ok: true });
});

module.exports = router;
