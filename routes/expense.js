const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const requireAdmin = require("../middlewares/requireAdmin");
const {
  handleCreateExpense,
  handleGetExpenses,
  handleGetExpenseById,
  handleUpdateExpense,
  handleDeleteExpense,
  handleGetExpenseBetDates,
} = require("../controllers/expense");

router.get(
  "/totalExpenseBet",
  verifyToken,
  requireAdmin,
  handleGetExpenseBetDates,
);

router.post("/", verifyToken, requireAdmin, handleCreateExpense);
router.get("/", verifyToken, requireAdmin, handleGetExpenses);
router.get("/:id", verifyToken, requireAdmin, handleGetExpenseById);
router.put("/:id", verifyToken, requireAdmin, handleUpdateExpense);
router.delete("/:id", verifyToken, requireAdmin, handleDeleteExpense);

module.exports = router;
