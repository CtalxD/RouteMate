const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { 
  msgUser,
  forgotPassword,
  resetPassword,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logout,
  refreshToken 
} = require("../controller/userController");

router.get("/", msgUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getUserProfile);
router.put("/profile", upload.single("profilePic"), updateUserProfile);
router.post("/logout", logout);
router.post("/forgot-pass", forgotPassword);
router.post("/reset-pass", resetPassword);
router.post("/refresh-token", refreshToken);

module.exports = router;
