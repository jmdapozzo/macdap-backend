const express = require("express");
const router = express.Router();

class Timezone {
  name;
  tz;

  constructor(name, tz) {
    this.name = name;
    this.tz = tz;
  }
}

const getUI = (req, res, next) => {
  try {
    res.render("index", { title: "Express" });
  } catch (error) {
    next(error);
  }
};

const getInfo = (req, res, next) => {
  const nameplate = {
    company: req.i18n.t("company"),
    brand: req.i18n.t("brand"),
    applicationName: req.i18n.t("applicationName"),
    language: req.i18n.t("language"),
    version: process.env.VERSION,
    versionDate: "",
  };
  res.send(nameplate);
};

const getTimeZones = (req, res, next) => {
  let timezones = [];

  timezones.push(new Timezone("timezone.utc", "UTC0"));
  timezones.push(new Timezone("timezone.at", "AST4ADT,M3.2.0,M11.1.0"));
  timezones.push(new Timezone("timezone.et", "EST5EDT,M3.2.0,M11.1.0"));
  timezones.push(new Timezone("timezone.pt", "PST8PDT,M3.2.0,M11.1.0"));
  timezones.push(new Timezone("timezone.mt", "MST7MDT,M3.2.0,M11.1.0"));
  timezones.push(new Timezone("timezone.ct", "CST6CDT,M3.2.0,M11.1.0"));
  timezones.push(new Timezone("timezone.nt", "NST3:30NDT,M3.2.0,M11.1.0"));

  res.send(timezones);
};

router.get("/", (req, res, next) => getUI(req, res, next));
router.get("/info", (req, res, next) => getInfo(req, res, next));
router.get("/timezones/v1", (req, res, next) => getTimeZones(req, res, next));

module.exports = router;
