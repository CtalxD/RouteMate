// backend/routes/busRouter.js

const express = require("express")
const router = express.Router()
const busController = require("../controller/busController")
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware")

// Public routes
router.get("/", busController.getAllBuses)
router.get("/:busId", busController.getBusById)

// Protected routes (admin only)
router.post("/", authenticateToken, authorizeRole("ADMIN"), busController.createBus)
router.put("/:busId", authenticateToken, authorizeRole("ADMIN"), busController.updateBus)
router.delete("/:busId", authenticateToken, authorizeRole("ADMIN"), busController.deleteBus)

module.exports = router
