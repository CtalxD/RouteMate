const { Resend } = require('resend');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { loginSchema, registerSchema, userUpdateSchema } = require("../utils/userSchema");
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

    const accessToken = jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.refreshTokenSecret,
      { expiresIn: '7d' }
    );

    // Set cookies with appropriate options
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'development',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'development',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });


    // Send success response
    res.status(200).json({
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const logout = (req, res) => {
  // Clear both cookies
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.status(200).json({ message: "Logged out successfully" });
};

const getUserProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: "Access token required"
      });
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({
        status: 'error',
        message: "Access token is missing"
      });
    }

    try {
      const decoded = jwt.verify(accessToken, config.jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          fullName:true,
          profilePic:true
        }
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: "User not found"
        });
      }

      return res.status(200).json({
        data: user
      });

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh token.'
        });
      }
      throw err;
    }

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return res.status(500).json({
      status: 'error',
      message: "Internal server error",
      error: error.message
    });
  }
};

const updateUserProfile = async (req, res) => {

  const validationResult = userUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ errors: validationResult.error.errors });
    }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const { fullName } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "Full Name is required" });
    }

    let profilePic;
    if (req.file) {
      // Create full URL for the profile picture
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      profilePic = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        fullName,
        ...(profilePic && { profilePic }), // Store full URL in database
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePic: true,
        role: true,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

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

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Refresh token required' 
      });
    }

    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid refresh token' 
      });
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      config.refreshTokenSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json({ 
      status: 'error',
      message: 'Invalid refresh token' 
    });
  }
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
  refreshToken,
};
