const Product = require("../models/Product");
const XLSX = require("xlsx");
const fs = require("fs");
async function handleCreateProduct(req, res) {
  try {
    const { name, price, trackStock, stock } = req.body;

    const newProduct = await Product.create({
      name,
      price,
      trackStock: trackStock || false,
      stock: trackStock ? stock || 0 : 0,
    });

    res.status(201).json({
      id: newProduct._id,
      name: newProduct.name,
      price: newProduct.price,
      trackStock: newProduct.trackStock,
      stock: newProduct.trackStock ? newProduct.stock : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleGetAllProducts(req, res) {
  try {
    const products = await Product.find()
      .select("name price stock trackStock")
      .lean();

    if (products.length === 0) {
      return res.status(404).json({ msg: "No Product found" });
    }

    const cleanProducts = products.map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      trackStock: p.trackStock,
      stock: p.trackStock ? p.stock : undefined,
    }));

    res.json(cleanProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleGetProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json({
      id: product._id,
      name: product.name,
      price: product.price,
      trackStock: product.trackStock,
      stock: product.trackStock ? product.stock : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleGetProductByName(req, res) {
  try {
    const { name } = req.params;

    if (!name) {
      // If name is empty, return all products
      const products = await Product.find()
        .select("name price trackStock stock")
        .lean();
      return res.json(
        products.map((p) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          trackStock: p.trackStock,
          stock: p.trackStock ? p.stock : undefined,
        })),
      );
    }

    // Find all matching products (case-insensitive, partial match)
    const products = await Product.find({
      name: new RegExp(name, "i"), // partial match
    })
      .select("name price trackStock stock")
      .lean();

    if (products.length === 0)
      return res.status(404).json({ msg: "No products found" });

    const cleanProducts = products.map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      trackStock: p.trackStock,
      stock: p.trackStock ? p.stock : undefined,
    }));

    res.json(cleanProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleProductDelete(req, res) {
  try {
    const { id } = req.params;
    const productToBeDeleted = await Product.findByIdAndDelete(id);

    if (!productToBeDeleted)
      return res.status(404).json({ msg: "Product not found" });

    res.json({ msg: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Need to see this in future
async function handleProductUpdate(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newTrackStock = updateData.trackStock ?? product.trackStock;

    if (updateData.stock !== undefined && !newTrackStock) {
      return res.status(400).json({
        message: "Cannot update stock for a product that does not track stock",
      });
    }

    if (product.trackStock && updateData.trackStock === false) {
      product.stock = undefined;
    }

    Object.assign(product, updateData);
    await product.save();

    const updatedProduct = product.toObject();

    res.status(200).json({
      id: updatedProduct._id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      trackStock: updatedProduct.trackStock,
      stock: updatedProduct.trackStock ? updatedProduct.stock : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

async function handleBulkUploadFromExcel(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: "Excel file is empty" });
    }

    // Map rows to products
    const products = rows.map((row) => ({
      name: row.name,
      price: row.price,
      trackStock: row.trackStock || false,
      stock: row.trackStock ? row.stock || 0 : 0,
    }));

    // Insert into DB
    const newProducts = await Product.insertMany(products);

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    const response = newProducts.map((p) => ({
      id: p._id,
      name: p.name,
      price: p.price,
      trackStock: p.trackStock,
      stock: p.trackStock ? p.stock : undefined,
    }));

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleCreateProduct,
  handleGetAllProducts,
  handleGetProductByName,
  handleGetProductById,
  handleProductDelete,
  handleProductUpdate,
  handleBulkUploadFromExcel,
};
