const router = require('express').Router();
const c = require('../controllers/AppointmentController');
const { wrap } = require('../middleware/wrap');

router.get('/',                   wrap((req, res) => c.list(req, res)));
router.get('/tomorrow',           wrap((req, res) => c.listTomorrow(req, res)));
router.get('/patient/:patientId', wrap((req, res) => c.listByPatient(req, res)));
router.post('/',                  wrap((req, res) => c.create(req, res)));
router.put('/:id',                wrap((req, res) => c.update(req, res)));
router.patch('/:id/status',       wrap((req, res) => c.updateStatus(req, res)));
router.delete('/:id',             wrap((req, res) => c.remove(req, res)));

module.exports = router;
