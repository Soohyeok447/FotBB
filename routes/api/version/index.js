let version = require("./current_version.js");

var express = require('express');


var router = express.Router();
var current_version = version;

router.get('/',(req,res,next) =>{
    res.json({"current_version": `${current_version}`});
});

module.exports = router;