const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

async function drawCard({
  saadhak,
  kender,
  kenderTeam,
  ksheterTeam,
  monthName,
  year,
  totalDays,
  attendanceDays,
  message,
  startTime,
  kenderPramukh,
  sehKenderPramukh,
}) {
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  function formatTime(timeStr) {
    const [hourStr, minStr] = timeStr.split(":");
    let hour = parseInt(hourStr);
    const minutes = minStr.padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  }

  registerFont(
    path.join(__dirname, "../fonts/NotoSansDevanagari-Regular.ttf"),
    { family: "Noto Hindi" }
  );

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = "#dc3545";
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Header Gradient
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "#dc3545");
  grad.addColorStop(1, "#a71d2a");
  ctx.fillStyle = grad;
  ctx.fillRect(40, 40, width - 80, 120);

  // Logo
  try {
    const logo = await loadImage(
      path.join(__dirname, "../public/images/logo.jpg")
    );
    ctx.drawImage(logo, 60, 55, 80, 80);
  } catch (err) {
    console.warn("Logo load error:", err.message);
  }

  // Header Text (Top Right)
  ctx.fillStyle = "#fff";
  ctx.font = "bold 38px Arial";
  ctx.textAlign = "left";
  ctx.fillText(
    `${saadhak.name.toUpperCase()} - ${monthName} ${year}`,
    160,
    100
  );

  // Move to body content
  let y = 240;

  // 📌 Attendance Report Title (Centered, Underlined)
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText("Attendance Report", width / 2, y);

  // Underline
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, y + 10);
  ctx.lineTo(width / 2 + 200, y + 10);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";
  ctx.stroke();

  y += 70;

  // Saadhak Info
  ctx.textAlign = "left";
  ctx.font = "bold 48px Arial";
  ctx.fillText(`👤 Name: ${saadhak.name}`, 80, y);
  y += 85;
  ctx.fillText(`📱 Mobile: ${saadhak.mobile}`, 80, y);
  y += 85;
  ctx.fillText(`🏠 Kender: ${kender.name}`, 80, y);
  y += 85;
  if (startTime) {
    ctx.fillText(`🕖 Kender Start Time: ${formatTime(startTime)}`, 80, y);
    y += 85;
  }

  // Attendance Grid
  const gridStartY = y + 50;
  const cellSize = 70;
  const gap = 20;
  const cols = 7;
  const gridWidth = cols * cellSize + (cols - 1) * gap;
  const startX = (width - gridWidth) / 2;

  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 1; i <= totalDays; i++) {
    const col = (i - 1) % cols;
    const row = Math.floor((i - 1) / cols);
    const x = startX + col * (cellSize + gap);
    const yy = gridStartY + row * (cellSize + gap);

    ctx.fillStyle = attendanceDays.includes(i) ? "#4CAF50" : "#ffeeba";
    ctx.fillRect(x, yy, cellSize, cellSize);

    ctx.fillStyle = "#000";
    ctx.fillText(i.toString(), x + cellSize / 2, yy + cellSize / 2);
  }

  const gridRows = Math.ceil(totalDays / cols);
  const messageY = gridStartY + gridRows * (cellSize + gap) + 60;

  // Total Attendance Message
  ctx.font = "bold 46px Arial";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(
    `🧾 Your Total Attendance: ${attendanceDays.length} Days`,
    width / 2,
    messageY
  );

  y = messageY + 60;

  // Motivational Message
  ctx.font = '48px "Noto Hindi"';
  ctx.fillStyle = "#a71d2a";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  wrapText(ctx, message, 80, y, width - 160, 52);

  // Wishes Section
  let wishesY = messageY + 220;
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#00796b";
  ctx.fillText("💐 With Best Wishes From 💐", width / 2, wishesY);
  wishesY += 50;

  ctx.font = "48px Arial";
  ctx.fillStyle = "#000";
  ctx.fillText(
    `Kender Pramukh: ${kenderPramukh?.name || "-"}`,
    width / 2,
    wishesY
  );
  wishesY += 60;

  if (sehKenderPramukh.length > 0) {
    sehKenderPramukh.forEach((skp) => {
      ctx.fillText(`Seh Kender Pramukh: ${skp.name}`, width / 2, wishesY);
      wishesY += 50;
    });
  } else {
    ctx.fillText(`Seh Kender Pramukh: -`, width / 2, wishesY);
    wishesY += 50;
  }

  wishesY += 60;

  // Footer Date
  const today = new Date();
  const footerY = height - 80;

  ctx.font = "24px Arial";
  ctx.fillStyle = "#555";
  ctx.textAlign = "left";
  ctx.fillText(
    `🕒 Generated on: ${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`,
    80,
    footerY
  );

  return canvas;
}

function getRoleName(teamArray, role) {
  const found = teamArray.find((m) => m.roles.includes(role));
  return found ? found.name : "-";
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x + maxWidth / 2, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x + maxWidth / 2, y);
}

module.exports = drawCard;
