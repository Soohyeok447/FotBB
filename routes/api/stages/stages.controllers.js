var User = require("../../../models/user");
var Stage = require("../../../models/stage");
var {logger} = require('../../../config/logger');


//메인메뉴에서 stage버튼을 누를 시 & 정렬방식 저장
exports.stages = async (req, res, next) => {
    const {id ,sort_type} = req.body;
    console.log(id);
    let user = await User.findOne({googleid:id});
    
    switch(sort_type){
        case "basic": //기본
            //정렬방식 저장
            user.sort_method = sort_type;
            await user.save({new:true});
            res.status(200).send("저장완료");
            break;
        case "composer": //작곡가
            //정렬방식 저장
            user.sort_method = sort_type;
            await user.save({new:true});
            res.status(200).send("저장완료");
            break;
        case "popularity_desc": //인기내림차순
            console.log("인기내림차순 정렬");
            //정렬방식 저장
            user.sort_method = sort_type;
            await user.save({new:true});
            res.status(200).send("저장완료");

            break;
        case "popularity_asc": //인기오름차순
            //정렬방식 저장
            user.sort_method = sort_type;
            await user.save({new:true});
            res.status(200).send("저장완료");

        break;
        case "favorite": //즐겨찾기
            //정렬방식 저장
            user.sort_method = sort_type;
            await user.save({new:true});
            res.status(200).send("저장완료");
            break;
        default:
            res.status(200).send("잘못된 정렬 타입입니다.")
    }
}

//스테이지목록에서 한 스테이지 눌렀을 때 랭킹 받아오기
exports.stage = async (req,res,next)=>{
    const {id,stage_name} = req.body;
    try{
        const jsonObj = {};
        let stage = await Stage.findOne({stage_name:stage_name});
        let user = await User.findOne({googleid:id});
        let country = user.country;
        //user.stage_checked
        let check_initialized = user.stage_checked.findIndex(s =>s === stage_name);
        if(check_initialized<0){ //스테이지 랭킹 불러온적이 없을 때
            user.stage_checked.push(stage_name);
            user.save({new:true});
            

            //0초 초과인 기록들 불러오기
            let cleared_Normal_array = stage.Normal.filter(it => it.cleartime >0);
            let cleared_Hard_array = stage.Hard.filter(it=> it.cleartime >0);



            //랭킹 정렬
            // cleartime 기준으로 정렬
            let sorted_Total_Normal_ranking = cleared_Normal_array.sort((a, b)=>{
                if (a.cleartime > b.cleartime) {
                return 1;
                }
                if (a.cleartime < b.cleartime) {
                return -1;
                }
                // 동률
                return 0;
            });
            
            // cleartime 기준으로 정렬
            let sorted_Total_Hard_ranking = cleared_Hard_array.sort((a, b)=>{
                if (a.cleartime > b.cleartime) {
                return 1;
                }
                if (a.cleartime < b.cleartime) {
                return -1;
                }
                // 동률
                return 0;
            });

            //1등부터 50등 까지 반환
            let sliced_Total_Normal_array = sorted_Total_Normal_ranking.slice(0,50);
            let sliced_Total_Hard_array = sorted_Total_Hard_ranking.slice(0,50);
            

            //내 등수 불러오기
            let my_Total_Normal_ranking = sorted_Total_Normal_ranking.findIndex((s) => s.userid === id)+1
            let my_Total_Hard_ranking = sorted_Total_Hard_ranking.findIndex((s) => s.userid === id)+1

            jsonObj.Total_Normal_leaderboard = sliced_Total_Normal_array;
            jsonObj.Total_Normal_ranking = my_Total_Normal_ranking;
            jsonObj.Total_Hard_leaderboard = sliced_Total_Hard_array;
            jsonObj.Total_Hard_ranking = my_Total_Hard_ranking;
        //국가 랭킹

            //국가 필터링
            let Normal_country_filter = cleared_Normal_array.filter(it => it.country === country);
            let Hard_country_filter = cleared_Hard_array.filter(it=> it.country === country);
                
               

            //랭킹 정렬
            // cleartime 기준으로 정렬
            let sorted_country_Normal_ranking = Normal_country_filter.sort((a, b)=>{
                if (a.cleartime > b.cleartime) {
                return 1;
                }
                if (a.cleartime < b.cleartime) {
                return -1;
                }
                // 동률
                return 0;
            });
        
            // cleartime 기준으로 정렬
            let sorted_country_Hard_ranking = Hard_country_filter.sort((a, b)=>{
                if (a.cleartime > b.cleartime) {
                return 1;
                }
                if (a.cleartime < b.cleartime) {
                return -1;
                }
                // 동률
                return 0;
            });

            //1등부터 50등 까지 반환
            let sliced_country_Normal_array = sorted_country_Normal_ranking.slice(0,50);
            let sliced_country_Hard_array = sorted_country_Hard_ranking.slice(0,50);
            
            //내 등수 불러오기
            let my_country_Normal_ranking = sorted_country_Normal_ranking.findIndex((s) => s.userid === id)+1
            let my_country_Hard_ranking = sorted_country_Hard_ranking.findIndex((s) => s.userid === id)+1

            jsonObj.country_Normal_leaderboard = sliced_country_Normal_array;
            jsonObj.country_Normal_ranking = my_country_Normal_ranking;
            jsonObj.country_Hard_leaderboard = sliced_country_Hard_array;
            jsonObj.country_Hard_ranking = my_country_Hard_ranking;

            res.status(200).json(jsonObj);
            logger.info(`${id} 가 스테이지 ${stage_name}의 랭킹을 로딩`)
        }else{ //스테이지를 불러온적이 있을 때,
            res.status(200).send("이미 불러온 적 있습니다.")
        }
    }catch(err){
        res.status(500).json({ error: "database failure" });
        logger.error(`${id} 가 스테이지 ${stage_name}의 랭킹로딩에 실패 [${err}]`)
        next(err);
    }
    
}


//스테이지 즐겨찾기 추가
exports.favorite = async(req,res,next)=>{
    const {id,stage_name,update_type} = req.body;
    let user = await User.findOne({googleid:id});
    try{
        let favorite = user.favorite;

        switch(update_type){
            case "add": 
                console.log("add");
                favorite.push(stage_name); 
                await user.save({new:true});
                
                //중복 제거
                var uniq_composer_array = favorite.reduce((a,b)=>{
                    if (a.indexOf(b) < 0 ) a.push(b);
                        return a;
                    },[]);
                res.status(200).json(uniq_composer_array);

                break;
            case "remove":
                console.log("remove");
                favorite.pull(stage_name); 
                await user.save({new:true});
                res.status(200).json(favorite);

                break;
            default:res.status(200).send("error : 잘못된 update_type 인자");
        }
    }catch(err){
        res.status(500).json({error : "db failure"});
        logger.error(`${id} 가 스테이지 ${stage_name}의 즐겨찾기 저장 or 삭제에 실패 [${err}]`)
        next(err);
    }
}