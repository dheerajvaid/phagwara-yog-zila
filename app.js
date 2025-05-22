// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');

const zilaRoutes = require('./routes/zilaRoutes');
const ksheterRoutes = require('./routes/ksheterRoutes');
const kenderRoutes = require('./routes/kenderRoutes');
const saadhakRoutes = require('./routes/saadhakRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const adminRoutes = require('./routes/adminRoutes');
// const apiRoutes = require('./routes/apiRoutes');
const exploreRoutes = require('./routes/exploreRoutes');
const exportRoutes = require('./routes/exportRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const flash = require("connect-flash");
const shivirRoutes = require('./routes/shivir');
const yogSamagriRoutes = require('./routes/yogSamagri');
const storyRoutes = require('./routes/storyRoutes');
// Load environment variables from .env file
dotenv.config();

// Set up MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Set up EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'yog-zila-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Or your hardcoded DB URI
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 * 365 // 365 day expiration
  })
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // ✅ Prevents undefined
  next();
});

// Home route to render a test page
app.get('/', (req, res) => {
  res.render('home');
});

app.use('/', adminRoutes);
// app.use('/api', apiRoutes);
app.use('/', roleRoutes);
app.use('/auth', authRoutes);
app.use(dashboardRoutes);
app.use('/', zilaRoutes);
app.use(ksheterRoutes);
app.use(kenderRoutes);
app.use('/', saadhakRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/', exploreRoutes); // Keep it public!
 // 👈 This is required
 app.use('/', exportRoutes);
 app.use('/', passwordResetRoutes);
 app.use('/report', reportRoutes);
 app.use('/shivir', shivirRoutes);
 app.use('/yog-samagri', yogSamagriRoutes);
 app.use('/stories', storyRoutes);
 
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
