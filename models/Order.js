const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    },
    customerName: String,

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        name: String,
        qty: Number,
        price: Number,
        total: Number,
      },
    ],

    subTotal: Number,

    gstPercent: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },

    extraCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },

    totalAmount: Number,

    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },

    lastMessageSent: Date,
  },
  { timestamps: true },
);

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
