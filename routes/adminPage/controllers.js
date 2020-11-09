var User = require("../../models/user");
require('dotenv').config();

const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.GCP_CLIENT_ID);
async function verify(token, email) {
    try {
        let user = await User.findOne({email:email});

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GCP_CLIENT_ID
        });
        const payload = ticket.getPayload();


        var check_validation = (payload.aud === process.env.GCP_CLIENT_ID) ? true : false;
        
        //토큰 유효성 체크 통과
        if (check_validation && payload && user.admin === true) {
            console.log("유효한 토큰 & 어드민입니다..")

            return true;

        } else if (check_validation) {
            console.log("payload가 없습니다.")

            return false;
        } else {
            console.log("페이로드 티켓없음 | 어드민이 아님")

            return false;
        }

    } catch (err) {
        console.log(err);
        return false;
    }
}

//로그인 페이지
exports.login = async (req, res, next) => {
    res.render("admin_login",{
        
    });
};

//메인 페이지
exports.main = async (req, res, next) => {
    res.render("admin_main",{
        
    });
};

exports.auth = async(req,res,next)=>{
    try{
        console.log(req.body);
        if(verify(req.body.id_token,req.body.email)){
            res.status(200).json({})
        }
    }catch(err){
        console.log(err);
        next(err);
    }
    
}