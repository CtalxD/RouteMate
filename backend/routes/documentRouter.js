const express = require("express");
const router = express.Router();
const { authorizeRole } = require("../middleware/authMiddleware");
const { multipleUpload } = require("../middleware/upload");
const { createDocumentSchema } = require("../utils/documentSchema");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require("../controller/documentController");

router.post(
  "/",
  authorizeRole,
  validateRequest(createDocumentSchema),
  multipleUpload,
  createDocument
);
router.get("/", authorizeRole, getAllDocuments);
router.get("/:id", authorizeRole, getDocumentById);
router.put("/:id", authorizeRole, multipleUpload, updateDocument);
router.delete("/:id", authorizeRole, deleteDocument);

module.exports = router;
