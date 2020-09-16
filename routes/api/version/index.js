var express = require('express');


var router = express.Router();
var version = '1.0.0';

router.get('/',(req,res,next) =>{
    res.json({"current_version": `${version}`});
});

module.exports = router;
exports.version = version;