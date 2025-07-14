const mongoose = require("mongoose");
require("dotenv").config(); // Loads MONGODB_URI from .env

const Question = require("./models/Question");

// Add more models below if needed
// const SomeOtherModel = require('../models/SomeOtherModel');

const yogaQuestions =[
  {
    "text": "कपालभाति प्राणायाम मुख्य रूप से किस अंग पर प्रभाव डालता है?",
    "options": ["हृदय", "जिगर", "फेफड़े", "पाचन तंत्र"],
    "correctAnswers": [3],
    "category": "प्राणायाम"
  },
  {
    "text": "सर्वांगासन को अंग्रेजी में क्या कहा जाता है?",
    "options": ["Shoulder Stand", "Plow Pose", "Bridge Pose", "Mountain Pose"],
    "correctAnswers": [0],
    "category": "योग"
  },
  {
    "text": "योगनिद्रा की अवस्था किसके समान मानी जाती है?",
    "options": ["गहरी नींद", "सतर्क ध्यान", "दैनिक सोच", "स्वप्न"],
    "correctAnswers": [0],
    "category": "ध्यान"
  },
  {
    "text": "त्राटक ध्यान विशेष रूप से किसे लाभ पहुंचाता है?",
    "options": ["सांस", "नेत्र शक्ति", "जिगर", "पेट"],
    "correctAnswers": [1],
    "category": "ध्यान"
  },
  {
    "text": "शीतली प्राणायाम करते समय साँस कैसे ली जाती है?",
    "options": ["नाक से", "मुँह से जीभ मोड़कर", "मुँह से सीटी बजाकर", "बाएं नासिका से"],
    "correctAnswers": [1],
    "category": "प्राणायाम"
  },
  {
    "text": "योग के किस अंग में 'इंद्रियों का संयम' सिखाया जाता है?",
    "options": ["प्रत्याहार", "धारणा", "समाधि", "ध्यान"],
    "correctAnswers": [0],
    "category": "अष्टांग योग"
  },
  {
    "text": "नाड़ी शोधन प्राणायाम का उद्देश्य क्या है?",
    "options": ["शरीर को लचीला बनाना", "मांसपेशियाँ मजबूत करना", "ऊर्जा चैनलों की शुद्धि", "नींद को सुधारना"],
    "correctAnswers": [2],
    "category": "प्राणायाम"
  },
  {
    "text": "ध्यान करते समय विचार आने पर क्या करना चाहिए?",
    "options": ["उन्हें दबाना", "उन्हें देखना और जाने देना", "सोचना", "मन में दोहराना"],
    "correctAnswers": [1],
    "category": "ध्यान"
  },
  {
    "text": "सूर्य नमस्कार के कितने चरण होते हैं?",
    "options": ["10", "12", "14", "16"],
    "correctAnswers": [1],
    "category": "सूर्य नमस्कार"
  },
  {
    "text": "कौन‑सी मुद्रा कब्ज में राहत देती है?",
    "options": ["अपान मुद्रा", "ज्ञान मुद्रा", "प्राण मुद्रा", "वरुण मुद्रा"],
    "correctAnswers": [0],
    "category": "मुद्रा"
  },
  {
    "text": "पाचन शक्ति को बढ़ाने के लिए कौन‑सा आसन उपयुक्त है?",
    "options": ["वज्रासन", "भुजंगासन", "शवासन", "मत्स्यासन"],
    "correctAnswers": [0],
    "category": "पाचन"
  },
  {
    "text": "उज्जायी प्राणायाम में साँस लेने की विशेषता क्या है?",
    "options": ["नाक से गहरी साँस", "गले से आवाज के साथ साँस", "मुँह से साँस", "तेज गति से"],
    "correctAnswers": [1],
    "category": "प्राणायाम"
  },
  {
    "text": "योगिक शुद्धि क्रिया 'नेती' के कितने प्रकार होते हैं?",
    "options": ["1", "2", "3", "4"],
    "correctAnswers": [1],
    "category": "शुद्धि"
  },
  {
    "text": "हठ योग में कितने मूल आसनों का वर्णन है?",
    "options": ["4", "8", "12", "15"],
    "correctAnswers": [0],
    "category": "योग"
  },
  {
    "text": "कौन‑सा आसन शरीर को संतुलन सिखाता है?",
    "options": ["वृक्षासन", "शवासन", "हलासन", "सेतुबंधासन"],
    "correctAnswers": [0],
    "category": "योग"
  },
  {
    "text": "अग्निसार क्रिया मुख्य रूप से किसके लिए की जाती है?",
    "options": ["मस्तिष्क", "फेफड़े", "जठराग्नि", "हृदय"],
    "correctAnswers": [2],
    "category": "शुद्धि"
  },
  {
    "text": "संधि-विक्षेप यानी (Joint dislocation) से बचने के लिए क्या आवश्यक है?",
    "options": ["तेज व्यायाम", "लचीलापन", "प्रोटीन डाइट", "मेडिटेशन"],
    "correctAnswers": [1],
    "category": "शरीर"
  },
  {
    "text": "प्राण का संबंध मुख्य रूप से किससे होता है?",
    "options": ["विचारों से", "ऊर्जा से", "भावनाओं से", "शरीर से"],
    "correctAnswers": [1],
    "category": "प्राण"
  },
  {
    "text": "योग में कौन‑सी क्रिया से पेट की सफाई होती है?",
    "options": ["कपालभाति", "जल नेती", "वमन धौति", "त्राटक"],
    "correctAnswers": [2],
    "category": "शुद्धि"
  },
  {
    "text": "कौन‑सी मुद्रा मन को शांत करती है?",
    "options": ["शंख मुद्रा", "शून्य मुद्रा", "ज्ञान मुद्रा", "आकाश मुद्रा"],
    "correctAnswers": [2],
    "category": "मुद्रा"
  },
  {
    "text": "प्राणायाम किस अंग के बाद आता है?",
    "options": ["ध्यान", "आसन", "यम", "नियम"],
    "correctAnswers": [1],
    "category": "अष्टांग योग"
  },
  {
    "text": "कुंभक किस क्रिया को कहते हैं?",
    "options": ["साँस छोड़ना", "साँस रोकना", "गहरी साँस लेना", "साँस बदलना"],
    "correctAnswers": [1],
    "category": "प्राणायाम"
  },
  {
    "text": "जठराग्नि को बढ़ाने वाली योगिक क्रिया कौन‑सी है?",
    "options": ["उड्डीयान बंध", "भ्रामरी", "ध्यान", "शीर्षासन"],
    "correctAnswers": [0],
    "category": "शुद्धि"
  },
  {
    "text": "कौन‑सी योग मुद्रा भोजन पचाने में मदद करती है?",
    "options": ["वज्रासन", "धनुरासन", "मत्स्यासन", "नटराजासन"],
    "correctAnswers": [0],
    "category": "पाचन"
  },
  {
    "text": "गले से संबंधित रोगों में कौन‑सी क्रिया लाभ देती है?",
    "options": ["कपालभाति", "भ्रामरी", "शंख प्रक्षालन", "जालंधर बंध"],
    "correctAnswers": [3],
    "category": "शुद्धि"
  },
  {
    "text": "संधि शक्ति बढ़ाने के लिए कौन‑सा अभ्यास उचित है?",
    "options": ["पद्मासन", "सूर्य नमस्कार", "जोड़ व्यायाम", "वज्रासन"],
    "correctAnswers": [2],
    "category": "व्यायाम"
  },
  {
    "text": "नमक और पानी से की जाने वाली शुद्धि क्रिया कौन‑सी है?",
    "options": ["त्राटक", "जल नेती", "शंख प्रक्षालन", "वमन धौति"],
    "correctAnswers": [2],
    "category": "शुद्धि"
  },
  {
    "text": "पेट के गैस ट्रबल में कौन‑सा आसन लाभ देता है?",
    "options": ["पवनमुक्तासन", "धनुरासन", "शवासन", "वृक्षासन"],
    "correctAnswers": [0],
    "category": "पाचन"
  },
  {
    "text": "ध्यान के कितने चरण होते हैं?",
    "options": ["1", "3", "4", "6"],
    "correctAnswers": [1],
    "category": "ध्यान"
  },
  {
    "text": "दैनिक जीवन में योग का उद्देश्य क्या है?",
    "options": ["शरीर सौंदर्य", "आर्थिक लाभ", "मानसिक और शारीरिक संतुलन", "धार्मिक अनुष्ठान"],
    "correctAnswers": [2],
    "category": "योग"
  },
  {
    "text": "मसूड़ों को स्वस्थ रखने हेतु कौन‑सी क्रिया की जाती है?",
    "options": ["त्राटक", "गुणगुने तेल से कूजन", "जल नेती", "भस्त्रिका"],
    "correctAnswers": [1],
    "category": "आयुर्वेद"
  },
  {
    "text": "कौन‑सा आसन वक्षस्थल को खोलता है?",
    "options": ["उष्ट्रासन", "वज्रासन", "पद्मासन", "भुजंगासन"],
    "correctAnswers": [0],
    "category": "शरीर"
  },
  {
    "text": "शवासन का प्रमुख उद्देश्य क्या है?",
    "options": ["शरीर को गर्म करना", "शरीर को थकाना", "पूर्ण विश्राम देना", "ताकत बढ़ाना"],
    "correctAnswers": [2],
    "category": "योग"
  },
  {
    "text": "योगिक दृष्टि से दिन की शुरुआत कैसे होनी चाहिए?",
    "options": ["अलार्म से उठकर", "ध्यान से", "फोन देखने से", "जल्दी भागकर"],
    "correctAnswers": [1],
    "category": "जीवनशैली"
  },
  {
    "text": "ध्यान किस अवस्था में सबसे प्रभावी होता है?",
    "options": ["नींद में", "थकान में", "शांत और जागरूक मन में", "भूख में"],
    "correctAnswers": [2],
    "category": "ध्यान"
  },
  {
    "text": "नाड़ी शुद्ध करने वाला प्राणायाम कौन‑सा है?",
    "options": ["शीतली", "अनुलोम-विलोम", "भस्त्रिका", "श्वासाग्रह"],
    "correctAnswers": [1],
    "category": "प्राणायाम"
  },
  {
    "text": "हठ योग का शाब्दिक अर्थ क्या है?",
    "options": ["धीरे योग", "मन का योग", "बलपूर्वक योग", "शांति का योग"],
    "correctAnswers": [2],
    "category": "योग"
  }
]


;


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

    const result = await Question.deleteMany({ 'contributedBy.name': '' });

    console.log(`🗑️ Deleted ${result.deletedCount} questions with empty contributor name.`);
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
