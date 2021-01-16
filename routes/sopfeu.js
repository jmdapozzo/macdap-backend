const express = require('express');
const router = express.Router();
const axios = require('axios');

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
        this.riskNowKey = this.#getRiskKey(riskNow);
        this.riskNowColor = this.#getRiskColor(riskNow);
        this.riskTomorrow = riskTomorrow;
        this.riskTomorrowKey = this.#getRiskKey(riskTomorrow);
        this.riskTomorrowColor = this.#getRiskColor(riskTomorrow);
        this.riskAfterTomorrow = riskAfterTomorrow;
        this.riskAfterTomorrowKey = this.#getRiskKey(riskAfterTomorrow);
        this.riskAfterTomorrowColor = this.#getRiskColor(riskAfterTomorrow);
    }

    #getRiskKey(riskIndex) {
        if (riskIndex in riskKeys) { 
            return riskKeys[riskIndex];
        } else {
            return riskKeys[0];
        }
    }

    #getRiskColor(riskIndex) {
        if (riskIndex in riskColors) { 
            return riskColors[riskIndex];
        } else {
            return riskColors[0];
        }
    }
}

const riskColors = [
    '#0',
    '#528EDC', 
    '#87C905', 
    '#E3E226', 
    '#F58723',
    '#CC170E'
];

const riskKeys = [
    'fireRisk.notAvailable',
    'fireRisk.low',
    'fireRisk.moderate',
    'fireRisk.high',
    'fireRisk.veryHigh',
    'fireRisk.extreme'
];

const nextUpdateDelay = 60;
var fireRisks = [];
var lastUpdate;
var nextUpdateAt = new Date();
var regions = [];

// Firts time fireRisk array initialization
getRiskZones();

// Set fireRisks to be periodically updated
setInterval(getRiskZones, 10000);

// Set routes
router.get('/fire-risks', function(req, res, next) {
    res.send(fireRisks);
});

router.get('/fire-risks/:id', function(req, res, next) {
    const fireRisk = fireRisks.find(fr => fr.id === parseInt(req.params.id));
    if (!fireRisk) {
        res.status(404).send(`Unable to find fire risk for the requested id ${req.params.id}`);
    } else {
        res.send(fireRisk);
    }
});
  
router.get('/regions', function(req, res, next) {
    res.send(regions);
});

router.get('/regions/:id', function(req, res, next) {
    const region = regions.find(r => r.id === parseInt(req.params.id));
    if (!region) {
        res.status(404).send(`Unable to find region for the requested id ${req.params.id}`);
    } else {
        res.send(region);
    }
});

router.get('/risk-colors', function(req, res, next) {
    res.send(riskColors);
});

function getRiskZones() {
    const currentDate = new Date();
    if (currentDate >= nextUpdateAt) {
        axios.get('https://cartes.sopfeu.qc.ca/risk-zones')
        .then(response => {
            lastUpdate = new Date();
            nextUpdateAt = new Date();
            nextUpdateAt.setMinutes(nextUpdateAt.getMinutes() + nextUpdateDelay);
            console.log(`Last update at ${lastUpdate} \nNext one schedule at ${nextUpdateAt}\n`)

            fireRisks = response.data.map((o) => {
                // const simRiskNow = Math.floor(Math.random() * 6);
                // const simRiskTomorrow = Math.floor(Math.random() * 6);
                // const simRiskAfterTomorrow = Math.floor(Math.random() * 6);
                // return new Risk(o.id, o.name, o.updatedAt, simRiskNow, simRiskTomorrow, simRiskAfterTomorrow);
                return new Risk(o.id, o.name, o.updatedAt, o.riskNow, o.riskTomorrow, o.riskAfterTomorrow);
            });
                
            regions = response.data.map((o) => {
                return {
                    'id': o.id,
                    'name': o.name
                };
            })
        })
        .catch(error => {
          console.log(error);
        });
    } else {
        console.log(`Current date is ${currentDate} \nWaiting for ${nextUpdateAt}\n`)
    }
}

module.exports = router;
