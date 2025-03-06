const Keycloak = require('keycloak-connect');

const keycloak = new Keycloak({ }, {
  "realm": process.env.KEYCLOAK_REALM,
  "auth-server-url": process.env.KEYCLOAK_SERVER_URL,
  "resource": process.env.KEYCLOAK_CLIENT_ID,
  "credentials": {
        "secret": process.env.KEYCLOAK_PUBLIC_KEY
  }
});

module.exports = keycloak;