const express = require("express");
const router = express.Router();
const mapController = require("../controller/mapController");

router.post("/routes", mapController.getRoute);

module.exports = router;