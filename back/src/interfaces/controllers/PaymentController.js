const paymentRepository = require('../../infrastructure/repositories/PaymentRepository');

const list = (req, res) => {
  res.json(paymentRepository.findAll());
};

const listInadimplencia = (req, res) => {
  res.json(paymentRepository.findInadimplencia());
};

const listByPatient = (req, res) => {
  res.json(paymentRepository.findByPatient(req.params.patientId));
};

const create = (req, res) => {
  if (!req.body.patientId || !req.body.descricao || !req.body.valor) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  res.json(paymentRepository.create(req.body));
};

const update = (req, res) => {
  if (!req.body.descricao || !req.body.valor) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  res.json(paymentRepository.update(req.params.id, req.body));
};

const remove = (req, res) => {
  paymentRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { list, listInadimplencia, listByPatient, create, update, remove };
