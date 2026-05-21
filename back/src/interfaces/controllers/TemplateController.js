const templateRepository = require('../../infrastructure/repositories/TemplateRepository');

const list = (req, res) => {
  res.json(templateRepository.findAll());
};

const create = (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'Nome obrigatório' });
  res.json(templateRepository.create(req.body));
};

const remove = (req, res) => {
  templateRepository.remove(req.params.id);
  res.json({ ok: true });
};

module.exports = { list, create, remove };
