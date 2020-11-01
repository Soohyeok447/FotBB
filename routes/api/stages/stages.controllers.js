var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var {logger} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');

//middleware
var {get_userid,get_now} = require("../middleware/function");

                
//////////////////verify///////////////////////
require('dotenv').config();
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);


async function verify(token,email) {
    try{
        var TokenObj ={}
        
        //email이 존재하지 않는 경우
        if(!email){
            TokenObj.verified = false;
            TokenObj.error = 'no email';
            logger.error(`no email`);
            upload('','stages | token',`no email`);
            return TokenObj;
        }else{
            var id = await get_userid(email);
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        

        var check_validation = (payload.aud === process.env.CLIENT_ID) ? true : false;

        //토큰 유효성 체크 통과
        if(check_validation && payload){
            console.log("aud일치 유효한 토큰입니다.")
            TokenObj.payload = payload;
            TokenObj.verified = true;
            
            return TokenObj;

        }else if(check_validation){
            console.log("payload가 없습니다.")
            TokenObj.verified = false;
            TokenObj.error = 'no payload';
            logger.error(`no payload error`);
            upload(email,'stages | token',`accessToken error`);
            return TokenObj;
        }else{ 
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(email,'stages | token',`accessToken error`);
            return TokenObj;
        }

    }catch(err){
        console.log("err났습니다.")
        let check_expiredtoken = /Token used too late/;
        
        let error = err.toString();
        

        let check = error.match(check_expiredtoken);
        
        //토큰 만료 에러
        if(check){
            TokenObj.error = 'Token Expired';
            TokenObj.verified = false; 
        //토큰 만료 에러 외
        }else{
            TokenObj.error = err;
            TokenObj.verified = false; 
        }
        
        logger.error(`${id} - ${email} : ${err}`);
        upload(email,`stages | token`,err);
        return TokenObj;
    }
}


////////////////////////////////////////////
function calculate_leaderboard(array,type){
    let no_0_array;

    //클리어 타임이 0이 아닌 랭킹들 필터링   
    switch(type){
        case 'Normal':
            //console.log("노말입니다잉")
            no_0_array = array.Normal.filter(it => it.cleartime >0);
            break;
        case 'Hard':
            //console.log("하드입니다잉")
            no_0_array = array.Hard.filter(it => it.cleartime >0);
            break;
        default:
            //console.log("그럴리는 없겠지만 잘못된 타입이 들어왔습니다.")
            break;
    } 
    
    
    
    //terminated된 기록들 필터링
    let no_terminated_array = no_0_array.filter(e =>e.terminated === !true);

    // cleartime 기준으로 정렬
    let sorted_ranking = no_terminated_array.sort((a, b)=>{
        if (a.cleartime > b.cleartime) {
        return 1;
        }
        if (a.cleartime < b.cleartime) {
        return -1;
        }
        // 동률
        return 0;
    });

    return sorted_ranking
}


////////////////////////////////////////////
//스테이지목록에서 한 스테이지 눌렀을 때 글로벌랭킹 받아오기
exports.global = async (req,res,next)=>{
    const {email,stage_name,token} = req.body;
    var verify_result = await verify(token,email)
    if(verify_result.verified){
        try{
            const jsonObj = {};
            let stage = await Stage.findOne({stage_name:stage_name});
            let user = await User.findOne({email:email});
            

            let userid = await get_userid(email);

            //user.stage_checked
            let check_initialized = user.stage_checked.findIndex(s =>s === stage_name);
            if(check_initialized<0){ //스테이지 랭킹 불러온적이 없을 때
                user.stage_checked.push(stage_name);
                user.save({new:true});


                let sorted_Total_Normal_ranking = calculate_leaderboard(stage,'Normal')
                let sorted_Total_Hard_ranking = calculate_leaderboard(stage,'Hard')


                //1등부터 50등 까지 반환
                let sliced_Total_Normal_array = sorted_Total_Normal_ranking.slice(0,50);
                let sliced_Total_Hard_array = sorted_Total_Hard_ranking.slice(0,50);
                
    
                //내 등수 불러오기
                let my_Total_Normal_ranking = sorted_Total_Normal_ranking.findIndex((s) => s.userid === userid)+1
                let my_Total_Hard_ranking = sorted_Total_Hard_ranking.findIndex((s) => s.userid === userid)+1
    

                jsonObj.status = 'success';

                //playcount,total_death,total_clear도 같이 반환
                jsonObj.playcount = stage.playcount;
                jsonObj.total_death = stage.total_death;
                jsonObj.total_clear = stage.total_clear;

                //랭킹 반환
                jsonObj.Total_Normal_leaderboard = sliced_Total_Normal_array;
                jsonObj.Total_Normal_ranking = my_Total_Normal_ranking;
                jsonObj.Total_Hard_leaderboard = sliced_Total_Hard_array;
                jsonObj.Total_Hard_ranking = my_Total_Hard_ranking;
            
            
                res.status(200).json(jsonObj);
                logger.info(`${userid} 가 스테이지 ${stage_name}의 랭킹을 로딩`)
            }else{ //스테이지를 불러온적이 있을 때,
                res.status(200).json({message:"이미 불러온 적 있습니다.",status:'fail'})
            }
        }catch(err){
            res.status(500).json({ error: `${err}` });
            logger.error(`${userid} 가 스테이지 ${stage_name}의 랭킹로딩에 실패 [${err}]`)
            upload(email,'stages',err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "Token error" ,"error":`${verify_result.error}`});
    }
}


////////////////////////////////////////////
//스테이지목록에서 한 스테이지 눌렀을 때 국가랭킹 받아오기
exports.country = async (req,res,next)=>{
    const {email,country,stage_name,token} = req.body;
    var verify_result = await verify(token,email)
    if(verify_result.verified){
        try{
            const jsonObj = {};
            let stage = await Stage.findOne({stage_name:stage_name});
            let user = await User.findOne({email:email});
            

            let userid = await get_userid(email);

            let stage_name_country = `${stage_name}`+'_'+`${country}`;
            //user.stage_checked
            let check_initialized = user.stage_checked.findIndex(s =>s === stage_name_country);
            if(check_initialized<0){ //스테이지 랭킹 불러온적이 없을 때
                user.stage_checked.push(stage_name_country);
                user.save({new:true});


                let sorted_Total_Normal_ranking = calculate_leaderboard(stage,'Normal')
                let sorted_Total_Hard_ranking = calculate_leaderboard(stage,'Hard')


                //국가 랭킹
    
                //국가 필터링
                let Normal_country_filter = sorted_Total_Normal_ranking.filter(it => it.country === country);
                let Hard_country_filter = sorted_Total_Hard_ranking.filter(it=> it.country === country);
                    
    
                //1등부터 50등 까지 반환
                let sliced_country_Normal_array = Normal_country_filter.slice(0,50);
                let sliced_country_Hard_array = Hard_country_filter.slice(0,50);
                
                //내 등수 불러오기
                let my_country_Normal_ranking = Normal_country_filter.findIndex((s) => s.userid === userid)+1
                let my_country_Hard_ranking = Hard_country_filter.findIndex((s) => s.userid === userid)+1
    
                jsonObj.status = 'success';

                jsonObj.country_Normal_leaderboard = sliced_country_Normal_array;
                jsonObj.country_Normal_ranking = my_country_Normal_ranking;
                jsonObj.country_Hard_leaderboard = sliced_country_Hard_array;
                jsonObj.country_Hard_ranking = my_country_Hard_ranking;



                res.status(200).json(jsonObj);
                logger.info(`${userid} 가 스테이지 ${stage_name}의 랭킹을 로딩`)
            }else{ //스테이지를 불러온적이 있을 때,
                res.status(200).json({message:"이미 불러온 적 있습니다.",status:'fail'})
            }

        }catch(err){
            res.status(500).json({ error: `${err}` });
            logger.error(`${userid} 가 스테이지 ${stage_name}의 랭킹로딩에 실패 [${err}]`)
            upload(email,'stages',err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "Token error" ,"error":`${verify_result.error}`});
    }
}
