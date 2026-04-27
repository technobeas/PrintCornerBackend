const express = require("express");
const router = express.Router();
const {
  handleCreateUser,
  handleUserLogin,
  handleDeleteUser,
  handleGetUser,
  handleChangePassword,
} = require("../controllers/user");
const verifyToken = require("../middlewares/verifyToken");
const requireAdmin = require("../middlewares/requireAdmin");

router.post("/register", verifyToken, requireAdmin, handleCreateUser);

router.post("/login", handleUserLogin);

router.delete("/:id", verifyToken, requireAdmin, handleDeleteUser);

router.get("/", verifyToken, requireAdmin, handleGetUser);

router.put("/change-password", verifyToken, requireAdmin, handleChangePassword);

module.exports = router;
