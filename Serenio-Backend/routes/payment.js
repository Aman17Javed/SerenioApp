const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const authenticateToken = require('../middleware/authMiddleware');
const Transaction = require('../models/transaction');
const Payment = require('../models/payment');

const MINIMUM_AMOUNT = {
  usd: 100, // 100 cents = $1.00
  pkr: 10000, // 100 PKR = 10,000 paisa
};

router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    const { amount, currency = 'pkr' } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const minAmount = MINIMUM_AMOUNT[currency.toLowerCase()];
    if (!minAmount) {
      return res.status(400).json({ error: `Unsupported currency: ${currency}` });
    }
    if (amount < minAmount) {
      return res.status(400).json({ error: `Amount must be at least ${minAmount / 100} ${currency.toUpperCase()}` });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { userId: req.user.userId },
      receipt_email: req.user.email,
    });

    const transaction = new Transaction({
      userId: req.user.userId,
      stripePaymentId: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status,
    });
    await transaction.save();

    console.log(`💸 Payment intent created: ${paymentIntent.id}`);
    res.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ error: 'Payment failed: ' + error.message });
  }
});

// Update transaction status (e.g., via webhook or manual check)
router.post('/update-transaction', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, status } = req.body;
    const transaction = await Transaction.findOneAndUpdate(
      { stripePaymentId: paymentIntentId },
      { status },
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update associated payment
    await Payment.updateOne(
      { appointmentId: transaction.appointmentId },
      { paymentStatus: status === 'succeeded' ? 'Success' : 'Failed' }
    );

    res.status(200).json({ message: 'Transaction updated', transaction });
  } catch (error) {
    console.error('Transaction update error:', error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

// Get transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId })
      .populate('appointmentId', 'date timeSlot');
    res.json(transactions);
  } catch (error) {
    console.error('Transaction history error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

module.exports = router;