const express = require("express");
const router = express.Router();
const axios = require("axios");
const checkJwtBackend = require("../auth/check-jwt-backend");

let accessToken;

const getAccessToken = async () => {
  try {
    if (accessToken === undefined) {
      console.log("Getting a new access token");
      const response = await axios.request({
        method: "POST",
        url: "https://macdap.us.auth0.com/oauth/token",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: process.env.AUTH0_AUDIENCE_MANAGEMENT,
        }),
      });
      expires_in = response.data.expires_in;
      setTimeout(() => {
        accessToken = undefined;
        console.log("Access token expired");
      }, expires_in * 1000);
      accessToken = response.data.access_token;
    }
    return accessToken;
  } catch (error) {
    console.error(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    var token = await getAccessToken();
    const response = await axios.request({
      method: "GET",
      url: "https://macdap.us.auth0.com/api/v2/users",
      headers: { authorization: `Bearer ${token}` },
    });
    res.send(response.data);
  } catch (error) {
    console.error(`getUser: ${error.name} ${error.code} - error ${error.response.status}, ${error.response.statusText}`);
    next(error);
  }
};

router.get("/user/v2", checkJwtBackend, (req, res, next) => getUsers(req, res, next));

module.exports = router;
