const createError = require("http-errors");
const express = require("express");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const i18next = require("i18next");
const i18nextFsBackend = require("i18next-fs-backend");
const i18nextHttpMiddleware = require("i18next-http-middleware");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const sopfeuRouter = require("./routes/sopfeu");
const deviceRouter = require("./routes/device");
const managementRouter = require("./routes/management");
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

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18nextHttpMiddleware.handle(i18next));

app.use("/", indexRouter);
app.use("/sopfeu", sopfeuRouter);
app.use("/device", deviceRouter);
app.use("/management", managementRouter);
app.use("/", otaRouter);
app.use("/api", templateRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
