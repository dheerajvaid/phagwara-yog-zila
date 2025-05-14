const mongoose = require('mongoose');
require('dotenv').config(); // Loads MONGODB_URI from .env

// Import all models
// const Zila = require('../models/Zila');
// const Ksheter = require('../models/Ksheter');
// const Kender = require('../models/Kender');
// const Saadhak = require('../models/Saadhak');

const Attendance = require('../models/Attendance');


// Add more models below if needed
// const SomeOtherModel = require('../models/SomeOtherModel');

async function clearDatabasePreservingSaadhak() {

    mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log("MongoDB connected"))
      .catch((err) => console.log(err));


    console.log('✅ Connected to MongoDB');

   
  try {
    const records = await Attendance.find({});

    for (const record of records) {
      const originalDate = new Date(record.date);
      const updatedDate = new Date(
        originalDate.getFullYear(),
        originalDate.getMonth(),
        originalDate.getDate(),
        10, 0, 0, 0 // set to 10:00:00.000
      );

      record.date = updatedDate;
      await record.save();
      console.log(`Updated ${record._id} → ${updatedDate.toISOString()}`);
    }

    console.log('✅ All attendance date times updated.');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error updating attendance records:', err);
    mongoose.disconnect();
  }
    // 🔥 Delete everything from each collection except the Saadhak with mobile 9316161666
    // await Zila.deleteMany({});
    // await Ksheter.deleteMany({});
    // await Kender.deleteMany({});
    // await Attendance.deleteMany({});
    
    // Preserve Saadhak with mobile = 9316161666
    // await Saadhak.deleteMany({ mobile: { $ne: '9316161666' } });

    // Optional: If you have more collections, add below
    // await SomeOtherModel.deleteMany({});

    // console.log('✅ Cleared all data except Saadhak with mobile 9316161666');
    console.log("done");
    mongoose.connection.close();
    process.exit(0);
  } 

  // updateAttendanceTimes();
 clearDatabasePreservingSaadhak();
