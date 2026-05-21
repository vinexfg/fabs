const router = require('express').Router();
const db = require('../db').db;
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  const { date, month } = req.query;
  let rows;
  if (date) {
    rows = db.prepare(`
      SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
      FROM appointments a
      JOIN patients p ON p.id = a.patientId
      WHERE a.date = ?
      ORDER BY a.time
    `).all(date);
  } else if (month) {
    rows = db.prepare(`
      SELECT a.*, p.nome as patientNome
      FROM appointments a
      JOIN patients p ON p.id = a.patientId
      WHERE a.date LIKE ?
      ORDER BY a.date, a.time
    `).all(`${month}%`);
  } else {
    rows = db.prepare(`
      SELECT a.*, p.nome as patientNome
      FROM appointments a
      JOIN patients p ON p.id = a.patientId
      ORDER BY a.date DESC, a.time
    `).all();
  }
  res.json(rows);
});

router.get('/patient/:patientId', (req, res) => {
  res.json(db.prepare('SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC, time').all(req.params.patientId));
});

router.post('/', (req, res) => {
  const { patientId, date, time, duration, type, status, notes } = req.body;
  if (!patientId || !date || !time) return res.status(400).json({ error: 'patientId, date e time sÃ£o obrigatÃ³rios' });
  const id = randomUUID();
  db.prepare('INSERT INTO appointments (id, patientId, date, time, duration, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, date, time, duration || 60, type || 'Consulta', status || 'agendado', notes);
  const row = db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a JOIN patients p ON p.id = a.patientId
    WHERE a.id = ?
  `).get(id);
  res.json(row);
});

router.patch('/:id/status', (req, res) => {
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id));
});

router.put('/:id', (req, res) => {
  const { date, time, duration, type, status, notes } = req.body;
  db.prepare('UPDATE appointments SET date=?, time=?, duration=?, type=?, status=?, notes=? WHERE id=?')
    .run(date, time, duration, type, status, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

