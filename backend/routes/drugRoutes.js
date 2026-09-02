const express = require("express");
const Drug = require("../models/Drug");

const router = express.Router();

// GET all drugs
router.get("/", async (req, res) => {
  try {
    const drugs = await Drug.find();
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch drugs" });
  }
});

// POST a new drug
router.post("/", async (req, res) => {
  try {
    const newDrug = new Drug(req.body);
    const savedDrug = await newDrug.save();

    res.status(201).json(savedDrug);
  } catch (error) {
    res.status(400).json({
      message: "Failed to add drug",
      error: error.message,
    });
  }
});

// GET a single drug by ID
router.get("/:id", async (req, res) => {
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
router.put("/:id", async (req, res) => {
  try {
    const updatedDrug = await Drug.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedDrug) {
      return res.status(404).json({
        message: "Drug not found"
      });
    }

    res.json(updatedDrug);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update drug",
      error: error.message
    });
  }
});

// DELETE a drug
router.delete("/:id", async (req, res) => {
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