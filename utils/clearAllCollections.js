// scripts/addPrantToAllCollections.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Zila = require('../models/Zila');
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak');

const ObjectId = mongoose.Types.ObjectId;
const prantId = new ObjectId('6890868bc19fc86268bd78bd');

async function addPrantToAllCollections() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const [zilaResult, ksheterResult, kenderResult, saadhakResult] = await Promise.all([
      Zila.updateMany({}, { $set: { prant: prantId } }),
      Ksheter.updateMany({}, { $set: { prant: prantId } }),
      Kender.updateMany({}, { $set: { prant: prantId } }),
      Saadhak.updateMany({}, { $set: { prant: prantId } }),
    ]);

    console.log(`✔ Zila updated: ${zilaResult.modifiedCount}`);
    console.log(`✔ Ksheter updated: ${ksheterResult.modifiedCount}`);
    console.log(`✔ Kender updated: ${kenderResult.modifiedCount}`);
    console.log(`✔ Saadhak updated: ${saadhakResult.modifiedCount}`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error updating documents:", err);
    await mongoose.disconnect();
  }
}

addPrantToAllCollections();
