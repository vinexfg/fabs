const router = require('express').Router();
const c = require('../controllers/BackupController');
const { wrap } = require('../middleware/wrap');

router.get('/',          wrap((req, res) => c.exportBackup(req, res)));
router.post('/restore',  wrap((req, res) => c.restore(req, res)));

module.exports = router;
