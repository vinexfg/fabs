const jwtService = require('../../infrastructure/auth/JwtService');
const settingsRepository = require('../../infrastructure/repositories/SettingsRepository');
const { hashPw, verifyPw } = require('../../infrastructure/database/schema');

const login = (req, res) => {
  if (!req.body.password) return res.status(400).json({ error: 'Senha obrigatória' });
  const row = settingsRepository.findByKey('password');
  if (!row || !verifyPw(req.body.password, row.value)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }
  // Auto-upgrade: se ainda era SHA-256, re-salva como bcrypt
  if (!row.value.startsWith('$2')) {
    settingsRepository.upsert('password', hashPw(req.body.password));
  }
  const token = jwtService.sign({ role: 'admin' });
  res.json({ token });
};

module.exports = { login };
