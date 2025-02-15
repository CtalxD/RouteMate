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
    .regex(/^\d{4}$/, "Production year must be a 4-digit number")
    .transform((val) => parseInt(val))
    .refine((val) => {
      const currentYear = new Date().getFullYear();
      return val >= 1900 && val <= currentYear;
    }, `Production year must be between 1900 and current year`),

  // Validate file arrays
  blueBookImage: z
    .array(filePathSchema)
    .min(1, "At least one blue book image is required")
    .max(2, "Maximum 2 blue book images allowed"),

  vehicleImage: z
    .array(filePathSchema)
    .min(1, "At least one vehicle image is required")
    .max(2, "Maximum 2 vehicle images allowed"),

  userId: z.number().int().positive("User ID must be a positive integer")
});

// Schema for updating document status by admin
const updateDocumentStatusSchema = z.object({
  status: DocumentStatus,
  adminComment: z
    .string()
    .max(500, "Comment must not exceed 500 characters")
    .optional(),
  documentId: z.number().int().positive("Document ID must be a positive integer")
});


// Example usage in your document controller:
// const createDocument = async (req, res) => {
//   try {
//     // Validate request body
//     const validatedData = createDocumentSchema.parse({
//       ...req.body,
//       blueBookImage: req.files?.blueBookImage?.map(file => file.path) || [],
//       vehicleImage: req.files?.vehicleImage?.map(file => file.path) || [],
//       userId: parseInt(req.user.id)
//     });

//     const document = await prisma.document.create({
//       data: validatedData
//     });

//     // Validate response data
//     const validatedResponse = documentResponseSchema.parse(document);

//     res.status(201).json({
//       success: true,
//       data: validatedResponse
//     });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: error.errors
//       });
//     }

//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// Example usage in your admin controller:
// const reviewDocument = async (req, res) => {
//   try {
//     const { documentId } = req.params;
//     const validatedData = updateDocumentStatusSchema.parse({
//       ...req.body,
//       documentId: parseInt(documentId)
//     });

//     const document = await prisma.document.update({
//       where: { id: validatedData.documentId },
//       data: {
//         status: validatedData.status,
//         adminComment: validatedData.adminComment
//       }
//     });

//     const validatedResponse = documentResponseSchema.parse(document);

//     res.status(200).json({
//       success: true,
//       data: validatedResponse
//     });
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: error.errors
//       });
//     }

//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

module.exports = {
  createDocumentSchema,
  updateDocumentStatusSchema,
};