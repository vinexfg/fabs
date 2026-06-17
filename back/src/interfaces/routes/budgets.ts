import { Router } from 'express';
import c from '../controllers/BudgetController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/patient/:patientId',  wrap((req, res) => c.listByPatient(req, res)));
router.post('/',                   wrap((req, res) => c.create(req, res)));
router.put('/:id',                 wrap((req, res) => c.update(req, res)));
router.patch('/:id/status',        wrap((req, res) => c.updateStatus(req, res)));
router.delete('/:id',              wrap((req, res) => c.remove(req, res)));

export default router;
