const router = require('express').Router();
const { db } = require('../../infrastructure/database/connection');
const { wrap } = require('../middleware/wrap');

router.get('/', wrap((req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ patients: [], evolutions: [], appointments: [] });

  const like = `%${q}%`;

  const patients = db.prepare(`
    SELECT id, nome, telefone, cpf, convenio
    FROM patients
    WHERE nome LIKE ? OR telefone LIKE ? OR cpf LIKE ?
    ORDER BY nome LIMIT 5
  `).all(like, like, like);

  const evolutions = db.prepare(`
    SELECT e.id, e.proc, e.data, e.notas, e.patientId, p.nome as patientNome
    FROM evolutions e
    JOIN patients p ON p.id = e.patientId
    WHERE e.proc LIKE ? OR e.notas LIKE ?
    ORDER BY e.data DESC LIMIT 5
  `).all(like, like);

  const appointments = db.prepare(`
    SELECT a.id, a.date, a.time, a.type, a.status, a.patientId, p.nome as patientNome
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE p.nome LIKE ? OR a.type LIKE ? OR a.notes LIKE ?
    ORDER BY a.date DESC LIMIT 5
  `).all(like, like, like);

  res.json({ patients, evolutions, appointments });
}));

module.exports = router;
