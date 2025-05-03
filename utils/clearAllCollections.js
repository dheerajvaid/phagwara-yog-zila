const mongoose = require('mongoose');
require('dotenv').config(); // Loads MONGODB_URI from .env

// Import all models
const Zila = require('../models/Zila');
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak');

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

    // 🔥 Delete everything from each collection except the Saadhak with mobile 9316161666
    await Zila.deleteMany({});
    await Ksheter.deleteMany({});
    await Kender.deleteMany({});
    
    // Preserve Saadhak with mobile = 9316161666
    await Saadhak.deleteMany({ mobile: { $ne: '9316161666' } });

    // Optional: If you have more collections, add below
    // await SomeOtherModel.deleteMany({});

    console.log('✅ Cleared all data except Saadhak with mobile 9316161666');
    mongoose.connection.close();
    process.exit(0);
  } 

clearDatabasePreservingSaadhak();
