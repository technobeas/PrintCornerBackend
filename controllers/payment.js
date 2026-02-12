const Payment = require("../models/Payment");

async function handleGetAllPayments(req, res) {
  try {
    const [payments, total] = await Promise.all([
      Payment.find()
        .populate("order")
        .populate("customer")
        .sort({ createdAt: -1 }),

      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      count: payments.length,
      totalAmount: total[0]?.totalAmount || 0,
      data: payments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { handleGetAllPayments };
