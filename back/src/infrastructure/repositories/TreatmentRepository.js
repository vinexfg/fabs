const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findByPatient = (patientId) =>
  db.prepare('SELECT * FROM treatments WHERE patientId = ? ORDER BY criadoEm').all(patientId);

const findById = (id) =>
  db.prepare('SELECT * FROM treatments WHERE id = ?').get(id);

const create = ({ patientId, proc, dente, valor, status, obs }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO treatments (id, patientId, proc, dente, valor, status, obs) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, proc, dente, valor || 0, status || 'pendente', obs);
  return findById(id);
};

const updateStatus = (id, status) => {
  db.prepare('UPDATE treatments SET status = ? WHERE id = ?').run(status, id);
  return findById(id);
};

const remove = (id) =>
  db.prepare('DELETE FROM treatments WHERE id = ?').run(id);

module.exports = { findByPatient, findById, create, updateStatus, remove };
