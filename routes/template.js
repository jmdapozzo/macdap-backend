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
      "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.",
  });
};


// Ensure that users have either `nicepants` realm-level role, or `mr-fancypants` app-level role.
function pants(token, request) {
  console.log('----------------------------------------');
  console.log('token', token);
  console.log('------------------------------------------------------------------------------------------------');
  console.log('realm_access', token.realm_access);
  console.log('----------------------------------------');
  console.log('resource_access', token.resource_access);
  console.log('----------------------------------------');
  console.log('token.hasRole( "realm:default-roles-macdap")', token.hasRole( 'realm:default-roles-macdap'));
  console.log('token.hasApplicationRole( "realm:default-roles-macdap")', token.hasApplicationRole( 'realm:default-roles-macdap'));
  console.log('token.hasRealmRole( "realm:default-roles-macdap")', token.hasRealmRole( 'realm:default-roles-macdap'));
  console.log('token.hasRole( "administrator")', token.hasRole( 'administrator'));
  console.log('token.hasApplicationRole( "administrator")', token.hasApplicationRole( 'administrator'));
  console.log('token.hasRealmRole( "administrator")', token.hasRealmRole( 'administrator'));
  return token.hasRole( 'realm:default-roles-macdap') || token.hasRole( 'administrator');
}

//app.get( '/fancy/:page', keycloak.protect( pants ), myPantsHandler );


router.get("/public", (req, res, next) => getPublic(req, res, next));

router.get("/private", keycloakWeb.protect(), (req, res, next) => getPrivate(req, res, next));
//router.get("/private-scoped", keycloakWeb.protect('web-frontend:administrator'), (req, res, next) => getPrivateScoped(req, res, next));
router.get("/private-scoped", keycloakWeb.protect( pants ), (req, res, next) => getPrivateScoped(req, res, next));

router.get("/iot/private", keycloakIot.protect(), (req, res, next) => getPrivate(req, res, next));
router.get("/iot/private-scoped", keycloakIot.protect('test-role'), (req, res, next) => getPrivateScoped(req, res, next));

module.exports = router;
