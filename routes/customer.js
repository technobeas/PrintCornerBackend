const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const {
  handleGetAllCustomer,
  handleCreateCustomer,
  handleGetCustomerByName,
  handleCustomerDelete,
  handleCustomerUpdate,
  handleBulkUploadFromExcel,
} = require("../controllers/customer");
const verifyToken = require("../middlewares/verifyToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.post("/", verifyToken, requireAdmin, handleCreateCustomer);

router.get("/", verifyToken, handleGetAllCustomer);

router.get("/search", verifyToken, handleGetCustomerByName);

router.delete("/:id", verifyToken, requireAdmin, handleCustomerDelete);

router.patch("/:id", verifyToken, requireAdmin, handleCustomerUpdate);

router.post("/upload-excel", upload.single("file"), handleBulkUploadFromExcel);

module.exports = router;
