// controller/adminController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch admin from the database
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ email: admin.email, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_LIFE,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = { loginAdmin };