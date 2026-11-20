import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import { requireAuth, allowRoles, type AuthRequest } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

// Customer: payment history
router.get("/mine", requireAuth, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const payments = await Payment.find({ customerEmail: req.user!.email.toLowerCase() })
      .sort({ paidAt: -1 });
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return res.json({ success: true, count: payments.length, totalRevenue, payments });
  } catch (error) {
    console.error("Payment history error:", error);
    return res.status(500).json({ success: false, message: "Could not load payments." });
  }
});

// Admin: every transaction
router.get("/", requireAuth, allowRoles("admin"), async (_req, res) => {
  try {
    const payments = await Payment.find({}).sort({ paidAt: -1 });
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return res.json({ success: true, count: payments.length, totalRevenue, payments });
  } catch (error) {
    console.error("Transactions error:", error);
    return res.status(500).json({ success: false, message: "Could not load transactions." });
  }
});

/**
 * Customer-facing confirmation for the success page.
 *
 * Reads only: the session is fetched from Stripe with the secret key to
 * confirm the payment really happened, then the stored Payment document
 * (written exclusively by the signed webhook) is returned. This endpoint
 * never marks a booking as paid itself.
 */
router.get("/verify", requireAuth, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const sessionId = String(req.query.session_id || "");

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Missing checkout session." });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ success: false, message: "Stripe is not configured." });
    }

    const existing = await Payment.findOne({ stripeSessionId: sessionId });
    if (existing) {
      if (existing.customerEmail !== req.user!.email.toLowerCase()) {
        return res.status(403).json({ success: false, message: "This receipt belongs to another account." });
      }
      return res.json({ success: true, payment: existing });
    }

    // Confirm directly with Stripe, then give the signed webhook a moment
    // to land — it is the only writer of payment records.
    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return res.status(404).json({ success: false, message: "Checkout session not found." });
    }

    if (stripeSession.payment_status !== "paid") {
      return res.status(402).json({ success: false, message: "This payment has not completed yet." });
    }

    const ownerEmail = String(stripeSession.metadata?.customerEmail || "").toLowerCase();
    if (ownerEmail && ownerEmail !== req.user!.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "This receipt belongs to another account." });
    }

    // The webhook normally lands within a second or two of checkout.
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const payment = await Payment.findOne({ stripeSessionId: sessionId });
      if (payment) return res.json({ success: true, payment });
    }

    return res.status(202).json({
      success: false,
      message: "Payment received — the receipt will appear shortly while we confirm the transaction.",
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return res.status(500).json({ success: false, message: "Could not verify the payment." });
  }
});

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

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancelled?session_id={CHECKOUT_SESSION_ID}`
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

        const sessionEmail = String(
          session.customer_details?.email || session.customer_email || ""
        ).toLowerCase();
        const metadataEmail = String(session.metadata?.customerEmail || "").toLowerCase();
        const expectedAmount = Math.round(Number(booking.finalAmount) * 100);

        if (
          !sessionEmail ||
          sessionEmail !== booking.customerEmail.toLowerCase() ||
          metadataEmail !== booking.customerEmail.toLowerCase()
        ) {
          return res.status(400).send("Customer email verification failed.");
        }

        if (
          session.currency !== "usd" ||
          !Number.isFinite(expectedAmount) ||
          expectedAmount <= 0 ||
          session.amount_total !== expectedAmount
        ) {
          return res.status(400).send("Payment amount or currency mismatch.");
        }

        if (
          session.mode !== "payment" ||
          session.status !== "complete" ||
          typeof session.payment_intent !== "string"
        ) {
          return res.status(400).send("Invalid completed payment session.");
        }

        const existingByBooking = await Payment.findOne({ bookingId });
        const existingBySession = await Payment.findOne({ stripeSessionId: session.id });

        if (existingBySession && existingBySession.bookingId !== bookingId) {
          return res.status(409).send("Stripe session is already linked to another booking.");
        }

        if (existingByBooking && existingByBooking.stripeSessionId !== session.id) {
          return res.status(409).send("Booking already has a different payment session.");
        }

        if (!existingByBooking && !existingBySession) {
          try {
            await Payment.create({
              bookingId,
              serviceTitle: booking.serviceTitle,
              customerName: booking.customerName,
              customerEmail: booking.customerEmail,
              technicianName: booking.technicianName,
              technicianEmail: booking.technicianEmail,
              amount: session.amount_total / 100,
              currency: "usd",
              transactionId: session.payment_intent,
              stripeSessionId: session.id,
              paymentStatus: "paid",
              paidAt: new Date()
            });
          } catch (createError) {
            // A concurrent duplicate webhook may have created the record.
            const duplicatePayment = await Payment.findOne({
              bookingId,
              stripeSessionId: session.id
            });

            if (!duplicatePayment) {
              throw createError;
            }
          }
        }

        // Save booking only after the payment record exists.
        if (booking.paymentStatus !== "paid") {
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










