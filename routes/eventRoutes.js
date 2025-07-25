// ✅ Required part in POST and PUT is marked with comments.

const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { showEventList } = eventController;
const { cloudinary, storage } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage });
const Event = require("../models/Event");

const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { adminOnly } = require("../config/roles");


// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.render("events/list", { events });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching events");
  }
});

// GET add form
router.get("/add", requireLogin, canManage(adminOnly, "event"), (req, res) => {
  res.render("events/add");
});

// GET edit form
router.get("/:id/edit", requireLogin, canManage(adminOnly, "event"), eventController.renderEditForm);

// GET single event
router.get("/:id", eventController.viewEvent);

// POST create event
router.post(
  "/",
  requireLogin,
  canManage(adminOnly, "event"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, date } = req.body;

      let imageUrls = [];
      let videoUrl = "", videoPublicId = "";
      let audioUrl = "", audioPublicId = "";
      let fileUrl = "", filePublicId = "", fileResourceType = "";

      if (req.files["images"]) {
        imageUrls = req.files["images"].map(file => ({
          url: file.path,
          public_id: file.filename,
        }));
      }

      if (req.files["video"] && req.files["video"][0]) {
        videoUrl = req.files["video"][0].path;
        videoPublicId = req.files["video"][0].filename;
      }

      if (req.files["audio"] && req.files["audio"][0]) {
        audioUrl = req.files["audio"][0].path;
        audioPublicId = req.files["audio"][0].filename;
      }

      if (req.files["file"] && req.files["file"][0]) {
        fileUrl = req.files["file"][0].path;
        filePublicId = req.files["file"][0].filename;
        fileResourceType = "raw"; // ✅ Save this so we know what to delete later
      }

      await Event.create({
        title,
        description,
        date,
        imageUrls,
        videoUrl,
        videoPublicId,
        audioUrl,
        audioPublicId,
        fileUrl,
        filePublicId,
        fileResourceType, // ✅
      });

      res.redirect("/events");
    } catch (err) {
      console.error(err);
      res.send("Error saving event");
    }
  }
);

// DELETE event
router.post("/:id/delete", requireLogin, canManage(adminOnly, "event"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    if (event.imageUrls?.length > 0) {
      for (const img of event.imageUrls) {
        await cloudinary.uploader.destroy(img.public_id, { resource_type: "image" });
      }
    }

    if (event.videoPublicId) {
      await cloudinary.uploader.destroy(event.videoPublicId, { resource_type: "video" });
    }

    if (event.audioPublicId) {
      await cloudinary.uploader.destroy(event.audioPublicId, { resource_type: "video" });
    }

    if (event.filePublicId) {
      await cloudinary.uploader.destroy(event.filePublicId, {
        resource_type: event.fileResourceType || "raw", // ✅ Use stored type
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.redirect("/events");
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).send("Error deleting event");
  }
});

// PUT update event
// PUT update event
router.put(
  "/:id",
  requireLogin,
  canManage(adminOnly, "event"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        date,
        deleteImages,
        deleteVideo,
        deleteAudio,
        deleteFile,
      } = req.body;

      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).send("Event not found");

      event.title = title;
      event.description = description;
      event.date = date;

      if (deleteImages) {
        const toDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
        for (const url of toDelete) {
          const img = event.imageUrls.find((img) => img.url === url);
          if (img) {
            await cloudinary.uploader.destroy(img.public_id, { resource_type: "image" });
            event.imageUrls = event.imageUrls.filter((i) => i.url !== img.url);
          }
        }
      }

      if (deleteVideo === "true" && event.videoPublicId && !req.files["video"]) {
        await cloudinary.uploader.destroy(event.videoPublicId, { resource_type: "video" });
        event.videoUrl = "";
        event.videoPublicId = "";
      }

      if (deleteAudio === "true" && event.audioPublicId && !req.files["audio"]) {
        await cloudinary.uploader.destroy(event.audioPublicId, { resource_type: "video" });
        event.audioUrl = "";
        event.audioPublicId = "";
      }

      // ✅ Upload new file first (this takes priority)
      if (req.files["file"] && req.files["file"][0]) {
        if (event.filePublicId) {
          await cloudinary.uploader.destroy(event.filePublicId, {
            resource_type: event.fileResourceType || "raw",
          });
        }
        event.fileUrl = req.files["file"][0].path;
        event.filePublicId = req.files["file"][0].filename;
        event.fileResourceType = "raw";
      }
      // ✅ Only delete file if no new file was uploaded
      else if (deleteFile === "true" && event.filePublicId) {
        await cloudinary.uploader.destroy(event.filePublicId, {
          resource_type: event.fileResourceType || "raw",
        });
        event.fileUrl = "";
        event.filePublicId = "";
        event.fileResourceType = "";
      }

      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          event.imageUrls.push({ url: file.path, public_id: file.filename });
        }
      }

      if (req.files["video"] && req.files["video"][0]) {
        if (event.videoPublicId) {
          await cloudinary.uploader.destroy(event.videoPublicId, { resource_type: "video" });
        }
        event.videoUrl = req.files["video"][0].path;
        event.videoPublicId = req.files["video"][0].filename;
      }

      if (req.files["audio"] && req.files["audio"][0]) {
        if (event.audioPublicId) {
          await cloudinary.uploader.destroy(event.audioPublicId, { resource_type: "video" });
        }
        event.audioUrl = req.files["audio"][0].path;
        event.audioPublicId = req.files["audio"][0].filename;
      }

      await event.save();
      res.redirect(`/events/${event._id}`);
    } catch (err) {
      console.error("Error updating event:", err);
      res.status(500).send("Error updating event");
    }
  }
);


module.exports = router;
