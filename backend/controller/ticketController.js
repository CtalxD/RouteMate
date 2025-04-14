const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const createTicket = async (req, res) => {
  try {
    const { 
      busNumberPlate, 
      from, 
      to, 
      departureTime, 
      estimatedTime, 
      totalPrice, 
      passengerNames,
      paymentStatus = "PENDING" 
    } = req.body;

    // Validate required fields
    if (!busNumberPlate || !from || !to || !departureTime || !estimatedTime || !totalPrice || !passengerNames) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Create ticket in database
    const ticket = await prisma.ticket.create({
      data: {
        busNumberPlate,
        from,
        to,
        departureTime,
        estimatedTime,
        totalPrice: Number.parseFloat(totalPrice),
        passengerNames,
        paymentStatus,
      },
    });

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error.message,
    });
  }
}

module.exports = { createTicket }