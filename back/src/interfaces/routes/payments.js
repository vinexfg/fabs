const router = require('express').Router();
const paymentController = require('../controllers/PaymentController');

router.get('/',                      (req, res) => paymentController.list(req, res));
router.get('/inadimplencia',         (req, res) => paymentController.listInadimplencia(req, res));
router.get('/patient/:patientId',    (req, res) => paymentController.listByPatient(req, res));
router.post('/',                     (req, res) => paymentController.create(req, res));
router.delete('/:id',                (req, res) => paymentController.remove(req, res));

module.exports = router;
