const express = require("express");
const route = express.Router();
const Listing = require("../moduels/list.js");
const wrapAsync = require("../utils/wraperror.js");
const expresserror = require("../utils/expresserror.js");
const { listingSchema } = require("../schema.js");
const { islogin, isowner } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudconf.js");
const upload = multer({ storage });
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const geocodingClient = mbxGeocoding({ accessToken: process.env.Map_Token });

const esc = (s) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body.listing);
  if (error) throw new expresserror(400, error.details[0].message);
  next();
};

// move the uploaded file (if any) into req.body.listing.image
const attachImage = (req, res, next) => {
  if (req.file) {
    req.body.listing.image = { url: req.file.path, filename: req.file.filename };
  }
  next();
};

const geocode = async (place) => {
  const r = await geocodingClient.forwardGeocode({ query: place, limit: 1 }).send();
  const f = r.body.features[0];
  if (!f) throw new expresserror(400, "We could not find that location. Try a nearby city name.");
  return f.geometry;
};

// ---------- search / browse ----------
route.get("/", wrapAsync(async (req, res) => {
  const { q, location, category, sort = "rating" } = req.query;
  const filter = {};
  const and = [];

  if (q && q.trim()) {
    const rx = new RegExp(esc(q), "i");
    and.push({ $or: [{ title: rx }, { description: rx }, { category: rx }, { location: rx }] });
  }
  if (location && location.trim()) {
    const rx = new RegExp(esc(location), "i");
    and.push({ $or: [{ location: rx }, { country: rx }] });
  }
  if (and.length) filter.$and = and;
  if (category) filter.category = category;

  const found = await Listing.find(filter).populate("reviews");
  let listings = found.map((l) => {
    const count = l.reviews.length;
    const rating = count ? l.reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { ...l.toObject(), rating, count };
  });

  if (sort === "newest") listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === "name") listings.sort((a, b) => a.title.localeCompare(b.title));
  else listings.sort((a, b) => b.rating - a.rating || b.count - a.count);

  res.render("listings/index.ejs", { listings, q, location, category, sort });
}));

route.get("/new", islogin, (req, res) => {
  res.render("listings/new.ejs");
});

route.get("/:id", wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  if (!listing) {
    req.flash("error", "That listing does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
}));

route.post("/", islogin, upload.single("listing[image]"), attachImage, validateListing,
  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.geometry = await geocode(req.body.listing.location);
    await newListing.save();
    req.flash("success", "Your business is now listed!");
    res.redirect("/listings");
  })
);

route.get("/:id/edit", islogin, isowner, wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "That listing does not exist!");
    return res.redirect("/listings");
  }
  const originalimage = listing.image && listing.image.url
    ? listing.image.url.replace("/upload", "/upload/w_250") : "";
  res.render("listings/edit.ejs", { listing, originalimage });
}));

route.put("/:id", islogin, isowner, upload.single("listing[image]"), attachImage, validateListing,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const moved = listing.location !== req.body.listing.location;
    listing.set(req.body.listing);
    if (moved) listing.geometry = await geocode(req.body.listing.location);
    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${listing._id}`);
  })
);

route.delete("/:id", islogin, isowner, wrapAsync(async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted.");
  res.redirect("/listings");
}));

module.exports = route;
