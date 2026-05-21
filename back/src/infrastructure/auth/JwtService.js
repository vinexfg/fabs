const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'df_secret_k9x2024';

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: '30d' });

const verify = (token) => jwt.verify(token, SECRET);

module.exports = { sign, verify };
