var express = require("express");

//middleware
var { verifyToken } = require("../middleware/function");
const router = express.Router();

var resultController = require("./result.controllers");

//클리어 시
router.post("/",verifyToken ,resultController.result);
module.exports = router;