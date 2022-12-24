//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create')
const FacebookStrategy = require('passport-facebook')

const app = express();

mongoose.set('strictQuery', true)


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))


app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB')

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({
            facebookId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        scope: ['profile', 'email']
    },
    //userProfileURL :"https://www.googleapis.com/oauth2/v3/userinfo",
    function (accessToken, refreshToken, profile, done) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return done(err, user);
        });
    },
    // function (accessToken, refreshToken, profile, cb) {
    //     User.findOrCreate({
    //         googleId: profile.id
    //     }, function (err, user) {
    //         return cb(err, user);
    //     });
    // }
));



app.route('/')
    .get((req, res) => {
        res.render('home');
    });


app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {

        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('secrets');
                })
            }
        })
    })


app.route('/secrets')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render('secrets')
        } else {
            res.redirect('/login')
        }


    })



app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        User.register({
            username: req.body.username
        }, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect('/register')
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect('/secrets')
                })
            }
        })


    })



// app.get("/auth/google",
//     passport.authenticate('google', {
//         scope: ["profile"]
//     }),
//     function (req, res) {
//         // Successful authentication, redirect to secrets.

//     });

app.route("/auth/google")
    .get(passport.authenticate('google', {
        scope: ["profile"]
    }), (res, req) => {
        res.redirect("/auth/google/secrets");
    })




app.get("/auth/google/secrets",
    passport.authenticate('google', {
        failureRedirect: "/login"
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    });

// app.route('/auth/google/secrets')
//     .get(passport.authenticate('google', {
//         failureRedirect: "/login"
//     }),(res,req)=>{
//          // Successful authentication, redirect to secrets.
//          res.redirect("/secrets");
//     })

// app.get('/auth/facebook',
//     passport.authenticate('facebook', {
//         scope: ['user_friends', 'manage_pages']
//     },));
app.route('/auth/facebook')
    .get(passport.authenticate('facebook', {
        scope: ['user_friends', 'manage_pages']
    },),(req,res)=>{
        res.redirect("/auth/facebook/secrets");
    })



app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



app.route('/logout')
    .get((req, res) => {
        req.logout((err) => {
            if (err) {
                console.log(err);
            }
        })
        res.redirect('/')

    })






const PORT = 3000 || process.env.PORT
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})