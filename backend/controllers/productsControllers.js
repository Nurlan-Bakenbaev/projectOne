import path from "path";
import Product from "../models/product.model.js";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import User from "../models/usersModel.js";
// POST PRODUCT
export const postProduct = async (req, res) => {
  const product = req.body;

  // Validate input
  if (!product.name || !product.userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all fields" });
  }

  // Handle images
  const imagePaths = req.files.map((file) => file.path);
  const newProduct = new Product({
    ...product,
    user: product.userId,
    images: imagePaths,
  });

  try {
    // Save new product
    await newProduct.save();

    // Update user with new product ID
    await User.findByIdAndUpdate(product.userId, {
      $push: { products: newProduct._id },
    });

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error while creating product:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET ONE PRODUCT
export const getOneProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const singleProduct = await Product.findById(id);
    if (!singleProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, product: singleProduct });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.json({ success: true, quantity: products.length, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE PRODUCT
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the product by ID to get image paths
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Delete associated images
    if (product.image && product.image.length > 0) {
      await Promise.all(
        product.image.map(async (imagePath) => {
          const fullImagePath = path.isAbsolute(imagePath)
            ? imagePath
            : path.join(__dirname, "..", imagePath);
          try {
            await fs.access(fullImagePath);
            await fs.unlink(fullImagePath);
          } catch (err) {
            console.error("Error deleting image:", err);
            // Optionally log or handle errors if needed
          }
        })
      );
    }

    // Delete the product
    await Product.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Product and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, img } = req.body.product;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, price, img },
      { new: true, runValidators: true } // Ensure valid data
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
