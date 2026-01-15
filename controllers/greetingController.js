const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const Kender = require("../models/Kender");
const Ksheter = require("../models/Ksheter");
const Zila = require("../models/Zila");
const greetingMessagesPath = path.join(__dirname, "../data/greetings.json");
const messages = JSON.parse(fs.readFileSync(greetingMessagesPath, "utf-8"));

exports.generateGreeting = async (req, res) => {
  // console.log(req.body);

  const { name, type, date, mobile, photoUrl } = req.body;
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
    const randomNumber = Math.floor(Math.random() * 12) + 1;

    const backgroundImage = await loadImage(
      path.join(__dirname, `../public/images/bg${randomNumber}.png`)
    );

    const logoImage = await loadImage(
      path.join(__dirname, "../public/images/logo-nbg.png")
    );

    ctx.drawImage(backgroundImage, 0, 0, width, height);
    ctx.drawImage(logoImage, width / 2 - 60, 30, 120, 100); // Slightly smaller logo

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
    ctx.font = "bold 52px Georgia"; // Reduced from 64px
    drawCenteredText(ctx, `Happy ${capitalize(type)}!`, width / 2, 175);

    // 👤 Name
    ctx.fillStyle = "#0d47a1";
    ctx.shadowColor = "#00217133";
    ctx.shadowBlur = 2;
    const nameFontSize = fitTextToWidth(ctx, name + " Ji", 880, 58, "Verdana"); // Reduced from 74px
    ctx.font = `bold ${nameFontSize}px Verdana`;
    drawCenteredText(ctx, name + " Ji", width / 2, 240);

    // 📅 Date
    let yStartMessage = 290;
    if (date) {
      const formattedDate = formatDateReadable(date);
      ctx.fillStyle = "#d32f2f";
      ctx.font = "bold 30px Arial"; // Reduced from 38px
      drawCenteredText(ctx, formattedDate, width / 2, 285);
      yStartMessage = 320;
    }

    // 🖼️ User Photo (if provided)
    // 🖼️ User Photo (if provided)
    if (photoUrl) {
      try {
        const userPhoto = await loadImage(photoUrl);
        const maxPhotoWidth = 160;
        const maxPhotoHeight = 205.44;

        // Calculate dimensions preserving aspect ratio
        const aspectRatio = userPhoto.width / userPhoto.height;
        let photoWidth, photoHeight;

        if (aspectRatio > maxPhotoWidth / maxPhotoHeight) {
          // Wider image - constrain by width
          photoWidth = maxPhotoWidth;
          photoHeight = maxPhotoWidth / aspectRatio;
        } else {
          // Taller image - constrain by height
          photoHeight = maxPhotoHeight;
          photoWidth = maxPhotoHeight * aspectRatio;
        }

        const photoX = width / 2 - photoWidth / 2;
        const photoY = yStartMessage;

        // Draw photo with border (no clipping)
        ctx.drawImage(userPhoto, photoX, photoY, photoWidth, photoHeight);

        // Draw border around photo
        ctx.lineWidth = 4;
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(photoX, photoY, photoWidth, photoHeight);

        yStartMessage = photoY + photoHeight + 20; // move message below photo
      } catch (photoErr) {
        console.error("Failed to load photo:", photoErr);
      }
    }

    // 📦 Message Box
    const boxX = 60;
    const boxY = yStartMessage;
    const boxWidth = 880;
    const padding = 20;

    // 📝 Message - Dynamic font size based on available space
    ctx.fillStyle = "black";
    const hasPhoto = !!photoUrl;
    const messageFontSize = hasPhoto ? 42 : 48; // Smaller font when photo present
    ctx.font = `${messageFontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const lines = getWrappedLines(ctx, randomMessage, boxWidth - 2 * padding);
    const lineHeight = hasPhoto ? 48 : 54;
    let startY = boxY + padding;

    // Limit lines to prevent overflow
    const maxLines = hasPhoto ? 4 : 5;
    const displayLines = lines.slice(0, maxLines);

    displayLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    });

    // Calculate where message ends
    const messageEndY = startY + displayLines.length * lineHeight + 20;

    // 🟡 From Info - Dynamic positioning based on message end
    const fromInfoStartY = Math.max(messageEndY, hasPhoto ? 680 : 700);

    const fromLabel = "- Best Wishes -";
    const fromText = `${user.name} (${user.roles.join(", ")})`;
    const hierarchyText = [kenderName, ksheterName].filter(Boolean).join(", ");
    const hierarchyText1 = [zilaName];

    ctx.shadowColor = "#00000022";
    ctx.shadowBlur = 2;

    ctx.font = "bold 28px Arial"; // Reduced from 36px
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText(fromLabel, width / 2, fromInfoStartY);

    ctx.font = "bold 34px Arial"; // Reduced from 42px
    ctx.fillStyle = "blue";
    ctx.textAlign = "center";
    ctx.fillText(fromText, width / 2, fromInfoStartY + 35);

    ctx.font = "bold 26px Arial"; // Reduced from 32px
    ctx.fillText(hierarchyText, width / 2, fromInfoStartY + 75);

    ctx.font = "bold 26px Arial"; // Reduced from 32px
    ctx.fillText(hierarchyText1, width / 2, fromInfoStartY + 105);

    ctx.font = "bold 38px Arial"; // Reduced from 48px
    ctx.fillStyle = "red";
    ctx.fillText("BHARATIYA YOG SANSTHAN (REGD.)", width / 2, 940);

    // Save File
    const safeName = name.replace(/\s+/g, "_");
    const safeMobile = (mobile || "").replace(/\s+/g, "_");
    const safeType = type.replace(/\s+/g, "_");
    const { v4: uuidv4 } = require("uuid");
    const fileName = `${safeName}-${safeMobile}-${safeType}-${uuidv4()}.png`;
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
