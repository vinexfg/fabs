const router = require('express').Router();
const { db } = require('../db');
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM templates ORDER BY name').all());
});

router.post('/', (req, res) => {
  const { name, valor, obs } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });
  const id = randomUUID();
  db.prepare('INSERT INTO templates (id, name, valor, obs) VALUES (?, ?, ?, ?)').run(id, name, valor || 0, obs);
  res.json(db.prepare('SELECT * FROM templates WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
