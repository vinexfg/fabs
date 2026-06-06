const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET não definido no .env');

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: '8h' });

const verify = (token) => jwt.verify(token, SECRET);

module.exports = { sign, verify };
