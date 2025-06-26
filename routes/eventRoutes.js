const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { cloudinary, storage } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage });
const Event = require("../models/Event");

const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { adminOnly } = require("../config/roles");

// GET /events - list all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }); // latest first
    res.render("events/list", { events });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching events");
  }
});

// GET /events/add - show the form to create a new event
router.get("/add", requireLogin, canManage(adminOnly, 'event'), (req, res) => {
  res.render("events/add");
});

// GET /events/:id/edit
router.get("/:id/edit", requireLogin, canManage(adminOnly, 'event'), eventController.renderEditForm);

// GET /events/:id
router.get("/:id", eventController.viewEvent);

// POST /events - create event with files
router.post(
  "/",
  requireLogin,
  canManage(adminOnly, 'event'),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "file", maxCount: 1 } // ✅ Added to support file uploads (PDF, ZIP)
  ]),
  async (req, res) => {
    try {
      const { title, description, date } = req.body;

      let imageUrls = [];
      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "phagwara-yog-zila/events/images",
          });
          imageUrls.push(result.secure_url);
        }
      }

      let videoUrl = "";
      if (req.files["video"] && req.files["video"][0]) {
        const result = await cloudinary.uploader.upload(req.files["video"][0].path, {
          resource_type: "video",
          folder: "phagwara-yog-zila/events/videos",
        });
        videoUrl = result.secure_url;
      }

      let audioUrl = "";
      if (req.files["audio"] && req.files["audio"][0]) {
        const result = await cloudinary.uploader.upload(req.files["audio"][0].path, {
          resource_type: "video",
          folder: "phagwara-yog-zila/events/audios",
        });
        audioUrl = result.secure_url;
      }

      let fileUrl = null;
      if (req.files["file"] && req.files["file"][0]) {
        const result = await cloudinary.uploader.upload(req.files["file"][0].path, {
          resource_type: "raw",
          folder: "phagwara-yog-zila/events/files",
        });
        fileUrl = result.secure_url;
      }

      const event = new Event({
        title,
        description,
        date,
        imageUrls,
        videoUrl,
        audioUrl,
        fileUrl,
      });

      await event.save();
      res.redirect("/events");
    } catch (err) {
      console.error(err);
      res.send("Error saving event");
    }
  }
);

// POST /events/:id/delete - delete event
router.post("/:id/delete", requireLogin, canManage(adminOnly, 'event'), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect("/events");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting event");
  }
});

// PUT /events/:id - update event
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
      const { title, description, date, deleteImages, deleteVideo, deleteAudio, deleteFile } = req.body;
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).send("Event not found");

      event.title = title;
      event.description = description;
      event.date = date;

      // 🔻 DELETE IMAGES
      if (deleteImages) {
        if (typeof deleteImages === "string") {
          event.imageUrls = event.imageUrls.filter((url) => url !== deleteImages);
        } else if (Array.isArray(deleteImages)) {
          event.imageUrls = event.imageUrls.filter((url) => !deleteImages.includes(url));
        }
      }

      // 🔻 DELETE VIDEO
      if (deleteVideo === "true") {
        event.videoUrl = "";
      }

      // 🔻 DELETE AUDIO
      if (deleteAudio === "true") {
        event.audioUrl = "";
      }

      // 🔻 DELETE FILE
      if (deleteFile === "true") {
        event.fileUrl = "";
      }

      // 🔺 NEW IMAGES
      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "phagwara-yog-zila/events/images",
            resource_type: "image",
          });
          event.imageUrls.push(result.secure_url);
        }
      }

      // 🔺 NEW VIDEO
      if (req.files["video"] && req.files["video"][0]) {
        const result = await cloudinary.uploader.upload(req.files["video"][0].path, {
          resource_type: "video",
          folder: "phagwara-yog-zila/events/videos",
        });
        event.videoUrl = result.secure_url;
      }

      // 🔺 NEW AUDIO
      if (req.files["audio"] && req.files["audio"][0]) {
        const result = await cloudinary.uploader.upload(req.files["audio"][0].path, {
          resource_type: "video", // Cloudinary treats audio as video
          folder: "phagwara-yog-zila/events/audios",
        });
        event.audioUrl = result.secure_url;
      }

      // 🔺 NEW FILE
      if (req.files["file"] && req.files["file"][0]) {
        const result = await cloudinary.uploader.upload(req.files["file"][0].path, {
          resource_type: "raw",
          folder: "phagwara-yog-zila/events/files",
        });
        event.fileUrl = result.secure_url;
      }

      await event.save();
      res.redirect(`/events/${event._id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating event");
    }
  }
);

module.exports = router;
