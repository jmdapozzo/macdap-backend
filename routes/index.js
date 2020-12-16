const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  const nanmeplate = {
    company: req.i18n.t('company'),
    brand: req.i18n.t('brand'),
    applicationName: req.i18n.t('applicationName'),
    language: req.i18n.t('language'),
    version: '0.0.0',
    versionDate: ''
    }
  res.send(nanmeplate);
});

module.exports = router;
