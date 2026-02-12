const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "customer" },
    amount: Number,
    paymentMode: String, // cash, upi, bank
  },
  { timestamps: true },
);

module.exports = mongoose.model("payment", paymentSchema);
