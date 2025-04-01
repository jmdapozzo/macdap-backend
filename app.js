const createError = require("http-errors");
const express = require("express");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const keycloakIot = require("./auth/keycloak-iot-device");
const keycloakWeb = require("./auth/keycloak-web-frontend");
const i18next = require("i18next");
const i18nextFsBackend = require("i18next-fs-backend");
const i18nextHttpMiddleware = require("i18next-http-middleware");
const morgan = require("morgan");

const indexRouter = require("./routes/index");
const sopfeuRouter = require("./routes/sopfeu");
const deviceRouter = require("./routes/device");
const otaRouter = require("./routes/ota");
const templateRouter = require("./routes/template");

const whitelist = [
  "http://localhost:3000",
  "https://macdap.net",
  "https://staging.macdap.net",
  "https://production.macdap.net",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

const i18nextOptions = {
  initImmediate: false,
  fallbackLng: "en",
  preload: ["en", "fr"],
  ns: ["common", "sopfeu"],
  defaultNS: "common",
  backend: {
    loadPath: "locales/{{lng}}/{{ns}}.json",
  },
};

i18next
  .use(i18nextHttpMiddleware.LanguageDetector)
  .use(i18nextFsBackend)
  .init(i18nextOptions);

const app = express();

morgan.token('title', function (req, res) { return req.headers['macdap-app-title'] })
morgan.token('version', function (req, res) { return req.headers['macdap-app-version'] })
morgan.token('platformType', function (req, res) { return req.headers['macdap-platform-type'] })
morgan.token('platformID', function (req, res) { return req.headers['macdap-platform-id'] })

app.use(cors(corsOptions));
app.use(morgan(":method :url :status :title :version :platformType :platformID :response-time ms"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18nextHttpMiddleware.handle(i18next));
app.use(keycloakIot.middleware());
app.use(keycloakWeb.middleware());

app.use("/", indexRouter);
app.use("/sopfeu", sopfeuRouter);
app.use("/device", deviceRouter);
app.use("/api", templateRouter);
app.use("/", otaRouter);

app.use((req, res, next) => {
  console.log(`404 Error for URL: ${req.url}`);
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.log(`Error: ${err.message}`);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
});

// Object.keys(process.env).forEach(function(key) {
//   console.log('export ' + key + '="' + process.env[key] +'"');
// });

const port = process.env.PORT || 3300;
console.log(`Running server on port ${port}`);
app.listen(port);

module.exports = app;
