const express = require("express");
const Warehouse = require("../models/Warehouse");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a warehouse
router.post("/", protect, async (req, res) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();

    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Get all warehouses
router.get("/",  protect, async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.status(200).json(warehouses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Get one warehouse
router.get("/:id", protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Update a warehouse
router.put("/:id", protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    Object.assign(warehouse, req.body);
    await warehouse.save();

    res.status(200).json(warehouse);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete a warehouse
router.delete("/:id",protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        message: "Warehouse not found",
      });
    }

    res.status(200).json({
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;