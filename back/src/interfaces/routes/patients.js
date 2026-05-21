const router = require('express').Router();
const patientController = require('../controllers/PatientController');

router.get('/',     (req, res) => patientController.list(req, res));
router.get('/:id',  (req, res) => patientController.show(req, res));
router.post('/',    (req, res) => patientController.create(req, res));
router.put('/:id',  (req, res) => patientController.update(req, res));
router.delete('/:id', (req, res) => patientController.remove(req, res));

module.exports = router;
