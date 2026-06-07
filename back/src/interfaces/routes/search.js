const router = require('express').Router();
const c = require('../controllers/SearchController');
const { wrap } = require('../middleware/wrap');

router.get('/', wrap((req, res) => c.search(req, res)));

module.exports = router;
