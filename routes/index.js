const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
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

module.exports = router;
