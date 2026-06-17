import { Router } from 'express';
import c from '../controllers/TemplateController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/',       wrap((req, res) => c.list(req, res)));
router.post('/',      wrap((req, res) => c.create(req, res)));
router.delete('/:id', wrap((req, res) => c.remove(req, res)));

export default router;
