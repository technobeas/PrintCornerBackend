const express = require("express");
const Onlineorder = require("../models/Onlineorder");
const Pricing = require("../models/Pricing");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// GET ALL ORDERS
router.get("/liveorders", async (req, res) => {
  const orders = await Onlineorder.find().sort({ createdAt: -1 });
  res.json(orders);
});

// DELETE SINGLE FILE
router.delete("/orders/:orderId/file/:fileIndex", async (req, res) => {
  try {
    const { orderId, fileIndex } = req.params;

    const order = await Onlineorder.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const file = order.files[fileIndex];
    if (!file) return res.status(404).json({ message: "File not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.publicId, {
      resource_type: "raw",
    });

    // Remove file from order
    order.totalPrice -= file.price;
    order.files.splice(fileIndex, 1);

    await order.save();

    res.json({ message: "File deleted", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE ENTIRE ORDER
// router.delete("/orders/:orderId", async (req, res) => {
//   try {
//     const order = await Onlineorder.findById(req.params.orderId);
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Delete all files from Cloudinary
//     for (const file of order.files) {
//       await cloudinary.uploader.destroy(file.publicId, {
//         resource_type: "raw",
//       });
//     }

//     await order.deleteOne();

//     res.json({ message: "Order & all files deleted" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.delete("/orders/:orderId", async (req, res) => {
//   try {
//     const order = await Onlineorder.findById(req.params.orderId);
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Delete files from Cloudinary
//     for (const file of order.files) {
//       await cloudinary.uploader.destroy(file.publicId, {
//         resource_type: "raw",
//       });
//     }

//     await order.deleteOne();

//     // 🔥🔥🔥 EMIT REALTIME DELETE
//     const io = req.app.get("io");
//     io.emit("order-deleted");

//     res.json({ message: "Order & all files deleted" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.delete("/orders/:orderId", async (req, res) => {
  try {
    const order = await Onlineorder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    for (const file of order.files) {
      await cloudinary.uploader.destroy(file.publicId, {
        resource_type: "raw",
      });
    }

    await order.deleteOne();

    // 🔥 BROADCAST TO ALL CLIENTS
    const io = req.app.get("io");
    io.emit("order-deleted", req.params.orderId);

    res.json({ message: "Order & all files deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE / UPDATE PRICING
router.post("/pricing", async (req, res) => {
  const pricing = await Pricing.create(req.body);
  res.json(pricing);
});

module.exports = router;
