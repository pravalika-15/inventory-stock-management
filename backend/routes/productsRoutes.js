const express = require("express");
const router = express.Router();
const Product = require("../Schema/productModel");
const Supplier = require("../Schema/supplierModel");
const productsPerPage = 10;
router.get("/products", async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};

    if (search) {
      const searchTerm = new RegExp(search, "i");
      query = {
        $or: [
          { name: searchTerm },
          { category: searchTerm },
          // Add other fields to search in as needed
        ],
      };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const page = parseInt(req.query.page) || 1;
    let productsQuery = Product.find(query)
      .skip((page - 1) * productsPerPage)
      .limit(productsPerPage);

    const products = await productsQuery.exec();

    // Fetch supplier information for each product
    const productsWithSupplier = await Promise.all(
      products.map(async (product) => {
        const supplier = await Supplier.findById(product.supplier);
        console.log(supplier);
        return { ...product._doc, supplier };
      })
    );

    return res.json({
      products: productsWithSupplier,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    // Extract the product data from the request body
    const { id, name, category, price, description, supplier } = req.body;

    // Create a new product instance
    const newProduct = new Product({
      id,
      name,
      category,
      price,
      description,
      supplier,
    });

    // Save the product to the database
    const savedProduct = await newProduct.save();

    res.json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
