const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const { multipleUpload } = require("../middleware/upload");
const {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    approveDocument,
    rejectDocument
} = require("../controller/documentController");

// Document submission by users
router.post("/", authenticateToken, multipleUpload, createDocument);

// Admin document management routes
router.get("/", authenticateToken, authorizeRole('ADMIN'), getAllDocuments);
router.get("/:id", authenticateToken, authorizeRole('ADMIN'), getDocumentById);
router.put("/:id", authenticateToken, authorizeRole('ADMIN'), multipleUpload, updateDocument);
router.delete("/:id", authenticateToken, authorizeRole('ADMIN'), deleteDocument);
router.put("/:id/approve", authenticateToken, authorizeRole('ADMIN'), approveDocument);
router.put("/:id/reject", authenticateToken, authorizeRole('ADMIN'), rejectDocument);

module.exports = router;