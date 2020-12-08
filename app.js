const createError = require('http-errors');
const express = require('express');
require('dotenv').config();
const path = require('path');
const fs = require('fs')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const i18next = require("i18next");
const i18nextFsBackend = require('i18next-fs-backend');
const i18nextHttpMiddleware = require('i18next-http-middleware');
const logger = require('morgan');

const whitelist = ['http://localhost:3000'];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

const i18nextOptions = {
  initImmediate: false,
  fallbackLng: 'en',
  preload: ['en', 'fr'],
  ns: ['common', 'index', 'sopfeu'],
  defaultNS: 'common',
  backend: {
    loadPath: 'public/locales/{{lng}}/{{ns}}.json'
  }
};

i18next
  .use(i18nextHttpMiddleware.LanguageDetector)
  .use(i18nextFsBackend)
  .init(i18nextOptions);

const basicAuthOptions = {
  challenge: true,
  authorizer: (username, password) => {
    const userMatches = basicAuth.safeCompare(username, 'admin');
    const passwordMatches = basicAuth.safeCompare(password, '123456');
    return userMatches & passwordMatches
  }
};

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
//app.use('/locales', express.static('locales'));
app.use(i18nextHttpMiddleware.handle(i18next));

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const sopfeuRouter = require('./routes/sopfeu');
app.use('/sopfeu', sopfeuRouter);

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const testRouter = require('./routes/test');
app.use('/test', basicAuth(basicAuthOptions), testRouter);

app.get('/lib/i18next.min.js', function(req, res) {
  fs.readFile(__dirname + '/node_modules/i18next/i18next.min.js', 'utf-8', function(err, doc) {
    res.send(doc);
  });
});

app.get('/lib/i18nextHttpBackend.min.js', function(req, res) {
  fs.readFile(__dirname + '/node_modules/i18next-http-backend/i18nextHttpBackend.min.js', 'utf-8', function(err, doc) {
    res.send(doc);
  });
});

app.get('/lib/i18nextBrowserLanguageDetector.min.js', function(req, res) {
  fs.readFile(__dirname + '/node_modules/i18next-browser-languagedetector/i18nextBrowserLanguageDetector.min.js', 'utf-8', function(err, doc) {
    res.send(doc);
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
