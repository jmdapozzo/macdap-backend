const express = require("express");
const router = express.Router();
const checkJwtBackendIot = require("../auth/check-jwt-backend-iot");
const axios = require("axios");
const turf = require('@turf/turf');
const isValidCoordinates = require('is-valid-coordinates');
const createError = require("http-errors");

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

class MeasureType {
  id;
  name;
  order;
  createdAt;
  updatedAt;

  constructor(id, name, order, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.order = order;
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
  }
}

class Measure {
  id;
  date;
  createdAt;
  updatedAt;
  active;
  type;
  json;

  constructor(id, date, createdAt, updatedAt, active, type, json) {
    this.id = id;
    this.date = new Date(date);
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
    this.active = active;
    this.type = new MeasureType(
      type.id,
      type.name,
      type.order,
      type.createdAt,
      type.updatedAt
    );
    this.json = JSON.parse(json);
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
let fireRisks = [];
let nextUpdateAt = new Date();
let regions = [];
let lastTestRisk = 0;
let measures = [];

// First time initialization then updated periodically
sopfeuQuery();
setInterval(sopfeuQuery, 1000);

//Test points
//const turfPointIDS = turf.point([-73.551635, 45.453351]); //ids
//const turfPointPatricia = turf.point([-74.120374, 46.301903]); //chalet Patricia
//const turfPointMarcel = turf.point([-75.379037, 46.418500]); //chalet Marcel

const getMeasure = (req, res, next) => {
  const longitude = Number(req.params.longitude);
  const latitude = Number(req.params.latitude);
  if (isValidCoordinates(longitude, latitude)){
    const point = turf.point([longitude, latitude]);
    let restrictions = measures.map(measure => {
      const polygon = turf.multiPolygon(measure.json.features[0].geometry.coordinates);
      return {
        date: measure.date,
        createdAt: measure.createdAt,
        updatedAt: measure.updatedAt,
        active: measure.active,
        id: measure.type.id,
        name: measure.type.name,
        order: measure.type.order,
        restricted: turf.booleanPointInPolygon(point, polygon)
      };
    });
    return res.send(restrictions);
  }
  else
  {
    return next(createError(400, "Bad coordinates"));
  }
};

const getFireRisks = (req, res, next) => {
  res.send(fireRisks);
};

const getFireRisk = (req, res, next) => {
  if (req.params.id === "0") {
    let testRisk = req.params.currentRisk;
    if (testRisk === undefined) {
      testRisk = lastTestRisk;
      lastTestRisk = ++lastTestRisk % 6;
    } else {
      testRisk = ++testRisk % 6;
    }

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

function sopfeuQuery() {
  const currentDate = new Date();
  if (currentDate >= nextUpdateAt) {
    const lastUpdate = new Date();
    nextUpdateAt = new Date();
    nextUpdateAt.setTime(
      nextUpdateAt.getTime() + nextUpdateDelayInMinute * 60 * 1000
    );
    console.log(`Last update at ${lastUpdate} \nNext one schedule at ${nextUpdateAt}\n`);

    axios
      .get("https://cartes.sopfeu.qc.ca/risk-zones")
      .then((response) => {
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

      axios
      .get("https://cartes.sopfeu.qc.ca/measures")
      .then((response) => {
        measures = response.data.map((o) => {
          return new Measure(
            o.id,
            o.date,
            o.createdAt,
            o.updatedAt,
            o.active,
            o.type,
            o.json
          );
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    //console.log(`Current date is ${currentDate} \nWaiting for ${nextUpdateAt}\n`);
  }
}

function sopfeuMeasures() {
}

router.get("/fire-risks/v1", (req, res, next) => getFireRisks(req, res, next));
router.get("/fire-risks/v1/:id", (req, res, next) => getFireRisk(req, res, next));
router.get("/fire-risks/v1/:id/:currentRisk", (req, res, next) => getFireRisk(req, res, next));
router.get("/regions/v1", (req, res, next) => getRegions(req, res, next));
router.get("/regions/v1/:id", (req, res, next) => getRegion(req, res, next));
router.get("/risk-colors/v1", (req, res, next) => getRiskColors(req, res, next));

router.get("/measure/v2/:longitude/:latitude", checkJwtBackendIot, (req, res, next) => getMeasure(req, res, next));

module.exports = router;
