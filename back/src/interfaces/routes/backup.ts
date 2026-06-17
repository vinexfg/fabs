import { Router } from 'express';
import c from '../controllers/BackupController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/',          wrap((req, res) => c.exportBackup(req, res)));
router.post('/restore',  wrap((req, res) => c.restore(req, res)));

export default router;
