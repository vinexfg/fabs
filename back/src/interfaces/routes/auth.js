const router = require('express').Router();
const authController = require('../controllers/AuthController');
const { wrap } = require('../middleware/wrap');

router.post('/login', wrap((req, res) => authController.login(req, res)));

module.exports = router;
