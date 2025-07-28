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
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const normalizedType = type?.toLowerCase();

    const backgroundImage = await loadImage(
      path.join(__dirname, "../public/images/bg.png")
    );
    const logoImage = await loadImage(
      path.join(__dirname, "../public/images/logo.jpg")
    );

    // 🎨 Draw background and logo first
    ctx.drawImage(backgroundImage, 0, 0, width, height);
    ctx.drawImage(logoImage, width - 130, 35, 106, 90);

    // ✅ Draw themed border AFTER background
    const borderWidth = 10;
    ctx.save();
    let borderColor = "#999"; // fallback neutral

    switch (normalizedType) {
      case "birthday":
        borderColor = "#ff80ab"; // light pink
        break;
      case "anniversary":
        borderColor = "#ffb300"; // golden yellow
        break;
      case "wedding":
        borderColor = "#ab47bc"; // purple
        break;
      case "farewell":
        borderColor = "#29b6f6"; // blue
        break;
      default:
        borderColor = "#90a4ae"; // soft gray-blue
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

    // 🎉 Continue as-is from here
    const messageArray = messages[normalizedType];
    if (
      !messageArray ||
      !Array.isArray(messageArray) ||
      messageArray.length === 0
    ) {
      console.warn(`No messages found for type: ${normalizedType}`);
    }

    const randomMessage = messageArray
      ? messageArray[Math.floor(Math.random() * messageArray.length)]
      : "Wishing you happiness, health, and harmony on this special day!";

    // 🟣 Title
    ctx.fillStyle = "#d81b60"; // more vibrant deep pink
    ctx.shadowColor = "#880e4f";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.font = "bold 56px Georgia";
    drawShadowedText(ctx, `  Happy ${capitalize(type)}!`, 50, 90);

    // 🔵 Name
    ctx.fillStyle = "#0d47a1"; // deep vibrant blue
    ctx.shadowColor = "#002171";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 🧠 Dynamically calculate font size
    const nameMaxWidth = 900; // total safe width before wrapping
    const nameFontSize = fitTextToWidth(ctx, name, nameMaxWidth, 70, "Verdana");
    ctx.font = `bold ${nameFontSize}px Verdana`;
    drawShadowedText(ctx, " " + name, 50, 180);

    // 🔴 Event Date
    let yStartMessage = 270;
    if (date) {
      const formattedDate = formatDateReadable(date);
      ctx.fillStyle = "#d32f2f";
      ctx.font = "bold 28px Arial";
      drawShadowedText(ctx, "     " + formattedDate, 55, 225);
      yStartMessage = 270;
    }

    // 🟢 Message Box
    const boxX = 45;
    const boxY = yStartMessage;
    const boxWidth = 910;
    const boxHeight = 160;
    const padding = 20;

    ctx.save();
    ctx.shadowColor = "#00000033";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffffffdd";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#cccccc";
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    ctx.restore();

    // ✉️ Greeting message
    ctx.fillStyle = "#444";
    ctx.font = "32px Arial";
    wrapText(
      ctx,
      randomMessage,
      boxX + padding,
      boxY + padding + 40,
      boxWidth - 2 * padding,
      42
    );

    // 🟠 From Info (Beautified)
    const fromLabel = "From:";
    const fromText = `${user.name} (${user.roles.join(", ")})`;
    const hierarchyText = [kenderName, ksheterName, zilaName]
      .filter(Boolean)
      .join(", ");

    ctx.shadowColor = "#00000033";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // From label in black
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#000000";
    ctx.shadowColor = "#333333";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.fillText(fromLabel, 50, height - 120);

    // User info and hierarchy info in the same color as event date
    ctx.font = "20px Arial";
    ctx.fillStyle = "#b71c1c"; // deeper rich red
    ctx.shadowColor = "#880e0e";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    // same as event date
    ctx.fillText(fromText, 50, height - 90);
    ctx.fillText(hierarchyText, 50, height - 60);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Save file
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

// ✨ Shadow Text
function drawShadowedText(ctx, text, x, y) {
  ctx.save();
  ctx.shadowColor = "#00000055";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 🔤 Capitalize First Letter
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 📅 Format Date as "26-Jul-2025 (Saturday)"
function formatDateReadable(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const weekday = date.toLocaleString("en-IN", { weekday: "long" });
  return `${day}-${month}-${year} (${weekday})`;
}

// 🧾 Wrap long text
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function fitTextToWidth(ctx, text, maxWidth, baseFontSize, fontFamily) {
  let fontSize = baseFontSize;
  do {
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width;
    if (textWidth <= maxWidth) break;
    fontSize -= 2; // Decrease gradually
  } while (fontSize > 20); // Reasonable lower limit
  return fontSize;
}
