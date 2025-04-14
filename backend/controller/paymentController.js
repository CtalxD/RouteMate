const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env

// Initiate Khalti Payment
const initiatePayment = async (req, res) => {
  const { amount, mobile, purchase_order_id, purchase_order_name, passengerNames } = req.body;

  try {
    const response = await axios.post(
      'https://khalti.com/api/v2/epayment/initiate/',
      {
        return_url: 'http://localhost:8081/lists', // Frontend success URL
        website_url: 'http://localhost:8081/lists', // Frontend URL
        amount: amount * 100, // Amount in paisa
        purchase_order_id,
        purchase_order_name,
        customer_info: {
          name: passengerNames[0], // Use the first passenger's name
          email: 'ctalaryal22@gmail.cpm', // Replace with actual email if available
          phone: '9862732725',
        },
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        },
      }
    );

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
    });
  }
};

// Verify Khalti Payment
const verifyPayment = async (req, res) => {
  const { pidx } = req.body;

  try {
    const response = await axios.post(
      'https://khalti.com/api/v2/epayment/lookup/',
      {
        pidx,
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, // Use environment variable
        },
      }
    );

    if (response.data.status === 'Completed') {
      // Payment is successful, update your database here
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
};