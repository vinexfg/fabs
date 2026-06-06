const router = require('express').Router();
const c = require('../controllers/PatientController');
const { wrap } = require('../middleware/wrap');

router.get('/',       wrap((req, res) => c.list(req, res)));
router.get('/:id',    wrap((req, res) => c.show(req, res)));
router.post('/',      wrap((req, res) => c.create(req, res)));
router.put('/:id',    wrap((req, res) => c.update(req, res)));
router.delete('/:id', wrap((req, res) => c.remove(req, res)));

module.exports = router;
