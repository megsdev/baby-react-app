require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const massive = require('massive')
const Auth0Strategy = require('passport-auth0')
const fc = require('./controllers/foodController')

const app = express()

//cors
app.use(cors())

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
}))
app.use(bodyParser())

app.use(passport.initialize())
app.use(passport.session())

//Massive
massive(process.env.CONNECTION_STRING).then(dbInstance => {
    app.set('db', dbInstance)
})

app.get('/testing', (req, res, next) => {
    let db = req.app.get('db')
    console.log('db')
})

//strategy
passport.use(new Auth0Strategy({
    domain: process.env.AUTH_DOMAIN,
    clientID: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.AUTH_CALLBACK,
    scope: 'openid profile email'
}, function(accessToken, refreshToken, extraParams, profile, done) {
    let db = app.get('db')
    console.log('profile', profile)
    db.get_by_auth_id({auth_id: profile['user_id']}).then(user => {
        if(user.length) {
            return done(null, {id: user[0].id})
        } else {
            let { displayName: user_name, user_id: auth_id, emails } = profile
            let email = emails[0].value;

            db.create_user({user_name, auth_id, email}).then( user => {
                return done(null, {id: user[0].id})
            })
        }
    })
}))

//TODO: build out functionality
app.get('/me', (req, res) => {
    if(req.user) {
        res.send({
            name: req.user.user_name,
            email: req.user.email
        })
    } else {
        res.sendStatus(401)
    }
})

//auth routes
app.get('/auth', passport.authenticate('auth0'));

app.get('/auth/callback', passport.authenticate('auth0', {
    successRedirect: 'http://localhost:3000/#/profile',
    failureRedirect: 'http://localhost:3000/#/home'
}))

passport.serializeUser((user,done) => {
    console.log('serialize user', user)
    done(null, {id: user.id})
})

passport.deserializeUser((user, done) => {
    console.log('user in deserialize', user)
    let db = app.get('db')
    db.get_session_user({id: user.id}).then( user => {
        console.log('user in getsession user', user)
        return done(null, user[0])
    })
})

//route
app.get('/db/create', (req, res, next) => {
    let db = req.app.get('db')
    db.create_user_table().then( res => {
        console.log('res', res)
    })
})

//routes
app.get('/api/food/', fc.getFoodies)
app.post('/api/food', fc.postFood)

app.listen(3005, () => {
    console.log(`listening on port 3005`)
})