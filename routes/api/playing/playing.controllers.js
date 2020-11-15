//게임 중 지속적으로 데이터를 받음(now_time) → 저장돼있는 now_time과 비교해서 어이없는 데이터가 들어오면 
//유저 모든 db terminate화, 밴처리를 한다. → 그리고 클리어시에도 비교


var Playing = require("../../../models/playing");
var Stage = require("../../../models/stage");
var User_stage = require("../../../models/user_stage");
var User = require("../../../models/user");

var {ban,delete_playing,get_userid,get_now} = require("../middleware/function");

var {logger,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');


//플레이 중 데이터 변조 체크
exports.check_modulation = async (req, res, next) => {
    const {email, now_time,start,stage_name} = req.body //gametype에 따라 구분해야한다면 나중에 수정

    try{
        let userid = await get_userid(email);
        //console.log("유저아이디 함수테스트",userid);

        //존재하는 유저 인지 검사
        if(!await User.exists({email:email})){
            res.status(200).json({message:"존재하지 않는 유저입니다."});
        }else{
            

                //만약에 플레이 시작하는 거면
            if(start){
                let check_duplicate = await Playing.exists({email:email})
                if(check_duplicate){  // 해킹이나 버그로 start=true가 또 오거나
                    await delete_playing(email); //playing DB 초기화
                    var user_playing = new Playing({
                        userid: userid,
                        email:email,
                        now_time: now_time,
                        start_at:get_now(),
                        stage_name:stage_name
                    });
                    //playing모델에 id,now_time 필드 등록
                    await user_playing.save({ new: true });
                    res.status(200).json({message:'새로운 시작.'});
                }else{  //진짜 첫 플레이이면
                    let check_exist_user = await User.exists({email:email});
                    let user_stage = await User_stage.findOne({userid:userid});
                    await up_playcount(stage_name);

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
                            await delete_playing(email); //playing DB 초기화
                            var user_playing = new Playing({
                                userid: userid,
                                email:email,
                                now_time: now_time,
                                start_at:get_now(),
                                stage_name:stage_name
                            });
                            //playing모델에 id,now_time 필드 등록
                            await user_playing.save({ new: true });
                            res.status(200).json({message:'플레이 시작'})
                        }
                    }
                }
            //start 가 false일 때,
            }else{
                //start가 false인데 playing DB에 존재하지 않을 때,
                if(!await Playing.exists({email:email})){
                    res.status(200).json({message:"잘못된 접근입니다."});
                //올바른 접근일 때
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
                        ban(email,'부정기록');
                        await delete_playing(email);
        
        
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
        }
    }catch (err) {
        let id = await get_userid(email);
        res.status(500).json({ error: `${err}` });
        logger.error(`유저 밴 에러: ${email} : ${id} [${err}]`);
        userinfo.error(`유저 밴 에러: ${email} : ${id} [${err}]`);
        upload(email,'playing',err);
        next(err);
    }
    

    

    async function up_playcount(stage_name){
        // 스테이지 플레이 횟수 증가
        let selected_stage = await Stage.findOne({stage_name});
        selected_stage.playcount++;
        await selected_stage.save({new:true});
    }
}