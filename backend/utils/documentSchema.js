//backend/utils/documentSchema.js

const { z } = require("zod");

// Base validation for file paths
const filePathSchema = z.string().min(1, "File path is required");

// Enum for document status
const DocumentStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);

// Schema for creating a new document
const createDocumentSchema = z.object({
  licenseNumber: z
    .string()
    .min(1, "License number is required")
    .regex(/^\d+$/, "License number must contain only digits")
    .transform((val) => parseInt(val)), // Transform to number

  productionYear: z
    .string()
    .min(1, "Production year is required")
    .regex(/^\d{4}$/, "Production year must be a 4-digit number")
    .transform((val) => parseInt(val))
    .refine((val) => {
      const currentYear = new Date().getFullYear();
      return val >= 1900 && val <= currentYear;
    }, `Production year must be between 1900 and ${new Date().getFullYear()}`),

})

// Schema for updating document status by admin
const updateDocumentStatusSchema = z.object({
  status: DocumentStatus,
  adminComment: z
    .string()
    .max(500, "Comment must not exceed 500 characters")
    .optional(),
  documentId: z.number().int().positive("Document ID must be a positive integer")
}).strict();

// Schema for document response
const documentResponseSchema = z.object({
  id: z.number().int().positive(),
  licenseNumber: z.number().int(),
  productionYear: z.number().int(),
  status: DocumentStatus,
  adminComment: z.string().nullable(),
  userId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
  reviewedAt: z.date().nullable(),
  user: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    email: z.string().email()
  }).optional()
});

module.exports = {
  createDocumentSchema,
  updateDocumentStatusSchema,
  documentResponseSchema,
  DocumentStatus
};