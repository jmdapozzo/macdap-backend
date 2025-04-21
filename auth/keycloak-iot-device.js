const Keycloak = require('keycloak-connect');

const keycloakIot = new Keycloak({ }, {
  "realm": process.env.KEYCLOAK_REALM,
  "bearer-only": true,
  "auth-server-url": process.env.KEYCLOAK_SERVER_URL,
  "ssl-required": "none",
  "resource": process.env.KEYCLOAK_CLIENT_ID_IOT
});

module.exports = keycloakIot;