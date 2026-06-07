const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findAll = () =>
  db.prepare('SELECT * FROM patients ORDER BY nome').all();

const findPaginated = ({ q = '', page = 1, limit = 15 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const like = `%${q}%`;
  const where = q
    ? 'WHERE nome LIKE ? OR telefone LIKE ? OR cpf LIKE ? OR convenio LIKE ?'
    : '';
  const params = q ? [like, like, like, like] : [];
  const rows  = db.prepare(`SELECT * FROM patients ${where} ORDER BY nome LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);
  const { total } = db.prepare(`SELECT COUNT(*) as total FROM patients ${where}`).get(...params);
  return { patients: rows, total, page: Number(page), limit: Number(limit) };
};

const findById = (id) =>
  db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

const create = ({ nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto, anamnese }) => {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO patients (id, nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto, anamnese)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto || null, anamnese || null);
  return findById(id);
};

const update = (id, { nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto, anamnese }) => {
  db.prepare(`
    UPDATE patients SET nome=?, dataNascimento=?, cpf=?, telefone=?, email=?, endereco=?, convenio=?, alergias=?, medicamentos=?, conds=?, queixa=?, foto=?, anamnese=?
    WHERE id=?
  `).run(nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto || null, anamnese || null, id);
  return findById(id);
};

const remove = (id) => {
  db.prepare('DELETE FROM evolutions WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM payments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM treatments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM appointments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM odontograma WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM budgets WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM patients WHERE id = ?').run(id);
};

module.exports = { findAll, findPaginated, findById, create, update, remove };
