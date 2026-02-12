const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const productRoute = require("./routes/product");
const customerRoute = require("./routes/customer");
const userRoute = require("./routes/user");
const orderRoute = require("./routes/order");
const revenueRoute = require("./routes/revenue");
const expenseRoute = require("./routes/expense");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const printRoute = require("./routes/printRoute");

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"], // allow both frontend and localhost
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("🟢 Admin connected:", socket.id);
});

// 🔥 MAKE IO AVAILABLE EVERYWHERE
app.set("io", io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));

app.get("/health", (req, res) => {
  res.json({ msg: "Working" });
});

app.use("/product", productRoute);
app.use("/customer", customerRoute);
app.use("/user", userRoute);
app.use("/order", orderRoute);
app.use("/revenue", revenueRoute);
app.use("/expense", expenseRoute);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", printRoute);

// app.listen(3000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
