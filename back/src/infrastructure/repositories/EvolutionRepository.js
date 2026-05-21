const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findByPatient = (patientId) =>
  db.prepare('SELECT * FROM evolutions WHERE patientId = ? ORDER BY data DESC, hora DESC').all(patientId);

const findById = (id) =>
  db.prepare('SELECT * FROM evolutions WHERE id = ?').get(id);

const create = ({ patientId, proc, data, hora, notas, proxConsulta }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO evolutions (id, patientId, proc, data, hora, notas, proxConsulta) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, patientId, proc, data, hora, notas, proxConsulta);
  return findById(id);
};

const remove = (id) =>
  db.prepare('DELETE FROM evolutions WHERE id = ?').run(id);

module.exports = { findByPatient, findById, create, remove };
