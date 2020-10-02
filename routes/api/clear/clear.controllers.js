var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");
var Playing = require("../../../models/playing");

var {ban,delete_playing} = require("../middleware/function");

var {logger,play,userinfo} = require('../../../config/logger');
var {upload} = require('./../../../config/s3_option');

//////////////////verify///////////////////////
require('dotenv').config();
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);


async function verify(token,id) {
    try{
        var TokenObj ={}
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        
        const userid = payload['sub'];
        
        

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
            upload(id,'',`accessToken error`);
            return TokenObj;
        }else{
            console.log("페이로드 티켓없음")
            TokenObj.verified = false;
            TokenObj.error = 'no ticket';
            logger.error(`no ticket error`);
            upload(id,'',`accessToken error`);
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
        
        logger.error(`${id} - ${err}`);
        upload(id,`clear`,err);
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


//클리어 시
exports.clear = async (req, res, next) => {
    const {
        id,
        get_crystal,
        cleartime,
        gametype,
        token,
        stage_name,
        country,
        nextstage, //(만약 유니티에서 처리가 가능하다면 Boolean값으로)
    } = req.body;
    
    //유효한 토큰이면 api 이용
    var verify_result = await verify(token)
    if(verify_result.verified){
        try {
            let playing = await Playing.findOne({userid:id});
        //부정기록인지 정당한 기록인지 체크
            //부정기록이면 밴
            if((playing.now_time>cleartime) ? true : false){
                console.log("부정기록입니다 해당 유저를 밴 합니다.")
                try{
                    //밴    
                    ban(id)
                    //playing삭제
                    delete_playing(id);
    
    
                    res.status(200).json({"now_time":playing.now_time,"cleartime":cleartime,"banned":true,"userid":id});
                    userinfo.info(`유저 ${id} 밴 됨.`);
                    logger.info(`유저 ${id} 밴 됨.`);
                }catch(err){
                    res.status(500).json({ error: "database failure" });
                    logger.error(`유저 밴 에러: ${id} [${err}]`);
                    userinfo.error(`유저 밴 에러: ${id} [${err}]`);
                    upload(err,`유저 : ${id} 밴 처리 실패 or clear컨트롤러 에러| /playing`);
                }
                
            //정당한 기록일 시
            }else{
                console.log("정당한 기록입니다. 기록을 저장합니다.")
                //playing 삭제
                delete_playing(id);
    
                    //유저 db 갱신
                await User.findOneAndUpdate(
                    { googleid: id },
                    {
                        $inc: {
                            crystal: get_crystal,
                        },
                    },
                    { new: true }
                ).setOptions({ runValidators: true });
    
                //다음 스테이지 언락  (유니티에서 처리 가능해보임) 
                //처리가 가능하다면 true false 여부만 판단해서 스테이지등록
                let user_stage = await User_stage.findOne({userid:id});
                let has_stage = (user_stage.stage.filter(s=>s.stage_name === nextstage));
                if(has_stage.length===0){  //user_stage 모델에서 해당 스테이지를 찾지 못했을 때
                    console.log("클리어한 적이 없는 스테이지 입니다.");
                    //user_stage 모델 배열에 스테이지 추가
                    await User_stage.findOneAndUpdate( 
                        {userid:id},
                        {$addToSet: {stage:{
                            stage_name:nextstage,
                            N_cleartime:0,
                            H_cleartime:0,
                            N_death:0,
                            H_death:0,
                        }}},
                        {new:true}
                        ).setOptions({ runValidators: true });
                    
                    //stage 모델 배열에 유저추가
                    await Stage.findOneAndUpdate(
                        {stage_name:nextstage},
                        {
                            $addToSet: {
                                Normal: {
                                    userid: id,
                                    cleartime: 0,
                                    death: 0,
                                    country: country,
                                    terminated: false,
                                },
                                Hard:{
                                    userid:id,
                                    cleartime: 0,
                                    death: 0,
                                    country: country,
                                    terminated: false,
                                },
                            },
                        },{new:true}).setOptions({ runValidators: true });
                    
                }else{
                    console.log("있는 스테이지 입니다.");
                }
    
            
                //유저 stage db , stage 모델 갱신
                let stage = await Stage.findOne({stage_name:stage_name});
    
                
    
                if (gametype === "Normal") {
                    console.log("Normal 진입");
                    let type = 'Normal'
                    //total_clear 갱신
                    stage.total_clear++;
                    // (death 변수는 user_stage 에서 가져와서 그대로 
                    // 왜냐하면 업데이트 death는 fail라우터에서 처리할 거기 때문에)
                    //let user_stage = await User_stage.findOne({ userid: id }); //user_stage 에서 id로 찾기
                    
                    //이전 클리어타임 확인용
                    let stage_select = stage.Normal.filter( //stage_name으로 stage 선택
                        (s) => s.userid === id
                    );
                    //console.log(stage_select);
                    let previous_cleartime = stage_select[0].cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수
                    
                    
                    
    
                    //user_stage 모델에 Normal클리어타임 갱신
                    let user_stage = await User_stage.findOne( { userid: id});
                    let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                    //console.log(stage.Normal[userindex])
    
                
                    
    
                    //(기본 로직)
                    //랭킹등록 -> 등수와 클리어타임 반환
                    //첫 플레이일 경우,
                    if (previous_cleartime === 0) {
                        console.log("첫 랭킹 등록");
    
                        //클리어타임 갱신
                        stage_select[0].cleartime = cleartime; //Stage 모델 클리어타임 갱신용 (잠시 해제)
                        user_stage.stage[userindex].N_cleartime = cleartime; // user_stage 모델 클리어 타임 갱신용
                        
                        await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신
                        
                        //랭킹등록 
                        //let stage = await Stage.findOne( { stage_name: stage_name});
                        userindex = stage.Normal.findIndex((s) => s.userid === id);
                        //console.log(stage.Normal[userindex])
                        stage.Normal[userindex].cleartime = cleartime;
                        //stage.Normal[userindex].death = user_stage.N_death;
                        
                        await stage.save({ new: true }); 
    
                        
                        var sorted_ranking = calculate_leaderboard(stage,type);
    
                        //등수 찾기
                        let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                        console.log(cleartime,"초  ",ranking,"등입니다.");
    
                        //내 바로 다음 랭커 기록 찾기
                        let compare_with_me = sorted_ranking[ranking-2];
                        //console.log(compare_with_me);
                        if(compare_with_me<0){
                            console.log("1등입니다.")
                            res.status(200).json({"ranking": `${ranking}`,"total_clear":stage.total_clear});
                        }else{ //1등이 아니면 바로 윗 랭크 기록 반환
                            res.status(200).json({"ranking": `${ranking}`,"next_user":compare_with_me,"total_clear":stage.total_clear});
                        }
                        logger.info(`${id} 가 노말 ${stage_name} 첫 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}`);
                        play.info(`${id} 가 노말 ${stage_name} 첫 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}`);
                    }else{ //첫 플레이가 아닐경우(기록 존재)
                        console.log("첫플레이가 아닙니다.");
                        //이제 기록 갱신과 갱신이 아닌경우 처리
                        console.log(`이전기록${previous_cleartime} 현재기록 ${cleartime}`)
                        
                        await stage.save({ new: true }); //stage 모델에 cleartime 갱신
    
                        if(previous_cleartime>cleartime){  //기록 갱신했을 경우 (이전기록 > 현재 기록)
                            console.log("기록 갱신 성공");
                            
                            //user_stage 모델에 Normal클리어타임 갱신
                            let user_stage = await User_stage.findOne( { userid: id});
                            let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                            //console.log(stage.Normal[userindex])
                            user_stage.stage[userindex].N_cleartime = cleartime;
    
                            await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                            //랭킹등록 
                            let stage = await Stage.findOne( { stage_name: stage_name});
                            userindex = stage.Normal.findIndex((s) => s.userid === id);
                            //console.log(stage.Normal[userindex])
                            stage.Normal[userindex].cleartime = cleartime;
                            
    
                            await stage.save({ new: true }); //신기록 갱신
                            
    
                            var sorted_ranking = calculate_leaderboard(stage,type);

                            //등수 찾기
                            let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                            console.log("기록 갱신  ",cleartime,"초  ",ranking,"등입니다.");
    
                            //내 바로 다음 랭커 기록 찾기
                            let compare_with_me = sorted_ranking[ranking-2];
                            console.log(compare_with_me);
                            if(compare_with_me<0){
                                console.log("1등입니다.")
                                res.status(200).json({"ranking": `${ranking}`,"total_clear":stage.total_clear});
                            }else{ //1등이 아니면 바로 윗 랭크 기록 반환
                                res.status(200).json({"ranking": `${ranking}`,"next_user":compare_with_me,"total_clear":stage.total_clear});
                            }
                            logger.info(`${id} 가 노말 ${stage_name} 클리어.(갱신)   랭킹 : ${ranking}  기록  : ${cleartime}`);
                            play.info(`${id} 가 노말 ${stage_name} 클리어.(갱신)   랭킹 : ${ranking}  기록  : ${cleartime}`);
                        }else{ //기록 갱신 실패했을 경우
                            console.log("기록갱신 실패했습니다.");
                            let stage = await Stage.findOne( { stage_name: stage_name});
    
    
                            var sorted_ranking = calculate_leaderboard(stage,type);
    
                            //등수 찾기
                            let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                            console.log("갱신실패 ",previous_cleartime,"초  ",ranking,"등입니다. 현재 초 :",cleartime);
                            
                            //내 바로 다음 랭커 기록 찾기
                            let compare_with_me = sorted_ranking[ranking-2];
                            console.log(compare_with_me);
                            if(compare_with_me<0){
                                console.log("1등입니다.")
                                res.status(200).json({"ranking": `${ranking}`,"previous_cleartime":`${previous_cleartime}`,"total_clear":stage.total_clear});
                            }else{ //1등이 아니면 바로 윗 랭크 기록 반환
                                res.status(200).json({"ranking": `${ranking}`,"previous_cleartime":`${previous_cleartime}`,"next_user":compare_with_me,"total_clear":stage.total_clear});
                            }
                            logger.info(`${id} 가 노말 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                            play.info(`${id} 가 노말 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                        }
                    }
                }else{ //Hard
                    var type = 'Hard';
                    console.log("Hard 진입");
    
                    //total_clear 갱신
                    stage.total_clear++;
                    //let user_stage = await User_stage.findOne({ userid: id }); //user_stage 에서 id로 찾기
                    
                    //stage 모델에 Hard 클리어 타임 갱신
                    let stage_select = stage.Hard.filter( //stage_name으로 stage 선택
                        (s) => s.userid === id
                    );
                    let previous_cleartime = stage_select[0].cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수
    
                    
                    //user_stage 모델에 Hard클리어타임 갱신
                    let user_stage = await User_stage.findOne( { userid: id});
                    let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                    //console.log(stage.Normal[userindex])
                    await stage.save({new:true}); 
    
    
    
                    //첫 플레이일 경우,
                    if (previous_cleartime === 0) {
                        console.log("첫 랭킹 등록");
    
                        //클리어 타임 갱신
                        user_stage.stage[userindex].H_cleartime = cleartime; //user_stage 모델 클리어 타임 갱신용
                        stage_select[0].cleartime = cleartime; //stage 모델 클리어타임 갱신용 (잠시 해제)
    
                        await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신
                        
                        
    
                        //let stage = await Stage.findOne( { stage_name: stage_name});
                        userindex = stage.Hard.findIndex((s) => s.userid === id);
                        //console.log(stage.Normal[userindex])
                        stage.Hard[userindex].cleartime = cleartime;
                        //stage.Hard[userindex].death = user_stage.H_death;
                        
                        await stage.save({ new: true }); 
    
    
                        var sorted_ranking = calculate_leaderboard(stage,type);
    
                        //등수 찾기
                        let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                        console.log(cleartime,"초  ",ranking,"등입니다.");
    
                        //내 바로 다음 랭커 기록 찾기
                        let compare_with_me = sorted_ranking[ranking-2];
                        console.log(compare_with_me);
                        if(compare_with_me<0){
                            console.log("1등입니다.")
                            res.status(200).json({"ranking": `${ranking}`,"total_clear":stage.total_clear});
                        }else{ //1등이 아니면 바로 윗 랭크 기록 반환
                            res.status(200).json({"ranking": `${ranking}`,"next_user":compare_with_me,"total_clear":stage.total_clear});
                        }
                        logger.info(`${id} 가 하드 ${stage_name} 첫 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}`);
                        play.info(`${id} 가 하드 ${stage_name} 첫 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}`);
                    }else{ //첫 플레이가 아닐경우(기록 존재)
                        console.log("첫플레이가 아닙니다.");
                        //이제 기록 갱신과 갱신이 아닌경우 처리
                        console.log(`이전기록${previous_cleartime} 현재기록 ${cleartime}`)
                        
                        
    
                        if(previous_cleartime>cleartime){  //기록 갱신했을 경우 (이전기록 > 현재 기록)
                            console.log("기록 갱신 성공");
    
                            //user_stage 모델에 Hard클리어타임 갱신
                            let user_stage = await User_stage.findOne( { userid: id});
                            let userindex = user_stage.stage.findIndex((s) => s.stage_name === stage_name);
                            //console.log(stage.Normal[userindex])
                            user_stage.stage[userindex].H_cleartime = cleartime;
    
                            await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신


                            //랭킹등록 
                            //let stage = await Stage.findOne( { stage_name: stage_name});
                            userindex = stage.Hard.findIndex((s) => s.userid === id);
                            //console.log(stage.Hard[userindex])
                            stage.Hard[userindex].cleartime = cleartime;
                            //stage.Hard[userindex].death = user_stage.H_death;
                            await stage.save({ new: true }); //신기록 갱신
                            
    
                            var sorted_ranking = calculate_leaderboard(stage,type);

                            //등수 찾기
                            let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                            console.log("기록 갱신  ",cleartime,"초  ",ranking,"등입니다.");
    
                            //내 바로 다음 랭커 기록 찾기
                            let compare_with_me = (sorted_ranking[ranking-2]);
                            if((ranking-2)<0){
                                console.log("1등입니다.")
                                res.status(200).json({"ranking": `${ranking}`,"total_clear":stage.total_clear});
                            }else{ //1등이 아니면 바로 윗 랭크 기록 반환
                                res.status(200).json({"ranking": `${ranking}`,"next_user":compare_with_me,"total_clear":stage.total_clear});
                            }
    
                            logger.info(`${id} 가 하드 ${stage_name} 클리어.(갱신)   랭킹 : ${ranking}  기록  : ${cleartime}`);
                            play.info(`${id} 가 하드 ${stage_name} 클리어.(갱신)   랭킹 : ${ranking}  기록  : ${cleartime}`);
    
                        
                        }else{ //기록 갱신 실패했을 경우
                            console.log("기록갱신 실패했습니다.");
                            let stage = await Stage.findOne( { stage_name: stage_name});
    
                            var sorted_ranking = calculate_leaderboard(stage,type);
    
    
                            //등수 찾기
                            let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                            console.log("갱신실패 ",previous_cleartime,"초  ",ranking,"등입니다. 현재 초 :",cleartime);
    
                            //내 바로 다음 랭커 기록 찾기
                            let compare_with_me = (sorted_ranking[ranking-2]);
                            if((ranking-2)<0){
                                console.log("1등입니다.")
                                res.status(200).json({"ranking": `${ranking}`,"previous_cleartime":`${previous_cleartime}`,"total_clear":stage.total_clear});
                            }else{ //1등이 아니면 바로 윗 랭크 기록 반환
                                res.status(200).json({"ranking": `${ranking}`,"previous_cleartime":`${previous_cleartime}`,"next_user":compare_with_me,"total_clear":stage.total_clear});
                            }
    
                            logger.info(`${id} 가 하드 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                            play.info(`${id} 가 하드 ${stage_name} 클리어.   랭킹 : ${ranking}  기록  : ${cleartime}   이전기록  :  ${previous_cleartime}`);
                        }
                    }
                }
            }      
        } catch (err) {
            res.status(500).json({ error: `${err}` });
            logger.error(`스테이지 clear 에러: ${id} [${err}]`);
            play.error(`스테이지 clear 에러: ${id} [${err}]`);
            upload(id,`clear`,err);
            next(err);
        }
    }else{
        res.status(500).json({ "message": "Token error" ,"error":`${verify_result.error}`});
    }
}