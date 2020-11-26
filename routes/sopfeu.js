const express = require('express');
const router = express.Router();
const axios = require('axios');
const i18next = require('i18next');

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
        this.riskTomorrow = this.riskTomorrow;
        this.riskTomorrowKey = this.#getRiskKey(riskTomorrow);
        this.riskTomorrowColor = this.#getRiskColor(riskTomorrow);
        this.riskAfterTomorrow = this.riskAfterTomorrow;
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
    0x0,
    0x528EDC, 
    0x87C905, 
    0xE3E226, 
    0xF58723,
    0xCC170E
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
router.get('/', function(req, res, next) {
    res.render('sopfeu', { title: 'SOPFEU', fireRisks});
});

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

// Export routes
module.exports = router;

// Support functions
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
