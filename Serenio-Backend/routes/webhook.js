const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const Transaction = require('../models/transaction');

// Stripe webhook for payment events
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transaction = await Transaction.findOne({ stripePaymentId: paymentIntent.id });
      if (transaction) {
        transaction.status = 'succeeded';
        await transaction.save();
        console.log(`💸 Transaction updated: ${paymentIntent.id} to succeeded`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: 'Webhook error: ' + error.message });
  }
});

module.exports = router;