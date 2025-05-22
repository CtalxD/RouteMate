//backend/controller/busController.js

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// Get all buses with driver information
const getAllBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(buses)
  } catch (error) {
    console.error("Error fetching buses:", error)
    res.status(500).json({ message: "Failed to fetch buses", error: error.message })
  }
}

// Get a single bus by ID with driver information
const getBusById = async (req, res) => {
  try {
    const { busId } = req.params

    const bus = await prisma.bus.findUnique({
      where: { busId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" })
    }

    res.status(200).json(bus)
  } catch (error) {
    console.error("Error fetching bus:", error)
    res.status(500).json({ message: "Failed to fetch bus", error: error.message })
  }
}

// Create a new bus with optional driver assignment
const createBus = async (req, res) => {
  try {
    const { busNumber, userId, driverName } = req.body

    if (!busNumber) {
      return res.status(400).json({ message: "Bus number is required" })
    }

    // Check if bus with the same number already exists
    const existingBus = await prisma.bus.findFirst({
      where: { busNumber },
    })

    if (existingBus) {
      return res.status(400).json({ message: "Bus with this number already exists" })
    }

    // Create new bus with optional driver assignment
    const newBus = await prisma.bus.create({
      data: {
        busNumber,
        userId: userId || null,
        driverName: driverName || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    res.status(201).json({
      message: "Bus created successfully",
      bus: newBus,
    })
  } catch (error) {
    console.error("Error creating bus:", error)
    res.status(500).json({ message: "Failed to create bus", error: error.message })
  }
}

// Update a bus with driver assignment
const updateBus = async (req, res) => {
  try {
    const { busId } = req.params
    const { busNumber, userId, driverName } = req.body

    if (!busNumber) {
      return res.status(400).json({ message: "Bus number is required" })
    }

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { busId },
    })

    if (!existingBus) {
      return res.status(404).json({ message: "Bus not found" })
    }

    // Check if the new bus number already exists (excluding current bus)
    const duplicateBus = await prisma.bus.findFirst({
      where: {
        busNumber,
        busId: { not: busId },
      },
    })

    if (duplicateBus) {
      return res.status(400).json({ message: "Bus with this number already exists" })
    }

    // Update bus with driver information
    const updatedBus = await prisma.bus.update({
      where: { busId },
      data: {
        busNumber,
        userId: userId !== undefined ? userId : existingBus.userId,
        driverName: driverName !== undefined ? driverName : existingBus.driverName,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    res.status(200).json({
      message: "Bus updated successfully",
      bus: updatedBus,
    })
  } catch (error) {
    console.error("Error updating bus:", error)
    res.status(500).json({ message: "Failed to update bus", error: error.message })
  }
}

// Assign driver to bus
const assignDriverToBus = async (req, res) => {
  try {
    const { busId } = req.params
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" })
    }

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { busId },
    })

    if (!existingBus) {
      return res.status(404).json({ message: "Bus not found" })
    }

    // Check if user exists and is a driver
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role !== "DRIVER" && user.role !== "ADMIN") {
      return res.status(400).json({ message: "User must be a driver or admin" })
    }

    // Update bus with driver information
    const updatedBus = await prisma.bus.update({
      where: { busId },
      data: {
        userId,
        driverName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    })

    res.status(200).json({
      message: "Driver assigned to bus successfully",
      bus: updatedBus,
    })
  } catch (error) {
    console.error("Error assigning driver to bus:", error)
    res.status(500).json({ message: "Failed to assign driver to bus", error: error.message })
  }
}

// Remove driver from bus
const removeDriverFromBus = async (req, res) => {
  try {
    const { busId } = req.params

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { busId },
    })

    if (!existingBus) {
      return res.status(404).json({ message: "Bus not found" })
    }

    // Update bus to remove driver
    const updatedBus = await prisma.bus.update({
      where: { busId },
      data: {
        userId: null,
        driverName: null,
      },
    })

    res.status(200).json({
      message: "Driver removed from bus successfully",
      bus: updatedBus,
    })
  } catch (error) {
    console.error("Error removing driver from bus:", error)
    res.status(500).json({ message: "Failed to remove driver from bus", error: error.message })
  }
}

// Delete a bus
const deleteBus = async (req, res) => {
  try {
    const { busId } = req.params

    // Check if bus exists
    const existingBus = await prisma.bus.findUnique({
      where: { busId },
    })

    if (!existingBus) {
      return res.status(404).json({ message: "Bus not found" })
    }

    // Delete bus
    await prisma.bus.delete({
      where: { busId },
    })

    res.status(200).json({ message: "Bus deleted successfully" })
  } catch (error) {
    console.error("Error deleting bus:", error)
    res.status(500).json({ message: "Failed to delete bus", error: error.message })
  }
}

module.exports = {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  assignDriverToBus,
  removeDriverFromBus,
}
