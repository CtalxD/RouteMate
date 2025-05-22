const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
require('dotenv').config(); // Load environment variables from .env

// Initiate Khalti Payment
  const initiatePayment = async (req, res) => {
  try {
    const { amount, return_url, ticketId } = req.body;

    if (!amount || !ticketId) {
      return res.status(400).json({
        success: false,
        message: "Amount and ticketId are required"
      });
    }

    const data = {
      return_url: return_url || "http://localhost:8081/lists",
      website_url: "http://localhost:8081/",
      amount: amount * 100,
      purchase_order_id: `order_${Date.now()}`,
      purchase_order_name: "Bus Ticket Booking",
      customer_info: {
        name: "Bus Passenger",
        email: "passenger@example.com",
        phone: "9800000000",
      },
      amount_breakdown: [
        { label: "Ticket Price", amount: amount * 100 },
        { label: "VAT", amount: 0 },
      ],
      product_details: [
        {
          identity: "bus_ticket_" + ticketId,
          name: "Bus Ticket",
          total_price: amount * 100,
          quantity: 1,
          unit_price: amount * 100,
        },
      ],
    };

    const headers = {
      Authorization: "Key 9b8cc341904c462aae137a17c2acdd4c",
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      data,
      { headers }
    );

    res.json({
      success: true,
      payment_url: response.data.payment_url,
      pidx: response.data.pidx
    });
  } catch (error) {
    console.error("Payment initiation error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Payment initiation failed",
      error: error.response?.data?.detail || error.message
    });
  }
  };
// Verify Khalti Payment
const verifyPayment = async (req, res) => {
  const { pidx } = req.body;
  
  if (!pidx) {
    return res.status(400).json({
      success: false,
      message: "Payment ID (pidx) is required"
    });
  }

  try {
    // First verify with Khalti
    const verificationResponse = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      { 
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY || '9b8cc341904c462aae137a17c2acdd4c'}`,
          "Content-Type": "application/json"
        } 
      }
    );

    // If payment was successful
    if (verificationResponse.data.status === "Completed") {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        data: verificationResponse.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment was not completed",
        status: verificationResponse.data.status
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.response?.data || error.message
    });
  }
};

  const handlePaymentCallback = async (req, res) => {
  const { pidx } = req.query;
  
  if (!pidx) {
    return res.status(400).json({
      success: false,
      message: "Payment ID (pidx) is required"
    });
  }

  try {
    // Verify payment with Khalti
    const verificationResponse = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      { 
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY || '9b8cc341904c462aae137a17c2acdd4c'}`,
          "Content-Type": "application/json"
        } 
      }
    );

    // Find or create the payment record
    let payment = await prisma.payment.findUnique({
      where: { transactionId: pidx }
    });

    if (!payment) {
      // Create a new payment record if not found
      payment = await prisma.payment.create({
        data: {
          transactionId: pidx,
          amount: verificationResponse.data.amount / 100,
          status: verificationResponse.data.status.toUpperCase(),
          metadata: verificationResponse.data.product_details ? 
            JSON.stringify(verificationResponse.data.product_details) : null
        }
      });
    }

    // If payment was successful
    if (verificationResponse.data.status === "Completed") {
      let ticketId = payment.ticketId;

      // If we don't have a ticket yet, create one from stored details
      if (!ticketId && payment.metadata) {
        try {
          const ticketDetails = JSON.parse(payment.metadata);
          
          // Create the ticket now that payment is successful
          const ticket = await prisma.ticket.create({
            data: {
              busNumberPlate: ticketDetails.busNumberPlate,
              from: ticketDetails.from,
              to: ticketDetails.to,
              departureTime: ticketDetails.departureTime,
              estimatedTime: ticketDetails.estimatedTime,
              totalPrice: Number(ticketDetails.totalPrice),
              passengerNames: {
                set: ticketDetails.passengerNames
              },
              paymentStatus: "PAID" // Directly mark as paid
            }
          });
          
          ticketId = ticket.id;
          
          // Update the payment to link it to the new ticket
          await prisma.payment.update({
            where: { 
              transactionId: pidx 
            },
            data: { 
              status: "COMPLETED",
              ticketId: ticket.id 
            }
          });
        } catch (dbError) {
          console.error("Error creating ticket:", dbError);
          return res.status(500).json({
            success: true,
            payment_successful: true,
            ticket_creation_failed: true,
            message: "Payment was successful but ticket creation failed"
          });
        }
      } else if (ticketId) {
        // If ticket exists but status needs updating
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { paymentStatus: "PAID" }
        });
        
        // Update payment record
        await prisma.payment.update({
          where: { transactionId: pidx },
          data: { status: "COMPLETED" }
        });
      }
      
      // Return success response
      return res.json({
        success: true,
        message: "Payment successful and ticket created/updated",
        ticketId: ticketId
      });
    } else {
      // Payment failed or is pending
      await prisma.payment.update({
        where: { transactionId: pidx },
        data: { status: verificationResponse.data.status.toUpperCase() }
      });
      
      return res.status(400).json({
        success: false,
        message: "Payment was not completed",
        status: verificationResponse.data.status
      });
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handlePaymentCallback
};