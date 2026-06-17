import { Router } from 'express';
import c from '../controllers/PaymentController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/',                   wrap((req, res) => c.list(req, res)));
router.get('/inadimplencia',      wrap((req, res) => c.listInadimplencia(req, res)));
router.get('/patient/:patientId', wrap((req, res) => c.listByPatient(req, res)));
router.post('/',                  wrap((req, res) => c.create(req, res)));
router.put('/:id',                wrap((req, res) => c.update(req, res)));
router.delete('/:id',             wrap((req, res) => c.remove(req, res)));

export default router;
