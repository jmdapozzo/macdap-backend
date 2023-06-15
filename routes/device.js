const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const semver = require("semver");
const checkJwtBackend = require("../auth/check-jwt-backend");
const checkJwtBackendIot = require("../auth/check-jwt-backend-iot");
const { requiredScopes } = require("express-oauth2-jwt-bearer");
const { Octokit } = require("octokit");

const esp32BaseRepository = "esp32";

const octokit = new Octokit({
  auth: process.env.GITHUB
})

const esp32BaseRepositoryPath = path.join(
  process.cwd(),
  "public/repository",
  esp32BaseRepository
);

if (!fs.existsSync(esp32BaseRepositoryPath)){
  fs.mkdirSync(esp32BaseRepositoryPath, { recursive: true });
}

var db = require("knex")({
  client: "pg",
  connection: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },
});

async function getGITfileList (subDirectory) {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: 'jmdapozzo',
      repo: 'firmware-updates',
      path: subDirectory,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    let list = [];
    list = response.data.map((file) => {
      const fileType = path.extname(file.name) === ".bin" ? "bin" : "file";
      const date = new Date();
      const fileDate = date.toDateString();
      const fileTime = date.toTimeString();
      return {
        name: file.name,
        type: fileType,
        date: fileDate,
        time: fileTime,
        size: file.size,
        sha: file.sha,
        url: file.download_url,
      };
    });
    return list;
};

async function getFirmwareList(platformType, title) {
  const subDirectoryPath = path.join(esp32BaseRepository, platformType);
  const fileList = await getGITfileList(subDirectoryPath);
  const firmwareString = "firmware.bin";

  const firmwareList = fileList.filter((fileInfo) => {
    const fileName = fileInfo.name.toLowerCase();
    if (
      fileName.startsWith(title.toLowerCase()) &&
      fileName.endsWith(firmwareString)
    ) {
      const startIndex = title.toLowerCase().length + 1;
      const endIndex = fileName.indexOf("." + firmwareString);
      const version = fileInfo.name.substring(startIndex, endIndex);
      fileInfo.version = semver.parse(version);
      return fileInfo;
    }
  });
  return firmwareList;
}

async function getVersionLockStatus(
  platformType,
  platformId,
  title,
  version,
  buildNumber
) {
  let lockVersion = false;

  result = await db.raw("select fnc_device_update(?, ?, ?, ?, ?)", [
    platformType,
    platformId,
    title,
    version,
    buildNumber,
  ]);

  if (result.rows.length !== 0) {
    lockVersion = result.rows[0].fnc_device_update;
  }

  return lockVersion;
}

function getDevices(req, res, next) {
  db.select("*")
    .from("vw_devices")
    .then((items) => {
      if (items.length) {
        res.json(items);
      } else {
        res.json({ dataExists: false });
      }
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.message}` });
    });
}

function postDeviceConnection(req, res, next) {
  const { platform_type, platform_id, title, version, build_number } = req.body;
  console.log(
    `Connection from ${platform_type}:${platform_id} running application ${title}`
  );
  db.raw("call sp_device_connection(?, ?, ?, ?, ?)", [
    platform_type,
    platform_id,
    title,
    version,
    build_number,
  ])
    .then(() => {
      res.json({ postDeviceConnection: true });
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.message}` });
    });
}

async function downloadFile (url, path) {  
  const writer = fs.createWriteStream(path)

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

async function getUpdate(req, res, next) {
  try {
    const currentAppTitle = req.headers["macdap-app-title"];
    const currentAppVersion = req.headers["macdap-app-version"];
    const currentAppBuildNumber = req.headers["macdap-app-build-number"];
    const currentAppPlatformType = req.headers["macdap-platform-type"];
    const currentAppPlatformId = req.headers["macdap-platform-id"].padStart(
      16,
      "0"
    );

    const lockVersion = await getVersionLockStatus(
      currentAppPlatformType,
      currentAppPlatformId,
      currentAppTitle,
      currentAppVersion,
      currentAppBuildNumber
    );

    const currentVersion = semver.parse(currentAppVersion);

    let firmwareList = await getFirmwareList(currentAppPlatformType, currentAppTitle);
    firmwareList.sort((fileInfo1, fileInfo2) => {
      return semver.compare(fileInfo1.version, fileInfo2.version);
    });

    const versionList = firmwareList.map((firmware) => {
      return firmware.version;
    });

    const targetVersion = semver.maxSatisfying(
      versionList,
      "^" + currentVersion.toString()
    );

    if (
      !lockVersion &&
      targetVersion !== null &&
      semver.neq(targetVersion, currentVersion)
    ) {
      const targetFileInfo = firmwareList.find((fileInfo) => {
        return semver.eq(fileInfo.version, targetVersion);
      });

      const repositoryPlatformPath = path.join(
        esp32BaseRepositoryPath,
        currentAppPlatformType
      );

      if (!fs.existsSync(repositoryPlatformPath)){
        fs.mkdirSync(repositoryPlatformPath);
      }

      const filePath = path.join(
        repositoryPlatformPath,
        targetFileInfo.name
      );

      if (!fs.existsSync(filePath)){
        console.log("Getting " + targetFileInfo.url + " into " + filePath);
        await downloadFile(targetFileInfo.url, filePath);
      };

      const urlPath = path.join(
        esp32BaseRepository,
        currentAppPlatformType,
        targetFileInfo.name
      );
     let url = req.protocol + "://" + req.get("host") + "/" + urlPath;

      response = {
        name: targetFileInfo.name,
        type: targetFileInfo.type,
        date: targetFileInfo.date,
        time: targetFileInfo.time,
        size: targetFileInfo.size,
        version: targetFileInfo.version.toString(),
        url: url,
      };
      res.send(response);
    } else {
      res.send();
    }
  } catch (error) {
    next(error);
  }
}

function putOwner(req, res, next) {
  const {
    device_owner_id,
    company_name,
    contact_name,
    contact_email,
    location_name,
  } = req.body;
  db.raw("call sp_device_owner_update(?, ?, ?, ?, ?)", [
    device_owner_id,
    company_name,
    contact_name,
    contact_email,
    location_name,
  ])
    .then(() => {
      res.json({ putOwner: true });
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.message}` });
    });
}

function putLockVersion(req, res, next) {
  const { device_application_id, lock_version } = req.body;
  db.raw("call sp_device_application_set_lock_version(?, ?)", [
    device_application_id,
    lock_version,
  ])
    .then(() => {
      res.json({ putLockVersion: true });
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.message}` });
    });
}

const checkScopes = requiredScopes(["read:messages"]);

router.get("/v2", checkJwtBackend, (req, res, next) =>
  getDevices(req, res, next)
);
router.post("/v2/connection", checkJwtBackendIot, (req, res, next) =>
  postDeviceConnection(req, res, next)
);
router.get("/v2/update", checkJwtBackendIot, (req, res, next) => {
  getUpdate(req, res, next);
});
router.put("/v2/owner", checkJwtBackend, (req, res, next) => {
  putOwner(req, res, next);
});
router.put("/v2/lock-version", checkJwtBackend, (req, res, next) => {
  putLockVersion(req, res, next);
});

module.exports = router;
