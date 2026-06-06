const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findAll = () =>
  db.prepare(`
    SELECT py.*, p.nome as patientNome
    FROM payments py JOIN patients p ON p.id = py.patientId
    ORDER BY py.data DESC
  `).all();

const findByPatient = (patientId) =>
  db.prepare('SELECT * FROM payments WHERE patientId = ? ORDER BY data DESC').all(patientId);

const findById = (id) =>
  db.prepare('SELECT * FROM payments WHERE id = ?').get(id);

const findInadimplencia = () => {
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
  return rows.map((row) => ({ ...row, emAberto: row.totalTrat - row.totalPago }));
};

const create = ({ patientId, descricao, valor, data, forma }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO payments (id, patientId, descricao, valor, data, forma) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, descricao, valor, data, forma);
  return findById(id);
};

const update = (id, { descricao, valor, data, forma }) => {
  db.prepare('UPDATE payments SET descricao=?, valor=?, data=?, forma=? WHERE id=?')
    .run(descricao, valor, data, forma, id);
  return findById(id);
};

const remove = (id) =>
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);

module.exports = { findAll, findByPatient, findById, findInadimplencia, create, update, remove };
