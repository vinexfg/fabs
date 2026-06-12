const { Router }    = require('express');
const { wrap }      = require('../middleware/wrap');
const controller    = require('../controllers/ReportController');

const router = Router();
router.get('/', wrap((req, res) => controller.stats(req, res)));
module.exports = router;
