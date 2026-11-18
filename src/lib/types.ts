export type Role = "customer" | "technician" | "admin";

export type BookingStatus =
  | "requested"
  | "accepted"
  | "rejected"
  | "in-progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ServiceMode = "Home Visit" | "Shop Drop-off";

export interface Service {
  _id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: ServiceMode;
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
  approvalStatus: ApprovalStatus;
  isAvailable: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Booking {
  _id: string;
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  category: string;
  basePrice: number;
  finalAmount: number;
  technicianName: string;
  technicianEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  preferredDate: string;
  problemDescription: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  _id: string;
  bookingId: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  technicianName: string;
  technicianEmail: string;
  amount: number;
  currency: string;
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: "paid";
  paidAt: string;
}

export interface AppUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  phone?: string;
  area?: string;
  bio?: string;
  createdAt?: string;
}

/** Shape returned by BetterAuth `useSession()` for the user object. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  phone?: string;
  area?: string;
  bio?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}
