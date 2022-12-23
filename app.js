//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

mongoose.set('strictQuery', true)
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))  
mongoose.connect('mongodb://127.0.0.1:27017/userDB')




const userSchema =new mongoose.Schema({
    email: String,
    password: String
})
const secret = process.env.SECRET
userSchema.plugin(encrypt,{secret:secret, encryptedFields:['password']} );

const User  =  new mongoose.model('User', userSchema);



app.route('/')
    .get((req, res) => {
        res.render('home');
    });


app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req,res)=>{
        const username = req.body.username
        const password = req.body.password

        User.findOne({email: username},(err, foundUser)=>{
            if (err){
                console.log(err);
            }else{
                if(foundUser){
                    if (foundUser.password === password){
                        res.render('secrets')
                    }
                }
            }
        })
    })



app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req,res)=>{
        console.log(req.body)
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save((err)=>{
            if(err){
                console.log(err);
            }else{
                res.render('secrets')
            }
        })
    })




const PORT = 3000 || process.env.PORT
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})