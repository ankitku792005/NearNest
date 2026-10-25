let Listing=require("./moduels/list.js");
let reviews=require("./moduels/reviews.js");
module.exports.islogin=(req,res,next)=>{
    if(!req.isAuthenticated()){
      req.session.redirecturl=req.originalUrl;
    req.flash("error","you must be logged in to create listing!");
    return res.redirect("/login");
  }
  next();
}
module.exports.saveredirecturl=(req,res,next)=>{
  if(req.session.redirecturl){
    res.locals.redirecturl=req.session.redirecturl;
  }
  next();
};
module.exports.isowner=async(req,res,next)=>{
   let { id } = req.params;
    let listing=await Listing.findById(id);
   if(!listing.owner._id.equals(res.locals.currentUser._id)){
    req.flash("error","you do not change this");
    return res.redirect(`/listings/${id}`);
  }
  next();
}
module.exports.isauthor=async(req,res,next)=>{
   let { id,reviewid } = req.params;
    let review=await reviews.findById(reviewid);
   if(!review.author.equals(res.locals.currentUser._id)){
    req.flash("error","you are not the author of this review");
    return res.redirect(`/listings/${id}`)
  }
  next();
}