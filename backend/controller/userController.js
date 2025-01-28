const { Resend } = require('resend');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { loginSchema, registerSchema } = require("../utils/userSchema");
const { config } = require("../config");

const prisma = new PrismaClient();

const msgUser = (req, res) => res.send("Welcome to the user route");

const registerUser = async (req, res) => {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.error.errors });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = {
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role,
    };

    const user = await prisma.user.create({ data: newUser });

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.error.errors });
    }

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role, id: user.id,},
      config.jwtSecret,
      { expiresIn: config.jwtTokenLife }
    );

    res.cookie("jwt_cookie", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("jwt_cookie");
  res.status(200).json({ message: "Logged out successfully" });
};

const getUserProfile = async (req, res) => {
  try {
    
    const token = req.cookies.jwt_cookie;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const updateUserProfile = async(req,res) =>{
  try {
    let token = req.cookies.jwt_cookie ?? req.headers.authorization.split(" ")[1] ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImN0YWxAZ21haWwuY29tIiwicm9sZSI6IlVTRVIiLCJpZCI6MSwiaWF0IjoxNzM3OTgyNTg0LCJleHAiOjE3Mzc5ODYxODR9.lRnenWPEMBJmSJfCIZbcoN5fn03AKPgBtCFD_MKMG0E";
  
    const decoded = jwt.verify(token, config.jwtSecret);

    const { fullName, profilePic } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "Full Name is required" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        fullName,
        profilePic,
      },
    });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

const resend = new Resend(process.env.RESEND_TOKEN_SECRET);

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const verificationCode = generateCode();

    try {
      await resend.emails.send({
        from: 'ctalaryal22@gmail.com',
        to: email,
        subject: 'Password Reset Verification Code',
        text: `Your verification code is: ${verificationCode}`,
      });

      res.status(200).json({ message: 'Verification code sent successfully', verificationCode });
    } catch (sendError) {
      console.error('Error sending email:', sendError);
      return res.status(500).json({ error: 'Failed to send verification code' });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ error: 'An error occurred while requesting password reset' });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};


module.exports = {
  msgUser,
  forgotPassword,
  resetPassword,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logout,
};
