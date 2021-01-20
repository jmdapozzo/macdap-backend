const express = require('express');
const router = express.Router();
const checkJwt = require('../auth/check-jwt');
const jwtAuthz = require('express-jwt-authz');

const getPublic = (req, res) => {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
};

const getPrivate = (req, res) => {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.'
    });
};

const getPrivateScoped = (req, res) => {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
    });
};

const checkScopes = jwtAuthz(['read:messages']);

router.get('/public', (req, res) => getPublic(req, res))
router.get('/private', checkJwt, (req, res) => getPrivate(req, res))
router.get('/private-scoped', checkJwt, jwtAuthz, (req, res) => getPrivateScoped(req, res))

module.exports = router;

