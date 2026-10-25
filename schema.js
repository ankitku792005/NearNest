const Joi = require("joi");
const categoryNames = require("./categories.js").map(c => c.name);

const listingSchema = Joi.object({
    title: Joi.string()
        .required(),
category: Joi.string()
    .valid(...categoryNames)
    .required(),
    description: Joi.string()
        .required(),

    image: Joi.object({
        url: Joi.string().required(),
        filename: Joi.string(),
    }),

    price: Joi.number().min(0).allow("", null),

    country: Joi.string()
        .required(),

    location: Joi.string()
        .required(),
        phone: Joi.string().allow("", null),
whatsapp: Joi.string().allow("", null),
// website: Joi.string().allow("", null),
hours: Joi.string().allow("", null),
email: Joi.string().email().allow("", null),
});

// module.exports = { listingSchema };
const reviews=Joi.object({
       rating: Joi.number().required().min(1).max(5),
comment: Joi.string().required(),
}).required()
// module.exports={reviews};

module.exports = {
    listingSchema,
    reviews
};