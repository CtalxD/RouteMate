const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const createTicket = async (req, res) => {
  try {
    console.log("Received ticket data:", req.body)

    const {
      busNumberPlate,
      from,
      to,
      fromLat,
      fromLon,
      toLat,
      toLon,
      departureTime,
      estimatedTime,
      totalPrice,
      passengerNames,
      paymentStatus = "PENDING",
      userId,
    } = req.body

    if (!busNumberPlate || !from || !to || !departureTime || !estimatedTime || !totalPrice || !passengerNames) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    // Parse totalPrice safely
    let parsedTotalPrice
    try {
      parsedTotalPrice = Number.parseFloat(totalPrice)
      if (isNaN(parsedTotalPrice)) {
        console.log("Invalid totalPrice, using 0")
        parsedTotalPrice = 0
      }
    } catch (error) {
      console.log("Error parsing totalPrice:", error)
      parsedTotalPrice = 0
    }

    // Ensure passengerNames is an array
    const processedPassengerNames = Array.isArray(passengerNames) ? passengerNames : [passengerNames].filter(Boolean)

    // Parse userId safely
    let parsedUserId = null
    if (userId) {
      try {
        parsedUserId = Number.parseInt(userId, 10)
        if (isNaN(parsedUserId)) {
          console.log("Invalid userId, not associating with a user")
          parsedUserId = null
        }
      } catch (error) {
        console.log("Error parsing userId:", error)
        parsedUserId = null
      }
    }

    console.log("Creating ticket with data:", {
      busNumberPlate,
      from,
      to,
      fromLat: Number.parseFloat(fromLat),
      fromLon: Number.parseFloat(fromLon),
      toLat: Number.parseFloat(toLat),
      toLon: Number.parseFloat(toLon),
      departureTime,
      estimatedTime,
      totalPrice: parsedTotalPrice,
      passengerNames: processedPassengerNames,
      paymentStatus,
      userId: parsedUserId,
    })

      const ticketData = {
      busNumberPlate,
      from,
      to,
      fromLat: parsedFromLat,
      fromLon: parsedFromLon,
      toLat: parsedToLat,
      toLon: parsedToLon,
      departureTime,
      estimatedTime,
      totalPrice: parsedTotalPrice,
      passengerNames: {
        set: processedPassengerNames,
      },
      paymentStatus,
    }


    // Only add userId if it's valid
    if (parsedUserId) {
      ticketData.userId = parsedUserId
    }

    const ticket = await prisma.ticket.create({
      data: ticketData,
    })

    console.log("Ticket created successfully:", ticket)

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    })
  } catch (error) {
    console.error("Error creating ticket:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

// Fixed getTickets function
const getTickets = async (req, res) => {
  try {
    const { status, userId } = req.query;

    // Validate status if provided
    if (status && !["INITIATED", "PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be one of: INITIATED, PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED"
      });
    }

    const where = {};
    
    // Add status filter if provided
    if (status) {
      where.paymentStatus = status.toUpperCase();
    }

    // Filter by userId if provided
    if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId format"
        });
      }
      where.userId = parsedUserId;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    res.status(200).json({
      success: true,
      data: ticket,
    })
  } catch (error) {
    console.error("Error fetching ticket:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    })
  }
}

const updateTicket = async (req, res) => {
  try {
    const { id } = req.params
    const {
      busNumberPlate,
      from,
      to,
      departureTime,
      estimatedTime,
      totalPrice,
      passengerNames,
      paymentStatus,
      userId,
    } = req.body

    // Validate required fields
    if (!busNumberPlate || !from || !to || !departureTime || !estimatedTime || !totalPrice || !passengerNames) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    const updateData = {
      busNumberPlate,
      from,
      to,
      departureTime,
      estimatedTime,
      totalPrice: Number.parseFloat(totalPrice),
      passengerNames: {
        set: passengerNames,
      },
      paymentStatus,
    }

    // Only update userId if provided
    if (userId) {
      updateData.userId = Number.parseInt(userId, 10)
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    })

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    })
  } catch (error) {
    console.error("Error updating ticket:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    })
  }
}

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !["PENDING", "PAID", "CANCELLED"].includes(paymentStatus.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Valid payment status is required (PENDING, PAID, or CANCELLED)",
      });
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Validate status transition
    const validTransitions = {
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['CANCELLED'],
      CANCELLED: ['PENDING']
    };

    if (!validTransitions[ticket.paymentStatus]?.includes(paymentStatus.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${ticket.paymentStatus} to ${paymentStatus}`,
        allowedTransitions: validTransitions[ticket.paymentStatus]
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { paymentStatus: paymentStatus.toUpperCase() },
    });

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${paymentStatus.toUpperCase()} successfully`,
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    // Check if ticket is already cancelled
    if (ticket.paymentStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Ticket is already cancelled",
      })
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { 
        paymentStatus: "CANCELLED",
      },
    })

    console.log("Ticket cancelled:", updatedTicket)

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
      data: updatedTicket,
    })
  } catch (error) {
    console.error("Error cancelling ticket:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel ticket",
      error: error.message,
    })
  }
}

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    await prisma.ticket.delete({
      where: { id },
    })

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting ticket:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message,
    })
  }
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  cancelTicket,
  deleteTicket,
}