const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const ticketController = require('../controller/ticketController');

// Public routes
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);

// Protected routes (require authentication)
router.put('/:id', authenticateToken, ticketController.updateTicket);
router.patch('/:id/status', authenticateToken, ticketController.updateTicketStatus);
router.delete('/:id', authenticateToken, ticketController.deleteTicket);

module.exports = router;