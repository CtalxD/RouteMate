require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtTokenLife: process.env.JWT_TOKEN_LIFE,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshTokenLife: process.env.REFRESH_TOKEN_LIFE,
};

module.exports = { config };
