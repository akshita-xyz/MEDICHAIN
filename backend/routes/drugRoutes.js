const express = require("express");
const Drug = require("../models/Drug");
const { protect, authorize } = require("../middleware/authMiddleware");
const getDrugStatus = require("../utils/drugStatus");

const router = express.Router();

// GET all drugs with search, filtering and pagination
router.get("/", protect, async (req, res) => {
  try {
    const {
      name,
      status,
      location,
      batchNumber,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Search by drug name
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by location
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // Search by batch number
    if (batchNumber) {
      filter.batchNumber = { $regex: batchNumber, $options: "i" };
    }

    // Pagination
    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const totalDrugs = await Drug.countDocuments(filter);

    const drugs = await Drug.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const totalPages = Math.ceil(totalDrugs / limitNumber);

    res.json({
      drugs,
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalDrugs,
        totalPages
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch drugs",
      error: error.message
    });
  }
});

// POST a new drug
router.post("/",protect, authorize("Admin", "Supplier", "Pharmacy"),  async (req, res) => {
  try {
    const newDrug = new Drug(req.body);
    newDrug.status = getDrugStatus(
  newDrug.quantity,
  newDrug.expiryDate,
  newDrug.reorderLevel
);
    const savedDrug = await newDrug.save();

    res.status(201).json(savedDrug);
  } catch (error) {
  console.error("ADD DRUG ERROR:", error);

  res.status(400).json({
    message: "Failed to add drug",
    error: error.message
  });
}
});

// GET a single drug by ID
router.get("/:id",protect, async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({
        message: "Drug not found"
      });
    }

    res.json(drug);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch drug",
      error: error.message
    });
  }
});

// UPDATE a drug
router.put("/:id", protect, authorize("Admin", "Supplier"), async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id);

    if (!drug) {
      return res.status(404).json({
        message: "Drug not found"
      });
    }

    // Update the drug with the new values
    Object.assign(drug, req.body);

    // Automatically calculate the correct status
    drug.status = getDrugStatus(
      drug.quantity,
      drug.expiryDate,
      drug.reorderLevel
    );

    const updatedDrug = await drug.save();

    res.json(updatedDrug);

  } catch (error) {
    res.status(400).json({
      message: "Failed to update drug",
      error: error.message
    });
  }
});

// DELETE a drug
router.delete("/:id", protect, authorize("Admin"), async (req, res) => {
  try {
    const deletedDrug = await Drug.findByIdAndDelete(req.params.id);

    if (!deletedDrug) {
      return res.status(404).json({
        message: "Drug not found"
      });
    }

    res.json({
      message: "Drug deleted successfully",
      drug: deletedDrug
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete drug",
      error: error.message
    });
  }
});

module.exports = router;