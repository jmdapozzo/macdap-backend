var createError = require("http-errors");
var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require('axios');
const { Octokit } = require("octokit");

const octokit = new Octokit({
  auth: process.env.GITHUB
})

const repositoryPath = path.join(
  process.cwd(),
  "public/repository"
);

if (!fs.existsSync(repositoryPath)){
  fs.mkdirSync(repositoryPath, { recursive: true });
}

async function getGITfile (file) {
  const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: 'jmdapozzo',
    repo: 'firmware-updates',
    path: file,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  return response.data;
};

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

const getFile = async (req, res, next) => {
  try {
    if (req.params[0]) {
      const filePath = req.params[0];
      const fileName = path.parse(filePath).base
      const fileDir = path.parse(filePath).dir;
      const requestedPath = path.join(
        repositoryPath,
        fileDir
      );
      if (!fs.existsSync(requestedPath)){
        fs.mkdirSync(requestedPath, { recursive: true });
      }

      const requestedFile = path.join(
        requestedPath,
        fileName
      );

      if (!fs.existsSync(requestedFile)){
        const fileProperties = await getGITfile(filePath);
        console.log("Getting " + fileProperties.download_url + " into " + filePath);
        await downloadFile(fileProperties.download_url, requestedFile);
      }

      if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
        const user_agent = req.get("user-agent");
        const sec_fetch_site = req.get("sec-fetch-site");
        if ((user_agent == "ESP32-http-Update") || (sec_fetch_site == "same-origin")) {
          const sta_mac = req.get("X-Esp32-Sta-Mac");
          const ap_mac = req.get("X-Esp32-Ap-Mac");
          const free_space = req.get("X-Esp32-Free-Space");
          const sketch_size = req.get("X-Esp32-Sketch-Size");
          const sketch_md5 = req.get("X-Esp32-Sketch-Md5");
          const sketch_sha256 = req.get("X-Esp32-Sketch-Sha256");
          const chip_size = req.get("X-Esp32-Chip-Size");
          const sdk_version = req.get("X-Esp32-Sdk-Version");
          const mode = req.get("X-Esp32-Mode");
        } else {
          throw new Error("The request available only from ESP32 http updater");
        }
        res.sendFile(requestedFile);
      } else {
        next(createError(404));
      }
    } else {
      res.render("index", { title: "Express" });
    }
  } catch (error) {
    console.error(`get: ${error.name} ${error.message}`);
    next(error);
  }
};

const getCatalog = async (req, res, next) => {
  try {
    if (req.query.op === "list") {
      const repositoryPath = path.join(
        repositoryPath,
        req.query.path
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

      const firmwareList = list.filter((fileInfo) => {
        if (fileInfo.name.endsWith("firmware.bin")) {
          return fileInfo;
        }
      });

      res.setHeader("content-type", "application/json");
      res.send(firmwareList);
    } else {
      throw new Error(`Unsupported operation '${req.query.op}'`);
    }
  } catch (error) {
    console.error(`getCatalog: ${error.name} ${error.code}`);
    next(error);
  }
};

router.get("/_catalog", (req, res, next) => getCatalog(req, res, next));
router.get("/*", (req, res, next) => getFile(req, res, next));

module.exports = router;
