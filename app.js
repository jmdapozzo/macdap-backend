const createError = require('http-errors');
const express = require('express');
require('dotenv').config();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const path = require('path');
const fs = require('fs')
const cookieParser = require('cookie-parser');
const cors = require('cors');
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

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://macdap.us.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_ISSUER,
  algorithms: ['RS256']
});

const i18nextOptions = {
  initImmediate: false,
  fallbackLng: 'en',
  preload: ['en', 'fr'],
  ns: ['common'],
  defaultNS: 'common',
  backend: {
    loadPath: 'locales/{{lng}}/{{ns}}.json'
  }
};

i18next
  .use(i18nextHttpMiddleware.LanguageDetector)
  .use(i18nextFsBackend)
  .init(i18nextOptions);

const app = express();

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18nextHttpMiddleware.handle(i18next));

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const sopfeuRouter = require('./routes/sopfeu');
app.use('/sopfeu', sopfeuRouter);

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

////////////////////////////

app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

// This route needs authentication
app.get('/api/private', checkJwt, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});

const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get('/api/private-scoped', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
  });
});

///////////////////////////

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500).send();
});

module.exports = app;
