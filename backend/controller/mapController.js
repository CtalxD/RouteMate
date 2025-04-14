// controllers/drivermapController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Update driver's location
const updateDriverLocation = async (driverId, latitude, longitude, accuracy, isOnline) => {
  try {
    const updatedLocation = await prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude,
        longitude,
        accuracy,
        isOnline,
        lastUpdated: new Date()
      },
      create: {
        driverId,
        latitude,
        longitude,
        accuracy,
        isOnline
      }
    });
    return updatedLocation;
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
};

// Get driver's current location
const getDriverLocation = async (driverId) => {
  try {
    const location = await prisma.driverLocation.findUnique({
      where: { driverId }
    });
    return location;
  } catch (error) {
    console.error('Error getting driver location:', error);
    throw error;
  }
};

// Get all online drivers' locations
const getOnlineDriversLocations = async () => {
  try {
    const drivers = await prisma.driverLocation.findMany({
      where: { isOnline: true },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            // include other driver details you need
          }
        }
      }
    });
    return drivers;
  } catch (error) {
    console.error('Error getting online drivers:', error);
    throw error;
  }
};

// Toggle driver's online status
const toggleDriverStatus = async (driverId, status) => {
  try {
    const updatedDriver = await prisma.driverLocation.update({
      where: { driverId },
      data: { isOnline: status }
    });
    return updatedDriver;
  } catch (error) {
    // If record doesn't exist, create it with default location
    if (error.code === 'P2025') {
      const defaultLocation = {
        driverId,
        latitude: 0,
        longitude: 0,
        isOnline: status
      };
      return await prisma.driverLocation.create({
        data: defaultLocation
      });
    }
    console.error('Error toggling driver status:', error);
    throw error;
  }
};

module.exports = {
  updateDriverLocation,
  getDriverLocation,
  getOnlineDriversLocations,
  toggleDriverStatus
};