const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findAll = () =>
  db.prepare('SELECT * FROM templates ORDER BY name').all();

const findById = (id) =>
  db.prepare('SELECT * FROM templates WHERE id = ?').get(id);

const create = ({ name, valor, obs }) => {
  const id = randomUUID();
  db.prepare('INSERT INTO templates (id, name, valor, obs) VALUES (?, ?, ?, ?)').run(id, name, valor || 0, obs);
  return findById(id);
};

const remove = (id) =>
  db.prepare('DELETE FROM templates WHERE id = ?').run(id);

module.exports = { findAll, findById, create, remove };
