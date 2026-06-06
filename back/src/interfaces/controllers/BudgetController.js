const budgetRepository = require('../../infrastructure/repositories/BudgetRepository');

const listByPatient = (req, res) => {
  res.json(budgetRepository.findByPatient(req.params.patientId));
};

const create = (req, res) => {
  if (!req.body.patientId) return res.status(400).json({ error: 'patientId é obrigatório' });
  res.json(budgetRepository.create(req.body));
};

const update = (req, res) => {
  res.json(budgetRepository.update(req.params.id, req.body));
};

const updateStatus = (req, res) => {
  if (!req.body.status) return res.status(400).json({ error: 'status é obrigatório' });
  res.json(budgetRepository.updateStatus(req.params.id, req.body.status));
};

const remove = (req, res) => {
  budgetRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { listByPatient, create, update, updateStatus, remove };
