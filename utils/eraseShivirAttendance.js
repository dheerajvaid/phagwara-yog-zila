const mongoose = require("mongoose");
require("dotenv").config(); // Loads MONGO_URI from .env
console.log(process.env.MONGO_URI);

const ShivirAttendance = require("../models/ShivirAttendance");

async function eraseAllShivirAttendance() {
  try {
  
   console.log(process.env.MONGO_URI);

   // Set up MongoDB connection
   mongoose
     .connect(process.env.MONGO_URI, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
     })
     .then(() => console.log("MongoDB connected"))
     .catch((err) => console.log(err));

    const result = await ShivirAttendance.deleteMany();
    console.log(
      `✅ All Shivir attendance records deleted. Count: ${result.deletedCount}`
    );
  } catch (err) {
    console.error("❌ Error deleting attendance records:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0); // Exit script
  }
}

eraseAllShivirAttendance();
