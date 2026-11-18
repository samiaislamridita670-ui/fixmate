import mongoose, { Schema, type Model } from "mongoose";

export const BOOKING_STATUSES = ["requested", "accepted", "rejected", "in-progress", "completed", "cancelled"] as const;

export interface IBooking {
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  category: string;
  basePrice: number;
  technicianName: string;
  technicianEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  preferredDate: Date;
  problemDescription: string;
  status: typeof BOOKING_STATUSES[number];
  finalAmount: number;
  paymentStatus: "unpaid" | "paid";
}

const bookingSchema = new Schema<IBooking>({
  serviceId: { type: String, required: true, index: true },
  serviceTitle: { type: String, required: true },
  serviceImage: { type: String, required: true },
  category: { type: String, required: true },
  basePrice: { type: Number, required: true, min: 0 },
  technicianName: { type: String, required: true },
  technicianEmail: { type: String, required: true, lowercase: true, trim: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  problemDescription: { type: String, required: true, minlength: 20 },
  status: { type: String, enum: BOOKING_STATUSES, default: "requested" },
  finalAmount: { type: Number, required: true, min: 0, default: function (this: any) { return this.basePrice; } },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" }
}, { timestamps: true });

bookingSchema.index({ customerEmail: 1, status: 1 });
bookingSchema.index({ technicianEmail: 1, status: 1 });
bookingSchema.index({ serviceId: 1, customerEmail: 1, status: 1 });

const Booking: Model<IBooking> = mongoose.models.Booking as Model<IBooking> || mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;

