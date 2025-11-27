// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const app = express();
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const roles = require("./config/roles");

// Routes
const prantRoutes = require("./routes/prantRoutes");
const zilaRoutes = require("./routes/zilaRoutes");
const ksheterRoutes = require("./routes/ksheterRoutes");
const kenderRoutes = require("./routes/kenderRoutes");
const saadhakRoutes = require("./routes/saadhakRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicExploreRoutes = require("./routes/publicExploreRoutes");
const exportRoutes = require("./routes/exportRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const shivirRoutes = require("./routes/shivir");
const yogSamagriRoutes = require("./routes/yogSamagri");
const storyRoutes = require("./routes/storyRoutes");
const shivirRegRoutes = require("./routes/shivirRoutes");
const eventRoutes = require("./routes/eventRoutes");
const questionRoutes = require("./routes/questionRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const quizRoutes = require("./routes/quiz");
const qubikRoute = require("./routes/qubik");
const calendarRoutes = require("./routes/calendarRoutes");
const greetingRoutes = require("./routes/greetingRoutes");
const programRoutes = require("./routes/programRoutes");
const yatraRoutes = require("./routes/yatraRoutes");
const wishesRoutes = require("./routes/wishesRoutes");
const paathRoutes = require("./paathTracker/routes/paath.routes");
const paathGroupRoutes = require("./paathTracker/routes/paathGroup.routes");

// Middlewares
const { assignRoleLevel } = require("./middleware/roleMiddleware");
const injectScopeData = require("./middleware/scopeData");
const { setEventCount } = require("./middleware/eventNotifier");
const dashboardController = require("./controllers/dashboardController");

// Load environment config
dotenv.config();

// ---------------------------------------------
// 🚀 FASTEST POSSIBLE SERVER START (Render Optimized)
// ---------------------------------------------
const port = process.env.PORT || 3000;
const host = "0.0.0.0";

app.get("/healthz", (req, res) => res.status(200).send("OK"));

app.listen(port, host, () => {
  console.log(`🚀 Server started instantly at http://${host}:${port}`);
});

// ---------------------------------------------
// 📌 VIEW ENGINE + STATIC FILES
// ---------------------------------------------
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "paathTracker", "views"),
]);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// ---------------------------------------------
// 📌 CONNECT MONGO (Does NOT block startup)
// ---------------------------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");

    // ---------------------------------------------
    // 📌 SESSION STORE (Load only after DB ready)
    // ---------------------------------------------
    app.use(
      session({
        secret: "yog-zila-secret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: process.env.MONGO_URI,
          collectionName: "sessions",
          ttl: 30 * 24 * 60 * 60,
        }),
        cookie: {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: false,
        },
      })
    );

    app.use(flash());

    // ---------------------------------------------
    // 📌 GLOBAL USER + ROLES
    // ---------------------------------------------
    app.use((req, res, next) => {
      res.locals.user = req.session.user || null;
      next();
    });

    app.use((req, res, next) => {
      res.locals.roles = roles;
      next();
    });

    // ---------------------------------------------
    // 📌 INJECT SCOPE DATA (prant/zila/ksheter/kender)
    // Must be BEFORE any routes that use scope data
    // ---------------------------------------------
    app.use(injectScopeData);

    // ---------------------------------------------
    // 📌 EVENT COUNT (Navbar badge)
    // Must be BEFORE routes that render pages using it
    // ---------------------------------------------
    app.use(setEventCount);

    // ---------------------------------------------
    // 📌 ASSIGN ROLE LEVEL
    // ---------------------------------------------
    app.use(assignRoleLevel);

    // ---------------------------------------------
    // 📌 LOAD ROUTES
    // ---------------------------------------------
    app.get("/", dashboardController.getFrontPageData);

    app.use("/", adminRoutes);
    app.use("/", roleRoutes);
    app.use("/auth", authRoutes);
    app.use(dashboardRoutes);
    app.use("/prant", prantRoutes);
    app.use("/", zilaRoutes);
    app.use(ksheterRoutes);
    app.use(kenderRoutes);
    app.use("/", saadhakRoutes);
    app.use("/attendance", attendanceRoutes);
    app.use("/explore", publicExploreRoutes);
    app.use("/", exportRoutes);
    app.use("/", passwordResetRoutes);
    app.use("/report", reportRoutes);
    app.use("/shivir", shivirRoutes);
    app.use("/yog-samagri", yogSamagriRoutes);
    app.use("/stories", storyRoutes);
    app.use("/shivirreg", shivirRegRoutes);
    app.use("/events", eventRoutes);
    app.use("/calendar", calendarRoutes);
    app.use("/greeting", greetingRoutes);
    app.use("/api/events", require("./routes/api/events"));
    app.use("/question", questionRoutes);
    app.use("/subscription", subscriptionRoutes);
    app.use("/quiz", quizRoutes);
    app.use("/qubik", qubikRoute);
    app.use("/programs", programRoutes);
    app.use("/vrindavan-trip", yatraRoutes);
    app.use("/wishes", wishesRoutes);
    app.use("/paath", paathRoutes);
    app.use("/paath", paathGroupRoutes);
    app.use('/idcard', require('./routes/idCard'));


    console.log("✅ All middlewares & routes loaded safely");
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
