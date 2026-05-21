const router = require('express').Router();
const db = require('../db').db;
const { randomUUID } = require('crypto');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM patients ORDER BY nome').all());
});

router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'NÃ£o encontrado' });
  res.json(p);
});

router.post('/', (req, res) => {
  const { nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  const id = randomUUID();
  db.prepare(`
    INSERT INTO patients (id, nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto || null);
  res.json(db.prepare('SELECT * FROM patients WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const { nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  db.prepare(`
    UPDATE patients SET nome=?, dataNascimento=?, cpf=?, telefone=?, email=?, endereco=?, convenio=?, alergias=?, medicamentos=?, conds=?, queixa=?, foto=?
    WHERE id=?
  `).run(nome, dataNascimento, cpf, telefone, email, endereco, convenio, alergias, medicamentos, conds, queixa, foto || null, req.params.id);
  res.json(db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM evolutions WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM payments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM treatments WHERE patientId = ?').run(id);
  db.prepare('DELETE FROM patients WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;

