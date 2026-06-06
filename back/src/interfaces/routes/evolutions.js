const router = require('express').Router();
const c = require('../controllers/EvolutionController');
const { wrap } = require('../middleware/wrap');

router.get('/patient/:patientId', wrap((req, res) => c.listByPatient(req, res)));
router.post('/',                  wrap((req, res) => c.create(req, res)));
router.put('/:id',                wrap((req, res) => c.update(req, res)));
router.delete('/:id',             wrap((req, res) => c.remove(req, res)));

module.exports = router;
