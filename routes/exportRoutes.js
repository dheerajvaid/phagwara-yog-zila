const express = require('express');
const router = express.Router();
const pdfExportController = require('../controllers/pdfExportController');



router.get('/export/pdf/all', pdfExportController.exportAllPDF);

module.exports = router;
