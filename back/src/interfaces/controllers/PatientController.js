const patientRepository = require('../../infrastructure/repositories/PatientRepository');

const list = (req, res) => {
  if (req.query.page !== undefined) {
    return res.json(patientRepository.findPaginated({
      q:     req.query.search || '',
      page:  req.query.page  || 1,
      limit: req.query.limit || 15,
    }));
  }
  res.json(patientRepository.findAll());
};

const show = (req, res) => {
  const patient = patientRepository.findById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Não encontrado' });
  res.json(patient);
};

const create = (req, res) => {
  if (!req.body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  res.json(patientRepository.create(req.body));
};

const update = (req, res) => {
  if (!req.body.nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  res.json(patientRepository.update(req.params.id, req.body));
};

const remove = (req, res) => {
  patientRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { list, show, create, update, remove };
