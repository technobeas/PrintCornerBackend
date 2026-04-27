const QRCode = require("qrcode");
const fs = require("fs");

const url = "https://print-corner-frontend.vercel.app/userorders"; // Replace with your URL
const outputFile = "qrcode.png";

QRCode.toFile(
  outputFile,
  url,
  {
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  },
  function (err) {
    if (err) throw err;
    console.log("QR Code generated and saved as qrcode.png");
  },
);
