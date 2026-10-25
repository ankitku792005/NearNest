const express= require("express");
const route=express.Router();
const wrapAsync=require("../utils/wraperror.js");
const User=require("../moduels/user.js");
const passport = require("passport");
const {saveredirecturl}=require("../middleware.js");

route.get("/signup",(req,res)=>{
    res.render("users/signup.ejs");
});

route.post("/signup", wrapAsync(async (req, res, next) => {
try{
    let { username, email, password } = req.body;

    let newUser = new User({
        username,
        email
    });

    let registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
        if (err) {
            return next(err);
        }
           req.flash("success", "Welcome to NearNest");
        res.redirect("/listings");
  });
        // req.flash("success", "Welcome to WanderLust!");
        // res.redirect("/listings");
}catch(e){
    req.flash("error",e.message);
     res.redirect("/signup");
}
}));


route.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});

route.post(
    "/login",saveredirecturl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true
    }),
    (req, res) => {
        let redirect=res.locals.redirecturl;
        if(redirect){
            res.redirect(redirect);
        }
else{
          res.redirect("/listings");
}
    }
);
route.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", "You have been logged out.");
        res.redirect("/listings");
    });
});
module.exports=route;