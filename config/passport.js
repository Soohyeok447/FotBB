// passport.js
import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'
import User from '../models/user'


passport.use(
  new GoogleStrategy(
    {
        clientID: process.env.GCP_CLIENT_ID,
        clientSecret: process.env.GCP_PASSWORD,
        callbackURL: "https://fotbbapi.shop:2986/adminpage/login"
      },
    function (accessToken, refreshToken, profile, cb) {
      const {
        _json: { id, avatar_url, login: name, email }
      } = profile
      try {
        const user = await User.findOne({ email: email })
        if (user.admin!==true) {
          return cb(null, user)
        } else {
          
          return cb(null, user)
        }
      } catch (error) {
        return cb(error)
      }
    }
  )
)