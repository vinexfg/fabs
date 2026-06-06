const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findByPatient = (patientId) =>
  db.prepare('SELECT * FROM budgets WHERE patientId = ? ORDER BY criadoEm DESC').all(patientId)
    .map(r => ({ ...r, items: JSON.parse(r.items || '[]') }));

const findById = (id) => {
  const r = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  if (!r) return null;
  return { ...r, items: JSON.parse(r.items || '[]') };
};

const create = ({ patientId, items = [], desconto = 0, obs = '', status = 'rascunho' }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO budgets (id, patientId, items, desconto, obs, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, patientId, JSON.stringify(items), desconto, obs, status);
  return findById(id);
};

const update = (id, { items, desconto, obs, status }) => {
  db.prepare('UPDATE budgets SET items=?, desconto=?, obs=?, status=? WHERE id=?')
    .run(JSON.stringify(items || []), desconto ?? 0, obs ?? '', status ?? 'rascunho', id);
  return findById(id);
};

const updateStatus = (id, status) => {
  db.prepare('UPDATE budgets SET status=? WHERE id=?').run(status, id);
  return findById(id);
};

const remove = (id) =>
  db.prepare('DELETE FROM budgets WHERE id = ?').run(id);

module.exports = { findByPatient, findById, create, update, updateStatus, remove };
