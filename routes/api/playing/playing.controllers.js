//게임 중 지속적으로 데이터를 받음(now_time) → 저장돼있는 now_time과 비교해서 어이없는 데이터가 들어오면 
//유저 모든 db terminate화, 밴처리를 한다. → 그리고 클리어시에도 비교


var Playing = require("../../../models/playing");
var User_stage = require("../../../models/user_stage");
var User = require("../../../models/user");

var {ban,delete_playing,get_userid,get_now} = require("../middleware/function");

var {logger,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');


            
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
            upload('','user | token',`no email`);
            return TokenObj;
        }else{
            var id = get_userid(email);
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
            upload(email,'user | token',`accessToken error`);
            return TokenObj;
        }else{ 
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(email,'user | token',`accessToken error`);
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
        upload(email,`user | token`,err);
        return TokenObj;
    }
}


//플레이 중 데이터 변조 체크
exports.check_modulation = async (req, res, next) => {
    const {email, now_time,start,stage_name,token} = req.body //gametype에 따라 구분해야한다면 나중에 수정

    var verify_result = await verify(token,email)
    if(verify_result.verified){
        try{
            let userid = await get_userid(email);
            console.log("유저아이디 함수테스트",userid);

            //존재하는 유저 인지 검사
            if(!await User.exists({email:email})){
                res.status(200).json({message:"존재하지 않는 유저입니다.",code:201});
            }else{
                    //만약에 플레이 시작하는 거면
                if(start){
                    let check_duplicate = await Playing.exists({email:email})
                    if(check_duplicate){  // 해킹이나 버그로 start=true가 또 오면
                        res.status(200).json({message:'이미 플레이 중 입니다.'});
                    }else{  //진짜 첫 플레이이면
                        let check_exist_user = await User.exists({email:email});
                        let user_stage = await User_stage.findOne({userid:userid});
                        let check_has_stage = user_stage.stage.findIndex(s => s.stage_name === stage_name);
                        console.log(check_has_stage);
                        if(!check_exist_user){//만약 존재하지 않는 유저라면
                            res.status(200).json({error:`없는 유저입니다.`})
                        }else{//db에 존재하는 유저라면
                            if(check_has_stage === -1){ //보유중이지 않은 스테이지면
                                console.log(check_has_stage);
                                res.status(200).json({error:`보유중이지 않은 스테이지 ${stage_name} playing 시도`})
                            }else{ //보유중인 스테이지면
                                console.log("start 진입했어요");
                                var user_playing = new Playing({
                                    userid: userid,
                                    email:email,
                                    now_time: now_time,
                                    start_at:get_now()
                                });
                                //playing모델에 id,now_time 필드 등록
                                await user_playing.save({ new: true });
                                res.status(200).json({message:'플레이 시작'})
                            }
                        }
                    }
                }else{
                    console.log("이전 기록과 비교를 해야합니다.")
                    //id로 해당 유저 찾고
                    let check = await Playing.findOne({email:email});
        
                    //그리고 이전 now_time이랑 비교
                    let check_result = (check.now_time >= now_time) ? true : false;
                    console.log(`저장된 기록: ${check.now_time} vs 현재 기록 : ${now_time}`);
                    console.log(check_result);
                    //만약 저장된 now_time보다 적은 time이면 (사기 기록이면)
                    if(check_result){
                        console.log("이 사람 사기 친다")
                        
                        //밴 , playing 모델에서 필드 삭제
                        ban(userid,'부정기록');
                        delete_playing(userid);
        
        
                        res.status(200).json({"previous_time":check.now_time,"now_time":now_time,"banned":true,"userid":userid});  
                        userinfo.info(`유저 ${userid} 밴 됨.`);
                        logger.info(`유저 ${userid} 밴 됨.`);
                    }else{
                        console.log("유효한 기록이므로 저장합니다.")
                        //아니면 now_time갱신
                        await Playing.findOneAndUpdate(
                            {email:email},
                            {now_time:now_time},
                            { new: true }
                        ).setOptions({ runValidators: true });
        
                        res.status(200).json({"now_time":now_time,"validation":"true"});
                    }
                }
            }
        }catch (err) {
            let id = await get_userid(email);
            res.status(500).json({ error: `${err}` });
            logger.error(`유저 밴 에러: ${email} : ${id} [${err}]`);
            userinfo.error(`유저 밴 에러: ${email} : ${id} [${err}]`);
            upload(email,'playing',err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "Token error" ,"error":`${verify_result.error}`});
    }

    
}