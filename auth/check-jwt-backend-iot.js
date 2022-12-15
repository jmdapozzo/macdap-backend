const { auth } = require("express-oauth2-jwt-bearer");

const checkJwtBackendIot = auth({
  audience: process.env.AUTH0_AUDIENCE_BACKEND_IOT,
  issuerBaseURL: process.env.AUTH0_ISSUER,
});

module.exports = checkJwtBackendIot;
