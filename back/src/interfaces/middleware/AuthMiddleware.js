const jwtService = require('../../infrastructure/auth/JwtService');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    req.user = jwtService.verify(token);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada, faça login novamente' });
  }
};

module.exports = { authenticate };
