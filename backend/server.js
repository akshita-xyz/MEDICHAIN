
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const drugRoutes = require("./routes/drugRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use("/api/drugs", drugRoutes);
app.use("/api/movements", stockMovementRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "MediChain backend is running!"
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`MediChain server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });