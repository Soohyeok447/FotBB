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
*/
router.post("/", async (req, res, next) => {
    const {id} = req.body;
    console.log(id);
    let user = await User.findOne({googleid:id});
    let user_stage = await User_stage.findOne({userid:id});
    
    res.status(201).json({"user_stage":user_stage.stage,"favorite":user.favorite});

});

//스테이지 창에서 어떤 곡을 눌렀을 때
router.post("/stage", async (req,res,next)=>{
    const {stage_name,sort_type,country} = req.body;
    try{
        let stage = await Stage.findOne({stage_name:stage_name});
        
        if(sort_type === "total"){ //전체 랭킹
            let cleared_Normal_array = stage.Normal.filter(it => it.cleartime >0);
            let cleared_Hard_array = stage.Hard.filter(it=> it.cleartime >0);
            
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
                res.status(201).json(favorite);

                //혹시나 오류로 중복 있을 수도 있으니 중복 방지
                favorite.reduce((acc,stage_name) => acc.includes(stage_name) ? acc : [...acc,stage_name],[]);
                break;
            case "remove":
                console.log("remove");
                favorite.pull(stage_name); 
                await user.save({new:true});
                res.status(201).json(favorite);

                //혹시나 오류로 중복 있을 수도 있으니 중복 방지
                favorite.reduce((acc,stage_name) => acc.includes(stage_name) ? acc : [...acc,stage_name],[]);

                break;
            default:res.status(201).send("error : 잘못된 update_type 인자");
        }
    }catch(err){
        res.status(500).json({error : "db failure"});
        console.error(err);
        next(err);
    }
});

//스테이지 정렬 (즐겨찾기, 작곡가, 인기순, 기본 등등)
router.post("/sort",async (req,res,next)=>{
    
});


module.exports = router;