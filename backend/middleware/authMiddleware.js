// backend/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

// Authenticate JWT token
const authenticateToken = (req, res, next) => {
  let token;
  if (
    req?.headers?.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Authentication token is missing" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();    
  } catch (error) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }
};

// Authorize by role
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden - insufficient permissions" });
    }
  };
};

// Logout handler
const logout = (req, res) => {
  res.cookie("jwt_cookie", "", { expires: new Date(0) });
  res.status(200).json({ message: "Logout successful" });
};

module.exports = { authenticateToken, authorizeRole, logout };