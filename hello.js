const mongoose = require("mongoose");
require("dotenv").config(); // Loads MONGODB_URI from .env
const Saadhak = require("./models/Saadhak");

async function photo() {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

  console.log("✅ Connected to MongoDB");

  try {
    await Saadhak.updateMany(
  { photoApprovalStatus: { $exists: false } },
  {
    $set: {
      photoApprovalStatus: "rejected",
    },
  }
);

console.log("Migration Completed");
  } catch (err) {
    console.error("❌ Error updating attendance records:", err);
    mongoose.connection.close();
    process.exit(0);
  }
}


mongoose.disconnect();
// Run the function
// deleteQuestionsWithBlankName();

photo();
