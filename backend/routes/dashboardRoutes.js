const express = require("express");
const Drug = require("../models/Drug");
const StockMovement = require("../models/StockMovement");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET drugs expiring soon
router.get("/expiring-soon", protect, async (req, res) => {
  try {
    const today = new Date();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const drugs = await Drug.find({
      expiryDate: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    }).sort({ expiryDate: 1 });

    res.json({
      count: drugs.length,
      drugs
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expiring drugs",
      error: error.message
    });
  }
});

// GET dashboard statistics
router.get("/stats", protect, async (req, res) => {
  try {
    const totalDrugs = await Drug.countDocuments();

    const stockResult = await Drug.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$quantity" }
        }
      }
    ]);

    const totalStock =
      stockResult.length > 0 ? stockResult[0].totalStock : 0;

    const lowStock = await Drug.countDocuments({
      status: "Low Stock"
    });

    const outOfStock = await Drug.countDocuments({
      status: "Out of Stock"
    });

    const expired = await Drug.countDocuments({
      status: "Expired"
    });

    const totalMovements = await StockMovement.countDocuments();

    const pendingMovements = await StockMovement.countDocuments({
      status: "Pending"
    });

    const inTransitMovements = await StockMovement.countDocuments({
      status: "In Transit"
    });

    const deliveredMovements = await StockMovement.countDocuments({
      status: "Delivered"
    });

    res.json({
      totalDrugs,
      totalStock,
      lowStock,
      outOfStock,
      expired,
      totalMovements,
      pendingMovements,
      inTransitMovements,
      deliveredMovements
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
});

module.exports = router;