const mongoose = require("mongoose");
require("dotenv").config(); // Loads MONGODB_URI from .env

const Question = require("./models/Question");

// Add more models below if needed
// const SomeOtherModel = require('../models/SomeOtherModel');

const yogaQuestions = [
  {
    text: "कोलेस्ट्रॉल किस प्रकार के भोजन से अधिक बढ़ता है?",
    options: ["फाइबर युक्त भोजन", "तले-भुने भोजन", "फल", "हरी सब्जियाँ"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल नियंत्रण में कौन सा आसन सहायक है?",
    options: ["मत्स्यासन", "शलभासन", "अर्धमत्स्येन्द्रासन", "भुजंगासन"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल बढ़ने से कौन सी बीमारी का खतरा बढ़ता है?",
    options: ["त्वचा रोग", "हृदयाघात", "नेत्र रोग", "श्वसन रोग"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "हाई कोलेस्ट्रॉल में कौन सा फल उपयोगी है?",
    options: ["सेब", "केला", "अनार", "संतरा"],
    correctAnswers: [0],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल नियंत्रण के लिए कौन सा अनाज सर्वोत्तम है?",
    options: ["मैदा", "चावल", "ओट्स", "रवा"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "रक्त में HDL स्तर बढ़ाने के लिए क्या आवश्यक है?",
    options: [
      "अधिक मीठा खाना",
      "नियमित व्यायाम",
      "तले खाद्य पदार्थ",
      "अधिक आराम",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल बढ़ने का एक सामान्य कारण है?",
    options: ["अधिक चलना", "तनाव रहित जीवन", "अत्यधिक जंक फूड", "योग अभ्यास"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "प्लाक बनने से किस अंग को सीधा नुकसान होता है?",
    options: ["त्वचा", "हृदय", "आंत", "नेत्र"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल के स्तर को जानने के लिए किसका परीक्षण किया जाता है?",
    options: ["रक्त शर्करा", "यूरीन टेस्ट", "लिपिड प्रोफाइल", "बीपी मापन"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "तनाव बढ़ने से शरीर में कोलेस्ट्रॉल का स्तर क्या होता है?",
    options: ["घटता है", "बढ़ता है", "संतुलित रहता है", "कोई असर नहीं"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "योग का कौन सा अभ्यास तनाव कम करने में प्रमुख है?",
    options: ["भस्त्रिका", "भ्रामरी", "कपालभाति", "नाड़ी शोधन"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "फाइबर युक्त आहार का असर कोलेस्ट्रॉल पर कैसा होता है?",
    options: [
      "कोलेस्ट्रॉल बढ़ाता है",
      "कोलेस्ट्रॉल नियंत्रित करता है",
      "कोई असर नहीं",
      "कोलेस्ट्रॉल तुरंत कम करता है",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल की अधिकता शरीर में किस जगह दिखाई नहीं देती?",
    options: ["धमनियाँ", "हृदय", "त्वचा", "रक्त"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल नियंत्रण हेतु किस प्रकार का योग अभ्यास करें?",
    options: [
      "जोरदार और तीव्र",
      "शांत और नियंत्रित",
      "पूरी तरह विश्राम",
      "केवल ध्यान",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "अत्यधिक कोलेस्ट्रॉल शरीर में किस समस्या को जन्म देता है?",
    options: ["ऊर्जा अधिक", "वजन कम", "धमनियों में ब्लॉकेज", "त्वचा मुलायम"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "संतुलित आहार में क्या शामिल हो जिससे HDL बढ़े?",
    options: ["संतृप्त वसा", "फाइबर युक्त फल", "अधिक तेल", "मीठे पेय"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "योग का कौन सा प्रकार चयापचय (Metabolism) बढ़ाने में सहायक है?",
    options: ["सूर्य नमस्कार", "शवासन", "वज्रासन", "ध्यान"],
    correctAnswers: [0],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "लिवर का संबंध किससे है?",
    options: [
      "रक्त प्रवाह",
      "कोलेस्ट्रॉल निर्माण",
      "दिल की धड़कन",
      "फेफड़ों का कार्य",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल का सामान्य कार्य क्या है?",
    options: [
      "खून पतला करना",
      "कोशिकाओं का निर्माण",
      "ऊर्जा संचय",
      "हड्डियों को मजबूत करना",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "धमनियों में प्लाक बनने के कारण रक्त प्रवाह कैसा हो जाता है?",
    options: ["आसान", "तेज", "धीमा और बाधित", "बिना बदलाव के"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल कम करने के लिए सबसे उपयुक्त तकनीक कौन सी है?",
    options: [
      "अधिक विश्राम",
      "तला-भुना भोजन",
      "नियमित व्यायाम और आहार सुधार",
      "नींद कम करना",
    ],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "योग के किस अभ्यास से चयापचय दर तेज होती है?",
    options: ["शवासन", "सूर्य नमस्कार", "अर्धमत्स्येन्द्रासन", "पवनमुक्तासन"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "फाइबर शरीर में किस तरह कार्य करता है?",
    options: [
      "रक्त गाढ़ा करता है",
      "कोलेस्ट्रॉल निकालने में मदद करता है",
      "धमनियों को बंद करता है",
      "मांसपेशियाँ बढ़ाता है",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "तनाव किस हार्मोन को बढ़ाता है, जो कोलेस्ट्रॉल बढ़ाने में सहायक है?",
    options: ["एंडोर्फिन", "सेरोटोनिन", "कॉर्टिसोल", "इंसुलिन"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "नियमित कौन सा अभ्यास कोलेस्ट्रॉल कम करने में सहायक है?",
    options: [
      "तेज भोजन करना",
      "तेजी से दौड़ना",
      "गहरा ध्यान और प्राणायाम",
      "रात्रि जागरण",
    ],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "प्राकृतिक रूप से कोलेस्ट्रॉल नियंत्रण हेतु क्या जरूरी है?",
    options: [
      "संतुलित आहार और योग",
      "अधिक तेल का सेवन",
      "मीठा भोजन",
      "आहार में नमक बढ़ाना",
    ],
    correctAnswers: [0],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल बढ़ने का मुख्य कारक क्या है?",
    options: [
      "खूब पानी पीना",
      "तनाव और जंक फूड",
      "योगाभ्यास",
      "हरी सब्जियाँ खाना",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "शरीर में प्लाक बनने से किसका खतरा है?",
    options: [
      "रक्त प्रवाह बेहतर",
      "धमनी ब्लॉकेज",
      "मांसपेशी मजबूती",
      "त्वचा रोग",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल कम करने हेतु किस तकनीक का उपयोग करें?",
    options: [
      "अधिक जंक फूड",
      "भ्रामरी प्राणायाम",
      "अधिक शक्कर",
      "गहरी नींद से बचें",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "नियमित योग करने से शरीर में क्या बढ़ता है?",
    options: ["वसा", "तनाव", "मेटाबोलिज्म", "कोलेस्ट्रॉल"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कौन सा हार्मोन HDL को प्रभावित करता है?",
    options: ["इंसुलिन", "एंडोर्फिन", "सेरोटोनिन", "एस्ट्रोजन"],
    correctAnswers: [3],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल नियंत्रित करने में मदद करने वाला भोजन है?",
    options: ["तला भोजन", "फाइबर युक्त अनाज", "अधिक मीठा", "भारी तेल"],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "लिवर में बनने वाले कोलेस्ट्रॉल को क्या कहा जाता है?",
    options: [
      "बाहरी कोलेस्ट्रॉल",
      "आंतरिक कोलेस्ट्रॉल",
      "डायटरी कोलेस्ट्रॉल",
      "फाइबर",
    ],
    correctAnswers: [1],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल नियंत्रण के लिए कौन सा फल सबसे उपयुक्त है?",
    options: ["अमरूद", "अंजीर", "सेब", "केला"],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "धमनियों में प्लाक जमा होने को क्या कहते हैं?",
    options: [
      "धमनी विस्फार",
      "अस्थि रोग",
      "अर्थेरोस्क्लेरोसिस",
      "हाइपरग्लाइसीमिया",
    ],
    correctAnswers: [2],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कौन सा व्यायाम कोलेस्ट्रॉल नियंत्रण में नहीं है?",
    options: ["पैदल चलना", "ध्यान लगाना", "तेज दौड़ना", "अधिक देर बैठना"],
    correctAnswers: [3],
    category: "कोलेस्ट्रॉल",
  },
  {
    text: "कोलेस्ट्रॉल किसमें शामिल नहीं है?",
    options: [
      "हार्मोन निर्माण",
      "कोशिका झिल्ली",
      "ऊर्जा भंडारण",
      "मांसपेशी निर्माण",
    ],
    correctAnswers: [3],
    category: "कोलेस्ट्रॉल",
  },
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

async function deleteQuestionsWithBlankName() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const result = await Question.deleteMany({ "contributedBy.name": "" });

    console.log(
      `🗑️ Deleted ${result.deletedCount} questions with empty contributor name.`
    );
  } catch (err) {
    console.error("❌ Error deleting questions:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  }
}

mongoose.disconnect();
// Run the function
// deleteQuestionsWithBlankName();

seedQuestions();
