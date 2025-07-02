// utils/pdfExport.js
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");

exports.renderPDF = (res, viewName, data, filename) => {
  const filePath = path.join(__dirname, "../views", `${viewName}.ejs`);
  ejs.renderFile(filePath, data, (err, html) => {
    if (err) {
      console.error("EJS render error:", err);
      return res.status(500).send("PDF render failed.");
    }

    const options = {
      format: "A4",
      border: "10mm",
    };

    pdf.create(html, options).toStream((err, stream) => {
      if (err) {
        console.error("PDF creation error:", err);
        return res.status(500).send("PDF generation failed.");
      }

      res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-type", "application/pdf");
      stream.pipe(res);
    });
  });
};
