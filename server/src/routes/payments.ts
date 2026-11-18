import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import { requireAuth, allowRoles, type AuthRequest } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

router.post("/checkout/:bookingId", requireAuth, allowRoles("customer"), async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ success: false, message: "Stripe is not configured." });
    }

    const bookingId = String(req.params.bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID." });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customerEmail: req.user!.email.toLowerCase()
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ success: false, message: "Only completed bookings can be paid." });
    }

    if (booking.paymentStatus === "paid" || await Payment.exists({ bookingId })) {
      return res.status(409).json({ success: false, message: "This booking has already been paid." });
    }

    const amount = Number(booking.finalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount." });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3001";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.customerEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: booking.serviceTitle,
            description: `FixMate booking ${booking._id}`
          }
        }
      }],
      metadata: {
        bookingId: String(booking._id),
        customerEmail: booking.customerEmail
      },
      success_url: `${clientUrl}/dashboard?payment=success`,
      cancel_url: `${clientUrl}/dashboard?payment=cancelled`
    });

    return res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(500).json({ success: false, message: "Could not create checkout session." });
  }
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send("Stripe webhook is not configured.");
  }

  if (!signature || typeof signature !== "string") {
    return res.status(400).send("Missing Stripe signature.");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe signature verification failed:", error);
    return res.status(400).send("Invalid webhook signature.");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      try {
        const bookingId = session.metadata?.bookingId;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
          return res.status(400).send("Invalid booking metadata.");
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
          return res.status(404).send("Booking not found.");
        }

        if (booking.paymentStatus !== "paid") {
          const existingPayment = await Payment.findOne({
            $or: [
              { bookingId },
              { stripeSessionId: session.id }
            ]
          });

          if (!existingPayment) {
            await Payment.create({
              bookingId,
              serviceTitle: booking.serviceTitle,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              technicianName: booking.technicianName,
              technicianEmail: booking.technicianEmail,
              amount: (session.amount_total || 0) / 100,
              currency: "usd",
              transactionId: typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.id,
              stripeSessionId: session.id,
              paymentStatus: "paid",
              paidAt: new Date()
            });
          }

          booking.paymentStatus = "paid";
          await booking.save();
        }
      } catch (error) {
        console.error("Stripe webhook processing error:", error);
        return res.status(500).send("Webhook processing failed.");
      }
    }
  }

  return res.json({ received: true });
};

export default router;
