const settingsRepository = require('../../infrastructure/repositories/SettingsRepository');
const { hashPw } = require('../../infrastructure/database/schema');

const show = (req, res) => {
  res.json(settingsRepository.findPublic());
};

const update = (req, res) => {
  settingsRepository.upsertPublicFields(req.body);
  res.json({ ok: true });
};

const updatePassword = (req, res) => {
  if (!req.body.current || !req.body.next) return res.status(400).json({ error: 'Campos obrigatórios' });
  const row = settingsRepository.findByKey('password');
  if (row?.value !== hashPw(req.body.current)) return res.status(401).json({ error: 'Senha atual incorreta' });
  settingsRepository.upsert('password', hashPw(req.body.next));
  res.json({ ok: true });
};

module.exports = { show, update, updatePassword };
