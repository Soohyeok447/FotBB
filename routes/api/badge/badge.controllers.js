var User = require("../../../models/user");

var {get_userid} = require("../middleware/function");

var {logger,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');


//뱃지 획득
exports.badge = async (req, res, next) => {
    const {email, badge } = req.body;
    try{
        if(!badge){
            res.status(200).json({error:"no badge",status:'fail'});
        }else{
            let user = await User.findOne({ email: email });
            let has_badge = user.badge.find(e=> e===badge);
            if(has_badge){
                
                res.status(200).json({message:"이미 보유중인 뱃지입니다.",status:'fail'});
            }else{

                user.badge.push(badge);
                await user.save({new:true});
                
                res.status(200).json({user:user,status:'success'});
            }
        }
    }catch (err) {
        let id = await get_userid(email);
        res.status(500).json({ error: `${err}` });
        logger.error(`유저 뱃지획득 에러: ${email} : ${id} [${err}]`);
        userinfo.error(`유저 뱃지획득 에러: ${email} : ${id} [${err}]`);
        upload(email,'badge',err);
        next(err);
    }
    
}