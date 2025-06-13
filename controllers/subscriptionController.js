const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Subscription = require("../models/Subscription");
const {
  validateMobile,
  validateName
} = require("../utils/validators");

const { formatName } = require("../utils/formatters");

exports.newForm = async (req, res) => {
  try {
    const user = req.session.user;

    // Only allow valid roles to access form
    const allowedRoles = [
      "Admin",
      "Zila Pradhan",
      "Zila Mantri",
      "Sangathan Mantri",
      "Cashier",
      "Ksheter Pradhan",
      "Ksheter Mantri",
      "Kender Pramukh",
      "Seh Kender Pramukh",
    ];

    const isAuthorized = user.roles.some((role) => allowedRoles.includes(role));
    if (!isAuthorized) return res.status(403).send("Not Authorized");

    const query = {};
    if (!user.roles.includes("Admin")) {
      if (
        ["Zila Pradhan", "Zila Mantri", "Sangathan Mantri", "Cashier"].some(
          (role) => user.roles.includes(role)
        )
      ) {
        query.zila = user.zila;
      }
      if (
        ["Ksheter Pradhan", "Ksheter Mantri"].some((role) =>
          user.roles.includes(role)
        )
      ) {
        query.ksheter = user.ksheter;
      }
      if (
        ["Kender Pramukh", "Seh Kender Pramukh"].some((role) =>
          user.roles.includes(role)
        )
      ) {
        query.kender = user.kender;
      }
    }

    const saadhaks = await Saadhak.find(query).sort({ name: 1 });
    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find().sort({ name: 1 });
    const kenders = await Kender.find().sort({ name: 1 });

    res.render("subscription/new", {
      user,
      saadhaks,
      zilas,
      ksheters,
      kenders,
    });
  } catch (err) {
    console.error("Error rendering new subscription form:", err);
    res.status(500).send("Server Error");
  }
};

exports.create = async (req, res) => {
  try {
    const {
      subscriberType,
      saadhakId,
      name,
      mobile,
      address,
      year,
      count
    } = req.body;

    const zila = req.body.zila || req.session.user.zila;
    const ksheter = req.body.ksheter || req.session.user.ksheter;
    const kender = req.body.kender || req.session.user.kender;
    const createdBy = req.session.user?.id;

    if (!zila || !kender || !createdBy || !year || !subscriberType || !count) {
      return res.status(400).send("Required fields missing");
    }

    if (subscriberType === "external") {
      // ✅ Validate name
      if (!validateName(name)) {
        return res.render("subscription/new", {
          error: "❌ Name should contain only alphabets and spaces",
          zilas: await Zila.find(),
          ksheters: await Ksheter.find(),
          kenders: await Kender.find(),
          saadhaks: await Saadhak.find(),
          user: req.session.user,
          formData: req.body,
        });
      }

      // ✅ Validate mobile format
      if (!validateMobile(mobile)) {
        return res.render("subscription/new", {
          error: "❌ Invalid Mobile Number",
          zilas: await Zila.find(),
          ksheters: await Ksheter.find(),
          kenders: await Kender.find(),
          saadhaks: await Saadhak.find(),
          user: req.session.user,
          formData: req.body,
        });
      }

      // ✅ Check duplicate external subscriber by mobile
      const existing = await Subscription.findOne({
        subscriberType: "external",
        mobile,
        year,
        zila,
        kender
      });

      if (existing) {
        return res.render("subscription/new", {
          error: "❌ This mobile number is already subscribed for this year.",
          zilas: await Zila.find(),
          ksheters: await Ksheter.find(),
          kenders: await Kender.find(),
          saadhaks: await Saadhak.find(),
          user: req.session.user,
          formData: req.body,
        });
      }
    }

    // ✅ Format name (only for external)
    const formattedName = subscriberType === "external" ? formatName(name) : undefined;

    const subscription = new Subscription({
      subscriberType,
      saadhak: subscriberType === "internal" ? saadhakId : undefined,
      name: formattedName,
      mobile: subscriberType === "external" ? mobile : undefined,
      address: subscriberType === "external" ? address : undefined,

      zila,
      ksheter,
      kender,
      numberOfSubscriptions: count,
      amount: count * 100,
      year,
      createdBy,

      deliveryStatus: {
        Q1: "Y",
        Q2: "N",
        Q3: "N",
        Q4: "N"
      }
    });

    await subscription.save();
    res.redirect("/subscription/list");
  } catch (err) {
    console.error("Error saving subscription:", err);
    res.status(500).send("Server Error");
  }
};

exports.list = async (req, res) => {
  try {
    // Fetch subscriptions with necessary populated fields if needed
    const subscriptions = await Subscription.find()
      .populate("saadhak")
      .populate("zila")
      .populate("ksheter")
      .populate("kender")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    res.render("subscription/list", { subscriptions, user: req.session.user });
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res.status(500).send("Server Error");
  }
};

exports.pushYogManzri = async (req, res) => {
  try {
    const user = req.session.user;
    const year = new Date().getFullYear();

    const allSaadhaks = await Saadhak.find({ zila: user.zila });
    console.log(allSaadhaks);
    let addedCount = 0;

    for (let saadhak of allSaadhaks) {
      const alreadySubscribed = await Subscription.findOne({
        saadhak: saadhak._id,
        year: year,
        subscriberType: "internal"
      });

      if (!alreadySubscribed) {
        const newSub = new Subscription({
          subscriberType: "internal",
          saadhak: saadhak._id,
          zila: saadhak.zila,
          ksheter: saadhak.ksheter,
          kender: saadhak.kender,
          numberOfSubscriptions: 0,
          amount: 0,
          year,
          createdBy: user.id,
          deliveryStatus: {
            Q1: "N", Q2: "N", Q3: "N", Q4: "N"
          }
        });

        await newSub.save();
        addedCount++;
      }
    }

    res.redirect(`/subscription/list?success=${addedCount} new records added.`);
  } catch (err) {
    console.error("Error pushing YogManzri:", err);
    res.status(500).send("Error pushing YogManzri");
  }
};

