import { Router } from 'express';
import c from '../controllers/OdontogramaController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/:patientId', wrap((req, res) => c.listByPatient(req, res)));
router.put('/:patientId', wrap((req, res) => c.upsert(req, res)));

export default router;
