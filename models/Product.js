const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    trackStock: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Product = mongoose.model("product", productSchema);

module.exports = Product;


