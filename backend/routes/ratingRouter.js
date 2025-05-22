const express = require('express');
const router = express.Router();
const ratingController = require('../controller/ratingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create a rating
router.post('/', authenticateToken, ratingController.createRating);

// Get all ratings for a bus
router.get('/bus/:busId', ratingController.getBusRatings);

// Get a user's rating for a specific bus
router.get('/user/:userId/bus/:busId', authenticateToken, ratingController.getUserBusRating);

// Update a rating
router.put('/:ratingId', authenticateToken, ratingController.updateRating);

// Delete a rating
router.delete('/:ratingId', authenticateToken, ratingController.deleteRating);

module.exports = router;