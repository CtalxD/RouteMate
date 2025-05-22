const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc Rate a bus after trip completion
 * @route POST /api/ratings
 * @access Private (User)
 */
const createRating = async (req, res) => {
  try {
    const { userId, busId, rating, comment } = req.body;

    // Validate required fields
    if (!userId || !busId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, busId and rating are required' 
      });
    }

    // Parse userId to integer
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userId format' 
      });
    }

    // Validate rating (1-5)
    const parsedRating = parseInt(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { busId }
    });

    if (!bus) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bus not found' 
      });
    }

    // Check if user has completed a trip on this bus
    const hasCompletedTrip = await prisma.ticket.findFirst({
      where: {
        userId: parsedUserId,
        busNumberPlate: busId,
        paymentStatus: 'COMPLETED'
      }
    });

    if (!hasCompletedTrip) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only rate buses you have traveled with' 
      });
    }

    // Check if user already rated this bus - if yes, update it
    const existingRating = await prisma.busRating.findFirst({
      where: {
        userId: parsedUserId,
        busId
      }
    });

    let result;
    if (existingRating) {
      // Update existing rating
      result = await prisma.busRating.update({
        where: { id: existingRating.id },
        data: {
          rating: parsedRating,
          comment: comment || null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePic: true
            }
          }
        }
      });
    } else {
      // Create new rating
      result = await prisma.busRating.create({
        data: {
          userId: parsedUserId,
          busId,
          rating: parsedRating,
          comment: comment || null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePic: true
            }
          }
        }
      });
    }

    res.status(existingRating ? 200 : 201).json({
      success: true,
      data: result,
      message: existingRating ? 'Rating updated successfully' : 'Rating created successfully'
    });

  } catch (error) {
    console.error('Error creating/updating rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save rating',
      error: error.message 
    });
  }
};

/**
 * @desc Get all ratings for a specific bus
 * @route GET /api/ratings/bus/:busId
 * @access Public
 */
const getBusRatings = async (req, res) => {
  try {
    const { busId } = req.params;

    const ratings = await prisma.busRating.findMany({
      where: { busId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePic: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating
    const averageRating = ratings.length > 0 
      ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ratings,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings: ratings.length
      }
    });

  } catch (error) {
    console.error('Error fetching bus ratings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bus ratings',
      error: error.message 
    });
  }
};

/**
 * @desc Get a user's rating for a specific bus
 * @route GET /api/ratings/user/:userId/bus/:busId
 * @access Private (User)
 */
const getUserBusRating = async (req, res) => {
  try {
    const { userId, busId } = req.params;

    const rating = await prisma.busRating.findFirst({
      where: {
        userId: parseInt(userId),
        busId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        bus: {
          select: {
            busId: true,
            busNumber: true
          }
        }
      }
    });

    if (!rating) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: rating
    });

  } catch (error) {
    console.error('Error fetching user bus rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user bus rating',
      error: error.message 
    });
  }
};

/**
 * @desc Update a user's rating
 * @route PUT /api/ratings/:ratingId
 * @access Private (User)
 */
const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating (1-5)
    const parsedRating = parseInt(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    const updatedRating = await prisma.busRating.update({
      where: { id: parseInt(ratingId) },
      data: {
        rating: parsedRating,
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedRating,
      message: 'Rating updated successfully'
    });

  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update rating',
      error: error.message 
    });
  }
};

/**
 * @desc Delete a rating
 * @route DELETE /api/ratings/:ratingId
 * @access Private (User/Admin)
 */
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;

    await prisma.busRating.delete({
      where: { id: parseInt(ratingId) }
    });

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete rating',
      error: error.message 
    });
  }
};

module.exports = {
  createRating,
  getBusRatings,
  getUserBusRating,
  updateRating,
  deleteRating
};