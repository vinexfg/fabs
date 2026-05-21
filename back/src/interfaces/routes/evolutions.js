const router = require('express').Router();
const evolutionController = require('../controllers/EvolutionController');

router.get('/patient/:patientId', (req, res) => evolutionController.listByPatient(req, res));
router.post('/',                  (req, res) => evolutionController.create(req, res));
router.delete('/:id',             (req, res) => evolutionController.remove(req, res));

module.exports = router;
