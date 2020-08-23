var express = require("express");

var User = require("../../../models/user");
var User_stage = require("../../../models/user_stage");
var current_version = require("../version").version;

const router = express.Router();

var jsonObj = {};

//접속 처리 라우터
router.post("/", (req, res, next) => {
    const { id } = req.body; 
    User.find({ googleid: id }, (err, user) => {
        //신규 회원
        if (user == false) {
            var user = new User({
                googleid: id,
                latest_login: Date.now(),
                version: current_version,
                //crystal: crystal,
                //...나머지는 default
            });
            user.save()
                .then((result) => {
                    res.status(201);
                    jsonObj.user = result;
                })
                .catch((err) => {
                    res.status(500).json({ error: "database failure" });
                    console.error(err);
                    next(err);
                });
            var user_stage = new User_stage({
                userid:id,
                stage:{
                   //default
                }
            })
            user_stage.save({ new: true})
                .then((result) => {
                    jsonObj.user_stage = result;
                    res.json(jsonObj);
                })
                .catch((err) => {
                    res.status(500).json({ error: "database failure" });
                    console.error(err);
                    next(err);
                });
                
        //이미 등록된 유저일 경우, 최근접속일 업데이트후 doc send(클라이언트에서 초기화용)
        } else {
            //user 스테이지도 초기화 (수정 필요)
            User_stage.findOne({userid:id})
                .then((result)=>{
                    jsonObj.user_stage = result;
                    
                })
                .catch((err)=>{
                    res.status(500).json({ error: "database failure" });
                    console.error(err);
                    next(err);
                })
            User.findOneAndUpdate(
                { googleid: id },
                { $set: { latest_login: Date.now() } },
                { new: true}
            )
                .then((result) => {
                    jsonObj.user = result;
                    res.status(201).json(jsonObj);
                })
                .catch((err) => {
                    res.status(500).json({ error: "database failure" });
                    console.error(err);
                    next(err);
                });
        }
    });
});

//크리스탈 처리 라우터
router.post("/crystal", (req, res, next) => {
    const { id , reduce_crystal} = req.body;
    User.findOneAndUpdate(
        { googleid: id },
        { $inc: { crystal: -(reduce_crystal) }  },
        { new: true})
        .then((result) => {
            res.status(201).json(result);
        })
        .catch((err) => {
            res.status(500).json({ error: "database failure" });
            console.error(err);
            next(err);
        });
});
 
module.exports = router;
