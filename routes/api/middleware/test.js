require('dotenv').config();

var express = require("express");

const router = express.Router();

const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client(process.env.CLIENT_ID);
var {logger} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');



router.post("/", async (req, res, next) => {
    const {token} = req.body
    
    async function verify(token) {

        try{
        
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
                // Or, if multiple clients access the backend:
                //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            });
            const payload = ticket.getPayload();
            console.log("paylaod : ",payload);
            const userid = payload['sub'];
            
    
            console.log("userid : ",userid);
    
            var check_validation = (payload.aud === process.env.CLIENT_ID) ? true : false;
            if(ticket){
                console.log("ticket존재 ",ticket)
            }else{
                console.log("티켓이 없어요")
            }
    
            if(check_validation && payload){
                console.log("aud일치 유효한 토큰입니다.")
                res.status(200).json({'message':'aud일치 유효한 토큰입니다.','payload':payload});
                //next();
            }else{
                console.log("else문 진입")
                res.status(200).json({'message':'잘 오긴 왔니?','payload':payload});
                //logger.error(`accessToken error`);
                //upload('accessToken error',`accessToken error`);
            }
        }catch(err){
            res.status(500).json({'message':'verify error'});
            console.log(err);
        }

        
    }
    var result = verify(token).catch(console.error);
    console.log(result);
    //result가 뭔지 보고 userid 사용하고 next()처리
})



exports.verifyToken = (token)=>{
    try{
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
                // Or, if multiple clients access the backend:
                //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            });
            const payload = ticket.getPayload();
            console.log("paylaod : ",payload);
            const userid = payload['sub'];
            // let check_validation = (payload.aud === process.env.CLIENT_ID) ? true : false;
    
            // if(check_validation && payload ){
            //     console.log("aud일치 유효한 토큰입니다.")
            //     res.status(200).json({'message':'aud일치 유효한 토큰입니다.'});
            //     return true;
            // }else{
            //     console.log("유효한 토큰이 아닙니다.")
            //     res.status(200).json({'message':'aud 불일치'});
            //     return false;
            // }
            return payload;
        }
        var payload = verify().catch(console.error);
        return payload;
    }catch(err){
        return res.status(500).send("유효하지 않은 토큰입니다.")
    }
}


async function isVerified(token) {
    try{
    
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        //console.log("paylaod : ",payload);
        const userid = payload['sub'];
        

        //console.log("userid : ",userid);

        var check_validation = (payload.aud === process.env.CLIENT_ID) ? true : false;

        //토큰 유효성 체크 통과
        if(check_validation && payload){
            console.log("aud일치 유효한 토큰입니다.")
            
            return payload;

            


        }else{
            console.log("else문 진입")
            return false;
            //logger.error(`accessToken error`);
            //upload('accessToken error',`accessToken error`);
        }
    }catch(err){
        return err
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

*/


module.exports = router, {isVerified};