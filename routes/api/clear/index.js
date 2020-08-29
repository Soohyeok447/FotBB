var express = require("express");

var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");

const router = express.Router();

router.post("/", async (req, res, next) => {
    const {
        id,
        get_crystal,
        cleartime,
        gametype,
        stage_name,
        country,
        death, //(이거 user모델에서 받아오도록 수정)
        nextstage,
    } = req.body;
    try {
        //유저 db 갱신
        let user = await User.findOneAndUpdate(
            { googleid: id },
            {
                $inc: {
                    crystal: get_crystal,
                    playtime: cleartime,
                },
            },
            { new: true }
        ).setOptions({ runValidators: true });

        //다음 스테이지 언락  (유니티에서 처리 가능해보임)
        let user_stage = await User_stage.findOne({userid:id});
        let has_stage = (user_stage.stage.filter(s=>s.stage_name === nextstage));
        if(has_stage.length===0){
            console.log("없는 스테이지 입니다.");
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
        }else{
            console.log("있는 스테이지 입니다.");
        }
        //유저 stage db , stage 모델 갱신
        if (gametype === "Normal") {
            console.log("Normal 진입");
            // (death 변수는 user_stage 에서 가져와서 그대로 
            // 왜냐하면 업데이트 death는 fail라우터에서 처리할 거기 때문에)
            //let user_stage = await User_stage.findOne({ userid: id }); //user_stage 에서 id로 찾기
            let stage_select = user_stage.stage.filter( //stage_name으로 stage 선택
                (s) => s.stage_name === stage_name
            );
            let previous_cleartime = stage_select[0].N_cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수
            stage_select[0].N_cleartime = cleartime; //클리어타임 갱신용 (잠시 해제)
            
            //(기본 로직)
            //랭킹등록 -> 등수와 클리어타임 반환
            //첫 플레이일 경우,
            if (previous_cleartime === 0) {
                console.log("첫 랭킹 등록");
                await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                //랭킹등록 
                let stage = await Stage.findOneAndUpdate(
                    { stage_name: stage_name},
                    {
                        $addToSet: {
                            Normal: {
                                userid: id,
                                cleartime: cleartime,
                                death: death,
                                country: country,
                            },
                        },
                    },
                    { new: true}
                );
                
                // //등수와 클리어타임 반환

                
                // cleartime 기준으로 정렬
                let sorted_ranking = stage.Normal.sort((a, b)=>{
                    if (a.cleartime > b.cleartime) {
                    return 1;
                    }
                    if (a.cleartime < b.cleartime) {
                    return -1;
                    }
                    // 동률
                    return 0;
                });
                //console.log(sorted_ranking);

                //등수 찾기
                let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                console.log(cleartime,"초  ",ranking,"등입니다.");
                res.status(201).json({"ranking": `${ranking}`});
                
                
            }else{ //첫 플레이가 아닐경우(기록 존재)
                console.log("첫플레이가 아닙니다.");
                //이제 기록 갱신과 갱신이 아닌경우 처리
                console.log(`이전기록${previous_cleartime} 현재기록 ${cleartime}`)

                if(previous_cleartime>cleartime){  //기록 갱신했을 경우 (이전기록 > 현재 기록)
                    console.log("기록 갱신 성공");
                    await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                    //랭킹등록 
                    let stage = await Stage.findOne( { stage_name: stage_name});
                    let userindex = stage.Normal.findIndex((s) => s.userid === id);
                    //console.log(stage.Normal[userindex])
                    stage.Normal[userindex].cleartime = cleartime;
                    stage.Normal[userindex].death = death;
                    await stage.save({ new: true }); //신기록 갱신
                    
                     // cleartime 기준으로 정렬
                    let sorted_ranking = stage.Normal.sort((a, b)=>{
                        if (a.cleartime > b.cleartime) {
                        return 1;
                        }
                        if (a.cleartime < b.cleartime) {
                        return -1;
                        }
                        // 동률
                        return 0;
                    });
                    console.log(sorted_ranking);
                    //등수 찾기
                    let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                    console.log("기록 갱신  ",cleartime,"초  ",ranking,"등입니다.");
                    res.status(201).json({"ranking": `${ranking}`});
                
                }else{ //기록 갱신 실패했을 경우
                    console.log("기록갱신 실패했습니다.");
                    let stage = await Stage.findOne( { stage_name: stage_name});

                    // cleartime 기준으로 정렬
                    let sorted_ranking = stage.Normal.sort((a, b)=>{
                        if (a.cleartime > b.cleartime) {
                        return 1;
                        }
                        if (a.cleartime < b.cleartime) {
                        return -1;
                        }
                        // 동률
                        return 0;
                    });
                    console.log(sorted_ranking);

                    //등수 찾기
                    let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                    console.log("갱신실패 ",previous_cleartime,"초  ",ranking,"등입니다. 현재 초 :",cleartime);
                    res.status(201).json({"ranking": `${ranking}`,"previous_cleartime":`${previous_cleartime}`});
                }
            }
        }else{ //Hard
            console.log("Hard 진입");

            //let user_stage = await User_stage.findOne({ userid: id }); //user_stage 에서 id로 찾기
            let stage_select = user_stage.stage.filter( //stage_name으로 stage 선택
                (s) => s.stage_name === stage_name
            );
            let previous_cleartime = stage_select[0].H_cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수
            stage_select[0].H_cleartime = cleartime; //클리어타임 갱신용 (잠시 해제)

            //첫 플레이일 경우,
            if (previous_cleartime === 0) {
                console.log("첫 랭킹 등록");
                await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                //랭킹등록 
                let stage = await Stage.findOneAndUpdate(
                    { stage_name: stage_name},
                    {
                        $addToSet: {
                            Hard: {
                                userid: id,
                                cleartime: cleartime,
                                death: death,
                                country: country,
                            },
                        },
                    },
                    { new: true}
                );
                // //등수와 클리어타임 반환

                // cleartime 기준으로 정렬
                let sorted_ranking = stage.Hard.sort((a, b)=>{
                    if (a.cleartime > b.cleartime) {
                    return 1;
                    }
                    if (a.cleartime < b.cleartime) {
                    return -1;
                    }
                    // 동률
                    return 0;
                });
                console.log(sorted_ranking);

                //등수 찾기
                let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                console.log(cleartime,"초  ",ranking,"등입니다.");
                res.status(201).json({"ranking": `${ranking}`});
                
            }else{ //첫 플레이가 아닐경우(기록 존재)
                console.log("첫플레이가 아닙니다.");
                //이제 기록 갱신과 갱신이 아닌경우 처리
                console.log(`이전기록${previous_cleartime} 현재기록 ${cleartime}`)

                if(previous_cleartime>cleartime){  //기록 갱신했을 경우 (이전기록 > 현재 기록)
                    console.log("기록 갱신 성공");
                    await user_stage.save({ new: true }); //user_stage 모델에 cleartime 갱신

                    //랭킹등록 
                    let stage = await Stage.findOne( { stage_name: stage_name});
                    let userindex = stage.Hard.findIndex((s) => s.userid === id);
                    //console.log(stage.Hard[userindex])
                    stage.Hard[userindex].cleartime = cleartime;
                    stage.Hard[userindex].death = death;
                    await stage.save({ new: true }); //신기록 갱신
                    
                     // cleartime 기준으로 정렬
                    let sorted_ranking = stage.Hard.sort((a, b)=>{
                        if (a.cleartime > b.cleartime) {
                        return 1;
                        }
                        if (a.cleartime < b.cleartime) {
                        return -1;
                        }
                        // 동률
                        return 0;
                    });
                    console.log(sorted_ranking);
                    //등수 찾기
                    let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                    console.log("기록 갱신  ",cleartime,"초  ",ranking,"등입니다.");
                    res.status(201).json({"ranking": `${ranking}`});

                
                }else{ //기록 갱신 실패했을 경우
                    console.log("기록갱신 실패했습니다.");
                    let stage = await Stage.findOne( { stage_name: stage_name});

                    // cleartime 기준으로 정렬
                    let sorted_ranking = stage.Hard.sort((a, b)=>{
                        if (a.cleartime > b.cleartime) {
                        return 1;
                        }
                        if (a.cleartime < b.cleartime) {
                        return -1;
                        }
                        // 동률
                        return 0;
                    });
                    console.log(sorted_ranking);

                    //등수 찾기
                    let ranking = (sorted_ranking.findIndex((s) => s.userid === id)+1);
                    console.log("갱신실패 ",previous_cleartime,"초  ",ranking,"등입니다. 현재 초 :",cleartime);
                    res.status(201).json({"ranking": `${ranking}`,"previous_cleartime":`${previous_cleartime}`});
                }
            }
        }
    } catch (err) {
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
});
module.exports = router;



/*
               //실수로 stage모델 지웠을 때 생성용
                let stage = new Stage({
                    stage_name:stage_name,
                    Normal:{
                        userid:id,
                        cleartime:cleartime,
                        death: death,
                        country:country,
                    },
                    Hard:{
                        userid:id,
                        cleartime:0,
                        death: 0,
                        country:123,
                    }
                });
                await stage.save({ new: true });
                */