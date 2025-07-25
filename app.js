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

const zilaRoutes = require("./routes/zilaRoutes");
const ksheterRoutes = require("./routes/ksheterRoutes");
const kenderRoutes = require("./routes/kenderRoutes");
const saadhakRoutes = require("./routes/saadhakRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const exploreRoutes = require("./routes/exploreRoutes");
const exportRoutes = require("./routes/exportRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const shivirRoutes = require("./routes/shivir");
const yogSamagriRoutes = require("./routes/yogSamagri");
const storyRoutes = require("./routes/storyRoutes");
const shivirRegRoutes = require("./routes/shivirRoutes");
const eventRoutes = require("./routes/eventRoutes");
const questionRoutes = require('./routes/questionRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const quizRoutes = require('./routes/quiz');
const qubikRoute = require("./routes/qubik");
const calendarRoutes = require("./routes/calendarRoutes");

const { assignRoleLevel } = require('./middleware/roleMiddleware');
const injectScopeData = require('./middleware/scopeData');
const { setEventCount } = require("./middleware/eventNotifier");

// Load environment variables from .env file
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

app.use(session({
    secret: "yog-zila-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions",
        ttl: 24 * 60 * 60 * 365,
    }),
}));

app.use(flash());

// Inject logged-in user (global for all views)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(setEventCount);

// ✅ Apply roleLevel and scopeData middleware early:
app.use(assignRoleLevel);
app.use(injectScopeData);

// Home route (optional testing)
app.get("/", (req, res) => {
    res.render("home");
});

// Routes
app.use("/", adminRoutes);
app.use("/", roleRoutes);
app.use("/auth", authRoutes);
app.use(dashboardRoutes);
app.use("/", zilaRoutes);
app.use(ksheterRoutes);
app.use(kenderRoutes);
app.use("/", saadhakRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/", exploreRoutes); // Public-facing
app.use("/", exportRoutes);
app.use("/", passwordResetRoutes);
app.use("/report", reportRoutes);
app.use("/shivir", shivirRoutes);
app.use("/yog-samagri", yogSamagriRoutes);
app.use("/stories", storyRoutes);
app.use("/shivirreg", shivirRegRoutes);
app.use("/events", eventRoutes);
app.use("/calendar", calendarRoutes);
app.use('/api/events', require('./routes/api/events'));
app.use('/question', questionRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/quiz', quizRoutes);
app.use("/qubik", qubikRoute);


// Server Start
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
