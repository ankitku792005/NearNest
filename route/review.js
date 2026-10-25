
const express= require("express");
const route=express.Router({mergeParams:true});
const review=require("../moduels/reviews.js");
const wrapAsync=require("../utils/wraperror.js");
const expresserror=require("../utils/expresserror.js");
const Listing=require("../moduels/list.js");
const {reviews} = require("../schema.js");
const {islogin,isauthor}=require("../middleware.js");
const validatereview = (req, res, next) => {
    const {error}  = reviews.validate(req.body.review);
    if (error) {
        throw new expresserror(400, error.details[0].message);
    }

    next();
};
route.post("/",islogin,validatereview,wrapAsync( async (req, res) => {

    let listing = await Listing.findById(req.params.id);

    let newReview = new review(req.body.review);
newReview.author=req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
}));
route.delete("/:reviewid",islogin,isauthor,wrapAsync(async(req,res)=>{
let{id,reviewid}=req.params;

 await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewid }
    });
  await review.findByIdAndDelete(reviewid);
res.redirect(`/listings/${id}`)
}));
module.exports=route;