import { Router } from 'express';
import controller from '../controllers/ReportController';
import { wrap } from '../middleware/wrap';

const router = Router();
router.get('/', wrap((req, res) => controller.stats(req, res)));
export default router;
