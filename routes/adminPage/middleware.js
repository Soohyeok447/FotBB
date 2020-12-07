exports.isLoggedIn = (req,res,next) =>{
    console.log(req.isAuthenticated())
    if(req.isAuthenticated()){
        console.log('로그인중입니다.')
        next();
    }else{
        console.log('로그인중이 아닙니다.')
        req.session.destroy();
        res.redirect('/adminpage');
    }
};

exports.isNotLoggedIn = (req,res,next) => {
    console.log(req.isAuthenticated())
    if(!req.isAuthenticated()){
        console.log('로그인중이 아닙니다.')
        next();
    }else{
        console.log('로그인중입니다.')
        res.redirect('/adminpage/main');
    }
}