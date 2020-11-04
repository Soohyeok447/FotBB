var express = require('express');
var router = express.Router();


var Controller = require("./controllers");

router.get("/",Controller.login);

router.post("/main",Controller.main);

module.exports = router;