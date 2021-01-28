const express = require("express");
const router = express.Router();

// db Connection w/ Heroku
// const db = require('knex')({
//   client: 'pg',
//   connection: {
//     connectionString: process.env.DATABASE_URL,
//     ssl: true,
//   }
// });

// db Connection w/ localhost
var db = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "",
    password: "",
    // host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASS,
    database: "macdap-1",
  },
});

router.get("/", (req, res) => getTableData(req, res, db));
router.post("/", (req, res) => postTableData(req, res, db));
router.put("/", (req, res) => putTableData(req, res, db));
router.delete("/", (req, res) => deleteTableData(req, res, db));

module.exports = router;

const getTableData = (req, res, db) => {
  db.select("*")
    .from("testtable1")
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

const postTableData = (req, res, db) => {
  const { first, last, email, phone, location, hobby } = req.body;
  const added = new Date();
  db("testtable1")
    .insert({ first, last, email, phone, location, hobby, added })
    .returning("*")
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.status(400).json({ dbError: `db error - ${err.detail}` });
    });
};

const putTableData = (req, res, db) => {
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

const deleteTableData = (req, res, db) => {
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
