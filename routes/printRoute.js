const express = require("express");
const axios = require("axios");
const router = express.Router();

// router.get("/print/:publicId", async (req, res) => {
//   try {
//     const { publicId } = req.params;

//     const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/${publicId}`;

//     const response = await axios.get(cloudinaryUrl, {
//       responseType: "stream",
//     });

//     res.setHeader("Content-Type", response.headers["content-type"]);
//     response.data.pipe(res);
//   } catch (err) {
//     console.error("Print proxy error:", err.response?.status || err.message);
//     res.status(500).send("Failed to load file");
//   }
// });

router.get("/print/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;

    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUD_NAME}/image/upload/${publicId}`;

    const response = await axios.get(cloudinaryUrl, {
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (err) {
    console.error("Print proxy error:", err.response?.status || err.message);
    res.status(500).send("Failed to load file");
  }
});

module.exports = router;
