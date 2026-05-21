const router = require('express').Router();
const backupController = require('../controllers/BackupController');

router.get('/',          (req, res) => backupController.exportBackup(req, res));
router.post('/restore',  (req, res) => backupController.restore(req, res));

module.exports = router;
