// backend/routes/ticketRouter.js

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const ticketController = require('../controller/ticketController');

// Create a new ticket
router.post('/', authenticateToken, ticketController.createTicket);

module.exports = router;