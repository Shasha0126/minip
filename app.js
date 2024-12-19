const express=require('express');
const app=express();
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const userModel=require("./models/user");
const postModel =require("./models/post");
const PORT=process.env.PORT || 4000;
const jwt=require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const post = require('./models/post');


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); 

app.get('/',(req,res)=>{
    res.render("main");
})
app.get('/review',(req,res)=>{
    res.render('review');
});

app.post('/register', async (req, res) => {
    try {
        const { name, password, email, age } = req.body;
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send("Hey, you are already registered!");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newUser = await userModel.create({
            name,
            password: hash,
            email,
            age,
        });

        const token = jwt.sign({ email: newUser.email, userid: newUser._id }, "secret");
        res.cookie("token", token);
        res.send("Registered successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during registration.");
    }
});



app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login', async (req, res) => {
    try {
        const { password, email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).send("Invalid email or password.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid email or password.");
        }

        const token = jwt.sign({ email: user.email, userid: user._id }, "secret");
        res.cookie("token", token);
        res.status(200).redirect("profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during login.");
    }
});


app.get('/logout',(req,res)=>{
    res.clearcookie("token");
    res.redirect("/login");
});
function isLoggedIn(req, res, next) {
    if (!req.cookies.token || req.cookies.token === "") {
        return res.redirect("login");
    }
    try {
        const data = jwt.verify(req.cookies.token, "secret");
        req.user = data; // Attach user info to the request
        next();
    } catch (err) {
        return res.status(401).send("Invalid or expired token.");
    }
}


app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate({
            path: "posts",
            populate: { path: "user", select: "name" }, // Populate 'user' and only fetch the 'name' field
        });

    res.render("profile", { user });
});



app.get("/like/:id", isLoggedIn, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post not found");
        }

        const userId = req.user.userid; // Get user ID from JWT

        // Check if the user has already liked the post
        const index = post.likes.indexOf(userId);
        if (index === -1) {
            // User hasn't liked yet, so add the like
            post.likes.push(userId);
        } else {
            // User has already liked, so remove the like
            post.likes.splice(index, 1);
        }

        await post.save();
        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while toggling like.");
    }
});



app.post('/post',isLoggedIn, async(req,res)=>{
    let user=await userModel.findOne({email:req.user.email});
    let {review:content}=req.body;

    let post=await postModel.create({
        user:user.id,

        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");


});

app.listen(PORT,()=>{
    console.log(`listening in port ${PORT}`);
});