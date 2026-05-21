const router = require('express').Router();
const db = require('../db').db;
const { randomUUID } = require('crypto');

router.get('/:patientId', (req, res) => {
  res.json(db.prepare('SELECT * FROM odontograma WHERE patientId = ?').all(req.params.patientId));
});

router.put('/:patientId', (req, res) => {
  const { tooth, status, notes } = req.body;
  if (!tooth) return res.status(400).json({ error: 'tooth Ã© obrigatÃ³rio' });

  const existing = db.prepare('SELECT id FROM odontograma WHERE patientId = ? AND tooth = ?').get(req.params.patientId, tooth);
  if (existing) {
    db.prepare("UPDATE odontograma SET status=?, notes=?, updatedAt=datetime('now') WHERE id=?")
      .run(status, notes || null, existing.id);
    res.json(db.prepare('SELECT * FROM odontograma WHERE id = ?').get(existing.id));
  } else {
    const id = randomUUID();
    db.prepare('INSERT INTO odontograma (id, patientId, tooth, status, notes) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.params.patientId, tooth, status, notes || null);
    res.json(db.prepare('SELECT * FROM odontograma WHERE id = ?').get(id));
  }
});

module.exports = router;

