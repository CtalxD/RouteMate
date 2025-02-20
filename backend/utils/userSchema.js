const { z } = require("zod");

const userSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.string().min(1, "Role is required"),
  fullName: z.string().optional(), //pachi register gardai milaune
  profilePic: z.string().optional(),
  isDriverEligible: z.boolean().optional()
});

const userUpdateSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  profilePic: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.string().optional(),
});

module.exports = { userSchema, loginSchema, registerSchema,userUpdateSchema };
