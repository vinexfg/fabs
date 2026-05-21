const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findByPatient = (patientId) =>
  db.prepare('SELECT * FROM odontograma WHERE patientId = ?').all(patientId);

const findById = (id) =>
  db.prepare('SELECT * FROM odontograma WHERE id = ?').get(id);

const findByPatientAndTooth = (patientId, tooth) =>
  db.prepare('SELECT id FROM odontograma WHERE patientId = ? AND tooth = ?').get(patientId, tooth);

const updateTooth = (id, { status, notes }) => {
  db.prepare("UPDATE odontograma SET status=?, notes=?, updatedAt=datetime('now') WHERE id=?")
    .run(status, notes || null, id);
  return findById(id);
};

const createTooth = (patientId, { tooth, status, notes }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO odontograma (id, patientId, tooth, status, notes) VALUES (?, ?, ?, ?, ?)')
    .run(id, patientId, tooth, status, notes || null);
  return findById(id);
};

module.exports = { findByPatient, findByPatientAndTooth, updateTooth, createTooth };
