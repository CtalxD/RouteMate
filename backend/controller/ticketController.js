const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

    if (!busNumberPlate || !from || !to || !departureTime || !estimatedTime || !totalPrice || !passengerNames) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        busNumberPlate,
        from,
        to,
        departureTime,
        estimatedTime,
        totalPrice: Number.parseFloat(totalPrice),
        passengerNames: {
          set: passengerNames
        },
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
};

const getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) {
      where.paymentStatus = status.toUpperCase();
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
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
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      busNumberPlate, 
      from, 
      to, 
      departureTime, 
      estimatedTime, 
      totalPrice, 
      passengerNames,
      paymentStatus 
    } = req.body;

    // Validate required fields
    if (!busNumberPlate || !from || !to || !departureTime || !estimatedTime || !totalPrice || !passengerNames) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        busNumberPlate,
        from,
        to,
        departureTime,
        estimatedTime,
        totalPrice: Number.parseFloat(totalPrice),
        passengerNames: {
          set: passengerNames
        },
        paymentStatus,
      },
    });

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !['PENDING', 'PAID', 'CANCELLED'].includes(paymentStatus.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Valid payment status is required (PENDING, PAID, or CANCELLED)",
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { paymentStatus: paymentStatus.toUpperCase() },
    });

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await prisma.ticket.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
};

module.exports = { 
  createTicket, 
  getTickets, 
  getTicketById,
  updateTicket, 
  updateTicketStatus,
  deleteTicket 
};