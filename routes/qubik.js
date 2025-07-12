const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("qubik/index");
});

module.exports = router;
