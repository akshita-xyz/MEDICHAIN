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

module.exports = router;