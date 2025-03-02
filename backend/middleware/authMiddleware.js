const jwt = require("jsonwebtoken");
require("dotenv").config();

const authorizeRole = (role) => {
  return (req, res, next) => {
    const userId = req.user.id;
    if (req.user.role === role) {
      req.userId = userId;
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
};

const authenticateToken = (req, res, next) => {
  let token;
  if (
    req?.headers?.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req?.cookies?.jwt_cookie) {
    token = req?.cookies?.jwt_cookie;
  }
  if (!token) {
    return res
      ?.status(401)
      .json({ message: "Authentication token is missing" });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }
};

const logout = (req, res) => {
  // Clear the token cookie by setting it to an empty value and expiring it immediately
  res.cookie("jwt_cookie", "", { expires: new Date(0) });
  res.status(200).json({ message: "Logout successful" });
};

module.exports = { authenticateToken, authorizeRole, logout };
