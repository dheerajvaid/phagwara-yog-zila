const mongoose = require("mongoose");
require("dotenv").config(); // Loads MONGODB_URI from .env

const Question = require("./models/Question");

// Add more models below if needed
// const SomeOtherModel = require('../models/SomeOtherModel');

const yogaQuestions = [
  {
    text: "प्राणायाम किसके लिए विशेष रूप से उपयोगी होता है?",
    options: ["शारीरिक शक्ति बढ़ाने के लिए", "श्वसन प्रणाली सुधारने के लिए", "पाचन क्रिया बढ़ाने के लिए", "नेत्र रोग ठीक करने के लिए"],
    correctAnswers: [1],
    category: "प्राणायाम"
  },
  {
    text: "सूर्य नमस्कार में कुल कितने चरण होते हैं?",
    options: ["10", "12", "14", "8"],
    correctAnswers: [1],
    category: "आसन"
  },
  {
    text: "कपालभाति प्राणायाम का मुख्य प्रभाव किस अंग पर होता है?",
    options: ["हृदय", "यकृत", "फेफड़े", "मस्तिष्क"],
    correctAnswers: [2],
    category: "प्राणायाम"
  },
  {
    text: "योग निद्रा किसके लिए उपयुक्त है?",
    options: ["शरीर की शक्ति बढ़ाने के लिए", "मानसिक तनाव कम करने के लिए", "नेत्रज्योति बढ़ाने के लिए", "पाचन शक्ति सुधारने के लिए"],
    correctAnswers: [1],
    category: "ध्यान"
  },
  {
    text: "ताड़ासन करने से किस अंग को लाभ होता है?",
    options: ["रीढ़ की हड्डी", "हृदय", "नेत्र", "पेट"],
    correctAnswers: [0],
    category: "आसन"
  },
  {
    text: "अनुलोम-विलोम प्राणायाम किस सिद्धांत पर आधारित है?",
    options: ["स्वर विज्ञान", "तंत्र योग", "शिव सूत्र", "ध्यान योग"],
    correctAnswers: [0],
    category: "प्राणायाम"
  },
  {
    text: "धनुरासन का अभ्यास किस अंग के लिए लाभकारी है?",
    options: ["पेट", "घुटने", "कमर", "रीढ़ की हड्डी"],
    correctAnswers: [0, 2],
    category: "आसन"
  },
  {
    text: "योग शब्द की उत्पत्ति किस धातु से हुई है?",
    options: ["युज", "योग", "योगा", "योगिक"],
    correctAnswers: [0],
    category: "सिद्धांत"
  },
  {
    text: "योग का अंतिम अंग कौन-सा है?",
    options: ["धारणा", "प्रत्याहार", "ध्यान", "समाधि"],
    correctAnswers: [3],
    category: "सिद्धांत"
  },
  {
    text: "भ्रामरी प्राणायाम में किस ध्वनि का उच्चारण किया जाता है?",
    options: ["ओम्", "हूं", "म", "शं"],
    correctAnswers: [2],
    category: "प्राणायाम"
  },
  {
    text: "जल नेति क्रिया मुख्यतः किस अंग की सफाई के लिए होती है?",
    options: ["आंत", "नाक", "पेट", "फेफड़े"],
    correctAnswers: [1],
    category: "शुद्धि क्रिया"
  },
  {
    text: "योग के अनुसार स्वास्थ्य किसका संतुलन है?",
    options: ["शरीर और मांसपेशियाँ", "मन, शरीर और आत्मा", "खाना और नींद", "भावना और विचार"],
    correctAnswers: [1],
    category: "स्वास्थ्य"
  },
  {
    text: "सुप्तवज्रासन का अभ्यास किसके लिए उपयुक्त है?",
    options: ["कब्ज़", "मधुमेह", "जोड़ों का दर्द", "पाचन तंत्र"],
    correctAnswers: [3],
    category: "आसन"
  },
  {
    text: "नाड़ी शोधन प्राणायाम किसके लिए सर्वोत्तम माना जाता है?",
    options: ["फेफड़ों की शक्ति", "नाड़ी संतुलन", "भोजन पाचन", "हड्डियाँ मज़बूत करने"],
    correctAnswers: [1],
    category: "प्राणायाम"
  }
];


async function seedQuestions() {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

  console.log("✅ Connected to MongoDB");

  try {
    await Question.insertMany(yogaQuestions);
    console.log("✅ Yoga-related questions inserted successfully.");

    console.log("✅ All attendance date times updated.");
  } catch (err) {
    console.error("❌ Error updating attendance records:", err);
    mongoose.connection.close();
    process.exit(0);
  }
}

mongoose.disconnect();

// updateAttendanceTimes();
seedQuestions();
