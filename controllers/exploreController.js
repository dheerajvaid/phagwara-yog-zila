// controllers/exploreController.js
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Saadhak = require("../models/Saadhak");
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
    const zilaQuery = req.query.zila;

    const zilaFilter = zilaQuery
      ? { name: { $regex: zilaQuery, $options: "i" } }
      : {};

    const [zilas, ksheterList, kenderList, saadhaks] = await Promise.all([
      Zila.find(zilaFilter).lean(),
      Ksheter.find().lean(),
      Kender.find().lean(),
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

      districtChildren.push(
        new Paragraph({
          text: `District: ${zila.name}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: `Total Zones: ${relatedKsheters.length}`,
          heading: HeadingLevel.HEADING_2,
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
            text: `ZONE No. ${zoneCounter}: ${ksheter.name}`,
            heading: HeadingLevel.HEADING_3,
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
            text: "Yog Centers Detail:",
            heading: HeadingLevel.HEADING_3,
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
      "attachment; filename=AllIndiaDirectory.docx"
    );
    res.send(buffer);
  } catch (err) {
    console.error("Word export error:", err);
    res.status(500).send("Failed to export Word file");
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
