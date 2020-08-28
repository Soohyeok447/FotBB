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

        //유저 stage db , stage 모델 갱신
        if (gametype === "Normal") {
            console.log("Normal 진입");
            // (death 변수는 user_stage 에서 가져와서 그대로 
            // 왜냐하면 업데이트 death는 fail라우터에서 처리할 거기 때문에)
            let user_stage = await User_stage.findOne({ userid: id }); //user_stage 에서 id로 찾기
            let stage_select = user_stage.stage.filter( //stage_name으로 stage 선택
                (s) => s.stage_name === stage_name
            );
            let previous_cleartime = stage_select[0].N_cleartime; //이전기록과 클리어타임 비교용인 이전기록 변수
            //stage_select[0].N_cleartime = cleartime; //클리어타임 갱신용 (잠시 해제)

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
                                death: 0,
                                country: country,
                            },
                        },
                    },
                    { new: true}
                );
                

                //등수와 클리어타임 반환
                let rank = await Stage.findOne({stage_name:stage_name});
                
                // cleartime 기준으로 정렬
                let sorted_array = rank.Normal.sort((a, b)=>{
                    if (a.cleartime > b.cleartime) {
                    return 1;
                    }
                    if (a.cleartime < b.cleartime) {
                    return -1;
                    }
                    // a must be equal to b
                    return 0;
                });
                console.log(sorted_array);

                //등수 찾기
                let ranking = (sorted_array.findIndex((s) => s.userid === id)+1);
                console.log(cleartime,"초  ",ranking,"등입니다.");
                res.status(201).json(ranking);
            }else{ //첫 플레이가 아닐경우(기록 존재)
                console.log("첫플레이가 아닙니다.");
                //이제 기록 갱신과 갱신이 아닌경우 처리
            }
            /*
            //첫 플레이 이거나, 기록이 이미 있을경우
            if (previous_cleartime > cleartime) {
                //기록 갱신
                console.log("신기록");
                stage_select[0].N_cleartime = cleartime;
                await user_stage.save({ new: true });
                // json에 합칠까?

                //이제 stage모델에 저장해야함(랭킹)
                //previous_cleartime이 0이라는 뜻은 클리어를 못했다는 것이고,
                //아직 랭킹에 다큐먼트 등록이 안됐다는 뜻임.
                if (previous_cleartime === 0) {
                    //랭킹 등록
                    console.log("랭킹 등록");
                    // let stage = await Stage.findOneAndUpdate(
                    //     {stage_name:stage_name},

                    // )
                    //전체 랭킹에서 불러올 때 정렬하자
                    await stage.save({ new: true });
                    stage = await Stage.findOne({ stage_name: stage_name }); // 무슨 스테이지 다큐먼트에서 찾을 건지
                    let ranking_user = stage.Normal.sort(
                        (a, b) => a.cleartime > b.cleartime
                    ).findIndex((s) => s.userid === id); //id로 해당 유저의 스키마에 접근
                    console.log(ranking_user + 1, "등"); // => 내 등수
                    res.status(201).json();
                } else {
                    //이미 기록이 있을 때
                    console.log("기록이 이미 있는 경우");
                    let stage = await Stage.findOne({ stage_name: stage_name });
                    // let find_user = stage.filter(s=>s.userid === id);
                    console.log(find_user);
                }
            } else {
                //기록 갱신 실패
                //이제 원래 있던 값을 response 해야함 (user_stage , stage모델)
            }
        } else {
            //Hard
            console.log("Hard 진입");
            let user_stage = await User_stage.findOne({ userid: id });
            let stage_select = user_stage.stage.filter(
                (s) => s.stage_name === stage_name
            );
            let previous_cleartime = stage_select[0].H_cleartime;

            if (previous_cleartime > cleartime) {
                //기록 갱신
                console.log("신기록");
                stage_select[0].H_cleartime = cleartime;
                await user_stage.save({ new: true });
                //res.status(201).json(stage_select);
            } else {
                //res.status(201).json(stage_select);
            }
        }
        */
        }
    } catch (err) {
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
});
module.exports = router;
