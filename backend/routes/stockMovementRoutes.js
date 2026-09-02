const express = require("express");
const StockMovement = require("../models/StockMovement");
const Drug = require("../models/Drug");

const router = express.Router();

// GET all stock movements
router.get("/", async (req, res) => {
  try {
    const movements = await StockMovement.find()
      .populate("drug")
      .sort({ createdAt: -1 });

    res.json(movements);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock movements",
      error: error.message
    });
  }
});

// GET a single stock movement
router.get("/:id", async (req, res) => {
  try {
    const movement = await StockMovement.findById(req.params.id)
      .populate("drug");

    if (!movement) {
      return res.status(404).json({
        message: "Stock movement not found"
      });
    }

    res.json(movement);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stock movement",
      error: error.message
    });
  }
});

// CREATE a stock movement
router.post("/", async (req, res) => {
  try {
    const {
      drug,
      batchNumber,
      fromLocation,
      toLocation,
      quantity,
      movedBy,
      notes
    } = req.body;

    // Check that the drug exists
    const existingDrug = await Drug.findById(drug);

    if (!existingDrug) {
      return res.status(404).json({
        message: "Drug not found"
      });
    }

    // Check available quantity
    if (quantity > existingDrug.quantity) {
      return res.status(400).json({
        message: "Insufficient stock available"
      });
    }

    const newMovement = new StockMovement({
      drug,
      batchNumber,
      fromLocation,
      toLocation,
      quantity,
      movedBy,
      notes
    });

    const savedMovement = await newMovement.save();

    // Reduce stock from the current location
    existingDrug.quantity -= quantity;
    existingDrug.status =
      existingDrug.quantity === 0 ? "Out of Stock" : "Available";

    existingDrug.location = toLocation;

    await existingDrug.save();

    res.status(201).json({
      message: "Stock movement created successfully",
      movement: savedMovement,
      updatedDrug: existingDrug
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create stock movement",
      error: error.message
    });
  }
});

module.exports = router;