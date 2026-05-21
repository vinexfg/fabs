const router = require('express').Router();
const db = require('../db').db;
const { randomUUID } = require('crypto');

router.get('/patient/:patientId', (req, res) => {
  res.json(db.prepare('SELECT * FROM treatments WHERE patientId = ? ORDER BY criadoEm').all(req.params.patientId));
});

router.post('/', (req, res) => {
  const { patientId, proc, dente, valor, status, obs } = req.body;
  if (!patientId || !proc) return res.status(400).json({ error: 'patientId e proc sÃ£o obrigatÃ³rios' });
  const id = randomUUID();
  db.prepare('INSERT INTO treatments (id, patientId, proc, dente, valor, status, obs) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, proc, dente, valor || 0, status || 'pendente', obs);
  res.json(db.prepare('SELECT * FROM treatments WHERE id = ?').get(id));
});

router.patch('/:id/status', (req, res) => {
  db.prepare('UPDATE treatments SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json(db.prepare('SELECT * FROM treatments WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM treatments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

