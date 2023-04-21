const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const checkJwtBackend = require("../auth/check-jwt-backend");
const checkJwtBackendIot = require("../auth/check-jwt-backend-iot");
const { requiredScopes } = require("express-oauth2-jwt-bearer");
//const { send } = require("process");

const esp32BaseRepository = "esp32";

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

function getRepositoryFileList(subDirectory) {
  const repositoryPath = path.join(
    process.cwd(),
    "public/repository",
    subDirectory
  );

  const files = fs.readdirSync(repositoryPath);
  let list = [];
  list = files.map((file) => {
    const stat = fs.statSync(path.join(repositoryPath, file));
    const fileType = path.extname(file) === ".bin" ? "bin" : "file";
    const date = new Date(stat.birthtime);
    const fileDate = date.toDateString();
    const fileTime = date.toTimeString();
    return {
      name: file,
      type: fileType,
      date: fileDate,
      time: fileTime,
      size: stat.size,
    };
  });
  return list;
}

function getFirmwareList(platformType, title) {
  const subDirectoryPath = path.join(esp32BaseRepository, platformType);
  const fileList = getRepositoryFileList(subDirectoryPath);
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

    let firmwareList = getFirmwareList(currentAppPlatformType, currentAppTitle);
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

      const targetPath = path.join(
        esp32BaseRepository,
        currentAppPlatformType,
        targetFileInfo.name
      );

      let url1 = req.protocol + "://" + req.get("host") + "/" + targetPath;
      let url2 =
        "http://macdap.webredirect.org/d4-88-88/" +
        currentAppTitle.toLowerCase() +
        ".2.0.3.firmware.bin";

      let url = semver.compare(currentVersion, "2.0.0") ? url1 : url2;
      //Test with curl http://macdap.webredirect.org/d4-88-88/clock.2.0.3.firmware.bin -o xxx.bin
      
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
