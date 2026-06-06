const router = require('express').Router();
const c = require('../controllers/OdontogramaController');
const { wrap } = require('../middleware/wrap');

router.get('/:patientId', wrap((req, res) => c.listByPatient(req, res)));
router.put('/:patientId', wrap((req, res) => c.upsert(req, res)));

module.exports = router;
