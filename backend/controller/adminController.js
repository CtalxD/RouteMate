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

    const token = jwt.sign({ email: admin.email, role: 'ADMIN' }, process.env.JWT_SECRET, {
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



// const loginAdmin = async (req, res) => {
//   try {
//     const validationResult = loginSchema.safeParse(req.body);
//     if (!validationResult.success) {
//       return res.status(400).json({ errors: validationResult.error.errors });
//     }

//     const { email, password } = req.body;

//     const user = await prisma.admin.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const isPasswordValid = await bcrypt.compare(hashedPassword, user.password);
//     if (isPasswordValid) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.status(200).json({ message: "Admin Login successful", token });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };