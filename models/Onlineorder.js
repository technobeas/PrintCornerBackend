const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileUrl: String,
  publicId: String,
  type: String, // ✅ ADD THIS
  originalName: String,
  paperSize: String,
  color: String,
  copies: Number,
  pageCount: Number,
  price: Number,
  notes: String, // ✅ ADD THIS
});

const OnlineorderSchema = new mongoose.Schema(
  {
    customerName: String,
    files: [FileSchema],
    totalPrice: Number,
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Onlineorder", OnlineorderSchema);
