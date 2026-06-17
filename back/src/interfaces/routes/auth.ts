import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/AuthController';
import { wrap } from '../middleware/wrap';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, wrap((req, res) => authController.login(req, res)));

export default router;
