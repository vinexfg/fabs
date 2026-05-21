const router = require('express').Router();
const templateController = require('../controllers/TemplateController');

router.get('/',     (req, res) => templateController.list(req, res));
router.post('/',    (req, res) => templateController.create(req, res));
router.delete('/:id', (req, res) => templateController.remove(req, res));

module.exports = router;
