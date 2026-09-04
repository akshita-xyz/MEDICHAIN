const express = require("express");
const StockMovement = require("../models/StockMovement");
const Drug = require("../models/Drug");
const { protect, authorize } = require("../middleware/authMiddleware");
const Warehouse = require("../models/Warehouse");

const router = express.Router();

// GET all stock movements
router.get("/", protect, async (req, res) => {
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
router.get("/:id", protect, async (req, res) => {
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
router.post(
  "/",
  protect,
  authorize("Admin", "Supplier", "Distributor", "Pharmacy"),
  async (req, res) => {
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

      // Validate quantity
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than 0"
        });
      }

      // Make sure source and destination are different
      if (fromLocation === toLocation) {
        return res.status(400).json({
          message: "Source and destination locations must be different"
        });
      }

      // Check that the drug exists
      const existingDrug = await Drug.findById(drug);

      if (!existingDrug) {
        return res.status(404).json({
          message: "Drug not found"
        });
      }

      // Make sure the drug is currently at the source location
      if (existingDrug.location !== fromLocation) {
        return res.status(400).json({
          message: `Drug is currently at ${existingDrug.location}, not ${fromLocation}`
        });
      }

      // Check available quantity
      if (quantity > existingDrug.quantity) {
        return res.status(400).json({
          message: "Insufficient stock available"
        });
      }

      // Make sure source warehouse exists
      const sourceWarehouse = await Warehouse.findOne({
        name: fromLocation
      });

      if (!sourceWarehouse) {
        return res.status(404).json({
          message: "Source warehouse not found"
        });
      }

      // Make sure destination warehouse exists
      const destinationWarehouse = await Warehouse.findOne({
        name: toLocation
      });

      if (!destinationWarehouse) {
        return res.status(404).json({
          message: "Destination warehouse not found"
        });
      }

      // Check destination capacity
      if (
        destinationWarehouse.currentStock + quantity >
        destinationWarehouse.capacity
      ) {
        return res.status(400).json({
          message: "Destination warehouse does not have enough capacity"
        });
      }

      const newMovement = new StockMovement({
        drug,
        batchNumber,
        fromLocation,
        toLocation,
        quantity,
        movedBy,
        notes,
        status: "Pending"
      });

      const savedMovement = await newMovement.save();

      res.status(201).json({
        message: "Stock movement created successfully",
        movement: savedMovement
      });

    } catch (error) {
      res.status(400).json({
        message: "Failed to create stock movement",
        error: error.message
      });
    }
  }
);

// UPDATE movement status
router.put(
  "/:id/status",
  protect,
  authorize("Admin", "Distributor", "Pharmacy"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "In Transit",
        "Delivered",
        "Cancelled"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status"
        });
      }

      const movement = await StockMovement.findById(req.params.id);

      if (!movement) {
        return res.status(404).json({
          message: "Stock movement not found"
        });
      }

      // Prevent changes after delivery or cancellation
      if (
        movement.status === "Delivered" ||
        movement.status === "Cancelled"
      ) {
        return res.status(400).json({
          message: `Movement is already ${movement.status}`
        });
      }

      // Valid status flow
      if (movement.status === "Pending" && status === "Delivered") {
        return res.status(400).json({
          message: "Movement must be In Transit before Delivered"
        });
      }

      // If movement is being delivered, update inventory
      if (status === "Delivered") {
        const drug = await Drug.findById(movement.drug);

        if (!drug) {
          return res.status(404).json({
            message: "Drug not found"
          });
        }

        // Make sure the drug is still at the source location
        if (drug.location !== movement.fromLocation) {
          return res.status(400).json({
            message: `Drug is no longer at ${movement.fromLocation}`
          });
        }

        // Make sure enough stock is available
        if (movement.quantity > drug.quantity) {
          return res.status(400).json({
            message: "Insufficient stock available"
          });
        }

        // Find warehouses
        const fromWarehouse = await Warehouse.findOne({
          name: movement.fromLocation
        });

        const toWarehouse = await Warehouse.findOne({
          name: movement.toLocation
        });

        if (!fromWarehouse) {
          return res.status(404).json({
            message: "Source warehouse not found"
          });
        }

        if (!toWarehouse) {
          return res.status(404).json({
            message: "Destination warehouse not found"
          });
        }

        // Check destination capacity
        if (
          toWarehouse.currentStock + movement.quantity >
          toWarehouse.capacity
        ) {
          return res.status(400).json({
            message: "Destination warehouse does not have enough capacity"
          });
        }

        // -----------------------------------------
        // PARTIAL TRANSFER
        // -----------------------------------------
        if (movement.quantity < drug.quantity) {
          // Reduce quantity at source
          drug.quantity -= movement.quantity;

          drug.status =
            drug.quantity <= 0
              ? "Out of Stock"
              : drug.quantity <= drug.reorderLevel
                ? "Low Stock"
                : "Available";

          await drug.save();

          // Create a new inventory record at destination
          const transferredDrug = new Drug({
            name: drug.name,
            genericName: drug.genericName,
            manufacturer: drug.manufacturer,
            batchNumber: movement.batchNumber,
            dosageForm: drug.dosageForm,
            strength: drug.strength,
            storageConditions: drug.storageConditions,
            quantity: movement.quantity,
            reorderLevel: drug.reorderLevel,
            expiryDate: drug.expiryDate,
            location: movement.toLocation,
            status:
              movement.quantity <= drug.reorderLevel
                ? "Low Stock"
                : "Available"
          });

          await transferredDrug.save();

        } else {
          // -----------------------------------------
          // FULL TRANSFER
          // -----------------------------------------

          drug.location = movement.toLocation;

          drug.status =
            drug.quantity <= drug.reorderLevel
              ? "Low Stock"
              : "Available";

          await drug.save();
        }

        // Update source warehouse stock
        fromWarehouse.currentStock = Math.max(
          0,
          fromWarehouse.currentStock - movement.quantity
        );

        // Update destination warehouse stock
        toWarehouse.currentStock += movement.quantity;

        await fromWarehouse.save();
        await toWarehouse.save();
      }

      movement.status = status;

      const updatedMovement = await movement.save();

      res.json({
        message: "Movement status updated successfully",
        movement: updatedMovement
      });

    } catch (error) {
      res.status(400).json({
        message: "Failed to update movement status",
        error: error.message
      });
    }
  }
);

module.exports = router;