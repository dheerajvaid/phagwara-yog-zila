// === Photo Preview Script ===
document.getElementById('photoInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('photoPreview').innerHTML =
            `<img src="${e.target.result}"
                 style="width:100%; height:100%; object-fit:cover;
                        image-rendering:crisp-edges;
                        filter:contrast(1.15) brightness(0.98);">`;
    };
    reader.readAsDataURL(file);
});

// === Shared function to render card to canvas ===
async function renderCardCanvas() {
    const card = document.querySelector("#card");
    const originalRatio = window.devicePixelRatio;
    window.devicePixelRatio = 4; // boost DPI for ultra-sharp rendering

    const canvas = await html2canvas(card, {
        scale: 5,              // ultra HD render
        logging: false,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        removeContainer: true
    });

    window.devicePixelRatio = originalRatio;
    return canvas;
}

// === Download PNG function ===
async function downloadPNG() {
    const canvas = await renderCardCanvas();
    const pngData = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = "id-card.png";
    link.href = pngData;
    link.click();
}

// === Download PDF function ===
async function downloadPDF() {
    const canvas = await renderCardCanvas();
    const { jsPDF } = window.jspdf;

    const pdfWidthCm = 8.56;
    const pdfHeightCm = 5.40;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "cm",
        format: [pdfWidthCm, pdfHeightCm]
    });

    // Use JPEG for sharper print quality
    const jpegData = canvas.toDataURL("image/jpeg", 1.0);

    pdf.addImage(
        jpegData,
        "JPEG",
        0,
        0,
        pdfWidthCm,
        pdfHeightCm,
        "",
        "FAST"
    );

    pdf.save("id-card.pdf");
}
