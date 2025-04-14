//backend/routes/adminRouter.js

const express = require('express');
const { loginAdmin } = require('../controller/adminController');
const router = express.Router();

// Admin login route (public)
router.post('/login', loginAdmin);

module.exports = router;