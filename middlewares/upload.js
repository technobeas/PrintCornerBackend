// // const multer = require("multer");

// // const storage = multer.diskStorage({});
// // module.exports = multer({ storage });

// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const uploadDir = "C:/temp/uploads";

// // Ensure folder exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// module.exports = multer({ storage });

const multer = require("multer");

module.exports = multer({
  storage: multer.memoryStorage(),
});
