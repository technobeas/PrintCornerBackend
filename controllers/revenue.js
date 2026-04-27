const Revenue = require("../models/Revenue");

async function handleGetRevenue(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include full end day

    // Get revenue list
    const revenueList = await Revenue.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate("order")
      .sort({ createdAt: -1 });

    // Get total revenue amount
    const totalRevenue = await Revenue.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      totalRevenue: totalRevenue[0]?.totalAmount || 0,
      count: revenueList.length,
      data: revenueList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleGetAllRevenue(req, res) {
  try {
    const [revenue, total] = await Promise.all([
      Revenue.find().populate("order").sort({ createdAt: -1 }),

      Revenue.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      count: revenue.length,
      totalAmount: total[0]?.totalAmount || 0,
      data: revenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { handleGetRevenue, handleGetAllRevenue };
