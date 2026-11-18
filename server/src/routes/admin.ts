import { Router } from "express";
import { verifyAdmin } from "../middleware/auth.js";
import Service from "../models/Service.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import { listUsers } from "../lib/users.js";

const router = Router();

const BOOKING_STATUS_FLOW = ["requested", "accepted", "in-progress", "completed", "rejected", "cancelled"] as const;

/** Admin dashboard statistics aggregated from the four app collections. */
router.get("/stats", ...verifyAdmin, async (_req, res) => {
  try {
    const [users, services, bookings, payments, revenue] = await Promise.all([
      listUsers(),
      Service.find({}).lean(),
      Booking.find({}).sort({ createdAt: -1 }).limit(10).lean(),
      Payment.find({}).lean(),
      Payment.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const allBookings = await Booking.find({}).select("status").lean();

    const totalTechnicians = users.filter((user) => user.role === "technician").length;
    const totalCustomers = users.filter((user) => user.role === "customer").length;

    const pendingServices = services.filter((service) => service.approvalStatus === "pending").length;
    const approvedServices = services.filter((service) => service.approvalStatus === "approved").length;

    const activeStatuses = new Set(["requested", "accepted", "in-progress"]);
    const activeBookings = allBookings.filter((booking) => activeStatuses.has(String(booking.status))).length;
    const completedBookings = allBookings.filter((booking) => booking.status === "completed").length;

    const bookingsByStatus = BOOKING_STATUS_FLOW.map((status) => ({
      label: status.replace("-", " "),
      value: allBookings.filter((booking) => booking.status === status).length,
    }));

    return res.json({
      success: true,
      totalUsers: users.length,
      totalTechnicians,
      totalCustomers,
      totalServices: services.length,
      pendingServices,
      approvedServices,
      totalBookings: allBookings.length,
      activeBookings,
      completedBookings,
      totalRevenue: revenue[0]?.total ?? 0,
      paymentsCount: payments.length,
      bookingsByStatus,
      recentBookings: bookings,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, message: "Could not load statistics." });
  }
});

export default router;
