const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Revenue = require("../models/Revenue");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");

async function handleCreateOrder(req, res) {
  try {
    // const {
    //   customerId,
    //   items,
    //   subTotal,
    //   gstPercent = 18,
    //   gstAmount,
    //   totalAmount,
    //   paidAmount = 0,
    // } = req.body;

    const {
      customerId,
      items,
      subTotal,
      gstPercent = 18,
      gstAmount,
      extraCharges = 0,
      discount = 0,
      totalAmount,
      paidAmount = 0,
    } = req.body;

    const finalItems = [];

    for (const i of items) {
      const product = await Product.findById(i.product);
      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }

      // Stock validation only
      if (product.trackStock) {
        if (product.stock < i.qty) {
          return res.status(400).json({
            msg: `Insufficient stock for ${product.name}`,
          });
        }

        product.stock -= i.qty;
        await product.save();
      }

      // ⬇️ TRUST FRONTEND VALUES
      finalItems.push({
        product: product._id,
        name: i.name || product.name,
        qty: i.qty,
        price: Number(i.price),
        total: Number(i.total),
      });
    }

    const balanceAmount = Number(totalAmount) - Number(paidAmount);

    let status = "pending";
    if (balanceAmount <= 0) status = "paid";
    else if (paidAmount > 0) status = "partial";

    const order = await Order.create({
      customer: customerId,
      customerName: req.customerName,
      items: finalItems,

      subTotal: Number(subTotal),
      gstPercent: Number(gstPercent),
      gstAmount: Number(gstAmount),

      extraCharges: Number(extraCharges),
      discount: Number(discount),

      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      balanceAmount,
      status,
    });

    // Revenue entry ONLY for paid amount
    if (paidAmount > 0) {
      await Revenue.create({
        source: "order",
        order: order._id,
        amount: Number(paidAmount),
      });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
}

//using
async function handleOrderPay(req, res) {
  try {
    const { amount } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    order.paidAmount += amount;
    order.balanceAmount = order.totalAmount - order.paidAmount;

    if (order.balanceAmount <= 0) {
      order.status = "paid";
      order.balanceAmount = 0;
    } else {
      order.status = "partial";
    }

    await order.save();

    await Payment.create({
      order: order._id,
      customer: order.customer,
      amount,
      paymentMode: "cash",
    });

    await Revenue.create({
      source: "order",
      order: order._id,
      amount,
    });

    // 📲 WhatsApp hook
    // sendWhatsApp(order.customerName, amount);

    res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: err.message });
  }
}

async function handleEditOrder(req, res) {
  try {
    const {
      items,
      gstApplied,
      totalAmount: manualTotal,
      extraCharges = 0,
      discount = 0,
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    /* ===============================
       1️⃣ RESTORE OLD STOCK
    =============================== */
    for (const oldItem of order.items) {
      const product = await Product.findById(oldItem.product);
      if (product && product.trackStock) {
        product.stock += oldItem.qty;
        await product.save();
      }
    }

    /* ===============================
       2️⃣ VALIDATE & DEDUCT NEW STOCK
    =============================== */
    const populatedItems = [];

    for (const i of items) {
      const product = await Product.findById(i.product);
      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }

      if (product.trackStock) {
        if (product.stock < i.qty) {
          return res.status(400).json({
            msg: `Insufficient stock for ${product.name}`,
          });
        }

        product.stock -= i.qty;
        await product.save();
      }

      populatedItems.push({
        product: product._id,
        name: product.name,
        qty: i.qty,
        price: product.price,
        total: product.price * i.qty,
      });
    }

    /* ===============================
       3️⃣ TOTALS
    =============================== */
    const newSubTotal = populatedItems.reduce((s, i) => s + i.total, 0);
    const gstAmount = gstApplied ? newSubTotal * 0.18 : 0;

    let finalTotal;

    if (typeof manualTotal === "number") {
      order.extraCharges = Number(extraCharges);
      order.discount = Number(discount);
      finalTotal = manualTotal;
    } else {
      finalTotal =
        newSubTotal +
        gstAmount +
        (order.extraCharges || 0) -
        (order.discount || 0);
    }

    const balanceAmount = finalTotal - order.paidAmount;

    /* ===============================
       4️⃣ SAVE ORDER
    =============================== */
    order.items = populatedItems;
    order.subTotal = newSubTotal;
    order.gstAmount = gstAmount;
    order.gstPercent = gstApplied ? 18 : 0;
    order.totalAmount = finalTotal;
    order.balanceAmount = balanceAmount;

    order.status =
      balanceAmount <= 0
        ? "paid"
        : order.paidAmount > 0
          ? "partial"
          : "pending";

    await order.save();

    /* ===============================
   5️⃣ ADJUST REVENUE IF NEEDED
=============================== */

    const oldTotalRevenue = await Revenue.aggregate([
      { $match: { order: order._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const alreadyRecordedRevenue = oldTotalRevenue[0]?.total || 0;

    // If order is fully paid, revenue should match totalAmount
    if (order.status === "paid") {
      const difference = order.totalAmount - alreadyRecordedRevenue;

      if (difference !== 0) {
        await Revenue.create({
          source: "order",
          order: order._id,
          amount: difference,
        });
      }
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
}

async function handleWalkinCustomer(req, res) {
  try {
    const { items, finalTotal, gstApplied } = req.body;

    if (typeof finalTotal !== "number" || finalTotal < 0) {
      return res.status(400).json({ msg: "Invalid final total" });
    }

    let subTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }

      if (product.trackStock) {
        if (product.stock < item.qty) {
          return res.status(400).json({
            msg: `Stock insufficient for ${product.name}`,
          });
        }
        product.stock -= item.qty;
        await product.save();
      }

      subTotal += product.price * item.qty;
    }

    // 🔐 Optional sanity check (recommended)
    if (typeof finalTotal !== "number" || finalTotal < 0) {
      return res.status(400).json({ msg: "Invalid final total" });
    }

    // ✅ Save revenue using FINAL TOTAL
    await Revenue.create({
      source: "quickSale",
      amount: finalTotal,
    });

    return res.json({
      total: finalTotal,
      msg: "Quick sale completed",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: err.message });
  }
}

async function handleGetOrder(req, res) {
  try {
    const orders = await Order.find()
      .populate("customer", "custName phone")
      .populate("items.product", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
}

async function handleOrderHistory(req, res) {
  try {
    const { phone, start, end } = req.query;

    const filter = {};

    // 📅 Date filter
    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    // 📞 Customer phone filter
    if (phone) {
      const customer = await Customer.findOne({ phone });
      if (!customer) return res.json([]);
      filter.customer = customer._id;
    }

    const orders = await Order.find(filter)
      .populate("customer", "custName phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
}

async function handleCustomersWithBalance(req, res) {
  try {
    const orders = await Order.find({
      balanceAmount: { $gt: 0 },
      status: { $ne: "paid" },
    })
      .populate("customer", "custName phone")
      .sort({ createdAt: 1 });

    const customerMap = new Map();

    for (const order of orders) {
      // 🛑 HARD GUARDS
      if (!order.customer) continue;
      if (!order.balanceAmount || order.balanceAmount <= 0) continue;

      const customerId = String(order.customer._id);

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: order.customer.custName || "Unknown",
          customerMobile: order.customer.phone || "-",
          balance: 0,
          orderStart: order.createdAt,
          orderEnd: order.createdAt,
          lastMessageSent: order.lastMessageSent || null,
        });
      }

      const customer = customerMap.get(customerId);

      customer.balance += Number(order.balanceAmount);

      if (order.createdAt < customer.orderStart)
        customer.orderStart = order.createdAt;

      if (order.createdAt > customer.orderEnd)
        customer.orderEnd = order.createdAt;
    }

    res.json({
      success: true,
      customers: Array.from(customerMap.values()),
    });
  } catch (err) {
    console.error("CUSTOMERS WITH BALANCE ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

async function handleWhatsAppSent(req, res) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ msg: "orderId required" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { lastMessageSent: new Date() },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
}

async function handleOrdersWithBalanceByCustomer(req, res) {
  try {
    const { customerId } = req.params;

    const orders = await Order.find({
      customer: customerId,
      balanceAmount: { $gt: 0 },
      status: { $ne: "paid" },
    }).populate("items.product", "name");

    // const formatted = orders.map((o) => ({
    //   orderId: o._id,
    //   order_date: o.createdAt,
    //   payable: o.totalAmount,
    //   balance: o.balanceAmount,
    //   items: o.items.map((i) => ({
    //     product_name: i.product?.name,
    //     quantity: i.qty,
    //     rate: i.price,
    //   })),
    // }));

    const formatted = orders.map((o) => ({
      orderId: o._id,
      order_date: o.createdAt,

      subTotal: o.subTotal,
      gstPercent: o.gstPercent,
      gstAmount: o.gstAmount,
      extraCharges: o.extraCharges,
      discount: o.discount,

      payable: o.totalAmount,
      paidAmount: o.paidAmount,
      balance: o.balanceAmount,

      items: o.items.map((i) => ({
        product_name: i.product?.name,
        quantity: i.qty,
        rate: i.price,
      })),
    }));

    res.json({ success: true, orders: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
async function handleCustomerBulkPay(req, res) {
  try {
    const { customerId, amount } = req.body;

    if (!customerId || !amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid parameters" });
    }

    let remaining = amount;

    const orders = await Order.find({
      customer: customerId,
      balanceAmount: { $gt: 0 },
      status: { $ne: "paid" },
    }).sort({ createdAt: 1 });

    // for (const order of orders) {
    //   if (remaining <= 0) break;

    //   if (order.balanceAmount <= remaining) {
    //     remaining -= order.balanceAmount;
    //     order.paidAmount += order.balanceAmount;
    //     order.balanceAmount = 0;
    //     order.status = "paid";
    //   } else {
    //     order.paidAmount += remaining;
    //     order.balanceAmount -= remaining;
    //     order.status = "partial";
    //     remaining = 0;
    //   }

    //   await order.save();

    //   // await Payment.create({
    //   //   order: order._id,
    //   //   customer: customerId,
    //   //   amount,
    //   //   paymentMode: "cash",
    //   // });

    //   // await Revenue.create({
    //   //   source: "order",
    //   //   order: order._id,
    //   //   amount,
    //   // });

    //   const paidNow =
    //     order.balanceAmount <= remaining ? order.balanceAmount : remaining;

    //   await Payment.create({
    //     order: order._id,
    //     customer: customerId,
    //     amount: paidNow,
    //     paymentMode: "cash",
    //   });

    //   await Revenue.create({
    //     source: "order",
    //     order: order._id,
    //     amount: paidNow,
    //   });
    // }

    for (const order of orders) {
      if (remaining <= 0) break;

      const payable = order.balanceAmount; // original balance
      const paidNow = Math.min(payable, remaining);

      order.paidAmount += paidNow;
      order.balanceAmount -= paidNow;

      order.status = order.balanceAmount <= 0 ? "paid" : "partial";

      await order.save();

      await Payment.create({
        order: order._id,
        customer: customerId,
        amount: paidNow,
        paymentMode: "cash",
      });

      await Revenue.create({
        source: "order",
        order: order._id,
        amount: paidNow,
      });

      remaining -= paidNow; // reduce AFTER creating records
    }

    const totalBalance = await Order.aggregate([
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$balanceAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      newBalance: totalBalance[0]?.total || 0,
    });
  } catch (err) {
    console.error("BULK PAY ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleCreateOrder,
  handleWalkinCustomer,
  handleEditOrder,
  handleOrderPay,
  handleGetOrder,
  handleOrderHistory,
  handleCustomersWithBalance,
  handleWhatsAppSent,
  handleCustomerBulkPay,
  handleOrdersWithBalanceByCustomer,
};
