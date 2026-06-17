import { Router } from 'express';
import c from '../controllers/SettingsController';
import { wrap } from '../middleware/wrap';

const router = Router();

router.get('/',          wrap((req, res) => c.show(req, res)));
router.put('/',          wrap((req, res) => c.update(req, res)));
router.put('/password',  wrap((req, res) => c.updatePassword(req, res)));
router.get('/notes',     wrap((req, res) => c.getNotes(req, res)));
router.put('/notes',     wrap((req, res) => c.updateNotes(req, res)));

export default router;
