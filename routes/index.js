const express = require("express");
const router = express.Router();
const path = require("path");
const jwt = require('jsonwebtoken');
const keycloakWeb = require("../auth/keycloak-web-frontend");
const fs = require("fs");

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
    res.sendFile(path.join(__dirname, '../index.html'));
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
    version: process.env.npm_package_version
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

const getMapJWT = (req, res, next) => {
  const header = {
    alg: "ES256",
    typ: "JWT",
    kid: process.env.APPLE_MAP_ID_KEY
  }
  const payload = {
    iss: process.env.APPLE_TEAM_ID,
    iat: Date.now() / 1000,
    exp: (Date.now() / 1000) + 15778800
  }

  var privateKey = fs.readFileSync("./" + process.env.APPLE_MAP_CERTIFICATE_NAME);
  var token = jwt.sign(payload, privateKey, { header: header });
  res.json({ token: token });
}

router.get("/", (req, res, next) => getUI(req, res, next));
router.get("/info", (req, res, next) => getInfo(req, res, next));
router.get("/timezones/v1", (req, res, next) => getTimeZones(req, res, next));
router.get("/favicon.ico", (req, res, next) => res.status(204).end());
router.get("/mapjwt/v1", keycloakWeb.protect(), (req, res, next) => getMapJWT(req, res, next));

module.exports = router;
