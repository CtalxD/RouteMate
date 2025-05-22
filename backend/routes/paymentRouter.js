// routes/paymentRouter.js
const express = require('express');
const axios = require('axios');
const paymentController = require('../controller/paymentController'); // Add this line
const router = express.Router();

router.post('/initiate', paymentController.initiatePayment); // Use the controller
router.post('/verify', paymentController.verifyPayment); // Move this before exports

module.exports = router;