// routes/drivermapRouter.js
const express = require('express');
const router = express.Router();
const drivermapController = require('../controllers/mapController');
const { authenticateDriver } = require('../middlewares/authMiddleware');

// Initialize Socket.io
const initializeSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a room specific to the driver
    socket.on('join-driver-room', (driverId) => {
      socket.join(`driver-${driverId}`);
      console.log(`Driver ${driverId} joined their room`);
    });

    // Join a room for tracking all drivers (admin/dispatcher view)
    socket.on('join-tracking-room', () => {
      socket.join('tracking-room');
      console.log('Client joined tracking room');
    });

    // Handle location updates from drivers
    socket.on('update-location', async (data) => {
      try {
        const { driverId, latitude, longitude, accuracy, isOnline } = data;
        const updatedLocation = await drivermapController.updateDriverLocation(
          driverId, latitude, longitude, accuracy, isOnline
        );
        
        // Broadcast to the driver's specific room
        io.to(`driver-${driverId}`).emit('location-updated', updatedLocation);
        
        // Broadcast to tracking room (for admin/dispatcher)
        io.to('tracking-room').emit('driver-location-updated', {
          ...updatedLocation,
          socketId: socket.id
        });
      } catch (error) {
        console.error('Error handling location update:', error);
      }
    });

    // Handle status changes
    socket.on('toggle-online-status', async (data) => {
      try {
        const { driverId, status } = data;
        const result = await drivermapController.toggleDriverStatus(driverId, status);
        
        io.to(`driver-${driverId}`).emit('status-changed', result);
        io.to('tracking-room').emit('driver-status-changed', {
          driverId,
          isOnline: status
        });
      } catch (error) {
        console.error('Error toggling online status:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

// HTTP Routes
router.put('/location', authenticateDriver, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, isOnline } = req.body;
    const driverId = req.user.id;
    
    const updatedLocation = await drivermapController.updateDriverLocation(
      driverId, latitude, longitude, accuracy, isOnline
    );
    
    res.json(updatedLocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/location', authenticateDriver, async (req, res) => {
  try {
    const driverId = req.user.id;
    const location = await drivermapController.getDriverLocation(driverId);
    res.json(location || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/online-drivers', async (req, res) => {
  try {
    const drivers = await drivermapController.getOnlineDriversLocations();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/toggle-status', authenticateDriver, async (req, res) => {
  try {
    const driverId = req.user.id;
    const { status } = req.body;
    
    const result = await drivermapController.toggleDriverStatus(driverId, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  initializeSocket
};