// controllers/exploreController.js
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Saadhak = require("../models/Saadhak");
const PDFDocument = require("pdfkit");
const moment = require("moment-timezone");
const ExcelJS = require("exceljs");
const {
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
} = require("../config/roles");

const getBadgeColor = require("../partials/badgeHelper");

exports.showExploreHome = async (req, res) => {
  try {
    const prants = await Prant.find().lean();
    const zilas = (await Zila.find().lean()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const ksheters = (await Ksheter.find().lean()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const saadhaks = await Saadhak.find().lean();
    const kenders = (await Kender.find().lean()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // 🔹 Enrich Prant with team
    const enrichedPrants = prants.map((prant) => {
      const team = saadhaks.filter(
        (s) =>
          s.prant?.toString() === prant._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => prantRoles.includes(r))
      );

      team.sort(
        (a, b) =>
          prantRoles.findIndex((role) => a.role.includes(role)) -
          prantRoles.findIndex((role) => b.role.includes(role))
      );

      return {
        ...prant,
        team,
      };
    });

    // 🔹 Enrich Zila with team
    const enrichedZilas = zilas.map((zila) => {
      const team = saadhaks.filter(
        (s) =>
          s.zila?.toString() === zila._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => zilaRoles.includes(r))
      );

      team.sort(
        (a, b) =>
          zilaRoles.findIndex((role) => a.role.includes(role)) -
          zilaRoles.findIndex((role) => b.role.includes(role))
      );

      return {
        ...zila,
        team,
      };
    });

    // 🔹 Enrich Ksheter with team
    const enrichedKsheters = ksheters.map((ksheter) => {
      const team = saadhaks.filter(
        (s) =>
          s.ksheter?.toString() === ksheter._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => ksheterRoles.includes(r))
      );

      team.sort(
        (a, b) =>
          ksheterRoles.findIndex((role) => a.role.includes(role)) -
          ksheterRoles.findIndex((role) => b.role.includes(role))
      );

      return {
        ...ksheter,
        team,
      };
    });

    // 🔹 Enrich Kenders with team
    const enrichedKenders = kenders.map((kender) => {
      const team = saadhaks.filter(
        (s) =>
          s.kender?.toString() === kender._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => kenderRoles.includes(r))
      );

      team.sort(
        (a, b) =>
          kenderRoles.findIndex((role) => a.role.includes(role)) -
          kenderRoles.findIndex((role) => b.role.includes(role))
      );

      return {
        ...kender,
        team,
      };
    });

    res.render("public/explore", {
      prants: enrichedPrants,
      zilas: enrichedZilas,
      ksheters: enrichedKsheters,
      kenders: enrichedKenders,
      saadhaks,
      prantRoles,
      zilaRoles,
      ksheterRoles,
      kenderRoles,
      getBadgeColor,
    });
  } catch (err) {
    console.error("Error in showExploreHome:", err);
    res.status(500).send("Server error");
  }
};

// 🏢 Zila Detail Page
exports.showZilaDetail = async (req, res) => {
  try {
    const zilaId = req.params.zilaId;
    const zila = await Zila.findById(zilaId).lean();

    const ksheterList = await Ksheter.find({ zila: zilaId }).lean();
    const saadhaks = await Saadhak.find({ zila: zilaId }).lean();

    res.render("public/zilaDetail", {
      zila,
      ksheterList,
      saadhaks,
      zilaRoles,
      ksheterRoles,
    });
  } catch (err) {
    console.error("❌ Error in showZilaDetail:", err);
    res.status(500).send("Error loading Zila detail");
  }
};

// 🏠 Ksheter Detail Page
exports.showKsheterDetail = async (req, res) => {
  try {
    const ksheterId = req.params.ksheterId;
    const ksheter = await Ksheter.findById(ksheterId).lean();

    const kenders = await Kender.find({ ksheter: ksheterId }).lean();
    const saadhaks = await Saadhak.find({ ksheter: ksheterId }).lean();

    res.render("public/ksheterDetail", {
      ksheter,
      kenders,
      saadhaks,
      ksheterRoles,
      kenderRoles,
    });
  } catch (err) {
    console.error("❌ Error in showKsheterDetail:", err);
    res.status(500).send("Error loading Ksheter detail");
  }
};

// 🧘‍♂️ Kender Detail Page
exports.showKenderDetail = async (req, res) => {
  try {
    const kenderId = req.params.kenderId;
    const kender = await Kender.findById(kenderId).lean();

    const saadhaks = await Saadhak.find({ kender: kenderId }).lean();

    res.render("public/kenderDetail", {
      kender,
      saadhaks,
      kenderRoles,
      kenderTeamRoles,
    });
  } catch (err) {
    console.error("❌ Error in showKenderDetail:", err);
    res.status(500).send("Error loading Kender detail");
  }
};

exports.handleSearchQuery = async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";
    if (!query) return res.redirect("/explore");

    const regex = new RegExp(query, "i");

    // 👤 Only allow specific role types
    const searchableRoles = [
      ...prantRoles,
      ...zilaRoles,
      ...ksheterRoles,
      ...kenderRoles,
    ];

    // 🔍 Search saadhaks
    const matchedSaadhaks = await Saadhak.find({
      role: { $in: searchableRoles }, // ✅ roles (plural) is correct
      $or: [
        { name: regex },
        { mobile: regex },
        { gender: regex },
        { role: regex }, // ✅ match strings in array
      ],
    }).lean();

    // 🔍 Direct unit matches
    const [matchedPrants, matchedZilas, matchedKsheters, matchedKenders] =
      await Promise.all([
        Prant.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
        Zila.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
        Ksheter.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
        Kender.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
      ]);

    // 🧠 Collect IDs from both saadhaks & direct units
    const prantIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => prantRoles.includes(r)))
          .map((s) => s.prant?.toString())
          .filter(Boolean),
        ...matchedPrants.map((p) => p._id.toString()),
      ]),
    ];

    const zilaIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => zilaRoles.includes(r)))
          .map((s) => s.zila?.toString())
          .filter(Boolean),
        ...matchedZilas.map((z) => z._id.toString()),
      ]),
    ];

    const ksheterIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => ksheterRoles.includes(r)))
          .map((s) => s.ksheter?.toString())
          .filter(Boolean),
        ...matchedKsheters.map((k) => k._id.toString()),
      ]),
    ];

    const kenderIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => kenderRoles.includes(r)))
          .map((s) => s.kender?.toString())
          .filter(Boolean),
        ...matchedKenders.map((k) => k._id.toString()),
      ]),
    ];

    // 📦 Fetch units and all eligible saadhaks for team building
    const [prants, zilas, ksheters, kenders, allSaadhaks] = await Promise.all([
      Prant.find({ _id: { $in: prantIds } })
        .sort({ name: 1 })
        .lean(),
      Zila.find({ _id: { $in: zilaIds } })
        .sort({ name: 1 })
        .lean(),
      Ksheter.find({ _id: { $in: ksheterIds } })
        .sort({ name: 1 })
        .lean(),
      Kender.find({ _id: { $in: kenderIds } })
        .sort({ name: 1 })
        .lean(),
      Saadhak.find({
        role: { $in: searchableRoles },
        $or: [
          { prant: { $in: prantIds } },
          { zila: { $in: zilaIds } },
          { ksheter: { $in: ksheterIds } },
          { kender: { $in: kenderIds } },
        ],
      }).lean(),
    ]);

    // 🏢 Enrich Prants with their teams
    const enrichedPrants = await Promise.all(
      prants.map(async (p) => {
        const team = await Saadhak.find({
          prant: p._id,
          role: { $in: [...prantRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            prantRoles.findIndex((role) => a.role.includes(role)) -
            prantRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...p,
          team,
        };
      })
    );

    // 🏢 Enrich Zilas with their teams
    const enrichedZilas = await Promise.all(
      zilas.map(async (z) => {
        const team = await Saadhak.find({
          zila: z._id,
          role: { $in: [...zilaRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            zilaRoles.findIndex((role) => a.role.includes(role)) -
            zilaRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...z,
          team,
        };
      })
    );

    // 🏢 Enrich Ksheters with their teams
    const enrichedKsheters = await Promise.all(
      ksheters.map(async (k) => {
        const team = await Saadhak.find({
          ksheter: k._id,
          role: { $in: [...ksheterRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            ksheterRoles.findIndex((role) => a.role.includes(role)) -
            ksheterRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...k,
          team,
        };
      })
    );

    // 🏢 Enrich Kenders with their teams
    const enrichedKenders = await Promise.all(
      kenders.map(async (k) => {
        const team = await Saadhak.find({
          kender: k._id,
          role: { $in: [...kenderRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            kenderRoles.findIndex((role) => a.role.includes(role)) -
            kenderRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...k,
          team,
        };
      })
    );

    // 🖥️ Final render
    res.render("public/searchResults", {
      query,
      results: matchedSaadhaks,
      prants: enrichedPrants, // ✅ added prants
      zilas: enrichedZilas,
      ksheters: enrichedKsheters,
      kenders: enrichedKenders,
      getBadgeColor,
    });
  } catch (err) {
    console.error("🔴 Search error:", err);
    res.status(500).send("Server error during search.");
  }
};

exports.exportExploreExcel = async (req, res) => {
  try {
    const [zilas, ksheterList, kenderList, saadhaks] = await Promise.all([
      Zila.find().lean(),
      Ksheter.find().lean(),
      Kender.find().lean(),
      Saadhak.find().lean(),
    ]);

    const sortedZilas = zilas.sort((a, b) => a.name.localeCompare(b.name));
    const sortedKsheters = ksheterList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedKenders = kenderList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Explore BYS");

    // Setup column headers
    worksheet.columns = [
      { header: "S.No.", key: "sno", width: 8 },
      { header: "Zila", key: "zila", width: 30 },
      { header: "Ksheter", key: "ksheter", width: 30 },
      { header: "Kender", key: "kender", width: 30 },
      { header: "Name", key: "name", width: 30 },
      { header: "Role", key: "role", width: 25 },
      { header: "Mobile", key: "mobile", width: 20 },
      { header: "Address", key: "address", width: 40 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" }, // Dark blue
    };

    let rowIndex = 2;

    for (const zila of sortedZilas) {
      worksheet.addRow({
        sno: "",
        zila: zila.name,
      });

      // Color the Zila row
      worksheet.getRow(rowIndex).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" }, // Light Blue
      };
      worksheet.getRow(rowIndex).font = { bold: true };
      rowIndex++;

      const zilaTeam = saadhaks.filter(
        (s) =>
          s.zila?.toString() === zila._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => zilaRoles.includes(r))
      );
      zilaTeam.forEach((s) => {
        worksheet.addRow({
          sno: "",
          name: s.name,
          role: s.role.join(", "),
          mobile: s.mobile,
          address: s.address || "",
        });
        rowIndex++;
      });

      const relatedKsheters = sortedKsheters.filter(
        (ksh) => ksh.zila?.toString() === zila._id.toString()
      );

      let ksheterCounter = 1;
      for (const ksheter of relatedKsheters) {
        worksheet.addRow({
          sno: ksheterCounter,
          ksheter: ksheter.name,
        });
        worksheet.getRow(rowIndex).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDFFFD6" }, // Light Green
        };
        worksheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;
        ksheterCounter++;

        const ksheterTeam = saadhaks.filter(
          (s) =>
            s.ksheter?.toString() === ksheter._id.toString() &&
            Array.isArray(s.role) &&
            s.role.some((r) => ksheterRoles.includes(r))
        );
        ksheterTeam.forEach((s) => {
          worksheet.addRow({
            sno: "",
            name: s.name,
            role: s.role.join(", "),
            mobile: s.mobile,
            address: s.address || "",
          });
          rowIndex++;
        });

        const relatedKenders = sortedKenders.filter(
          (ken) => ken.ksheter?.toString() === ksheter._id.toString()
        );

        let kenderCounter = 1;
        for (const kender of relatedKenders) {
          worksheet.addRow({
            sno: `${ksheterCounter - 1}.${kenderCounter}`,
            kender: kender.name,
            address: kender.address || "", // ✅ Show Kender address here
          });
          worksheet.getRow(rowIndex).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF2CC" }, // Light Yellow
          };
          worksheet.getRow(rowIndex).font = { bold: true };
          rowIndex++;
          kenderCounter++;

          const kenderTeam = saadhaks.filter(
            (s) =>
              s.kender?.toString() === kender._id.toString() &&
              Array.isArray(s.role) &&
              s.role.some((r) => kenderRoles.includes(r))
          );
          kenderTeam.forEach((s) => {
            worksheet.addRow({
              sno: "",
              name: s.name,
              role: s.role.join(", "),
              mobile: s.mobile,
              address: s.address || "",
            });
            rowIndex++;
          });
        }
      }

      worksheet.addRow({}); // blank row after each Zila
      rowIndex++;
    }

    // Send Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Explore-BYS.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).send("Failed to export Excel");
  }
};

// controllers/exportController.js

exports.showExportForm = async (req, res) => {
  const prants = await Prant.find().lean();
  const zilas = await Zila.find().lean();
  const ksheterList = await Ksheter.find().lean();
  const kenderList = await Kender.find().lean();

  res.render("export/form", { prants, zilas, ksheterList, kenderList });
};

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} = require("docx");

exports.exportDirectoryWord = async (req, res) => {
  try {
    const user = req.session.user;

    // 🟡 Normalize filters
    const normalizeScopeValue = (value) => {
      if (!value) return "";
      if (Array.isArray(value)) return value[0] || "";
      return String(value);
    };

    const prantQuery = normalizeScopeValue(req.query.prant).trim();
    const zilaQuery = normalizeScopeValue(req.query.zila).trim();
    const ksheterQuery = normalizeScopeValue(req.query.ksheter).trim();
    const kenderQuery = normalizeScopeValue(req.query.kender).trim();

    const prantDoc = prantQuery
      ? await Prant.findOne({ _id: prantQuery })
      : null;
    const zilaDoc = zilaQuery ? await Zila.findOne({ _id: zilaQuery }) : null;
    const ksheterDoc = ksheterQuery
      ? await Ksheter.findOne({ _id: ksheterQuery })
      : null;
    const kenderDoc = kenderQuery
      ? await Kender.findOne({ _id: kenderQuery })
      : null;

    const prantName = prantDoc?.name || "";
    const zilaName = zilaDoc?.name || "";
    const ksheterName = ksheterDoc?.name || "";
    const kenderName = kenderDoc?.name || "";

    let fileName = "BYS_Directory";

    if (kenderName) {
      fileName = kenderName;
    } else if (ksheterName) {
      fileName = ksheterName;
    } else if (zilaName) {
      fileName = zilaName;
    } else if (prantName) {
      fileName = prantName;
    }

    // If no query params, skip validation
    if (Object.keys(req.query).length > 0) {
      // 🛡️ Check if both prant & zila are required
      if (!prantQuery) {
        const referer = req.get("Referer");
        const backUrl = referer ? referer.split("?")[0] : "/explore/word/form";

        return res.status(400).render("error/error-page", {
          title: "Invalid Request",
          message: "Prant is required to view attendance.",
          backUrl,
        });
      }
    }

    const prantFilter = prantQuery ? { _id: prantQuery } : {};

    const zilaFilter = zilaQuery ? { _id: zilaQuery } : {};

    const ksheterFilter = ksheterQuery ? { _id: ksheterQuery } : {};

    const kenderFilter = kenderQuery ? { _id: kenderQuery } : {};

    const [zilas, ksheterList, kenderList, saadhaks] = await Promise.all([
      Zila.find(zilaFilter).lean(),
      Ksheter.find(ksheterFilter).lean(),
      Kender.find(kenderFilter).lean(),
      Saadhak.find().lean(),
    ]);

    const doc = new Document({ sections: [] });

    const sortedZilas = zilas.sort((a, b) => a.name.localeCompare(b.name));
    const sortedKsheters = ksheterList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedKenders = kenderList.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const roleMap = {
      PRESIDENT: ["ZILA PRADHAN", "KSHETER PRADHAN"],
      SECRETARY: ["ZILA MANTRI", "KSHETER MANTRI"],
      "ORGANISING SECRETARY": [
        "ZILA SANGATHAN MANTRI",
        // "KSHETER SANGATHAN MANTRI",
      ],
      // CASHIER: ["ZILA CASHIER", "KSHETER CASHIER"],
    };

    for (const zila of sortedZilas) {
      const zilaTeam = getTeam(saadhaks, "zila", zila._id, [
        "ZILA PRADHAN",
        "ZILA MANTRI",
        "ZILA SANGATHAN MANTRI",
        // "ZILA CASHIER",
      ]);

      const relatedKsheters = sortedKsheters.filter(
        (k) => k.zila?.toString() === zila._id.toString()
      );

      const districtChildren = [];

      const {
        Paragraph,
        TextRun,
        TabStopType,
        AlignmentType,
      } = require("docx");

      districtChildren.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.LEFT,
              position: 5000, // Adjust position for spacing as needed
            },
          ],
          children: [
            new TextRun({
              text: `District: ${zila.name}`,
              bold: true,
              color: "000000",
              size: 32,
            }),
            new TextRun({
              text: "\t", // Tab space between the two texts
            }),
            new TextRun({
              text: `Total Zones: ${relatedKsheters.length}`,
              bold: true,
              color: "000000",
              size: 32,
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        createDesignationTable(zilaTeam, roleMap, "ZILA"),
        new Paragraph({ text: "" })
      );

      let zoneCounter = 1;

      for (const ksheter of relatedKsheters) {
        const ksheterTeam = getTeam(saadhaks, "ksheter", ksheter._id, [
          "KSHETER PRADHAN",
          "KSHETER MANTRI",
          // "KSHETER CASHIER",
        ]);

        const kenders = sortedKenders.filter(
          (k) => k.ksheter?.toString() === ksheter._id.toString()
        );

        districtChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `ZONE No. ${zoneCounter}: ${ksheter.name}`,
                bold: true,
                color: "000000",
                size: 24,
              }),
            ],
          }),
          createDesignationTable(ksheterTeam, roleMap, "KSHETER"),
          new Paragraph({})
        );

        const centerRows = [
          new TableRow({
            children: [
              makeCell("S.NO.", true, AlignmentType.CENTER),
              makeCell("YOG CENTER NAME & ADDRESS", true, AlignmentType.CENTER),
              makeCell("CENTER INCHARGE", true, AlignmentType.CENTER),
              makeCell("MOBILE", true, AlignmentType.CENTER),
              makeCell("E-MAIL", true, AlignmentType.CENTER),
            ],
            height: { value: 400, rule: "atLeast" },
          }),
        ];

        let centerCounter = 1;
        for (const kender of kenders) {
          const incharge = saadhaks.find(
            (s) =>
              s.kender?.toString() === kender._id.toString() &&
              s.role?.some((r) => ["KENDER PRAMUKH"].includes(r.toUpperCase()))
          );

          centerRows.push(
            new TableRow({
              children: [
                makeCell(centerCounter.toString()),
                makeNameAndAddressCell(kender.name, kender.address),
                makeCell(incharge?.name || ""),
                makeCell(incharge?.mobile || ""),
                makeCell(incharge?.email || ""),
              ],
              height: { value: 400, rule: "atLeast" },
            })
          );
          centerCounter++;
        }

        const centerTable = new Table({
          rows: centerRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        });

        districtChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Yog Centers Detail:",
                bold: true,
                color: "000000",
                size: 24,
              }),
            ],
          }),
          centerTable,
          new Paragraph({ text: "", spacing: { after: 300 } })
        );

        zoneCounter++;
      }

      doc.addSection({
        properties: {},
        children: districtChildren,
      });
    }

    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + fileName + ".docx"
    );
    res.send(buffer);
  } catch (err) {
    console.error("Word export error:", err);
    res.status(500).send("Failed to export Word file");
  }
};

exports.showExploreSummaryView = async (req, res) => {
  try {
    const user = req.session.user;

    const roles = user.roles || [];

    let summary = [];
    let headers = [];
    let level = "";

    if (roles.some((r) => prantRoles.includes(r))) {
      level = "PRANT";
      headers = ["Zones", "Kenders"];
      const prant = await Prant.findById(user.prant).lean(); // 👈 Add this line
      var levelLabel = `${prant?.name || "Your"}`; // 👈 And this
      const zilas = await Zila.find({ prant: user.prant })
        .lean()
        .sort({ name: 1 });
      for (const zila of zilas) {
        const zones = await Ksheter.countDocuments({ zila: zila._id });
        const kenders = await Kender.countDocuments({ zila: zila._id });
        summary.push({ name: zila.name, Zones: zones, Kenders: kenders });
      }
    } else if (roles.some((r) => zilaRoles.includes(r))) {
      level = "ZILA";
      headers = ["Kenders"];
      const zila = await Zila.findById(user.zila).lean(); // 👈 Add this
      var levelLabel = `${zila?.name || "Your"}`; // 👈 And this
      const ksheters = await Ksheter.find({ zila: user.zila }).lean();
      for (const ksheter of ksheters) {
        const kenders = await Kender.countDocuments({ ksheter: ksheter._id });
        summary.push({ name: ksheter.name, Kenders: kenders });
      }
    } else if (roles.some((r) => ksheterRoles.includes(r))) {
      level = "KSHETER";
      headers = ["Kenders"];
      const kenders = await Kender.countDocuments({ ksheter: user.ksheter });
      const ksheter = await Ksheter.findById(user.ksheter).lean();
      var levelLabel = `${ksheter?.name || "Your"}`; // 👈 Add this
      summary.push({
        name: ksheter?.name || "Your Ksheter",
        Kenders: kenders,
      });
    } else {
      return res.render("export/summary", {
        level: "",
        headers: [],
        summary: [],
        message: "Summary not available for your role.",
      });
    }

    res.render("export/summary", {
      level,
      levelLabel, // 👈 add this
      headers,
      summary,
      message: null,
    });
  } catch (err) {
    console.error("❌ Error in showExploreSummaryView:", err);
    res.status(500).send("Internal error");
  }
};

exports.exportSummaryExcel = async (req, res) => {
  try {
    const user = req.session.user;
    const roles = user.roles || [];

    let summary = [];
    let headers = [];
    let level = "";
    let levelLabel = "";

    if (roles.some((r) => prantRoles.includes(r))) {
      level = "PRANT";
      headers = ["Zones", "Kenders"];
      const prant = await Prant.findById(user.prant).lean();
      levelLabel = `${prant?.name || "Your"}`;

      const zilas = await Zila.find({ prant: user.prant }).lean().sort({ name: 1 });

      for (const zila of zilas) {
        const zones = await Ksheter.countDocuments({ zila: zila._id });
        const kenders = await Kender.countDocuments({ zila: zila._id });
        summary.push({ name: zila.name, Zones: zones, Kenders: kenders });
      }
    } else if (roles.some((r) => zilaRoles.includes(r))) {
      level = "ZILA";
      headers = ["Kenders"];
      const zila = await Zila.findById(user.zila).lean();
      levelLabel = `${zila?.name || "Your"}`;

      const ksheters = await Ksheter.find({ zila: user.zila }).lean().sort({ name: 1 });

      for (const ksheter of ksheters) {
        const kenders = await Kender.countDocuments({ ksheter: ksheter._id });
        summary.push({ name: ksheter.name, Kenders: kenders });
      }
    } else if (roles.some((r) => ksheterRoles.includes(r))) {
      level = "KSHETER";
      headers = ["Kenders"];
      const ksheter = await Ksheter.findById(user.ksheter).lean();
      levelLabel = `${ksheter?.name || "Your"}`;

      const kenders = await Kender.countDocuments({ ksheter: user.ksheter });

      summary.push({
        name: ksheter?.name || "Your Ksheter",
        Kenders: kenders,
      });
    } else {
      return res.status(403).send("Summary not available for your role.");
    }

    // 🧾 Create Excel sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Summary-${levelLabel}`);

    // 🧾 Define columns
    const columns = [
      { header: "#", key: "sno", width: 5 },
      {
        header: level === "PRANT" ? "Zila" : "Ksheter",
        key: "name",
        width: 30,
      },
      ...headers.map((h) => ({ header: h, key: h, width: 20 })),
    ];

    worksheet.columns = columns;

    // 🧾 Add data rows and calculate totals
    const totals = {};
    headers.forEach((h) => (totals[h] = 0));

    summary.forEach((row, i) => {
      const dataRow = {
        sno: i + 1,
        name: row.name,
      };

      headers.forEach((h) => {
        const value = Number(row[h] || 0);
        dataRow[h] = value;
        totals[h] += value;
      });

      worksheet.addRow(dataRow);
    });

    // 🟡 Add totals row
    const totalRowData = {
      sno: "",
      name: "Total",
    };
    headers.forEach((h) => {
      totalRowData[h] = totals[h];
    });

    const totalRow = worksheet.addRow(totalRowData);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFCE4D6" }, // Light peach
    };

    // ✅ Download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=BYS_${levelLabel.replace(/\s+/g, "_")}_Summary.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Error in exportSummaryExcel:", err);
    res.status(500).send("Failed to export Excel summary.");
  }
};


exports.exportSummaryPDF = async (req, res) => {
  try {
    const user = req.session.user;
    const roles = user.roles || [];

    let summary = [];
    let headers = [];
    let level = "";
    let levelLabel = "";

    if (roles.some((r) => prantRoles.includes(r))) {
      level = "PRANT";
      headers = ["Zones", "Kenders"];
      const prant = await Prant.findById(user.prant).lean();
      levelLabel = `${prant?.name || "Your"}`;

      const zilas = await Zila.find({ prant: user.prant })
        .lean()
        .sort({ name: 1 });

      for (const zila of zilas) {
        const zones = await Ksheter.countDocuments({ zila: zila._id });
        const kenders = await Kender.countDocuments({ zila: zila._id });
        summary.push({ name: zila.name, Zones: zones, Kenders: kenders });
      }
    } else if (roles.some((r) => zilaRoles.includes(r))) {
      level = "ZILA";
      headers = ["Zones", "Kenders"];
      const zila = await Zila.findById(user.zila).lean();
      levelLabel = `${zila?.name || "Your"}`;

      const ksheters = await Ksheter.find({ zila: user.zila })
        .lean()
        .sort({ name: 1 });
      for (const ksheter of ksheters) {
        const kenders = await Kender.countDocuments({ ksheter: ksheter._id });
        summary.push({ name: ksheter.name, Zones: 1, Kenders: kenders });
      }
    } else if (roles.some((r) => ksheterRoles.includes(r))) {
      level = "KSHETER";
      headers = ["Kenders"];
      const ksheter = await Ksheter.findById(user.ksheter).lean();
      levelLabel = `${ksheter?.name || "Your"}`;

      const kenders = await Kender.countDocuments({ ksheter: user.ksheter });
      summary.push({
        name: ksheter?.name || "Your Ksheter",
        Kenders: kenders,
      });
    } else {
      return res.status(403).send("Summary not available for your role.");
    }

    // 🔢 Calculate totals
    const totals = {};
    headers.forEach((h) => (totals[h] = 0));
    summary.forEach((row) => {
      headers.forEach((h) => {
        totals[h] += Number(row[h] || 0);
      });
    });

    // 🧾 PDF Setup
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${levelLabel.replace(/\s+/g, "_")}_Summary.pdf`
    );

    doc.pipe(res);

    // ------------------ HEADER ------------------
    doc
      .fontSize(18)
      .fillColor("#dc3545")
      .text("BHARTIYA YOG SANSTHAN (Regd.)", { align: "center" });

    doc
      .moveDown()
      .fontSize(14)
      .fillColor("black")
      .text(`Explore Summary Report (${levelLabel})`, { align: "center" });

    doc
      .fontSize(10)
      .text(
        `Generated on: ${moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm")}`,
        { align: "center" }
      );

    doc.moveDown(2);

    // ------------------ BOXED TOTALS ------------------
    const boxStartX = 40;
    const boxStartY = doc.y;
    const boxWidth = 240;
    const boxHeight = 50;
    const spacing = 20;
    const rowSpacing = 60;

    const summaryBoxes = headers.map((h) => ({
      title: h,
      value: totals[h],
      color: h === "Kenders" ? "#0d6efd" : "#198754",
    }));

    for (let i = 0; i < summaryBoxes.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = boxStartX + col * (boxWidth + spacing);
      const y = boxStartY + row * rowSpacing;

      doc
        .lineWidth(1)
        .rect(x, y, boxWidth, boxHeight)
        .strokeColor(summaryBoxes[i].color)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(summaryBoxes[i].color)
        .text(summaryBoxes[i].title, x, y + 10, {
          width: boxWidth,
          align: "center",
        });

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("black")
        .text(summaryBoxes[i].value.toString(), x, y + 30, {
          width: boxWidth,
          align: "center",
        });
    }

    doc.moveDown(3);

    // ------------------ TABLE ------------------
    doc.font("Helvetica-Bold").fontSize(11).fillColor("black");

    const tableHeaders = ["#", level === "PRANT" ? "Zila" : "Ksheter", ...headers];
    const columnWidth = [40, 200, ...headers.map(() => 100)];
    const rowHeight = 20;
    let y = doc.y;
    let x = 40;

    // Header Row Background
    doc
      .rect(
        x,
        y,
        columnWidth.reduce((a, b) => a + b),
        rowHeight
      )
      .fill("#dc3545");
    doc.fillColor("white").font("Helvetica-Bold");

    tableHeaders.forEach((header, i) => {
      doc.text(header, x + 2, y + 5, {
        width: columnWidth[i],
        align: "center",
      });
      x += columnWidth[i];
    });

    y += rowHeight;

    // Table Rows
    doc.font("Helvetica").fontSize(10);

    summary.forEach((row, index) => {
      x = 40;

      const rowValues = [
        index + 1,
        row.name,
        ...headers.map((h) => Number(row[h] || 0)),
      ];

      const bgColor = index % 2 === 0 ? "#f8f9fa" : "#ffffff";
      doc.save();
      doc.fillColor(bgColor).rect(x, y, 510, rowHeight).fill();
      doc.restore();

      rowValues.forEach((val, i) => {
        doc.fillColor("black").text(val.toString(), x + 2, y + 5, {
          width: columnWidth[i],
          align: "center",
        });
        x += columnWidth[i];
      });

      y += rowHeight;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // ------------------ TOTAL ROW ------------------
    x = 40;
    const totalValues = ["", "Total", ...headers.map((h) => totals[h])];

    doc.font("Helvetica-Bold").fillColor("black");
    doc.fillColor("#fff3cd").rect(x, y, 510, rowHeight).fill();
    totalValues.forEach((val, i) => {
      doc.fillColor("black").text(val.toString(), x + 2, y + 5, {
        width: columnWidth[i],
        align: "center",
      });
      x += columnWidth[i];
    });

    // ✅ Done
    doc.end();
  } catch (err) {
    console.error("❌ Error in exportSummaryPDF:", err);
    res.status(500).send("Failed to export PDF summary.");
  }
};


function getTeam(saadhaks, level, id, roles) {
  const upperRoles = roles.map((r) => r.toUpperCase());

  return saadhaks.filter(
    (s) =>
      s[level]?.toString() === id.toString() &&
      Array.isArray(s.role) &&
      s.role.some((r) => upperRoles.includes(r.toUpperCase()))
  );
}

function createDesignationTable(team, roleMap, levelType) {
  const rows = [
    new TableRow({
      children: ["DESIGNATION", "NAME & ADDRESS", "MOBILE", "E-MAIL"].map((h) =>
        makeCell(h, true, AlignmentType.CENTER)
      ),
    }),
  ];

  let designations;

  if (levelType == "ZILA") {
    designations = [
      "PRESIDENT",
      "SECRETARY",
      "ORGANISING SECRETARY",
      // "CASHIER",
    ];
  } else {
    designations = ["PRESIDENT", "SECRETARY"];
  }

  // ✅ Now you can safely use designations here

  for (const designation of designations) {
    const dbRoles = (roleMap[designation] || []).map((r) => r.toUpperCase());

    const match = team.find((s) =>
      s.role.some((r) => dbRoles.includes(r.toUpperCase()))
    );

    rows.push(
      new TableRow({
        children: [
          makeCell(designation),
          makeNameAndAddressCell(match?.name, match?.address),
          makeCell(match?.mobile || ""),
          makeCell(match?.email || ""),
        ],
      })
    );
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function makeCell(text, isBold = false, alignment = AlignmentType.LEFT) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text,
            bold: isBold,
            font: "Calibri",
            size: 22,
          }),
        ],
      }),
    ],
  });
}

function makeNameAndAddressCell(name = "", address = "") {
  return new TableCell({
    children: [
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: name,
            bold: true,
            font: "Calibri",
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: address || "",
            font: "Calibri",
            size: 22,
          }),
        ],
      }),
    ],
  });
}
