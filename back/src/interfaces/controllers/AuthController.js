const jwtService = require('../../infrastructure/auth/JwtService');
const settingsRepository = require('../../infrastructure/repositories/SettingsRepository');
const { hashPw } = require('../../infrastructure/database/schema');

const login = (req, res) => {
  if (!req.body.password) return res.status(400).json({ error: 'Senha obrigatória' });
  const row = settingsRepository.findByKey('password');
  if (!row || row.value !== hashPw(req.body.password)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }
  const token = jwtService.sign({ role: 'admin' });
  res.json({ token });
};

module.exports = { login };
