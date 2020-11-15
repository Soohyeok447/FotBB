var User = require("../../models/user");
var Stage = require("../../models/stage");
var User_stage = require("../../models/user_stage");
var Banned = require("../../models/banned");
var Report = require("../../models/report_user");
require('dotenv').config();


//로그인 페이지
exports.login = async (req, res, next) => {
    res.render("admin_login",{
        error:'none'
    });
};

//메인 페이지
exports.main = async (req, res, next) => {
    try {
        if (!(req.body.email && req.body.token)) { //이메일과 토큰이 없는 잘못된 접근
            console.log("이메일이 없습니다.");
            res.render("admin_login",{ error: 'forbidden' });
        }else{
            let user = await User.exists({ email: req.body.email });
            if(req.body.email==='slasnrn@gmail.com'){ //나중에 삭제
                let users = await User.find({});
                res.render("admin_user", {
                    users: users,
                    admin: '진안이',
                    admin_email: req.body.email
                });
            }else{
                if(!user){ //DB에 없는 유저일 때
                    res.render("admin_login",{error:'nouser'});
                }else{
                    let _user = await User.findOne({email:req.body.email});
                    if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
                        console.log("어드민이 아닙니다.");
                        res.render("admin_login",{ error: 'noadmin' });
                    } else {
                        res.render("admin_main", {
                            admin: _user.googleid,
                            admin_email: req.body.email
                        });
                    }
                }
            }
        }

    } catch (err) {
        res.json({ error: "tlqkf" });
    }

};

//유저관리 페이지
exports.user = async (req, res, next) => {
    try {
        if (!(req.body.email && req.body.token)) { //이메일과 토큰이 없는 잘못된 접근
            console.log("이메일이 없습니다.");
            res.render("admin_login",{ error: 'forbidden' });
        }else{
            let user = await User.exists({ email: req.body.email });
            if(req.body.email==='slasnrn@gmail.com'){ //나중에 삭제
                let users = await User.find({});
                res.render("admin_user", {
                    users: users,
                    admin: '진안이',
                    admin_email: req.body.email
                });
            }else{
                if(!user){ //DB에 없는 유저일 때
                    res.render("admin_login",{error:'nouser'});
                }else{
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
                }
            }
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
        if (!(req.body.email && req.body.token)) { //이메일과 토큰이 없는 잘못된 접근
            console.log("이메일이 없습니다.");
            res.render("admin_login",{ error: 'forbidden' });
        }else{
            let user = await User.exists({ email: req.body.email });
            if(req.body.email==='slasnrn@gmail.com'){ //나중에 삭제
                let stages = await Stage.find({});
                res.render("admin_stage", {
                    stages: stages,
                    admin: '진안이',
                    admin_email: req.body.email
                });
            }else{
                if(!user){ //DB에 없는 유저일 때
                    res.render("admin_login",{error:'nouser'});
                }else{
                    let _user = await User.findOne({email:req.body.email});
                    if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
                        console.log("어드민이 아닙니다.");
                        res.render("admin_login",{ error: 'noadmin' });
                    } else {
                        let stages = await Stage.find({});
                        res.render("admin_stage", {
                            stages: stages,
                            admin: _user.googleid,
                            admin_email: req.body.email
                        });
                    }
                }
            }
        }

    } catch (err) {
        console.log(err);
        res.send(err);
    }

};


//밴유저 관리 페이지
exports.ban = async (req, res, next) => {
    try {
        if (!(req.body.email && req.body.token)) { //이메일과 토큰이 없는 잘못된 접근
            console.log("이메일이 없습니다.");
            res.render("admin_login",{ error: 'forbidden' });
        }else{
            let user = await User.exists({ email: req.body.email });
            if(req.body.email==='slasnrn@gmail.com'){ //나중에 삭제
                let banned = await Banned.find({});
                res.render("admin_stage", {
                    banned: banned,
                    admin: '진안이',
                    admin_email: req.body.email
                });
            }else{
                if(!user){ //DB에 없는 유저일 때
                    res.render("admin_login",{error:'nouser'});
                }else{
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
                }
            }
        }

    } catch (err) {
        console.log(err);
        res.send(err);
    }

};


//신고된 유저 관리 페이지
exports.report = async (req, res, next) => {
    try {
        if (!(req.body.email && req.body.token)) { //이메일과 토큰이 없는 잘못된 접근
            console.log("이메일이 없습니다.");
            res.render("admin_login",{ error: 'forbidden' });
        }else{
            let user = await User.exists({ email: req.body.email });
            if(req.body.email==='slasnrn@gmail.com'){ //나중에 삭제
                let reported = await Report.find({});
                res.render("admin_report", {
                    reported: reported,
                    admin: '진안이',
                    admin_email: req.body.email
                });
            }else{
                if(!user){ //DB에 없는 유저일 때
                    res.render("admin_login",{error:'nouser'});
                }else{
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
                }
            }
        }

    } catch (err) {
        console.log(err);
        res.send(err);
    }

};

//리액트연습
exports.react = async (req, res, next) => {
    try {
        console.log(req.body);
        if(req.body.value){
            res.render("react",{value:req.body.value});
        }else{
            if (!(req.body.email && req.body.token)) { //이메일과 토큰이 없는 잘못된 접근
                console.log("이메일이 없습니다.");
                res.render("admin_login",{ error: 'forbidden' });
            }else if (req.body.email && req.body.token){
                console.log("진입 ㅋㅋ");
                let user = await User.exists({ email: req.body.email });
                if(!user){ //DB에 없는 유저일 때
                    res.render("admin_login",{error:'nouser'});
                }else{
                    console.log("또 또 진입 ㅋㅋ");
                    let _user = await User.findOne({email:req.body.email});
                    if (_user.admin !== true) { //구글로그인을 했는데 어드민이 아닐 때
                        console.log("어드민이 아닙니다.");
                        res.render("admin_login",{ error: 'noadmin' });
                    } else {
                        console.log("이제 안되면 렌더링 문제");
                        res.render("react",{value:req.body.value});
                    }
                }
            }
        }

        
    } catch (err) {
        console.log(err);
        res.send(err);
    }
};