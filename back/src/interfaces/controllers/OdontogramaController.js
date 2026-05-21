const odontogramaRepository = require('../../infrastructure/repositories/OdontogramaRepository');

const listByPatient = (req, res) => {
  res.json(odontogramaRepository.findByPatient(req.params.patientId));
};

const upsert = (req, res) => {
  if (!req.body.tooth) return res.status(400).json({ error: 'tooth é obrigatório' });
  const existing = odontogramaRepository.findByPatientAndTooth(req.params.patientId, req.body.tooth);
  if (existing) return res.json(odontogramaRepository.updateTooth(existing.id, req.body));
  res.json(odontogramaRepository.createTooth(req.params.patientId, req.body));
};

module.exports = { listByPatient, upsert };
