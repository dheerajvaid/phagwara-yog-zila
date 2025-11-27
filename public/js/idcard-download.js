function downloadCard() {
  const card = document.querySelector("#card");

  // 1️⃣ High-resolution canvas
  html2canvas(card, {
    scale: 3, // 3x resolution for crisp printing
    useCORS: true, // allow external images like logo
    backgroundColor: null // preserve CSS background
  }).then(canvas => {
    // --- Option A: Download PNG ---
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "id-card.png";
    link.href = imgData;
    link.click();

    // --- Option B: Download PDF ---
    const pdfWidthCm = 8.56;
    const pdfHeightCm = 5.4;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "cm",
      format: [pdfWidthCm, pdfHeightCm]
    });
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidthCm, pdfHeightCm);
    pdf.save("id-card.pdf");
  });
}
