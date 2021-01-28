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
const usersRouter = require("./routes/users");
const templateRouter = require("./routes/template");

const whitelist = ["http://localhost:3000"];
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
  ns: ["common"],
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

app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18nextHttpMiddleware.handle(i18next));

app.use("/", indexRouter);
app.use("/sopfeu", sopfeuRouter);
app.use("/users", usersRouter);
app.use("/api", templateRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).send();
});

module.exports = app;
