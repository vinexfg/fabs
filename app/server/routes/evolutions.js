const router = require('express').Router();
const db = require('../db').db;
const { randomUUID } = require('crypto');

router.get('/patient/:patientId', (req, res) => {
  res.json(db.prepare('SELECT * FROM evolutions WHERE patientId = ? ORDER BY data DESC, hora DESC').all(req.params.patientId));
});

router.post('/', (req, res) => {
  const { patientId, proc, data, hora, notas, proxConsulta } = req.body;
  if (!patientId || !proc || !data) return res.status(400).json({ error: 'Campos obrigatÃ³rios faltando' });
  const id = randomUUID();
  db.prepare('INSERT INTO evolutions (id, patientId, proc, data, hora, notas, proxConsulta) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, proc, data, hora, notas, proxConsulta);
  res.json(db.prepare('SELECT * FROM evolutions WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM evolutions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

