const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

const {
  handleCreateOrder,
  handleWalkinCustomer,
  handleEditOrder,
  handleOrderPay,
  handleGetOrder,
  handleOrderHistory,
  handleCustomersWithBalance,
  handleWhatsAppSent,
  handleOrdersWithBalanceByCustomer,
  handleCustomerBulkPay,
} = require("../controllers/order");

const verifyToken = require("../middlewares/verifyToken");
const requireAdmin = require("../middlewares/requireAdmin");

/* =====================
   FIXED / SPECIFIC ROUTES FIRST
===================== */

router.get(
  "/customers-with-balance",
  verifyToken,
  requireAdmin,
  handleCustomersWithBalance,
);

router.get(
  "/with-balance/:customerId",
  verifyToken,
  requireAdmin,
  handleOrdersWithBalanceByCustomer,
);

router.post("/pay", verifyToken, requireAdmin, handleCustomerBulkPay);

router.get("/history", verifyToken, requireAdmin, handleOrderHistory);

router.post("/message-sent", verifyToken, requireAdmin, handleWhatsAppSent);

/* =====================
   ORDER ACTIONS
===================== */

router.post("/createOrder", verifyToken, requireAdmin, handleCreateOrder);

router.post("/quickSale", verifyToken, handleWalkinCustomer);

router.post("/:id/pay", verifyToken, requireAdmin, handleOrderPay);

router.put("/edit/:id", verifyToken, requireAdmin, handleEditOrder);

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "custName phone")
      .populate("items.product", "name price");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("GET ORDER ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
});

router.get("/", verifyToken, requireAdmin, handleGetOrder);

module.exports = router;
