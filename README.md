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

version: "3.9"
services:
  macdap-backend:
    platform: linux/amd64
    image: jmdapozzo/macdap-backend
    container_name: macdap-backend
    build: .
    ports:
      - "3000:3000"
    volumes:
      - /volume1/docker/macdap:/app/public/repository:rw
    environment:
      NODE_ENV: development
      DEBUG: app
      AUTH0_ISSUER: ${AUTH0_ISSUER}
      AUTH0_AUDIENCE_BACKEND: ${AUTH0_AUDIENCE_BACKEND}
      AUTH0_AUDIENCE_BACKEND_IOT: ${AUTH0_AUDIENCE_BACKEND_IOT}
      AUTH0_AUDIENCE_MANAGEMENT: ${AUTH0_AUDIENCE_MANAGEMENT}
      AUTH0_CLIENT_ID: ${AUTH0_CLIENT_ID}
      AUTH0_CLIENT_SECRET: ${AUTH0_CLIENT_SECRET}
      AUTH0_ACCESS_TOKEN_URL: ${AUTH0_ACCESS_TOKEN_URL}
      KEYCLOAK_REALM: ${KEYCLOAK_REALM}
      KEYCLOAK_SERVER_URL: ${KEYCLOAK_SERVER_URL}
      KEYCLOAK_CLIENT_ID_IOT: ${KEYCLOAK_CLIENT_ID_IOT}
      KEYCLOAK_CLIENT_ID_WEB: ${KEYCLOAK_CLIENT_ID_WEB}
      KEYCLOAK_PUBLIC_KEY: ${KEYCLOAK_PUBLIC_KEY}
      PG_HOST: ${PG_HOST}
      PG_PORT: ${PG_PORT}
      PG_USER: ${PG_USER}
      PG_PASSWORD: ${PG_PASSWORD}
      PG_DATABASE: ${PG_DATABASE}
      GITHUB_API_KEY: ${GITHUB_API_KEY}
    restart: no


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
