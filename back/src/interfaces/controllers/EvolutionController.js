const evolutionRepository = require('../../infrastructure/repositories/EvolutionRepository');

const listByPatient = (req, res) => {
  res.json(evolutionRepository.findByPatient(req.params.patientId));
};

const create = (req, res) => {
  if (!req.body.patientId || !req.body.proc || !req.body.data) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }
  res.json(evolutionRepository.create(req.body));
};

const update = (req, res) => {
  if (!req.body.proc || !req.body.data) return res.status(400).json({ error: 'proc e data são obrigatórios' });
  res.json(evolutionRepository.update(req.params.id, req.body));
};

const remove = (req, res) => {
  evolutionRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { listByPatient, create, update, remove };
