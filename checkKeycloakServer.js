const fetch = require("node-fetch");

const checkKeycloakServer = async () => {
  const keycloakServerUrl = process.env.KEYCLOAK_SERVER_URL; // Ensure this is set in your environment variables
  const realm = process.env.KEYCLOAK_REALM; // Ensure this is set in your environment variables

  if (!keycloakServerUrl || !realm) {
    console.error("KEYCLOAK_SERVER_URL or KEYCLOAK_REALM is not set in environment variables.");
    return {
      success: false,
      message: "Environment variables KEYCLOAK_SERVER_URL or KEYCLOAK_REALM are missing.",
    };
  }

  const url = `${keycloakServerUrl}/realms/${realm}`;

  try {
    const response = await fetch(url, { method: "GET" });

    if (response.ok) {
      console.log(`Keycloak server is reachable at ${keycloakServerUrl}`);
    } else {
      console.error(`Keycloak server returned status ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error connecting to Keycloak server: ${error.message}`);
  }
};

module.exports = checkKeycloakServer;