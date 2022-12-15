const express = require("express");
const router = express.Router();
const checkJwtBackend = require("../auth/check-jwt-backend");
const checkJwtBackendIot = require("../auth/check-jwt-backend-iot");
const { requiredScopes } = require("express-oauth2-jwt-bearer");

const getPublic = (req, res, next) => {
  res.json({
    message:
      "Hello from a public endpoint! You don't need to be authenticated to see this.",
  });
};

const getPrivate = (req, res, next) => {
  res.json({
    message:
      "Hello from a private endpoint! You need to be authenticated to see this.",
  });
};

const getPrivateScoped = (req, res, next) => {
  res.json({
    message:
      "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.",
  });
};

const checkScopes = requiredScopes(["read:messages"]);

router.get("/public", (req, res, next) => getPublic(req, res, next));
router.get("/private", checkJwtBackend, (req, res, next) => getPrivate(req, res, next));
router.get("/iot/private", checkJwtBackendIot, (req, res, next) => getPrivate(req, res, next));
router.get("/private-scoped", checkJwtBackend, checkScopes, (req, res, next) =>
  getPrivateScoped(req, res, next)
);

module.exports = router;
