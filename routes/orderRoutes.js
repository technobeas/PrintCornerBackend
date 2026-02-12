const express = require("express");
const upload = require("../middlewares/upload");
const cloudinary = require("../config/cloudinary");
const Onlineorder = require("../models/Onlineorder");

const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", upload.array("files"), async (req, res) => {
  try {
    const { customerName } = req.body;
    const filesMeta = JSON.parse(req.body.filesMeta);

    if (!req.files?.length) {
      return res.status(400).json({ message: "Files required" });
    }

    let uploadedFiles = [];
    let totalPrice = 0;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const meta = filesMeta[i];
      const extension = path.extname(file.originalname).toLowerCase();

      // DOC, DOCX, PPT, PPTX → upload as RAW
      const isOffice = [".doc", ".docx", ".ppt", ".pptx"].includes(extension);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: isOffice ? "raw" : "auto",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        stream.end(file.buffer);
      });

      const calculatedPrice =
        meta.pageCount *
        (meta.paperSize === "A4"
          ? meta.color === "bw"
            ? 2
            : 5
          : meta.color === "bw"
            ? 4
            : 8) *
        meta.copies;

      uploadedFiles.push({
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        originalName: file.originalname, // 👈 ADD THIS
        paperSize: meta.paperSize,
        color: meta.color,
        copies: meta.copies,
        pageCount: meta.pageCount,
        price: calculatedPrice,
        type: meta.type,
        notes: meta.notes || "",
      });

      totalPrice += calculatedPrice;
    }

    const order = await Onlineorder.create({
      customerName,
      files: uploadedFiles,
      totalPrice,
    });

    req.app.get("io").emit("new-order", order);

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
