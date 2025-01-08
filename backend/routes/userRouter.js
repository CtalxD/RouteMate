const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  msgUser, // Ensure this is correctly exported in your controller
  getProfile, // Adding the missing functionality for fetching user profile
} = require("../controller/userController");
const router = express.Router();

// Define routes
router.get("/", msgUser);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getProfile);
router.get("/logout", logout);


// Additional route example
router.get("/user", (req, res) => {
  res.send("User route");
});

module.exports = router;
