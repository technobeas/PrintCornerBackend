const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  handleCreateProduct,
  handleGetAllProducts,
  handleGetProductByName,
  handleProductDelete,
  handleProductUpdate,
  handleGetProductById,
  handleBulkUploadFromExcel,
} = require("../controllers/product");
const verifyToken = require("../middlewares/verifyToken");
const requireAdmin = require("../middlewares/requireAdmin");

const router = express.Router();

// Create product
router.post("/", verifyToken, requireAdmin, handleCreateProduct);

// Get all products
router.get("/", verifyToken, handleGetAllProducts);

// Get product by ID
router.get("/:id", verifyToken, handleGetProductById);

// Get product by name
router.get("/name/:name", verifyToken, handleGetProductByName);

// Update product
router.patch("/:id", verifyToken, requireAdmin, handleProductUpdate);

// Delete product
router.delete("/:id", verifyToken, requireAdmin, handleProductDelete);

router.post("/upload-excel", upload.single("file"), handleBulkUploadFromExcel);

module.exports = router;
