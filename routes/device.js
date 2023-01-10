const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const checkJwtBackend = require("../auth/check-jwt-backend");
const checkJwtBackendIot = require("../auth/check-jwt-backend-iot");
const { requiredScopes } = require("express-oauth2-jwt-bearer");
const { send } = require("process");

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

const getDevices = (req, res, next, db) => {
  db.select("*")
    .from("vw_devices")
    .then((items) => {
      if (items.length) {
        res.json(items);
      } else {
        res.json({ dataExists: "false" });
      }
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.detail}` });
    });
};

const postDeviceConnection = (req, res, db) => {
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
      res.json({ postDeviceConnection: "true" });
    })
    .catch((err) => {
      res.status(400).json({
        dbError: `call sp_device_connection(${platform_type}, ${platform_id}, ${title}, ${version}, ${build_number}) - ${err.detail}`,
      });
    });
};

const getUpdate = (req, res, db) => {
  try {
    const currentAppTitle = req.headers["macdap-app-title"];
    const currentAppVersion = req.headers["macdap-app-version"];
    const currentAppBuildNumber = req.headers["macdap-app-build-number"];
    const currentAppPlatformType = req.headers["macdap-platform-type"];
    const currentAppPlatformId = req.headers["macdap-platform-id"];

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

    if (targetVersion !== null && semver.neq(targetVersion, currentVersion)) {
      const targetFileInfo = firmwareList.find((fileInfo) => {
        return semver.eq(fileInfo.version, targetVersion);
      });

      const targetPath = path.join(
        esp32BaseRepository,
        currentAppPlatformType,
        targetFileInfo.name
      );
      const targetUrl =
        req.protocol + "://" + req.get("host") + "/" + targetPath;

        res.send(targetUrl);
    } else
    {
      res.send()
    }
  } catch (error) {
    next(error);
  }
};

const putDevice = (req, res, db) => {
  const { id, first, last, email, phone, location, hobby } = req.body;
  db("testtable1")
    .where({ id })
    .update({ first, last, email, phone, location, hobby })
    .returning("*")
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.detail}` });
    });
};

const deleteDevice = (req, res, db) => {
  const { id } = req.body;
  db("testtable1")
    .where({ id })
    .del()
    .then(() => {
      res.json({ delete: "true" });
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.detail}` });
    });
};

const checkScopes = requiredScopes(["read:messages"]);

router.get("/v2", checkJwtBackend, (req, res, next) =>
  getDevices(req, res, next, db)
);
router.post("/v2/connection", checkJwtBackendIot, (req, res) =>
  postDeviceConnection(req, res, db)
);
router.get("/v2/update", checkJwtBackendIot, (req, res) =>
  getUpdate(req, res, db)
);
router.put("/v2", (req, res) => putDevice(req, res, db));
router.delete("/v2", (req, res) => deleteDevice(req, res, db));

module.exports = router;
