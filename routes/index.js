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

router.get("/", function(req, res) {
    const nameplate = {
        company: req.i18n.t("company"),
        brand: req.i18n.t("brand"),
        applicationName: req.i18n.t("applicationName"),
        language: req.i18n.t("language"),
        version: "0.0.0",
        versionDate: "",
    };
    res.send(nameplate);
});

router.get("/timezones/v1", function(req, res, next) {
    let timezones = [];

    timezones.push(new Timezone("timezone.utc", "UTC0"));
    timezones.push(new Timezone("timezone.at", "AST4ADT,M3.2.0,M11.1.0"));
    timezones.push(new Timezone("timezone.et", "EST5EDT,M3.2.0,M11.1.0"));
    timezones.push(new Timezone("timezone.pt", "PST8PDT,M3.2.0,M11.1.0"));
    timezones.push(new Timezone("timezone.mt", "MST7MDT,M3.2.0,M11.1.0"));
    timezones.push(new Timezone("timezone.ct", "CST6CDT,M3.2.0,M11.1.0"));
    timezones.push(new Timezone("timezone.nt", "NST3:30NDT,M3.2.0,M11.1.0"));

    res.send(timezones);
});

module.exports = router;