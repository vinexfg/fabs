const router = require('express').Router();
const c = require('../controllers/SettingsController');
const { wrap } = require('../middleware/wrap');

router.get('/',          wrap((req, res) => c.show(req, res)));
router.put('/',          wrap((req, res) => c.update(req, res)));
router.put('/password',  wrap((req, res) => c.updatePassword(req, res)));

module.exports = router;
