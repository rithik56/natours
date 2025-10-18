const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factoryController');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    mode: 'payment',
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: tour.name,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    submit_type: 'book',
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  console.log('🔔 Webhook received:', new Date().toISOString());
  console.log('Headers:', req.headers);
  console.log('Body length:', req.body.length);

  let event;
  try {
    const signature = req.headers['stripe-signature'];
    console.log('Signature present:', !!signature);

    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    console.log('✅ Event verified successfully');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed:`, err.message);
    console.log('Raw body:', req.body.toString());
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    console.log('🎯 Processing checkout.session.completed');
    const session = event.data.object;

    try {
      const tour = session.client_reference_id;
      const email = session.customer_email;

      console.log('Tour ID:', tour);
      console.log('Customer email:', email);

      const user = await User.findOne({ email });
      console.log('User found:', !!user);

      if (!user) {
        console.log('❌ User not found for email:', email);
        return res.status(400).json({ error: 'User not found' });
      }

      // Get price from session.amount_total instead of line_items
      const price = session.amount_total / 100;
      console.log('Booking price:', price);

      const booking = await Booking.create({ tour, user, price });
      console.log('✅ Booking created successfully:', booking._id);
    } catch (dbError) {
      console.log('❌ Database error:', dbError.message);
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    console.log('ℹ️ Unhandled event type:', event.type);
  }

  console.log('✅ Webhook processed successfully');
  res.status(200).json({ received: true });
});

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

// Debug endpoint to test webhook connectivity
exports.testWebhook = (req, res) => {
  console.log('🧪 Webhook test endpoint hit');
  res.status(200).json({
    message: 'Webhook endpoint is reachable',
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
};
