const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  msgUser, // Ensure this is correctly exported in your controller
  getUserProfile,
  forgotPassword,
  resetPassword,
  updateUserProfile, // Adding the missing functionality for fetching user profile
} = require("../controller/userController");
const router = express.Router();

// Define routes
router.get("/", msgUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getUserProfile);
router.get("/logout", logout);
router.post("/forgot-pass",forgotPassword );
router.post("/reset-pass",resetPassword );
router.put("/profile",updateUserProfile)


module.exports = router;
