const jwt = require("jsonwebtoken");
require("dotenv").config();

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Access denied. No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, userRole }

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}

module.exports = verifyToken;
