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
      { email: user.email, role: user.role, id: user.id },
      config.jwtSecret,
      { expiresIn: config.jwtTokenLife }
    );

    res.cookie("jwt_cookie", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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

module.exports = {
  msgUser,
  registerUser,
  loginUser,
  logout,
};
