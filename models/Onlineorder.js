const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  fileUrl: String,
  publicId: String,
  resourceType: String, // ✅ ADD THIS
  type: String, // ✅ ADD THIS
  originalName: String,
  paperSize: String,
  color: String,
  copies: Number,
  pageCount: Number,
  price: Number,
  notes: String, // ✅ ADD THIS
  printSide: String,
  pageRange: String,
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

// PrintSide: Strintg (Single Side / Double Side)
// Page Range: String (all/ 1-4)
