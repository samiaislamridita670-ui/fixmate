import express from "express";
import mongoose from "mongoose";
import Service, { SERVICE_CATEGORIES } from "../models/Service.js";
import { requireAuth, allowRoles, type AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Technician: Upload service image to ImgBB
router.post("/upload-image", requireAuth, allowRoles("technician"), async (req, res) => {
  try {
    const apiKey = process.env.IMGBB_API_KEY;
    const { imageBase64 } = req.body || {};

    if (!apiKey) {
      return res.status(500).json({ success: false, message: "ImgBB API key is not configured." });
    }

    if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
      return res.status(400).json({ success: false, message: "Please select an image." });
    }

    const image = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const form = new URLSearchParams();
    form.append("image", image);

    const uploadResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: form,
      }
    );

    const uploadData = await uploadResponse.json() as {
      success?: boolean;
      data?: { url?: string; display_url?: string };
      error?: { message?: string };
    };

    if (!uploadResponse.ok || !uploadData.success || !uploadData.data?.url) {
      return res.status(400).json({
        success: false,
        message: uploadData.error?.message || "Image upload failed.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: uploadData.data.url,
    });
  } catch (error) {
    console.error("ImgBB upload error:", error);
    return res.status(500).json({ success: false, message: "Could not upload image." });
  }
});

// Public: Get approved services
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter: Record<string, unknown> = {
      approvalStatus: "approved",
      isAvailable: true,
    };

    if (category && SERVICE_CATEGORIES.includes(category as typeof SERVICE_CATEGORIES[number])) {
      filter.category = category;
    }

    if (typeof search === "string" && search.trim()) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const services = await Service.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: services.length, services });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Could not fetch services." });
  }
});

// Technician: Create service (pending approval)
router.post("/", requireAuth, allowRoles("technician"), async (req: AuthRequest, res) => {
  try {
    const {
      title, category, description, image, basePrice,
      estimatedDuration, serviceMode, serviceArea,
    } = req.body || {};

    if (
      typeof title !== "string" || !title.trim() ||
      !SERVICE_CATEGORIES.includes(category) ||
      typeof description !== "string" || description.trim().length < 20 ||
      typeof image !== "string" || !image.trim() ||
      !Number.isFinite(Number(basePrice)) || Number(basePrice) <= 0 ||
      typeof estimatedDuration !== "string" || !estimatedDuration.trim() ||
      !["Home Visit", "Shop Drop-off"].includes(serviceMode) ||
      typeof serviceArea !== "string" || !serviceArea.trim()
    ) {
      return res.status(400).json({ success: false, message: "Please provide valid service details." });
    }

    const service = await Service.create({
      title: title.trim(),
      category,
      description: description.trim(),
      image: image.trim(),
      basePrice: Number(basePrice),
      estimatedDuration: estimatedDuration.trim(),
      serviceMode,
      serviceArea: serviceArea.trim(),
      technicianName: req.user!.name,
      technicianEmail: req.user!.email,
      approvalStatus: "pending",
      isAvailable: true,
    });

    return res.status(201).json({
      success: true,
      message: "Service submitted for admin approval.",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);
    return res.status(500).json({ success: false, message: "Could not create service." });
  }
});

// Technician: View own services
router.get("/mine", requireAuth, allowRoles("technician"), async (req: AuthRequest, res) => {
  try {
    const services = await Service.find({ technicianEmail: req.user!.email }).sort({ createdAt: -1 });
    return res.json({ success: true, count: services.length, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not fetch your services." });
  }
});

// Public: View one approved service
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid service ID." });
    }

    const service = await Service.findOne({
      _id: id,
      approvalStatus: "approved",
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.json({ success: true, service });
  } catch (error) {
    console.error("Service details error:", error);
    return res.status(500).json({ success: false, message: "Could not fetch service details." });
  }
});
// Technician: Edit own service; every edit requires fresh admin approval
router.patch("/:id", requireAuth, allowRoles("technician"), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid service ID." });
    }

    const allowedFields = [
      "title", "category", "description", "image", "basePrice",
      "estimatedDuration", "serviceMode", "serviceArea",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No service details provided." });
    }

    if (updates.title !== undefined && (typeof updates.title !== "string" || !String(updates.title).trim())) {
      return res.status(400).json({ success: false, message: "Invalid service title." });
    }
    if (updates.category !== undefined && !SERVICE_CATEGORIES.includes(updates.category as typeof SERVICE_CATEGORIES[number])) {
      return res.status(400).json({ success: false, message: "Invalid service category." });
    }
    if (updates.description !== undefined && (typeof updates.description !== "string" || updates.description.trim().length < 20)) {
      return res.status(400).json({ success: false, message: "Description must contain at least 20 characters." });
    }
    if (updates.image !== undefined && (typeof updates.image !== "string" || !updates.image.trim())) {
      return res.status(400).json({ success: false, message: "Invalid service image URL." });
    }
    if (updates.basePrice !== undefined && (!Number.isFinite(Number(updates.basePrice)) || Number(updates.basePrice) <= 0)) {
      return res.status(400).json({ success: false, message: "Base price must be greater than zero." });
    }
    if (updates.estimatedDuration !== undefined && (typeof updates.estimatedDuration !== "string" || !updates.estimatedDuration.trim())) {
      return res.status(400).json({ success: false, message: "Invalid estimated duration." });
    }
    if (updates.serviceMode !== undefined && !["Home Visit", "Shop Drop-off"].includes(String(updates.serviceMode))) {
      return res.status(400).json({ success: false, message: "Invalid service mode." });
    }
    if (updates.serviceArea !== undefined && (typeof updates.serviceArea !== "string" || !updates.serviceArea.trim())) {
      return res.status(400).json({ success: false, message: "Invalid service area." });
    }

    if (updates.title) updates.title = String(updates.title).trim();
    if (updates.description) updates.description = String(updates.description).trim();
    if (updates.image) updates.image = String(updates.image).trim();
    if (updates.basePrice !== undefined) updates.basePrice = Number(updates.basePrice);
    if (updates.estimatedDuration) updates.estimatedDuration = String(updates.estimatedDuration).trim();
    if (updates.serviceArea) updates.serviceArea = String(updates.serviceArea).trim();

    const service = await Service.findOneAndUpdate(
      { _id: id, technicianEmail: req.user!.email },
      { $set: { ...updates, approvalStatus: "pending" } },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found or you do not own it." });
    }

    return res.json({ success: true, message: "Service updated and submitted for approval.", service });
  } catch (error) {
    console.error("Edit service error:", error);
    return res.status(500).json({ success: false, message: "Could not update service." });
  }
});

// Admin: View all services pending approval
router.get("/admin/pending", requireAuth, allowRoles("admin"), async (_req, res) => {
  try {
    const services = await Service.find({ approvalStatus: "pending" }).sort({ createdAt: -1 });
    return res.json({ success: true, count: services.length, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Could not fetch pending services." });
  }
});

// Admin: Approve or reject service
router.patch("/:id/approval", requireAuth, allowRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body || {};

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid service ID." });
    }

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: "Approval status must be approved or rejected." });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { approvalStatus },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }

    return res.json({ success: true, message: `Service ${approvalStatus}.`, service });
  } catch (error) {
    console.error("Approval error:", error);
    return res.status(500).json({ success: false, message: "Could not update approval." });
  }
});

export default router;

