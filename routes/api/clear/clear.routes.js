var express = require("express");


const router = express.Router();

var clearController = require("./clear.controllers");

//클리어 시
router.post("/", clearController.clear);
module.exports = router;