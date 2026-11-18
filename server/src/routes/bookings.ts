import { Router } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import { requireAuth, allowRoles, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const ACTIVE_STATUSES = ["requested", "accepted", "in-progress"];

router.post("/", requireAuth, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const { serviceId, customerPhone, address, preferredDate, problemDescription } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: "Invalid service ID." });
    }

    if (!customerPhone || !address || !preferredDate || !problemDescription || problemDescription.trim().length < 20) {
      return res.status(400).json({ success: false, message: "Please provide all required details. Problem description must be at least 20 characters." });
    }

    const service = await Service.findOne({
      _id: serviceId,
      approvalStatus: "approved",
      isAvailable: true
    });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found or unavailable." });
    }

    if (service.technicianEmail.toLowerCase() === req.user!.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "You cannot book your own service." });
    }

    const date = new Date(preferredDate);
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "Please select a valid future date." });
    }

    const existingBooking = await (Booking as any).findOne({
      serviceId: String(service._id),
      customerEmail: req.user!.email.toLowerCase(),
      status: { $in: ACTIVE_STATUSES }
    });

    if (existingBooking) {
      return res.status(409).json({ success: false, message: "You already have an active booking for this service." });
    }

    const booking = await Booking.create({
      serviceId: String(service._id),
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      customerName: req.user!.name,
      customerEmail: req.user!.email.toLowerCase(),
      customerPhone,
      address,
      preferredDate: date,
      problemDescription: problemDescription.trim(),
      status: "requested",
      finalAmount: service.basePrice,
      paymentStatus: "unpaid"
    });

    return res.status(201).json({ success: true, message: "Booking request submitted.", booking });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({ success: false, message: "Could not create booking." });
  }
});

router.get("/mine", requireAuth, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const bookings = await Booking.find({ customerEmail: req.user!.email.toLowerCase() }).sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load bookings." });
  }
});

router.get("/assigned", requireAuth, allowRoles("technician"), async (req: AuthRequest, res) => {
  try {
    const bookings = await Booking.find({ technicianEmail: req.user!.email.toLowerCase() }).sort({ createdAt: -1 });
    return res.json({ success: true, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not load assigned bookings." });
  }
});

router.patch("/:id/status", requireAuth, allowRoles("technician"), async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID." });
    }

    const { status, finalAmount } = req.body;
    const booking = await Booking.findOne({ _id: id, technicianEmail: req.user!.email.toLowerCase() });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const transitions: Record<string, string[]> = {
      requested: ["accepted", "rejected"],
      accepted: ["in-progress"],
      "in-progress": ["completed"]
    };

    if (!transitions[booking.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status transition." });
    }

    if (status === "completed") {
      const amount = Number(finalAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "Final amount must be greater than zero." });
      }
      booking.finalAmount = amount;
    }

    booking.status = status;
    await booking.save();

    return res.json({ success: true, message: "Booking status updated.", booking });
  } catch (error) {
    console.error("Update booking error:", error);
    return res.status(500).json({ success: false, message: "Could not update booking." });
  }
});

router.patch("/:id/cancel", requireAuth, allowRoles("customer"), async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID." });
    }

    const booking = await Booking.findOne({
      _id: id,
      customerEmail: req.user!.email.toLowerCase()
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "requested") {
      return res.status(400).json({ success: false, message: "Only requested bookings can be cancelled." });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.json({ success: true, message: "Booking cancelled.", booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not cancel booking." });
  }
});

export default router;



