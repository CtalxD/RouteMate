const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const ticketController = require('../controller/ticketController');

// Create a new ticket (public route)
router.post('/', ticketController.createTicket);

module.exports = router;
