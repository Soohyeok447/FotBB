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
router.post("/:id", async (req, res, next) => {
    const id = req.params.id;
    console.log(id);
    let user = await User.findOne({googleid:id});
    let user_stage = await User_stage.findOne({userid:id});
    
    res.status(201).json({"user_stage":user_stage.stage,"favorite":user.favorite});

});

//스테이지 창에서 어떤 곡을 눌렀을 때
router.post("/stage", async(req,res,next)=>{
    const {id, stage_name} = req.body;
    let stage = await Stage.findOne({userid:id});
    
});

//스테이지 창에서 정렬버튼을 눌렀을 때
router.post("/stage/sort", async(req,res,next)=>{

});

//즐겨찾기 추가
router.post("/favorite", async(req,res,next)=>{

});

//스테이지 정렬 (즐겨찾기, 작곡가, 인기순, 기본 등등)
router.post("/sort",async (req,res,next)=>{

});


module.exports = router;