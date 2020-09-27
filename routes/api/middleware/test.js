require('dotenv').config();
var {logger} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");

var express = require("express");

const router = express.Router();

const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client(process.env.CLIENT_ID);

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");



var day_format = 'YYYY.MM.DD HH:mm:ss';
var now = moment().format(day_format);




router.post("/", async (req, res, next) => {
    const {id} = req.body;

    let N_stages = await Stage.find().select( 
        { "Normal": { $elemMatch: { userid: id } } }
        )
    
    let H_stages = await Stage.find().select(
        { "Hard": {$elemMatch:{userid:id} } }  
    )
    
    N_stages.forEach(e=>{
        let arr = e.Normal;
        arr[0].terminated = true;
    })
    H_stages.forEach(e=>{
        let arr = e.Hard;
        arr[0].terminated = true;
    })


    console.log("N_stages:",N_stages);
    console.log("H_stages:",H_stages);

    
    
})

exports.isVerified = async (req, res, next) => {
    const {token} = req.body

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        console.log(payload);
        const userid = payload['sub'];
        // If request specified a G Suite domain:
        // const domain = payload['hd'];
    }
    var result = verify().catch(console.error);
    console.log(result);
    //result가 뭔지 보고 userid 사용하고 next()처리
    
    if(result){
        next();
    }else{
        res.status(403).send("accessToken error");
        logger.error(`accessToken error`);
        upload('accessToken error',`accessToken error`);
    }
}

/* payload example
{
 // These six fields are included in all Google ID Tokens.
 "iss": "https://accounts.google.com",
 "sub": "110169484474386276334",
 "azp": "1008719970978-hb24n2dstb40o45d4feuo2ukqmcc6381.apps.googleusercontent.com",
 "aud": "1008719970978-hb24n2dstb40o45d4feuo2ukqmcc6381.apps.googleusercontent.com",
 "iat": "1433978353",
 "exp": "1433981953",

 // These seven fields are only included when the user has granted the "profile" and
 // "email" OAuth scopes to the application.
 "email": "testuser@gmail.com",
 "email_verified": "true",
 "name" : "Test User",
 "picture": "https://lh4.googleusercontent.com/-kYgzyAWpZzJ/ABCDEFGHI/AAAJKLMNOP/tIXL9Ir44LE/s99-c/photo.jpg",
 "given_name": "Test",
 "family_name": "User",
 "locale": "en"
}


출처: https://blog.rewuio.com/entry/구글-플레이-게임-서비스를-통한-인증-및-검증?category=666012 [게임을 만듭니다.]
*/


module.exports = router;