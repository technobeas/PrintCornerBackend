const mongoose = require("mongoose");

const customerSchema = mongoose.Schema(
  {
    custName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    companyName: { type: String, default: "Unknown", trim: true },

    // ✅ WALLET FIELD
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

const Customer = mongoose.model("customer", customerSchema);

module.exports = Customer;
