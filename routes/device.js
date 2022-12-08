const express = require("express");
const router = express.Router();

var db = require("knex")({
  client: "pg",
  connection: {
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
  },
});

router.get("/v2", (req, res) => getDevices(req, res, db));
router.post("/v2/connection", (req, res) => postDeviceConnection(req, res, db));
router.put("/v2", (req, res) => putDevice(req, res, db));
router.delete("/v2", (req, res) => deleteDevice(req, res, db));

module.exports = router;

const getDevices = (req, res, db) => {
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
      res
        .status(400)
        .json({
          dbError: `call sp_device_connection(${platform_type}, ${platform_id}, ${title}, ${version}, ${build_number}) - ${err.detail}`,
        });
    });
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
