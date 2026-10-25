if(process.env.NODE_ENV!="production"){
require('dotenv').config();
}
console.log(process.env.SECRET);

const express= require("express");
const app=express();
const mongoose=require("mongoose");
// const Listing=require("./moduels/list.js");
// const review=require("./moduels/reviews.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const expresserror=require("./utils/expresserror.js");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const Listings=require("./route/listing.js");
const reviews =require("./route/review.js");
const userroute =require("./route/user.js");

const mdurl=process.env.Atlas;

const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const flash = require("connect-flash");
const passport=require("passport");
const localStrategy=require("passport-local");
const User=require("./moduels/user.js");

main().then((res)=>{
    console.log("connected successful");
})
.catch((err)=>console.log(err));
async function main() {
    await mongoose.connect(mdurl);
}
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl: mdurl,
    crypto: {
        secret: process.env.SESSION_SECRET
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Session store error:", err);
});
 const sessionoption={
    store:store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now()+7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    },
  }

  
app.locals.categories = require("./categories.js");
app.locals.waLink = (n) => {
  const d = String(n || "").replace(/\D/g, "");
  return d ? "https://wa.me/" + (d.length === 10 ? "91" + d : d) : "";
};
app.use(session(sessionoption));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
     res.locals.error = req.flash("error");
      res.locals.currentUser = req.user;
    next();
});
// app.get("/demouser",async(req,res)=>{
// let fakeuser=new User({
//     email: "student@gmail.com",
//     username:"delta-student"
// })
// let registeruser=await User.register(fakeuser,"helloworld");
// res.send(registeruser);
// });

app.use("/listings",Listings)
app.use("/listings/:id/reviews",reviews);
app.use("/",userroute);

app.all("/{*splat}", (req, res, next) => {
    next(new expresserror(404, "Page Not Found"));
});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;

    res.status(statusCode).render("./listings/error.ejs", {
        statusCode,
        message
    });
});
// app.use((err, req, res, next) => {
//     console.log("ERROR:", err);

//     let {
//         statusCode = 500,
//         message = "Something went wrong!"
//     } = err;

//     res.status(statusCode).send(message);
// });
app.listen(8080,()=>{
    console.log("listening port");
});
