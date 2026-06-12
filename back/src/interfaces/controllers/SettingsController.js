const settingsRepository = require('../../infrastructure/repositories/SettingsRepository');
const { hashPw, verifyPw } = require('../../infrastructure/database/schema');

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
  if (!row || !verifyPw(req.body.current, row.value)) return res.status(401).json({ error: 'Senha atual incorreta' });
  settingsRepository.upsert('password', hashPw(req.body.next));
  res.json({ ok: true });
};

const getNotes = (req, res) => {
  const row = settingsRepository.findByKey('dashboard_notes');
  res.json({ notes: row?.value ?? '' });
};

const updateNotes = (req, res) => {
  settingsRepository.upsert('dashboard_notes', req.body.notes ?? '');
  res.json({ ok: true });
};

module.exports = { show, update, updatePassword, getNotes, updateNotes };
