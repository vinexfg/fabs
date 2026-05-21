const treatmentRepository = require('../../infrastructure/repositories/TreatmentRepository');

const listByPatient = (req, res) => {
  res.json(treatmentRepository.findByPatient(req.params.patientId));
};

const create = (req, res) => {
  if (!req.body.patientId || !req.body.proc) return res.status(400).json({ error: 'patientId e proc são obrigatórios' });
  res.json(treatmentRepository.create(req.body));
};

const updateStatus = (req, res) => {
  res.json(treatmentRepository.updateStatus(req.params.id, req.body.status));
};

const remove = (req, res) => {
  treatmentRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { listByPatient, create, updateStatus, remove };
