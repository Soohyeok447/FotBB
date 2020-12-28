var User = require("../../models/user");
var Stage = require("../../models/stage");
var User_stage = require("../../models/user_stage");
var Banned = require("../../models/banned");
var Report = require("../../models/report_user");
var fs = require('fs');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

require('dotenv').config();


//로그인 페이지
exports.login = async (req, res, next) => {
    let fmsg = req.flash();
    let feedback = '';
    if (fmsg.error) {
        req.session.result = true;
        feedback = fmsg.error[0];
        req.session.feedback = feedback
    }
    if (req.session.result) {
        //console.log('result가 true')
        res.render("admin_login", {
            error: req.session.feedback,
        });
    } else {
        //console.log('result가 false')
        res.render("admin_login", {
            error: '',
        });
    }
};

//메인 페이지
exports.main = async (req, res, next) => {
    try {
        //console.log(req.user);
        res.render("admin_main", {
            admin: req.user.id,
            admin_email: req.user.email,
        });
    } catch (err) {
        res.json({ error: "tlqkf" });
    }

};


/*
        User 컴포넌트
*/

//유저관리 페이지
exports.user = async (req, res, next) => {
    try {
        let users = await User.find({});
        let banned = await Banned.find({});
        let user_arr = [];
        //console.log(banned);
        let array = banned.map(x => {
            if (x.email) {
                return x.email;
            }
        });
        users.forEach(x => {
            if (array.includes(x.email)) {

            } else {
                user_arr.push(x)
            }
        })
        //console.log(user_arr);
        res.json({ users: user_arr, banned: array });
    } catch (err) {
        res.json({ error: "tlqkf" });
    }
};

//유저관리 ajax
exports.user_search = async (req, res, next) => {
    try {
        let { email } = req.params;
        let result = await User.findOne({ email: email });

        let banned = await Banned.find({});
        let array = banned.map(x => {
            if (x.email) {
                return x.email;
            }
        });

        if (array.includes(result.email)) {
            //여기 수정
            result = 'banned';
        } else {

        }


        if (!result) { //이메일 결과가 없을 때
            //console.log("db에 없어요")
            res.status(200).json({ user: null });
        } else {
            //console.log("잘 보내지겠다.")
            res.status(200).json({ user: result });
        }


    } catch (err) {
        //console.log('왜 에러요?', err);
        res.status(201).json({ user: null });
    }

};

//유저 밴 ajax
exports.user_ban = async (req, res, next) => {
    try {
        let { email } = req.body;

        let user = await User.findOne({ email });

        let day_format = 'YYYY.MM.DD HH:mm:ss';
        let now = moment().format(day_format);

        var ban = new Banned({
            userid: user.googleid,
            email: email,
            banned_at: now,
            reason: '관리자페이지 user컴포넌트 밴',
        });
        await ban.save({ new: true });


        //console.log("db에 없어요")
        res.status(200).json({ result: 'success' });
    } catch (err) {
        //console.log('왜 에러요?', err);
        res.status(201).json({ result: 'error' });
    }
};

//유저 정보 수정 ajax
exports.user_modify = async (req, res, next) => {
    try {
        let { googleid, modified_email, original_email, bee_custom, crystal, royal_crystal, badge, country } = req.body;
        let user = await User.findOne({ email: original_email });

        let bee_custom_arr = bee_custom.split(',');
        let badge_arr = badge.split(',');
        if (!bee_custom_arr[bee_custom_arr.length - 1]) {
            bee_custom_arr.splice(bee_custom_arr.length - 1, 1);
        }
        if (!badge_arr[badge_arr.length - 1]) {
            badge_arr.splice(badge_arr.length - 1, 1);
        }

        user.googleid = googleid;
        user.email = modified_email;
        user.bee_custom = bee_custom_arr;
        user.crystal = crystal;
        user.royal_crystal = royal_crystal;
        user.badge = badge_arr;
        user.country = country;
        await user.save({ new: true });

        res.status(200).json({ result: 'success' });
    } catch (err) {
        //console.log('왜 에러요?', err);
        res.status(201).send(err);
    }
};

/*
        Stage 컴포넌트
*/


//스테이지관리 페이지
exports.stage = async (req, res, next) => {
    try {
        let stages = await Stage.find({});
        res.json({ stages: stages });
    } catch (err) {
        //console.log(err);
        res.send(err);
    }
};


/*
        Banned 컴포넌트
*/


//밴유저 관리 페이지
exports.ban = async (req, res, next) => {
    try {
        let banned = await Banned.find({});
        res.json({ banned });

    } catch (err) {
        //console.log(err);
        res.send(err);
    }
};

//밴유저 관리 페이지
exports.user_unban = async (req, res, next) => {
    try {
        let { email } = req.body;
        await Banned.findOneAndDelete({ email: email });



        res.status(200).json({ result: 'success' });
    } catch (err) {
        //console.log('왜 에러요?', err);
        res.status(201).send(err);
    }
};

//밴유저관리 ajax
exports.banned_search = async (req, res, next) => {
    try {
        let { email } = req.params;
        let result = await Banned.findOne({ email: email });

        if (!result) { //이메일 결과가 없을 때
            //console.log("db에 없어요")
            res.status(200).json({ user: null });
        } else {
            //console.log("잘 보내지겠다.")
            res.status(200).json({ user: result });
        }
    } catch (err) {
        //console.log('왜 에러요?', err);
        res.status(201).json({ user: null });
    }

};

/*
        Report 컴포넌트
*/

//신고된 유저 관리 페이지
exports.report = async (req, res, next) => {
    try {
        let report = await Report.find({});
        res.status(200).json({ report: report });
    } catch (err) {
        //console.log(err);
        res.send(err);
    }
};

//신고된 유저 밴 ajax
exports.report_ban = async (req, res, next) => {
    try {
        let { email } = req.body;

        let user = await Report.findOne({ email });

        let day_format = 'YYYY.MM.DD HH:mm:ss';
        let now = moment().format(day_format);

        var ban = new Banned({
            userid: user.id,
            email: email,
            banned_at: now,
            reason: `관리자페이지 report컴포넌트 밴 id - ${user.id}`,
        });
        await ban.save({ new: true });
        await Report.findOneAndDelete({ email: email });

        //console.log("db에 없어요")
        res.status(200).json({ result: 'success' });
    } catch (err) {
        //console.log(err);
        res.send(err);
    }
};

//신고된 유저 닉변 ajax
exports.report_changeid = async (req, res, next) => {
    try {
        let { email, new_id } = req.body
        //닉변
        let user = await User.findOne({ email: email });
        let before_id = user.googleid;

        user.googleid = new_id;
        await user.save({ new: true });

        //User_stage의 userid 변경
        // before_id 로 Stage, User_stage에 있는 모델에 접근
        let user_stage = await User_stage.findOne({ userid: before_id });
        user_stage.userid = new_id;
        await user_stage.save({ new: true });

        //Stage의 userid 변경 
        //이건 조금 까다로운데 Stage모델속에 stage객체배열이 있고 Normal객체배열 속 userid와 Hard 객체배열 속 userid를 바꿔야한다. 
        let stage = await Stage.find({}); // 모든 다큐먼트 불러오기 (모든 스테이지)
        stage.forEach(async e => { //e 는 하나의 스테이지 객체 
            //해당 유저가 기록된 index 구하기
            normal_index = e.Normal.findIndex((s) => s.userid === before_id);
            e.Normal[normal_index].userid = new_id;
            await e.save({ new: true });
        });

        //강제닉변한횟수 +1
        let report = await Report.findOne({ email: email });
        report.id = new_id;
        report.changed_id_by_force++;
        await report.save({ new: true });



    } catch (err) {
        //console.log(err);
        res.send(err);
    }
};

//신고된 유저 검색
exports.report_search = async (req, res, next) => {
    try {
        let { email } = req.params;
        let result = await Report.findOne({ email: email });

        if (!result) { //이메일 결과가 없을 때
            //console.log("db에 없어요")
            res.status(200).json({ user: null });
        } else {
            //console.log("잘 보내지겠다.")
            res.status(200).json({ user: result });
        }
    } catch (err) {
        //console.log(err);
        res.send(err);
    }
};


exports.reportteststst = async (req, res, next) => {
    try {
        let stage = await Stage.find({}); // 모든 다큐먼트 불러오기 (모든 스테이지)

        stage.forEach(e => {
            e.playcount = 0;
            e.total_death = 0;
            e.total_clear = 0;
            e.save({ new: true });
        })
        res.status(200).send('zz');
    } catch (err) {
        //console.log(err);
    }
}

exports.filter = async (req, res, next) => {
    try {
        fs.readFile(__dirname + "/../../src/filter.txt", "utf-8", function (err, data) {
            if (err) throw err;
            res.status(200).json({ db: data });
        });


    } catch (err) {
        //console.log(err);
    }
}

exports.modifyFilter = async (req, res, next) => {
    try {
        const { db, word } = req.body;

        if (db) {
            fs.writeFile(__dirname + "/../../src/filter.txt", db, function (err) {
                if (err) {
                    console.log('저장실패');
                    console.log(err);
                }
            });
        }else{
            console.log(word);
            let filter_db = fs.readFileSync(__dirname + "/../../src/filter.txt");
            let filter = filter_db + '|' + word;
            fs.writeFile(__dirname + "/../../src/filter.txt", filter, function (err) {
                if (err) {
                    console.log('저장실패');
                    console.log(err);
                }
            });
        }

        res.status(200).json({ result: 'success' });
    } catch (err) {
        //console.log(err);
    }
}
