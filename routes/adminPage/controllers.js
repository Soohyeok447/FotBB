var User = require("../../models/user");
var Stage = require("../../models/stage");
var User_stage = require("../../models/user_stage");
var Banned = require("../../models/banned");
var Report = require("../../models/report_user");


require('dotenv').config();


//로그인 페이지
exports.login = async (req, res, next) => {
    let fmsg = req.flash();
    let feedback = '';
    if(fmsg.error){
        req.session.result = true;
        feedback=fmsg.error[0];
        req.session.feedback=feedback
    }
    console.log(req.session);
    if(req.session.result){
        console.log('result가 true')
        res.render("admin_login",{
            error:req.session.feedback,
        });
    }else{
        console.log('result가 false')
        res.render("admin_login",{
            error:'',
        });
    }
};

//메인 페이지
exports.main = async (req, res, next) => {
    try {
        console.log(req.user);
        res.render("admin_main",{
                    admin: req.user.id,
                    admin_email: req.user.email,
                });
    } catch (err) {
        res.json({ error: "tlqkf" });
    }

};


//유저관리 페이지
exports.user = async (req, res, next) => {
    try {
        let _user = await User.findOne({email:req.body.email});
        if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
            console.log("어드민이 아닙니다.");
            res.render("admin_login",{ error: 'noadmin' });
        } else {
            let users = await User.find({});
            res.render("admin_user", {
                users: users,
                admin: _user.googleid,
                admin_email: req.body.email
            });
        }
    } catch (err) {
        res.json({ error: "tlqkf" });
    }
};

//유저관리 ajax
exports.user_ajax = async (req, res, next) => {
    try {
        console.log("진입")
        console.log(req.body);
        let {search_email} = req.body;
        let result = await User.exists({email:search_email});
        if(!result){ //이메일 결과가 없을 때
            console.log("db에 없어요")
            res.status(200).json({result:'none'});
        }else{
            console.log("잘 보내지겠다.")
            let user = await User.findOne({email:search_email});
            res.status(200).json({user:user});
        }
        

    } catch (err) {
        console.log('왜 에러요?');
        //res.status(201).json({ error: "이것도 안되니?" });
    }

};

//스테이지관리 페이지
exports.stage = async (req, res, next) => {
    try {
        let stages = await Stage.find({});
        res.render("admin_stage", {
            stages: stages,
            admin: _user.googleid,
            admin_email: req.body.email
        });
    } catch (err) {
        console.log(err);
        res.send(err);
    }
};


//밴유저 관리 페이지
exports.ban = async (req, res, next) => {
    try {
        let _user = await User.findOne({email:req.body.email});
        if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
            console.log("어드민이 아닙니다.");
            res.render("admin_login",{ error: 'noadmin' });
        } else {
            let banned = await Banned.find({});
            res.render("admin_ban", {
                banned: banned,
                admin: _user.googleid,
                admin_email: req.body.email
            });
        }
    } catch (err) {
        console.log(err);
        res.send(err);
    }
};


//신고된 유저 관리 페이지
exports.report = async (req, res, next) => {
    try {
        let _user = await User.findOne({email:req.body.email});
        if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
            console.log("어드민이 아닙니다.");
            res.render("admin_login",{ error: 'noadmin' });
        } else {
            let reported = await Report.find({});
            res.render("admin_report", {
                reported: reported,
                admin: _user.googleid,
                admin_email: req.body.email
            }); 
        }
    } catch (err) {
        console.log(err);
        res.send(err);
    }
};

//리액트연습
exports.react = async (req, res, next) => {
    try {
        let _user = await User.findOne({email:req.body.email});
        if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
            console.log("어드민이 아닙니다.");
            res.render("admin_login",{ error: 'noadmin' });
        } else {
            res.render("react",{value:req.body.value});
        }
    } catch (err) {
        console.log(err);
        res.send(err);
    }
};