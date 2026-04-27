const mongoose = require("mongoose");

const revenueSchema = mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["order", "quickSale"],
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
    amount: Number,
  },
  { timestamps: true },
);

module.exports = mongoose.model("revenue", revenueSchema);
