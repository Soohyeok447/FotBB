var express = require("express");

var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var Stage = require("../../../models/stage");

const router = express.Router();

//메인메뉴에서 stage버튼을 누를 시,
/*
            필요한 기능
    id로 해당 유저의 document 찾고 
    User_stage 모델의 현재 보유중인 
    스테이지, 노말 & 하드 클리어타임 ,죽은 횟수를 
    다 불러와야 함

    & 스테이지목록 정렬 (즐겨찾기, 작곡가, 인기순, 기본 등등)
    sort_type => basic | composer | popularity | favorite
*/
router.post("/", async (req, res, next) => {
    const {id ,sort_type} = req.body;
    console.log(id);
    let user = await User.findOne({googleid:id});
    let user_stage = await User_stage.findOne({userid:id});
    let stage = await Stage.find({});
    let stage_array = [];
    
    switch(sort_type){
        case "basic": //기본
            //성능이 뭐가 더 좋은지 몰라서 두개 다 만듬

            // for(let s in stage){
            //     stage_array.push(stage[s].stage_name); //총 스테이지 목록
            // }

            stage.forEach(s=>{
                stage_array.push(s.stage_name); //총 스테이지 목록
            })


            res.status(201).json({"total_stage":stage_array,"user_stage":user_stage.stage});
            break;
        case "composer": //작곡가
            /*
                1. 작곡가 목록을 뽑아낸다.
                2. 작곡가 별로 모아 반환.
            */
            console.log("작곡가별 정렬");
            let composer_array = [];

            stage.forEach(s=>{
                stage_array.push(s.composer); //총 스테이지 목록
            });

            //중복 제거
            var uniq_composer_array = stage_array.reduce((a,b)=>{
            if (a.indexOf(b) < 0 ) a.push(b);
                return a;
              },[]);
            
            //작곡가별 스테이지 이차원 배열화
            for(let s in uniq_composer_array){
                let select_composer = await Stage.find({composer:uniq_composer_array[s]});
                composer_array.push(select_composer); //총 스테이지 목록
            }

            res.status(201).json({"composer_index":uniq_composer_array,"user_stage":composer_array});
            break;
        case "popularity_desc": //인기내림차순
            console.log("인기내림차순 정렬");
            /*
                1. 스테이지목록에서 인기순별로 정렬
                2. 정렬한 데이터 json으로 반환
            */
            
            
            // cleartime 기준으로 정렬
            let desc_popularity_array = stage.sort((a, b)=>{
                if (a.popularity < b.popularity) {
                return 1;
                }
                if (a.popularity > b.popularity) {
                return -1;
                }
                // 동률
                return 0;
            });
            res.status(201).json({"sorted_ranking":desc_popularity_array});

            break;
        case "popularity_asc": //인기오름차순
            console.log("인기 오름차순정렬");
            /*
                1. 스테이지목록에서 인기순별로 정렬
                2. 정렬한 데이터 json으로 반환
            */
            
            
            // cleartime 기준으로 정렬
            let asc_popularity_array = stage.sort((a, b)=>{
                if (a.popularity > b.popularity) {
                return 1;
                }
                if (a.popularity < b.popularity) {
                return -1;
                }
                // 동률
                return 0;
            });
            res.status(201).json({"sorted_ranking":asc_popularity_array});

        break;
        case "favorite": //즐겨찾기
            console.log("즐겨찾기 목록");
            console.log(user.favorite);
            
            //배열에 즐겨찾기상태인 스테이지 저장
            for(s in user.favorite){
                let search_favorite = await Stage.findOne({stage_name:user.favorite[s]})
                stage_array.push(search_favorite);
            }

            res.status(201).json(stage_array);
            break;
        default:
            res.status(201).send("잘못된 정렬 타입입니다.")
    }
});

//스테이지 창에서 어떤 곡을 눌렀을 때
router.post("/stage", async (req,res,next)=>{
    const {stage_name,sort_type,country} = req.body;
    try{
        let stage = await Stage.findOne({stage_name:stage_name});
        
        if(sort_type === "total"){ //전체 랭킹
            let cleared_Normal_array = stage.Normal.filter(it => it.cleartime >0);
            let cleared_Hard_array = stage.Hard.filter(it=> it.cleartime >0);
            
            //랭킹 정렬
            // cleartime 기준으로 정렬
            let sorted_Normal_ranking = cleared_Normal_array.sort((a, b)=>{
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
            let sorted_Hard_ranking = cleared_Hard_array.sort((a, b)=>{
                if (a.cleartime > b.cleartime) {
                return 1;
                }
                if (a.cleartime < b.cleartime) {
                return -1;
                }
                // 동률
                return 0;
            });
            
            res.status(201).json({"Normal":sorted_Normal_ranking,"Hard":sorted_Hard_ranking})
        }else{ //국가 랭킹
            let cleared_Normal_array = stage.Normal.filter(it => it.cleartime >0);
            let cleared_Hard_array = stage.Hard.filter(it=> it.cleartime >0);
            
            let Normal_country_filter = cleared_Normal_array.filter(it => it.country === country);
            let Hard_country_filter = cleared_Hard_array.filter(it=> it.country === country);

            //랭킹 정렬
            // cleartime 기준으로 정렬
            let sorted_Normal_ranking = Normal_country_filter.sort((a, b)=>{
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
            let sorted_Hard_ranking = Hard_country_filter.sort((a, b)=>{
                if (a.cleartime > b.cleartime) {
                return 1;
                }
                if (a.cleartime < b.cleartime) {
                return -1;
                }
                // 동률
                return 0;
            });
            
            res.status(201).json({"Normal":sorted_Normal_ranking,"Hard":sorted_Hard_ranking})
        }
        
    }catch(err){
        res.status(500).json({ error: "database failure" });
        console.error(err);
        next(err);
    }
    
});

//즐겨찾기 추가
router.post("/favorite", async(req,res,next)=>{
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
                res.status(201).json(uniq_composer_array);

                break;
            case "remove":
                console.log("remove");
                favorite.pull(stage_name); 
                await user.save({new:true});
                res.status(201).json(favorite);

                break;
            default:res.status(201).send("error : 잘못된 update_type 인자");
        }
    }catch(err){
        res.status(500).json({error : "db failure"});
        console.error(err);
        next(err);
    }
});

module.exports = router;