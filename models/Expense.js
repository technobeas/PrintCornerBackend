const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema(
  {
    expenseAmount: Number,
    expenseDescription: String,
    expenseCategory: String,
  },
  { timestamps: true },
);

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
