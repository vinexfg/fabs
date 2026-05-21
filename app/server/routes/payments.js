const router = require('express').Router();
const { db } = require('../db');
const { randomUUID } = require('crypto');

// All payments (for reports)
router.get('/', (req, res) => {
  res.json(db.prepare(`
    SELECT py.*, p.nome as patientNome
    FROM payments py JOIN patients p ON p.id = py.patientId
    ORDER BY py.data DESC
  `).all());
});

router.get('/inadimplencia', (req, res) => {
  const rows = db.prepare(`
    SELECT
      p.id, p.nome, p.telefone, p.convenio,
      COALESCE((SELECT SUM(valor) FROM treatments WHERE patientId = p.id), 0) as totalTrat,
      COALESCE((SELECT SUM(valor) FROM payments   WHERE patientId = p.id), 0) as totalPago
    FROM patients p
    WHERE (
      COALESCE((SELECT SUM(valor) FROM treatments WHERE patientId = p.id), 0) -
      COALESCE((SELECT SUM(valor) FROM payments   WHERE patientId = p.id), 0)
    ) > 0
    ORDER BY (
      COALESCE((SELECT SUM(valor) FROM treatments WHERE patientId = p.id), 0) -
      COALESCE((SELECT SUM(valor) FROM payments   WHERE patientId = p.id), 0)
    ) DESC
  `).all();
  res.json(rows.map(r => ({ ...r, emAberto: r.totalTrat - r.totalPago })));
});

router.get('/patient/:patientId', (req, res) => {
  res.json(db.prepare('SELECT * FROM payments WHERE patientId = ? ORDER BY data DESC').all(req.params.patientId));
});

router.post('/', (req, res) => {
  const { patientId, descricao, valor, data, forma } = req.body;
  if (!patientId || !descricao || !valor) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  const id = randomUUID();
  db.prepare('INSERT INTO payments (id, patientId, descricao, valor, data, forma) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, descricao, valor, data, forma);
  res.json(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
