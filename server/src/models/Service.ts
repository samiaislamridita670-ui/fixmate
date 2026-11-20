import mongoose, { Schema, type Model } from "mongoose";

export const SERVICE_CATEGORIES = ["Smartphone", "Laptop & PC", "AC", "Refrigerator", "TV", "Washing Machine", "Electrical"] as const;

export interface IService {
  title: string;
  category: typeof SERVICE_CATEGORIES[number];
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: "Home Visit" | "Shop Drop-off";
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
  approvalStatus: "pending" | "approved" | "rejected";
  isAvailable: boolean;
}

const serviceSchema = new Schema<IService>({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: SERVICE_CATEGORIES, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  basePrice: { type: Number, required: true, min: 0.01 },
  estimatedDuration: { type: String, required: true },
  serviceMode: { type: String, enum: ["Home Visit", "Shop Drop-off"], required: true },
  serviceArea: { type: String, required: true },
  technicianName: { type: String, required: true },
  technicianEmail: { type: String, required: true, lowercase: true, trim: true },
  approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

serviceSchema.index({ approvalStatus: 1, isAvailable: 1 });
serviceSchema.index({ technicianEmail: 1 });

const Service: Model<IService> = mongoose.models.Service as Model<IService> || mongoose.model<IService>("Service", serviceSchema);
export default Service;


