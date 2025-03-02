const { z } = require("zod");

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    role: z.enum(["ADMIN", "USER"]).default("USER"),
    age: z
      .preprocess((val) => (val === "" ? undefined : Number(val)), z
        .number()
        .min(18, "You must be at least 18 years old")
        .max(120, "Age must be less than 120")
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const userUpdateSchema = z.object({
  profilePic: z.string().optional(),
  document: z
    .object({
      licenseNumber: z.string().min(1, "License number is required"),
      blueBookImage: z
        .array(z.string())
        .min(1, "At least one blue book image is required"),
      vehicleImage: z
        .array(z.string())
        .min(1, "At least one vehicle image is required"),
      productionYear: z
        .number()
        .min(2000, "Vehicle must not be older than 2000")
        .max(new Date().getFullYear(), "Production year cannot be in the future")
        .int("Production year must be a whole number"),
    })
    .optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),


});

// export type LoginSchemaType = z.infer<typeof loginSchema>;
// export type UserUpdateSchemaType = z.infer<typeof userUpdateSchema>;

module.exports = { registerSchema, loginSchema, userUpdateSchema };
