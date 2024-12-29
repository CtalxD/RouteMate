const express = require("express");
const {
  registerUser,
  loginUser,
  logout,
  msgUser, // Ensure this is correctly exported in your controller
} = require("../controller/userController");
const router = express.Router();

// Define routes
router.get("/", msgUser);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/logout", logout);

// Additional route example
router.get("/user", (req, res) => {
  res.send("User route");
});

module.exports = router;
