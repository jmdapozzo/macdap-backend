const { auth } = require("express-oauth2-jwt-bearer");

const checkJwtBackend = auth({
  audience: process.env.AUTH0_AUDIENCE_BACKEND,
  issuerBaseURL: process.env.AUTH0_ISSUER,
});

module.exports = checkJwtBackend;
