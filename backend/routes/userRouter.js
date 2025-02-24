const express = require("express");
const router = express.Router();
const {upload} = require("../middleware/upload");
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  forgotPassword,
  resetPassword,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logout,
  refreshToken
} = require("../controller/userController");
const { validateRequest } = require("../middleware/validateRequest");

// Public routes (no authentication required)
router.post("/register",validateRequest, registerUser);
router.post("/login", validateRequest, loginUser);
router.post("/forgot-pass", forgotPassword);
router.post("/reset-pass", resetPassword);
router.post("/refresh-token", refreshToken);

//protected routes
router.get("/profile", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, upload.single("profilePic"), updateUserProfile);
router.post("/logout", authenticateToken, logout);

module.exports = router;
