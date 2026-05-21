const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findByDate = (date) =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date = ?
    ORDER BY a.time
  `).all(date);

const findByMonth = (month) =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date LIKE ?
    ORDER BY a.date, a.time
  `).all(`${month}%`);

const findAll = () =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    ORDER BY a.date DESC, a.time
  `).all();

const findTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];
  return db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a
    JOIN patients p ON p.id = a.patientId
    WHERE a.date = ? AND a.status = 'agendado'
    ORDER BY a.time
  `).all(date);
};

const findByPatient = (patientId) =>
  db.prepare('SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC, time').all(patientId);

const findById = (id) =>
  db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

const findByIdWithPatient = (id) =>
  db.prepare(`
    SELECT a.*, p.nome as patientNome, p.telefone as patientTelefone
    FROM appointments a JOIN patients p ON p.id = a.patientId
    WHERE a.id = ?
  `).get(id);

const create = ({ patientId, date, time, duration, type, status, notes }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO appointments (id, patientId, date, time, duration, type, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, date, time, duration || 60, type || 'Consulta', status || 'agendado', notes);
  return findByIdWithPatient(id);
};

const update = (id, { date, time, duration, type, status, notes }) => {
  db.prepare('UPDATE appointments SET date=?, time=?, duration=?, type=?, status=?, notes=? WHERE id=?')
    .run(date, time, duration, type, status, notes, id);
  return findById(id);
};

const updateStatus = (id, status) => {
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
  return findById(id);
};

const remove = (id) =>
  db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

module.exports = { findByDate, findByMonth, findAll, findTomorrow, findByPatient, findById, create, update, updateStatus, remove };
