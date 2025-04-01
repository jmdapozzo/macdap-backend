const express = require("express");
const router = express.Router();
const keycloakIot = require("../auth/keycloak-iot-device");
const keycloakWeb = require("../auth/keycloak-web-frontend");

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
      "Hello from a private endpoint! You need to be authenticated and have a scope of realm:admin to see this.",
  });
};

router.get("/public", (req, res, next) => getPublic(req, res, next));

router.get("/private", keycloakWeb.protect(), (req, res, next) => getPrivate(req, res, next));
router.get("/private-scoped", keycloakWeb.protect('realm:admin'), (req, res, next) => getPrivateScoped(req, res, next));

router.get("/iot/private", keycloakIot.protect(), (req, res, next) => getPrivate(req, res, next));
router.get("/iot/private-scoped", keycloakIot.protect('test-role'), (req, res, next) => getPrivateScoped(req, res, next));

module.exports = router;
