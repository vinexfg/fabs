const router = require('express').Router();
const treatmentController = require('../controllers/TreatmentController');

router.get('/patient/:patientId', (req, res) => treatmentController.listByPatient(req, res));
router.post('/',                  (req, res) => treatmentController.create(req, res));
router.patch('/:id/status',       (req, res) => treatmentController.updateStatus(req, res));
router.delete('/:id',             (req, res) => treatmentController.remove(req, res));

module.exports = router;
