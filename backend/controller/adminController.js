const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Hardcoded admin credentials
const ADMIN_EMAIL = 'ctal@admin.com';
const ADMIN_PASSWORD = 'admin123'; 

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, process.env.JWT_SECRET, {
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

const reviewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, adminComment } = req.body;

    // Validate status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either APPROVED or REJECTED',
      });
    }

    const result = await prisma.$transaction(async (prisma) => {
      // Update document status
      const document = await prisma.document.update({
        where: { id: parseInt(documentId) },
        data: {
          status,
          adminComment,
        },
      });

      // If approved, update user's driver eligibility
      if (status === 'APPROVED') {
        await prisma.user.update({
          where: { id: document.userId },
          data: { isDriverEligible: true },
        });
      }

      return document;
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getPendingDocuments = async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { loginAdmin, reviewDocument, getPendingDocuments };