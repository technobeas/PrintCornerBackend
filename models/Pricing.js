const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema({
  paperSize: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  pricePerPage: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Pricing", PricingSchema);
