const { randomUUID } = require('crypto');
const { db } = require('../database/connection');

const findAll = () =>
  db.prepare('SELECT * FROM patients ORDER BY nome').all();

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
  db.prepare('DELETE FROM budgets WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM patients WHERE id = ?').run(id);
};

module.exports = { findAll, findById, create, update, remove };
