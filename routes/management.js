const express = require("express");
const router = express.Router();
const axios = require("axios");
const checkJwtBackend = require("../auth/check-jwt-backend");

var config = {
  method: "POST",
  url: "https://macdap.us.auth0.com/oauth/token",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  data: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.AUTH0_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE_MANAGEMENT,
  }),
};

var accessToken;

const getAccessToken = async () => {
  console.log("Getting Token");
  try {
    const response = await axios.request(config);
    expires_in = response.data.expires_in;
    setTimeout(() => {accessToken = undefined; console.log("Clear accessToken")}, 10000);
    console.log("expiration in ", expires_in);
    return response.data.access_token;
  } catch (error) {
    console.error(error);
  }
};

const getPublic = async (req, res, next) => {
  try {
    if (accessToken === undefined) {
        accessToken = await getAccessToken();
        console.log("Getting a new access token");
    }
    res.send(accessToken);
  } catch (error) {
    res.status(400).json({ dbError: `db error - ${err.detail}` });
  }
};

router.get("/user", (req, res, next) => getPublic(req, res, next));

module.exports = router;
