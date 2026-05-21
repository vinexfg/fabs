const router = require('express').Router();
const appointmentController = require('../controllers/AppointmentController');

router.get('/',                      (req, res) => appointmentController.list(req, res));
router.get('/tomorrow',              (req, res) => appointmentController.listTomorrow(req, res));
router.get('/patient/:patientId',    (req, res) => appointmentController.listByPatient(req, res));
router.post('/',                     (req, res) => appointmentController.create(req, res));
router.put('/:id',                   (req, res) => appointmentController.update(req, res));
router.patch('/:id/status',          (req, res) => appointmentController.updateStatus(req, res));
router.delete('/:id',                (req, res) => appointmentController.remove(req, res));

module.exports = router;
