const router = require('express').Router();
const odontogramaController = require('../controllers/OdontogramaController');

router.get('/:patientId', (req, res) => odontogramaController.listByPatient(req, res));
router.put('/:patientId', (req, res) => odontogramaController.upsert(req, res));

module.exports = router;
