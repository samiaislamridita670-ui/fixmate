/**
 * FixMate seed script — creates sample data for development/demo use.
 *
 * Safety rules:
 *  - Never overwrites existing documents (users are matched by email,
 *    services by title, bookings are only added when none exist).
 *  - Never creates payment records — payments come exclusively from the
 *    signed Stripe webhook.
 *  - Reads MONGODB_URI from server/.env (never hardcodes credentials).
 *
 * Usage:  npm run seed --prefix server
 */
import "dotenv/config";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import type { Collection, Document } from "mongodb";
import { hashPassword } from "better-auth/crypto";
import Service, { SERVICE_CATEGORIES } from "../src/models/Service.js";
import Booking from "../src/models/Booking.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing from server/.env");
  process.exit(1);
}

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: "customer" | "technician" | "admin";
  phone?: string;
  area?: string;
  bio?: string;
}

const TECHNICIANS: SeedUser[] = [
  {
    name: "Rakib Hasan",
    email: "rakib@fixmate.dev",
    password: "fixmate123",
    role: "technician",
    phone: "+880 1711 000111",
    area: "Dhanmondi, Dhaka",
    bio: "8 years repairing smartphones and laptops. Specialised in screen and battery replacements.",
  },
  {
    name: "Nusrat Jahan",
    email: "nusrat@fixmate.dev",
    password: "fixmate123",
    role: "technician",
    phone: "+880 1722 000222",
    area: "Gulshan, Dhaka",
    bio: "Home appliance specialist — AC, refrigerator and washing machine repairs with 6 years of field experience.",
  },
];

const CUSTOMERS: SeedUser[] = [
  {
    name: "Tanvir Ahmed",
    email: "tanvir@fixmate.dev",
    password: "fixmate123",
    role: "customer",
    phone: "+880 1811 000333",
    area: "Mirpur, Dhaka",
  },
  {
    name: "Sadia Rahman",
    email: "sadia@fixmate.dev",
    password: "fixmate123",
    role: "customer",
    phone: "+880 1822 000444",
    area: "Uttara, Dhaka",
  },
];

const ADMIN: SeedUser = {
  name: "FixMate Admin",
  email: "admin@fixmate.dev",
  password: "fixmate123",
  role: "admin",
  area: "Dhaka",
};

interface SeedService {
  title: string;
  category: string;
  description: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: "Home Visit" | "Shop Drop-off";
  serviceArea: string;
  technicianEmail: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  isAvailable?: boolean;
}

// Public placeholder images (ImgBB-hosted style URLs are replaced by real
// uploads when technicians edit their services in the dashboard).
const IMG = (_id: string) => "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80";

const SERVICES: SeedService[] = [
  {
    title: "Smartphone screen replacement",
    category: "Smartphone",
    description: "Genuine-quality OLED/LCD replacement for cracked screens, including adhesive seal, touch test and dead-pixel check before handover.",
    basePrice: 45,
    estimatedDuration: "45–60 minutes",
    serviceMode: "Shop Drop-off",
    serviceArea: "Dhanmondi, Dhaka",
    technicianEmail: "rakib@fixmate.dev",
  },
  {
    title: "Phone battery replacement",
    category: "Smartphone",
    description: "Battery swap for overheating or fast-draining phones. Includes health check, calibration and 30-day battery warranty.",
    basePrice: 25,
    estimatedDuration: "30–45 minutes",
    serviceMode: "Shop Drop-off",
    serviceArea: "Dhanmondi, Dhaka",
    technicianEmail: "rakib@fixmate.dev",
  },
  {
    title: "Laptop keyboard replacement",
    category: "Laptop & PC",
    description: "Full keyboard replacement for liquid-damaged or worn-out laptop keyboards, with key mapping verification.",
    basePrice: 60,
    estimatedDuration: "1–2 hours",
    serviceMode: "Shop Drop-off",
    serviceArea: "Dhanmondi, Dhaka",
    technicianEmail: "rakib@fixmate.dev",
  },
  {
    title: "Laptop thermal paste & cleaning",
    category: "Laptop & PC",
    description: "Deep fan cleaning, old paste removal, fresh thermal compound application and temperature benchmark after reassembly.",
    basePrice: 35,
    estimatedDuration: "45–60 minutes",
    serviceMode: "Shop Drop-off",
    serviceArea: "Dhanmondi, Dhaka",
    technicianEmail: "rakib@fixmate.dev",
  },
  {
    title: "Windows/macOS reinstall & tune-up",
    category: "Laptop & PC",
    description: "Clean OS reinstall, driver setup, update patching and startup optimisation with data backup consultation.",
    basePrice: 40,
    estimatedDuration: "1–2 hours",
    serviceMode: "Shop Drop-off",
    serviceArea: "Dhanmondi, Dhaka",
    technicianEmail: "rakib@fixmate.dev",
  },
  {
    title: "AC servicing & gas refill",
    category: "AC",
    description: "Full split or window AC servicing: filter clean, coil wash, drain check, cooling test and R410A gas top-up if required.",
    basePrice: 55,
    estimatedDuration: "1–1.5 hours",
    serviceMode: "Home Visit",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "AC compressor diagnosis",
    category: "AC",
    description: "Compressor, capacitor and relay diagnostics for ACs that trip or fail to cool, with a written repair quote.",
    basePrice: 40,
    estimatedDuration: "45–60 minutes",
    serviceMode: "Home Visit",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "Refrigerator cooling repair",
    category: "Refrigerator",
    description: "Diagnosis and repair of cooling failures, thermostat faults and frost buildup in single or double-door fridges.",
    basePrice: 65,
    estimatedDuration: "1–2 hours",
    serviceMode: "Home Visit",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "Refrigerator gasket replacement",
    category: "Refrigerator",
    description: "Door seal replacement to stop cool-air leakage, including fit adjustment and door alignment.",
    basePrice: 35,
    estimatedDuration: "45 minutes",
    serviceMode: "Home Visit",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "LED TV backlight repair",
    category: "TV",
    description: "Replacement of failed backlight strips causing dark or flickering screens, with panel reassembly and uniformity test.",
    basePrice: 70,
    estimatedDuration: "1.5–2.5 hours",
    serviceMode: "Shop Drop-off",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "Smart TV software fix",
    category: "TV",
    description: "Firmware reflash, app store repair and factory reset recovery for smart TVs stuck on boot or crashing apps.",
    basePrice: 30,
    estimatedDuration: "45–60 minutes",
    serviceMode: "Shop Drop-off",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "Washing machine drum clean & repair",
    category: "Washing Machine",
    description: "Front or top-load machine service: drum clean, belt inspection, drain pump check and noise diagnosis.",
    basePrice: 50,
    estimatedDuration: "1–1.5 hours",
    serviceMode: "Home Visit",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
  },
  {
    title: "Electrical outlet & wiring check",
    category: "Electrical",
    description: "Safety inspection of sockets, switches and visible wiring with fault tracing and immediate safe fixes.",
    basePrice: 30,
    estimatedDuration: "30–45 minutes",
    serviceMode: "Home Visit",
    serviceArea: "Gulshan, Dhaka",
    technicianEmail: "nusrat@fixmate.dev",
    approvalStatus: "pending",
  },
  {
    title: "Phone charging port repair",
    category: "Smartphone",
    description: "Charging port replacement for loose or dead ports, including cleaning, soldering where needed and charge testing.",
    basePrice: 30,
    estimatedDuration: "45–60 minutes",
    serviceMode: "Shop Drop-off",
    serviceArea: "Dhanmondi, Dhaka",
    technicianEmail: "rakib@fixmate.dev",
    isAvailable: false,
  },
];

async function ensureUser(collection: Collection<Document>, user: SeedUser): Promise<string> {
  const existing = await collection.findOne({ email: user.email });
  if (existing) return String(existing._id);

  const now = new Date();
  const passwordHash = await hashPassword(user.password);

  const doc = {
    name: user.name,
    email: user.email,
    emailVerified: true,
    image: null,
    role: user.role,
    phone: user.phone ?? "",
    area: user.area ?? "",
    bio: user.bio ?? "",
    createdAt: now,
    updatedAt: now,
  };

  const { insertedId } = await collection.insertOne(doc);
  await collection.db.collection("accounts").insertOne({
    accountId: String(insertedId),
    providerId: "credential",
    userId: new mongoose.Types.ObjectId(String(insertedId)),
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`  + ${user.role.padEnd(10)} ${user.email}`);
  return String(insertedId);
}

async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri!);
  const db = mongoose.connection.db!;
  const users = db.collection("users");

  console.log("\nEnsuring users (skips existing):");
  const technicianIds: Record<string, string> = {};
  for (const technician of TECHNICIANS) {
    technicianIds[technician.email] = await ensureUser(users, technician);
  }
  for (const customer of CUSTOMERS) {
    await ensureUser(users, customer);
  }
  await ensureUser(users, ADMIN);

  console.log("\nEnsuring services (skips existing titles):");
  let servicesCreated = 0;
  const serviceIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const service of SERVICES) {
    const technician = TECHNICIANS.find((t) => t.email === service.technicianEmail)!;
    const existing = await Service.findOne({ title: service.title });
    if (existing) {
      serviceIds[service.title] = existing._id as mongoose.Types.ObjectId;
      continue;
    }

    const created = await Service.create({
      title: service.title,
      category: service.category as typeof SERVICE_CATEGORIES[number],
      description: service.description,
      image: IMG(`photo-${1000 + servicesCreated}`),
      basePrice: service.basePrice,
      estimatedDuration: service.estimatedDuration,
      serviceMode: service.serviceMode,
      serviceArea: service.serviceArea,
      technicianName: technician.name,
      technicianEmail: technician.email,
      approvalStatus: service.approvalStatus ?? "approved",
      isAvailable: service.isAvailable ?? true,
    });
    if (!created) throw new Error(`Failed to create service: ${service.title}`);
    serviceIds[service.title] = created._id as mongoose.Types.ObjectId;
    servicesCreated++;
    console.log(`  + ${(service.approvalStatus ?? "approved").padEnd(8)} ${service.title}`);
  }

  await Service.updateMany({}, { $set: { image: IMG("fixed") } });
  await Booking.updateMany({}, { $set: { serviceImage: IMG("fixed") } });
  console.log("Updated existing service and booking images.");
  const existingBookings = await Booking.countDocuments();
  if (existingBookings > 0) {
    console.log(`\nBookings already exist (${existingBookings}) — skipping booking seed.`);
  } else {
    console.log("\nCreating sample bookings:");
    const byTitle = (title: string) => SERVICES.find((s) => s.title === title)!;
    const sample = [
      {
        service: "Smartphone screen replacement",
        customer: CUSTOMERS[0],
        status: "requested" as const,
        daysAhead: 3,
      },
      {
        service: "AC servicing & gas refill",
        customer: CUSTOMERS[1],
        status: "accepted" as const,
        daysAhead: 2,
      },
      {
        service: "Laptop thermal paste & cleaning",
        customer: CUSTOMERS[0],
        status: "in-progress" as const,
        daysAhead: 0,
      },
      {
        service: "Phone battery replacement",
        customer: CUSTOMERS[1],
        status: "completed" as const,
        daysAhead: -5,
        finalAmount: 30,
      },
      {
        service: "Washing machine drum clean & repair",
        customer: CUSTOMERS[0],
        status: "cancelled" as const,
        daysAhead: -2,
      },
    ];

    for (const entry of sample) {
      const seedService = byTitle(entry.service);
      const technician = TECHNICIANS.find((t) => t.email === seedService.technicianEmail)!;
      const preferredDate = new Date(Date.now() + entry.daysAhead * 24 * 60 * 60 * 1000);

      await Booking.create({
        serviceId: String(serviceIds[entry.service]),
        serviceTitle: seedService.title,
        serviceImage: IMG("photo-1000"),
        category: seedService.category,
        basePrice: seedService.basePrice,
        technicianName: technician.name,
        technicianEmail: technician.email,
        customerName: entry.customer.name,
        customerEmail: entry.customer.email,
        customerPhone: entry.customer.phone,
        address: `${entry.customer.area}, Dhaka`,
        preferredDate,
        problemDescription: `Sample booking for ${seedService.title.toLowerCase()} — seeded for demonstration of the FixMate workflow.`,
        status: entry.status,
        finalAmount: ("finalAmount" in entry ? entry.finalAmount : seedService.basePrice) as number,
        paymentStatus: "unpaid",
      });
      console.log(`  + [${entry.status.padEnd(11)}] ${entry.service} → ${entry.customer.email}`);
    }
  }

  const [userCount, serviceCount, bookingCount, paymentCount] = await Promise.all([
    users.countDocuments(),
    Service.countDocuments(),
    Booking.countDocuments(),
    db.collection("payments").countDocuments(),
  ]);

  console.log("\nSeed complete:");
  console.log(`  users=${userCount} services=${serviceCount} bookings=${bookingCount} payments=${paymentCount}`);
  console.log("  (payments stay at whatever the webhook has recorded — never seeded)");
  console.log("\nDemo logins — password for all: fixmate123");
  console.log("  admin@fixmate.dev | rakib@fixmate.dev | nusrat@fixmate.dev | tanvir@fixmate.dev");
}

main()
  .then(() => mongoose.disconnect())
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
    return mongoose.disconnect();
  });






