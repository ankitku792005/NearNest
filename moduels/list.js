const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const review=require("./reviews.js");
const User=require("./user.js");
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    filename: String,
    url:String
    // default:
    //   "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    // set: (v) =>
    //   v === ""
    //     ? "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60"
    //     : v,
  },
 price: { type: Number },
  location: String,
  country: String,
  reviews:[
    {
type:Schema.Types.ObjectId,
ref:"review"  
    },
  ],
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
  },
   geometry: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  category: {
    type: String,
    enum: require("../categories.js").map(c => c.name),
    default: "Other",
     required: true
},
phone: {
    type: String,
    trim: true
},
email: { type: String, trim: true },
whatsapp: { type: String, trim: true },
// website: { type: String, trim: true },
hours: { type: String, trim: true },
}, { timestamps: true });
listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await review.deleteMany({_id: {$in : listing.reviews}});
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;