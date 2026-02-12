const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const requireAdmin = require("../middlewares/requireAdmin");
const {
  handleGetRevenue,
  handleGetAllRevenue,
} = require("../controllers/revenue");

router.get("/", verifyToken, requireAdmin, handleGetRevenue);

router.get("/all", verifyToken, requireAdmin, handleGetAllRevenue);

module.exports = router;
