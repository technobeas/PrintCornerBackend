const Customer = require("../models/Customer");
const XLSX = require("xlsx");
const fs = require("fs");
async function handleCreateCustomer(req, res) {
  try {
    const { custName, phone, companyName } = req.body;

    if (!custName || !phone) {
      return res
        .status(400)
        .json({ msg: "Customer name and phone are required" });
    }

    const phoneStr = String(phone).trim();

    const customerExists = await Customer.findOne({ phone: phoneStr });
    if (customerExists) {
      return res.status(409).json({ msg: "Customer already exists" });
    }

    const newCustomer = await Customer.create({
      custName: custName.trim(),
      phone: phoneStr,
      companyName,
    });

    res.status(201).json({
      id: newCustomer._id,
      custName: newCustomer.custName,
      phone: newCustomer.phone,
      companyName: newCustomer.companyName,
    });
  } catch (err) {
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
}

async function handleGetAllCustomer(req, res) {
  try {
    const allCustomers = await Customer.find()
      .select("custName phone companyName")
      .lean();

    if (allCustomers.length === 0)
      return res.status(404).json({ msg: "No customers found" });

    const cleanCustomers = allCustomers.map((c) => ({
      id: c._id,
      custName: c.custName,
      phone: c.phone,
      companyName: c.companyName,
    }));

    res.json(cleanCustomers);
  } catch (err) {
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
}

async function handleGetCustomerByName(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const customers = await Customer.find({
      custName: { $regex: q, $options: "i" },
    })
      .limit(10)
      .lean();

    res.json(
      customers.map((c) => ({
        id: c._id,
        custName: c.custName,
        phone: c.phone,
        companyName: c.companyName,
      })),
    );
  } catch (err) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: err.message,
    });
  }
}

async function handleCustomerDelete(req, res) {
  try {
    const { id } = req.params;
    const customerToBeDeleted = await Customer.findByIdAndDelete(id);
    if (!customerToBeDeleted) {
      return res.status(404).json({ msg: "Customer not Found" });
    }
    res.json({ msg: "Customer Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
}

async function handleCustomerUpdate(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedCustomer) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    res.json({
      id: updatedCustomer._id,
      custName: updatedCustomer.custName,
      phone: updatedCustomer.phone,
      companyName: updatedCustomer.companyName,
    });
  } catch (err) {
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
}

async function handleBulkUploadFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: "Excel file is empty" });
    }

    const customers = rows.map((row) => ({
      custName: row.custName,
      phone: row.phone,
      companyName: row.companyName,
    }));

    const newCustomer = await Customer.insertMany(customers);

    fs.unlinkSync(req.file.path);

    const response = newCustomer.map((p) => ({
      id: newCustomer._id,
      custName: newCustomer.custName,
      phone: newCustomer.phone,
      companyName: newCustomer.companyName,
    }));

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleGetAllCustomer,
  handleCreateCustomer,
  handleGetCustomerByName,
  handleCustomerDelete,
  handleCustomerUpdate,
  handleBulkUploadFromExcel,
};
