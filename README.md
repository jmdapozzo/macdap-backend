# macdap-backend
This is a server providing a RESTful API to different resources.

To run locally: npm start
To build and run in Docker: docker build -t macdap-backend .
To build, run and use database: docker compose up --build -d
To Tag the image: docker tag macdap-backend jmdapozzo/macdap-backend
To push: docker push jmdapozzo/macdap-backend

TO create the image, build and push
docker buildx build -t jmdapozzo/macdap-backend . --platform linux/amd64,linux/arm64
docker push jmdapozzo/macdap-

Add an npm script
"build": "docker buildx build -t jmdapozzo/macdap-backend . --platform linux/amd64,linux/arm64 && docker push jmdapozzo/macdap-backend"

Use this in a portainer stack editor
services:
  macdap-backend:
    platform: linux/amd64
    image: jmdapozzo/macdap-backend
    container_name: macdap-backend
    ports:
      - "3300:3300"
    networks:
      - backend
      - database
      - authServer
    environment:
      KEYCLOAK_REALM: ${KEYCLOAK_REALM}
      KEYCLOAK_SERVER_URL: ${KEYCLOAK_SERVER_URL}
      KEYCLOAK_CLIENT_ID_IOT: ${KEYCLOAK_CLIENT_ID_IOT}
      KEYCLOAK_CLIENT_ID_WEB: ${KEYCLOAK_CLIENT_ID_WEB}
      KEYCLOAK_PUBLIC_KEY: ${KEYCLOAK_PUBLIC_KEY}
      APPLE_TEAM_ID: ${APPLE_TEAM_ID}
      APPLE_MAP_ID_KEY: ${APPLE_MAP_ID_KEY}
      APPLE_MAP_CERTIFICATE_NAME: ${APPLE_MAP_CERTIFICATE_NAME}
      PG_HOST: ${PG_HOST}
      PG_PORT: ${PG_PORT}
      PG_USER: ${PG_USER}
      PG_PASSWORD: ${PG_PASSWORD}
      PG_DATABASE: ${PG_DATABASE}
      GITHUB_API_KEY: ${GITHUB_API_KEY}
    restart: unless-stopped

networks:
  backend:
    name: macdap-backend_default
  database:
    external: true
    name: postgresql_default
  authServer:
    external: true
    name: keycloak_default



Updated SOPFEU data for new API:

Returns an array of geolocalized polygon regions
https://www.sopfeu.qc.ca/layers/zdi.json
From the sopfeu js, there is a relation zdi.Numero === danger-incendie.NumeroZone

Returns an arry of geographics codes???
https://geofeux.sopfeu.qc.ca/sopfeu-api/public/codes-geographiques

Returns an array of fires (empty at time of writing)
https://geofeux.sopfeu.qc.ca/sopfeu-api/public/feux

Returns an array of fire risks
https://geofeux.sopfeu.qc.ca/sopfeu-api/public/danger-incendie
Seems to be like the old https://cartes.sopfeu.qc.ca/risk-zones API
sopfeuQueryRiskZones has been adapted for newer API
