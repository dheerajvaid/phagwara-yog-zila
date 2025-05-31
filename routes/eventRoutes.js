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
// const saadhakManagerRoles = [...zilaRoles, ...ksheterRoles, ...kenderRoles];
// const attendanceRoles = [...kenderRoles, ...saadhakRoles];

// Make sure this exists

// GET /events - list all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }); // latest first
    res.render("events/list", { events }); // assuming you have a list.ejs inside views/events/
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching events");
  }
});

// GET /events/add - show the form to create a new event
router.get("/add", requireLogin, canManage(adminOnly), (req, res) => {
  res.render("events/add"); // make sure you have views/events/add.ejs
});

// ⬇️ EDIT ROUTE HERE
router.get("/:id/edit", requireLogin, canManage(adminOnly),eventController.renderEditForm);

// ⬇️ VIEW ROUTE
router.get("/:id", eventController.viewEvent);

// Accept multiple images + video + audio
router.post(
  "/",requireLogin, canManage(adminOnly),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, date } = req.body;

      // Upload multiple images to Cloudinary
      let imageUrls = [];
      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "phagwara-yog-zila/events/images",
          });
          imageUrls.push(result.secure_url);
        }
      }

      // Upload video to Cloudinary
      let videoUrl = "";
      if (req.files["video"] && req.files["video"][0]) {
        const result = await cloudinary.uploader.upload(
          req.files["video"][0].path,
          {
            resource_type: "video",
            folder: "phagwara-yog-zila/events/videos",
          }
        );
        videoUrl = result.secure_url;
      }

      // Upload audio to Cloudinary
      let audioUrl = "";
      if (req.files["audio"] && req.files["audio"][0]) {
        const result = await cloudinary.uploader.upload(
          req.files["audio"][0].path,
          {
            resource_type: "video", // audio uploads also use 'video' resource type in Cloudinary
            folder: "phagwara-yog-zila/events/audios",
          }
        );
        audioUrl = result.secure_url;
      }

      const event = new Event({
        title,
        description,
        date,
        imageUrls,
        videoUrl,
        audioUrl,
      });

      await event.save();
      res.redirect("/events");
    } catch (err) {
      console.error(err);
      res.send("Error saving event");
    }
  }
);

// // GET /events/:id - show event details
// router.get("/:id", async (req, res) => {
//   try {
//     const event = await Event.findById(req.params.id);
//     if (!event) {
//       return res.status(404).send("Event not found");
//     }
//     res.render("events/view", { event }); // make sure this view exists
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

// POST /events/:id/delete - delete event by ID
router.post("/:id/delete",requireLogin, canManage(adminOnly), async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect("/events"); // redirect back to event list after deletion
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting event");
  }
});

// For updating an event by ID
router.put(
  "/:id",requireLogin, canManage(adminOnly),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, date } = req.body;

      // Find existing event
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).send("Event not found");
      }

      // Update basic fields
      event.title = title;
      event.description = description;
      event.date = date;

      const deleteImages = req.body.deleteImages; // can be undefined, string or array

      if (deleteImages) {
        if (typeof deleteImages === "string") {
          // Only one image selected for deletion, convert to array
          event.imageUrls = event.imageUrls.filter(
            (url) => url !== deleteImages
          );
        } else if (Array.isArray(deleteImages)) {
          // Multiple images selected for deletion
          event.imageUrls = event.imageUrls.filter(
            (url) => !deleteImages.includes(url)
          );
        }
      }

      // Handle new uploaded images (append to existing imageUrls)
      if (req.files["images"]) {
        for (const file of req.files["images"]) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "phagwara-yog-zila/events/images",
          });
          event.imageUrls.push(result.secure_url);
        }
      }

      // Handle new video upload (replace existing)
      if (req.files["video"] && req.files["video"][0]) {
        const result = await cloudinary.uploader.upload(
          req.files["video"][0].path,
          {
            resource_type: "video",
            folder: "phagwara-yog-zila/events/videos",
          }
        );
        event.videoUrl = result.secure_url;
      }

      // Handle new audio upload (replace existing)
      if (req.files["audio"] && req.files["audio"][0]) {
        const result = await cloudinary.uploader.upload(
          req.files["audio"][0].path,
          {
            resource_type: "video",
            folder: "phagwara-yog-zila/events/audios",
          }
        );
        event.audioUrl = result.secure_url;
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
