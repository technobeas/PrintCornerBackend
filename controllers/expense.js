const Expense = require("../models/Expense");

async function handleCreateExpense(req, res) {
  try {
    const { expenseAmount, expenseDescription, expenseCategory } = req.body;

    if (!expenseAmount || !expenseCategory) {
      return res.status(400).json({ msg: "Amount and category are required" });
    }

    const newExpense = await Expense.create({
      expenseAmount,
      expenseDescription,
      expenseCategory,
    });

    return res.status(201).json({
      msg: "Expense created successfully",
      expense: newExpense,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleGetExpenses(req, res) {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });

    if (!expenses || expenses.length === 0) {
      return res.status(404).json({ msg: "No expenses found" });
    }

    return res.json({ count: expenses.length, expenses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleGetExpenseById(req, res) {
  try {
    const id = req.params.id;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    return res.json(expense);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleUpdateExpense(req, res) {
  try {
    const id = req.params.id;
    const { expenseAmount, expenseDescription, expenseCategory } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { expenseAmount, expenseDescription, expenseCategory },
      { new: true, runValidators: true },
    );

    if (!updatedExpense) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    return res.json({
      msg: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleDeleteExpense(req, res) {
  try {
    const id = req.params.id;

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    return res.json({
      msg: "Expense deleted successfully",
      expenseId: deletedExpense._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

// async function handleGetExpenseBetDates(req, res) {
//   const { start, end } = req.query;

//   if (!start || !end) {
//     return res.status(400).json({ error: "Start and end dates required" });
//   }

//   try {
//     const result = await Expense.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(start),
//             $lte: new Date(end),
//           },
//         },
//       },
//       { $sort: { createdAt: 1 } },
//       {
//         $group: {
//           _id: null,
//           totalExpense: { $sum: "$expenseAmount" },
//           expenses: { $push: "$$ROOT" },
//         },
//       },
//     ]);

//     res.json({
//       totalExpense: result[0]?.totalExpense || 0,
//       expenses: result[0]?.expenses || [],
//     });
//   } catch (error) {
//     console.error("Error fetching expenses:", error);
//     res.status(500).json({ error: "Failed to fetch expenses" });
//   }
// }

async function handleGetExpenseBetDates(req, res) {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates required" });
  }

  try {
    const result = await Expense.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$expenseAmount" },
          expenses: { $push: "$$ROOT" },
        },
      },
    ]);

    const expensesWithFormattedDate =
      result[0]?.expenses.map((exp) => ({
        ...exp,
        createdAtFormatted: exp.createdAt.toISOString(), // or toLocaleString() if you want server side formatting
      })) || [];

    res.json({
      totalExpense: result[0]?.totalExpense || 0,
      expenses: expensesWithFormattedDate,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
}

module.exports = {
  handleCreateExpense,
  handleGetExpenses,
  handleGetExpenseById,
  handleUpdateExpense,
  handleDeleteExpense,
  handleGetExpenseBetDates,
};
