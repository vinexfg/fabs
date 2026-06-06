const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/AuthController');
const { wrap } = require('../middleware/wrap');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, wrap((req, res) => authController.login(req, res)));

module.exports = router;
