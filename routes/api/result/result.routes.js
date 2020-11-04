var express = require("express");


const router = express.Router();

var resultController = require("./result.controllers");

//클리어 시
router.post("/", resultController.result);
module.exports = router;