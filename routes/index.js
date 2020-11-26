const express = require('express');
const router = express.Router();
const axios = require('axios');
const lorembarnak = require('lorembarnak');

/* GET home page. */
router.get('/', function(req, res, next) {

  //req.i18n.changeLanguage('en');

  var loremIpsum;

  switch(req.i18n.language) {
    case 'fr':
      loremIpsum = lorembarnak.getText();
      res.render('index', { title: 'MacDap', loremIpsum: loremIpsum });
      break;
    case 'en':
    default:
      axios.get('https://api.whatdoestrumpthink.com/api/v1/quotes/random')
      .then(response => {
        loremIpsum = response.data.message + ' - Trump';
        res.render('index', { title: 'MacDap', loremIpsum: loremIpsum });
      })
      .catch(error => {
        console.log(error);
      });
  }
});

module.exports = router;
