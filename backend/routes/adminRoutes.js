const express = require('express');
const { loginAdmin, reviewDocument, getPendingDocuments } = require('../controllers/adminController');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const router = express.Router();

// Admin login route (public)
router.post('/login', loginAdmin);

// Protected admin routes
router.put('/documents/:documentId/review', authenticateAdmin, reviewDocument);
router.get('/documents/pending', authenticateAdmin, getPendingDocuments);

module.exports = router;