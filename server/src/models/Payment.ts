import mongoose, { Schema, type Model } from "mongoose";

export interface IPayment {
  bookingId: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  technicianName: string;
  technicianEmail: string;
  amount: number;
  currency: "usd";
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: "paid";
  paidAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  bookingId: { type: String, required: true, unique: true },
  serviceTitle: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  technicianName: { type: String, required: true },
  technicianEmail: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["usd"], default: "usd" },
  transactionId: { type: String, required: true },
  stripeSessionId: { type: String, required: true, unique: true },
  paymentStatus: { type: String, enum: ["paid"], default: "paid" },
  paidAt: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

paymentSchema.index({ customerEmail: 1, paidAt: -1 });

const Payment: Model<IPayment> = mongoose.models.Payment as Model<IPayment> || mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;

