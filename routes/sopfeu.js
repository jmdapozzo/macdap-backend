const express = require("express");
const router = express.Router();
const axios = require("axios");

class Region {
  id;
  name;

  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

class Risk {
  id;
  name;
  updatedAt;
  riskNow;
  riskNowKey;
  riskNowColor;
  riskTomorrow;
  riskTomorrowKey;
  riskTomorrowColor;
  riskAfterTomorrow;
  riskAfterTomorrowKey;
  riskAfterTomorrowColor;

  constructor(id, name, updatedAt, riskNow, riskTomorrow, riskAfterTomorrow) {
    this.id = id;
    this.name = name;
    this.updatedAt = new Date(updatedAt);
    this.riskNow = riskNow;
    this.riskNowKey = this.getRiskKey(riskNow);
    this.riskNowColor = this.getRiskColor(riskNow);
    this.riskTomorrow = riskTomorrow;
    this.riskTomorrowKey = this.getRiskKey(riskTomorrow);
    this.riskTomorrowColor = this.getRiskColor(riskTomorrow);
    this.riskAfterTomorrow = riskAfterTomorrow;
    this.riskAfterTomorrowKey = this.getRiskKey(riskAfterTomorrow);
    this.riskAfterTomorrowColor = this.getRiskColor(riskAfterTomorrow);
  }

  getRiskKey(riskIndex) {
    if (riskIndex in riskKeys) {
      return riskKeys[riskIndex];
    } else {
      return riskKeys[0];
    }
  }

  getRiskColor(riskIndex) {
    if (riskIndex in riskColors) {
      return riskColors[riskIndex];
    } else {
      return riskColors[0];
    }
  }
}

const riskColors = [
  "#0",
  "#528EDC",
  "#87C905",
  "#E3E226",
  "#F58723",
  "#CC170E",
];

const riskKeys = [
  "fireRisk.notAvailable",
  "fireRisk.low",
  "fireRisk.moderate",
  "fireRisk.high",
  "fireRisk.veryHigh",
  "fireRisk.extreme",
];

const nextUpdateDelayInMinute = 60;
var fireRisks = [];
var lastUpdate;
var nextUpdateAt = new Date();
var regions = [];
var testRisk = 0;

// First time fireRisk array initialization
getRiskZones();

// Set fireRisks to be periodically updated
setInterval(getRiskZones, 60000);

const getFireRisks = (req, res, next) => {
  res.send(fireRisks);
};

const getFireRisk = (req, res, next) => {
  if (req.params.id === "0") {
    res.send(
      new Risk(
        0,
        req.i18n.t("sopfeu:testRegionName"),
        new Date(),
        testRisk,
        testRisk + 1,
        testRisk + 2
      )
    );
    testRisk = ++testRisk % 6;
  } else {
    const fireRisk = fireRisks.find((fr) => fr.id === parseInt(req.params.id));
    if (!fireRisk) {
      res
        .status(404)
        .send(`Unable to find fire risk for the requested id ${req.params.id}`);
    } else {
      res.send(fireRisk);
    }
  }
};

const getRegions = (req, res, next) => {
  res.send(regions);
};

const getRegion = (req, res, next) => {
  if (req.params.id === "0") {
    res.send(new Region(0, req.i18n.t("sopfeu:testRegionName")));
  } else {
    const region = regions.find((r) => r.id === parseInt(req.params.id));
    if (!region) {
      res
        .status(404)
        .send(`Unable to find region for the requested id ${req.params.id}`);
    } else {
      res.send(region);
    }
  }
};

const getRiskColors = (req, res, next) => {
  res.send(riskColors);
};

function getRiskZones() {
  const currentDate = new Date();
  if (currentDate >= nextUpdateAt) {
    axios
      .get("https://cartes.sopfeu.qc.ca/risk-zones")
      .then((response) => {
        lastUpdate = new Date();
        nextUpdateAt = new Date();
        nextUpdateAt.setTime(
          nextUpdateAt.getTime() + nextUpdateDelayInMinute * 60 * 1000
        );
        //console.log(`Last update at ${lastUpdate} \nNext one schedule at ${nextUpdateAt}\n`);

        fireRisks = response.data.map((o) => {
          return new Risk(
            o.id,
            o.name,
            o.updatedAt,
            o.riskNow,
            o.riskTomorrow,
            o.riskAfterTomorrow
          );
        });

        regions = response.data.map((o) => {
          return new Region(o.id, o.name);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    //console.log(`Current date is ${currentDate} \nWaiting for ${nextUpdateAt}\n`);
  }
}

router.get("/fire-risks/v1", (req, res, next) => getFireRisks(req, res, next));
router.get("/fire-risks/v1/:id", (req, res, next) => getFireRisk(req, res, next));
router.get("/regions/v1", (req, res, next) => getRegions(req, res, next));
router.get("/regions/v1/:id", (req, res, next) => getRegion(req, res, next));
router.get("/risk-colors/v1", (req, res, next) => getRiskColors(req, res, next));

module.exports = router;
