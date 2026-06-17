import { Router } from 'express';
import c from '../controllers/SearchController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/', wrap((req, res) => c.search(req, res)));

export default router;
