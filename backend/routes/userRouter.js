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
  getAllUsers,
  refreshToken
} = require("../controller/userController");
const { validateRequest } = require("../middleware/validateRequest");

// Public routes (no authentication required)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-pass", forgotPassword);
router.post("/reset-pass", resetPassword);
router.post("/refresh-token", refreshToken);

//protected routes
router.get("/profile", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, upload.single("profilePic"), updateUserProfile);
router.post("/logout", authenticateToken, logout);
router.get("/getAllUsers", getAllUsers);

module.exports = router;
