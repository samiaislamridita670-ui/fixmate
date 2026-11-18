import { Router } from "express";
import mongoose from "mongoose";
import { verifyToken, verifyAdmin, type AuthRequest } from "../middleware/auth.js";
import {
  findUserById,
  listUsers,
  updateUserProfile,
  updateUserRole,
} from "../lib/users.js";

const router = Router();

/** Current user profile (any role). */
router.get("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = await findUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ success: false, message: "Could not load your profile." });
  }
});

/** Update own profile — email and role are never accepted here. */
router.patch("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { name, phone, area, bio, image } = req.body || {};
    const updates: { name?: string; phone?: string; area?: string; bio?: string; image?: string } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: "Please provide a valid name." });
      }
      updates.name = name.trim();
    }
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({ success: false, message: "Invalid phone number." });
      }
      updates.phone = phone.trim();
    }
    if (area !== undefined) {
      if (typeof area !== "string") {
        return res.status(400).json({ success: false, message: "Invalid area." });
      }
      updates.area = area.trim();
    }
    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 500) {
        return res.status(400).json({ success: false, message: "Bio must be 500 characters or fewer." });
      }
      updates.bio = bio.trim();
    }
    if (image !== undefined) {
      if (typeof image !== "string") {
        return res.status(400).json({ success: false, message: "Invalid image URL." });
      }
      updates.image = image.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No profile changes provided." });
    }

    const user = await updateUserProfile(req.user!.id, updates);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, message: "Profile updated.", user });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Could not update your profile." });
  }
});

/** ImgBB avatar upload (same service image pipeline, any signed-in user). */
router.post("/upload-image", verifyToken, async (req, res) => {
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
      { method: "POST", body: form }
    );

    const uploadData = (await uploadResponse.json()) as {
      success?: boolean;
      data?: { url?: string };
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
    console.error("Avatar upload error:", error);
    return res.status(500).json({ success: false, message: "Could not upload image." });
  }
});

/** Admin: list every registered user. */
router.get("/", ...verifyAdmin, async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ success: false, message: "Could not load users." });
  }
});

/** Admin: change a user's role (never your own). */
router.patch("/:id/role", ...verifyAdmin, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id ?? "");
    const { role } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    if (!["customer", "technician", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }
    if (id === req.user!.id) {
      return res.status(400).json({ success: false, message: "You cannot change your own role." });
    }

    const user = await updateUserRole(id, role);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({ success: true, message: `Role updated to ${role}.`, user });
  } catch (error) {
    console.error("Role change error:", error);
    return res.status(500).json({ success: false, message: "Could not update the role." });
  }
});

export default router;
