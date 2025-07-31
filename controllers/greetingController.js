const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const Kender = require("../models/Kender");
const Ksheter = require("../models/Ksheter");
const Zila = require("../models/Zila");
const greetingMessagesPath = path.join(__dirname, "../data/greetings.json");
const messages = JSON.parse(fs.readFileSync(greetingMessagesPath, "utf-8"));

exports.generateGreeting = async (req, res) => {
  const { name, type, date, mobile } = req.body;
  const user = req.session.user;

  let kenderName = "",
    ksheterName = "",
    zilaName = "";

  if (user.kender) {
    const kender = await Kender.findById(user.kender).lean();
    if (kender) kenderName = kender.name;
  }

  if (user.ksheter) {
    const ksheter = await Ksheter.findById(user.ksheter).lean();
    if (ksheter) ksheterName = ksheter.name;
  }

  if (user.zila) {
    const zila = await Zila.findById(user.zila).lean();
    if (zila) zilaName = zila.name;
  }

  try {
    const width = 1000;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const normalizedType = type?.toLowerCase();

    const backgroundImage = await loadImage(
      path.join(__dirname, "../public/images/bg.png")
    );
    const logoImage = await loadImage(
      path.join(__dirname, "../public/images/logo.jpg")
    );

    ctx.drawImage(backgroundImage, 0, 0, width, height);
    ctx.drawImage(logoImage, width / 2 - 75, 40, 150, 120); // Centered logo

    // 🎨 Border
    const borderWidth = 12;
    ctx.save();
    let borderColor = "#999";
    switch (normalizedType) {
      case "birthday":
        borderColor = "#ff80ab";
        break;
      case "anniversary":
        borderColor = "#ffb300";
        break;
      case "wedding":
        borderColor = "#ab47bc";
        break;
      case "farewell":
        borderColor = "#29b6f6";
        break;
      default:
        borderColor = "#90a4ae";
    }
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      width - borderWidth,
      height - borderWidth
    );
    ctx.restore();

    const messageArray = messages[normalizedType];
    let randomMessage =
      messageArray && messageArray.length
        ? messageArray[Math.floor(Math.random() * messageArray.length)]
        : "Wishing you happiness, health, and harmony on this special day!";

    // Remove line breaks from message
    randomMessage = randomMessage.replace(/\n/g, " ");

    // 🎉 Title
    ctx.fillStyle = "#d81b60";
    ctx.shadowColor = "#880e4f33";
    ctx.shadowBlur = 2;
    ctx.font = "bold 64px Georgia";
    drawCenteredText(ctx, `  Happy ${capitalize(type)}!`, width / 2, 210);

    // 👤 Name
    ctx.fillStyle = "#0d47a1";
    ctx.shadowColor = "#00217133";
    ctx.shadowBlur = 2;
    const nameFontSize = fitTextToWidth(ctx, name, 880, 74, "Verdana");
    ctx.font = `bold ${nameFontSize}px Verdana`;
    drawCenteredText(ctx, name, width / 2, 300);

    // 📅 Date
    let yStartMessage = 390;
    if (date) {
      const formattedDate = formatDateReadable(date);
      ctx.fillStyle = "#d32f2f";
      ctx.font = "bold 32px Arial";
      drawCenteredText(ctx, formattedDate, width / 2, 350);
    }

    // 📦 Message Box (smaller height)
    const boxX = 60;
    const boxY = yStartMessage;
    const boxWidth = 880;
    const boxHeight = 360; // reduced height
    const padding = 24;

    ctx.save();
    ctx.shadowColor = "#00000022";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#ffffffee";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#cccccc";
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.restore();

    // 📝 Message (larger font, top-aligned)
    ctx.fillStyle = "#000000";
    ctx.font = "58px Arial"; // larger font for sharpness
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const lines = getWrappedLines(ctx, randomMessage, boxWidth - 2 * padding);
    const lineHeight = 64; // slightly more spacing
    let startY = boxY + padding;

    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    });

    // 🟡 From Info
    const fromLabel = "-From-";  //From Label
    const fromText = `${user.name} (${user.roles.join(", ")})`;
    const hierarchyText = [kenderName, ksheterName, zilaName]
      .filter(Boolean)
      .join(", ");

    ctx.shadowColor = "#00000022";
    ctx.shadowBlur = 2;

    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#000";
    drawCenteredText(ctx, fromLabel, width / 2, 770);

    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#b71c1c";
    ctx.textAlign = "center";
    ctx.fillText(fromText, width / 2, 810);
    ctx.font = "bold 24px Arial";
    ctx.fillText(hierarchyText, width / 2, 845);

    // Save File
    const safeName = name.replace(/\s+/g, "_");
    const safeMobile = (mobile || "").replace(/\s+/g, "_");
    const safeType = type.replace(/\s+/g, "_");
    const fileName = `${safeName}-${safeMobile}-${safeType}.png`;
    const greetingsDir = path.join(__dirname, "../public/greetings");
    const filePath = path.join(greetingsDir, fileName);

    if (!fs.existsSync(greetingsDir)) {
      fs.mkdirSync(greetingsDir, { recursive: true });
    }

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filePath, buffer);

    res.json({ success: true, imageUrl: `/greetings/${fileName}` });
  } catch (err) {
    console.error("Greeting generation failed:", err);
    res.status(500).json({ success: false });
  }
};

// --- UTILITY FUNCTIONS ---

function getWrappedLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (let word of words) {
    let testLine = line + word + " ";
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && line) {
      lines.push(line.trim());
      line = word + " ";
    } else if (ctx.measureText(word).width > maxWidth) {
      // Break long word
      const chars = word.split("");
      let piece = "";
      for (let ch of chars) {
        if (ctx.measureText(piece + ch).width > maxWidth) {
          lines.push(piece);
          piece = ch;
        } else {
          piece += ch;
        }
      }
      line = piece + " ";
    } else {
      line = testLine;
    }
  }

  if (line.trim()) lines.push(line.trim());
  return lines;
}

function drawCenteredText(ctx, text, centerX, y) {
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, centerX - textWidth / 2, y);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateReadable(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const weekday = date.toLocaleString("en-IN", { weekday: "long" });
  return `${day}-${month}-${year} (${weekday})`;
}

function fitTextToWidth(ctx, text, maxWidth, baseFontSize, fontFamily) {
  let fontSize = baseFontSize;
  do {
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width;
    if (textWidth <= maxWidth) break;
    fontSize -= 2;
  } while (fontSize > 20);
  return fontSize;
}
