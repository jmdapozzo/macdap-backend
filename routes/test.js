const express = require('express');
const router = express.Router();

/* GET test page. */
router.get('/', function(req, res, next) {
  res.render('test', { title: 'Test' });
});

module.exports = router;
