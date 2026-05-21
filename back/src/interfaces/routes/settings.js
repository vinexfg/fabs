const router = require('express').Router();
const settingsController = require('../controllers/SettingsController');

router.get('/',          (req, res) => settingsController.show(req, res));
router.put('/',          (req, res) => settingsController.update(req, res));
router.put('/password',  (req, res) => settingsController.updatePassword(req, res));

module.exports = router;
