const Keycloak = require('keycloak-connect');

const keycloakWeb = new Keycloak({ }, {
  "realm": process.env.KEYCLOAK_REALM,
  "auth-server-url": process.env.KEYCLOAK_SERVER_URL,
  "resource": process.env.KEYCLOAK_CLIENT_ID_WEB
});


module.exports = keycloakWeb;