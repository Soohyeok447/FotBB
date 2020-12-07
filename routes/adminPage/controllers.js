var User = require("../../models/user");
var Stage = require("../../models/stage");
var User_stage = require("../../models/user_stage");
var Banned = require("../../models/banned");
var Report = require("../../models/report_user");


var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

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
        let users = await User.find({});
        let banned = await Banned.find({});
        let user_arr = [];
        console.log(banned);
        let array = banned.map(x=>{
            if(x.email){
                return x.email;
            }
        });
        users.forEach(x=>{
            if(array.includes(x.email)){

            }else{
                user_arr.push(x)
            }
        })
        console.log(user_arr);
        res.json({users: user_arr,banned:array});
    } catch (err) {
        res.json({ error: "tlqkf" });
    }
};

//유저관리 ajax
exports.user_search = async (req, res, next) => {
    try {
        let {email} = req.params; 
        let result = await User.findOne({email:email});

        let banned = await Banned.find({});
        let array = banned.map(x=>{
            if(x.email){
                return x.email;
            }
        });

        if(array.includes(result.email)){
            //여기 수정
            result = 'banned';
        }else{
            
        }

        
        if(!result){ //이메일 결과가 없을 때
            console.log("db에 없어요")
            res.status(200).json({user:null});
        }else{
            console.log("잘 보내지겠다.")
            res.status(200).json({user:result});
        }
        

    } catch (err) {
        console.log('왜 에러요?',err);
        res.status(201).json({ user: null });
    }

};

//유저 밴 ajax
exports.user_ban = async (req, res, next) => {
    try {
        console.log(req.body);
        let {email} = req.body; 

        let user = await User.findOne({email});

        let day_format = 'YYYY.MM.DD HH:mm:ss';
        let now = moment().format(day_format);

        var ban = new Banned({
            userid:user.googleid,
            email:email,
            banned_at: now,
            reason: '관리자페이지 밴',
        });
        await ban.save({ new: true });
        
       
        console.log("db에 없어요")
        res.status(200).json({result:'success'});
        
        

    } catch (err) {
        console.log('왜 에러요?',err);
        res.status(201).json({result:'error'});
    }
};

//유저 정보 수정 ajax
exports.user_modify = async (req, res, next) => {
    try {
        let {googleid,modified_email,original_email,bee_custom,crystal,royal_crystal,badge} = req.body; 
        let user = await User.findOne({email:original_email});

        let bee_custom_arr = bee_custom.split(',');
        let badge_arr = badge.split(',');
        if(!bee_custom_arr[bee_custom_arr.length-1]){
            bee_custom_arr.splice(bee_custom_arr.length-1,1);
        }
        if(!badge_arr[badge_arr.length-1]){
            badge_arr.splice(badge_arr.length-1,1);
        }

        user.googleid = googleid;
        user.email = modified_email;
        user.bee_custom = bee_custom_arr;
        user.crystal = crystal;
        user.royal_crystal = royal_crystal;
        user.badge = badge_arr;
        await user.save({ new: true });
        
        res.status(200).json({result:'success'});
    } catch (err) {
        console.log('왜 에러요?',err);
        res.status(201).send(err);
    }
};


//스테이지관리 페이지
exports.stage = async (req, res, next) => {
    try {
        let stages = await Stage.find({});
        res.render("admin_stage", {
            stages: stages,
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