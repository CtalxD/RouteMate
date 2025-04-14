// backend/controllers/busController.js

const prisma = require("../prisma/prisma")

// Get all buses
const getAllBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
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

// Get a single bus by ID
const getBusById = async (req, res) => {
  try {
    const { busId } = req.params

    const bus = await prisma.bus.findUnique({
      where: { busId },
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

// Create a new bus
const createBus = async (req, res) => {
  try {
    const { busNumber } = req.body

    if (!busNumber) {
      return res.status(400).json({ message: "Bus number is required" })
    }

    // Check if bus with the same number already exists
    const existingBus = await prisma.bus.findUnique({
      where: { busNumber },
    })

    if (existingBus) {
      return res.status(400).json({ message: "Bus with this number already exists" })
    }

    // Create new bus
    const newBus = await prisma.bus.create({
      data: { busNumber },
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

// Update a bus
const updateBus = async (req, res) => {
  try {
    const { busId } = req.params
    const { busNumber } = req.body

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

    // Update bus
    const updatedBus = await prisma.bus.update({
      where: { busId },
      data: { busNumber },
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
}
